"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fetchNewRound } from "@/app/actions";
import { recordRound } from "@/app/actions/tracking";
import { GameMode, GameRound, RepoCategory } from "@/lib/types";
import { computeStats, loadHistory, saveRound } from "@/lib/history";
import HistoryDrawer from "@/components/HistoryDrawer";
import { useSession, signIn, signOut } from "next-auth/react";
import confetti from "canvas-confetti";
import Link from "next/link";

const CATEGORIES: { value: RepoCategory | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "ai-ml", label: "AI/ML" },
  { value: "languages", label: "Languages" },
  { value: "databases", label: "Databases" },
  { value: "devtools", label: "Dev Tools" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Data" },
];

export default function Game() {
  const [round, setRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("endless");
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RepoCategory | null>(null);

  const { data: session } = useSession();

  const prefetchRef = useRef<Promise<GameRound> | null>(null);
  const initRef = useRef(false);

  const loadRound = async (opts?: { mode?: GameMode; category?: RepoCategory | null; prefetched?: Promise<GameRound> }) => {
    setLoading(true);
    setSelectedOption(null);
    setError(null);
    try {
      const mode = opts?.mode ?? gameMode;
      const cat = opts?.category !== undefined ? opts.category : selectedCategory;
      const round = await (opts?.prefetched ?? fetchNewRound({ mode, category: cat }));
      prefetchRef.current = null;
      setRound(round);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load a snippet. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadRound();
  }, []);

  const stats = useMemo(() => computeStats(loadHistory()), [historyVersion]);

  const handleGuess = (option: string) => {
    if (selectedOption || !round) return;

    const correct = option === round.correctAnswer;
    setSelectedOption(option);

    saveRound({
      timestamp: Date.now(),
      correctRepo: round.correctAnswer,
      guessedRepo: option,
      correct,
    });
    setHistoryVersion((v) => v + 1);

    if (session) {
      recordRound({
        correctRepo: round.correctAnswer,
        guessedRepo: option,
        correct,
        category: round.category,
      });
    }

    if (correct) {
      const s = computeStats(loadHistory()).currentStreak;
      if (s >= 5 && s % 5 === 0) {
        setMilestone(s);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => setMilestone(null), 3000);
      }
    }

    if (gameMode !== "daily") {
      prefetchRef.current = fetchNewRound({ mode: "endless", category: selectedCategory });
    }
  };

  const handleNext = () => {
    if (gameMode === "daily" && guessed) {
      setGameMode("endless");
      loadRound({ mode: "endless", category: selectedCategory });
      return;
    }
    const prefetched = prefetchRef.current ?? undefined;
    prefetchRef.current = null;
    loadRound({ prefetched, mode: "endless", category: selectedCategory });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchMode = (mode: GameMode) => {
    setGameMode(mode);
    loadRound({ mode, category: selectedCategory });
  };

  const switchCategory = (cat: RepoCategory | null) => {
    setSelectedCategory(cat);
    loadRound({ mode: gameMode, category: cat });
  };

  const guessed = !!selectedOption;
  const isRateLimit = error?.startsWith("Rate limited");
  const isDailyDone = gameMode === "daily" && guessed;

  const resultUrl = useMemo(() => {
    if (!guessed || !round) return "";
    const total = stats.roundsPlayed;
    const correct = Math.round(stats.accuracy * total);
    const streak = stats.currentStreak;
    return `https://www.codeguesser.xyz/result?score=${correct}&total=${total}&streak=${streak}`;
  }, [guessed, round, stats.roundsPlayed, stats.accuracy, stats.currentStreak]);

  const shareText = useMemo(() => {
    if (!guessed || !round) return "";
    const total = stats.roundsPlayed;
    const correct = Math.round(stats.accuracy * total);
    const verb = selectedOption === round.correctAnswer ? "aced a round" : "played";
    return `I just ${verb} on CodeGuesser! Score: ${correct}/${total}. Can you beat me?`;
  }, [guessed, round, selectedOption, historyVersion, stats.roundsPlayed, stats.accuracy]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "4" && !guessed && !loading && round) {
        const btns = document.querySelectorAll<HTMLButtonElement>(".options-grid button");
        const idx = parseInt(e.key) - 1;
        if (btns[idx] && !btns[idx].disabled) btns[idx].click();
      }
      if (e.key === "Enter" && guessed && !loading) {
        document.querySelector<HTMLButtonElement>("button[data-next]")?.click();
      }
      if (e.key === "h" || e.key === "H") {
        setHistoryOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [guessed, loading, round]);

  // Error after relevant state - safe to use above deps
  // because guessed/loading/round are used in the closure

  return (
    <main>
      <header style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>CodeGuesser</h1>
        <div className="header-right" style={{ gap: "0.75rem" }}>
          <Link
            href="/leaderboard"
            style={{ fontSize: "0.85rem", opacity: 0.6, textDecoration: "none", color: "var(--foreground)", whiteSpace: "nowrap" }}
          >
            <span className="header-mobile-hide">Leaderboard</span><span className="header-show-mobile" style={{ display: "none" }}>LB</span>
          </Link>
          {session ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <img
                src={session.user.image || ""}
                alt={session.user.name || ""}
                width={24}
                height={24}
                style={{ borderRadius: "50%" }}
              />
              <span className="header-mobile-hide" style={{ fontSize: "0.85rem", opacity: 0.7 }}>{session.user.name}</span>
              <button
                onClick={() => signOut()}
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "transparent", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "6px", cursor: "pointer" }}
              >
                <span className="header-mobile-hide">Sign Out</span><span className="header-show-mobile" style={{ display: "none" }}>✕</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("github")}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <span className="header-mobile-hide">Sign in with GitHub</span><span className="header-show-mobile" style={{ display: "none" }}>Sign In</span>
            </button>
          )}
          <button
            onClick={() => setHistoryOpen(true)}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            <span className="header-mobile-hide">History</span><span className="header-show-mobile" style={{ display: "none" }}>📋</span>
          </button>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", background: "var(--card-bg)", padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
            <span className="header-mobile-hide">Score: </span>{Math.round(stats.accuracy * stats.roundsPlayed)}/{stats.roundsPlayed}
          </div>
        </div>
      </header>

      <div style={{ display: "flex", gap: 0, marginBottom: "0.75rem", alignSelf: "flex-start" }}>
        <button
          onClick={() => switchMode("endless")}
          style={{
            padding: "0.4rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: gameMode === "endless" ? "var(--accent)" : "var(--card-bg)",
            color: gameMode === "endless" ? "#fff" : "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "8px 0 0 8px",
            opacity: 1,
          }}
        >
          Endless
        </button>
        <button
          onClick={() => switchMode("daily")}
          style={{
            padding: "0.4rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: gameMode === "daily" ? "var(--accent)" : "var(--card-bg)",
            color: gameMode === "daily" ? "#fff" : "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "0 8px 8px 0",
            opacity: 1,
          }}
        >
          Daily
        </button>
      </div>

      <p className="game-description" style={{ opacity: 0.8, marginBottom: "1rem", fontSize: "1.1rem", textAlign: "center", maxWidth: "600px" }}>
        {gameMode === "daily"
          ? "One snippet a day. Make it count."
          : <>Name that repo. We show code, you guess the project.</>
        }
      </p>

      <div className="category-pills" style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={label}
            className="category-pill"
            onClick={() => switchCategory(value)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              background: selectedCategory === value ? "var(--accent)" : "var(--card-bg)",
              color: selectedCategory === value ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              opacity: 0.8,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {gameMode === "daily" && isDailyDone && (
        <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", fontWeight: 600 }}>
          Today&apos;s daily: {selectedOption === round?.correctAnswer ? "\u2705 Correct!" : "\u274C Incorrect"}
        </div>
      )}

      <div className="code-container" style={{ padding: 0 }}>
        {loading ? (
          <div className="skeleton-container">
            {[80, 100, 60, 90, 70, 50, 85, 65, 75, 55, 95, 45].map((width, i) => (
              <div key={i} className="skeleton-line" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "200px", flexDirection: "column", gap: "1rem", padding: "1.5rem", textAlign: "center" }}>
            {isRateLimit ? (
              <>
                <p style={{ fontSize: "2rem" }}>{String.fromCodePoint(0x23F3)}</p>
                <p style={{ color: "var(--foreground)", fontWeight: "bold" }}>{error}</p>
                <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
                  GitHub limits unauthenticated requests. Set a{" "}
                  <code>GITHUB_TOKEN</code> env var to get 5,000 requests/hour.
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "var(--error)" }}>{error}</p>
                <button onClick={() => loadRound()} style={{ color: "var(--foreground)" }}>Try Again</button>
              </>
            )}
          </div>
        ) : (
          <SyntaxHighlighter
            language={round?.language || "javascript"}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: "1.5rem", fontSize: "0.9rem", background: "transparent" }}
            codeTagProps={{ style: { fontFamily: "var(--font-fira-code), monospace" } }}
          >
            {round?.snippet || ""}
          </SyntaxHighlighter>
        )}
      </div>

      <div style={{ height: "1.5rem", marginBottom: "1rem", width: "100%", display: "flex", justifyContent: "space-between", color: "var(--foreground)", opacity: 0.7, fontSize: "0.9rem" }}>
        {guessed && round && !loading && (
          <>
            <span>File: {round.fileName}</span>
            <span>Language: {round.language}</span>
          </>
        )}
      </div>

      <div className="options-grid">
        {round?.options.map((option) => {
          let className = "";
          if (selectedOption) {
            if (option === round.correctAnswer) className = "correct";
            else if (option === selectedOption) className = "incorrect";
          }
          return (
            <button
              key={option}
              className={className}
              onClick={() => handleGuess(option)}
              disabled={guessed || loading}
            >
              {option}
            </button>
          );
        })}
      </div>

      {guessed && round && selectedOption !== round.correctAnswer && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "10px", width: "100%", fontSize: "0.9rem" }}>
          <span style={{ fontWeight: 700, color: "var(--accent)" }}>{round.correctAnswer}</span>
          {round.description && <span style={{ opacity: 0.7 }}> &mdash; {round.description}</span>}
          {round.category && <span style={{ opacity: 0.5, marginLeft: "0.5rem" }}>({round.category})</span>}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
        <button
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: copied ? "var(--success)" : "var(--foreground)",
            padding: "0.8rem 1.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            borderRadius: "12px",
            opacity: guessed ? 1 : 0,
            pointerEvents: guessed ? "auto" : "none",
            transform: guessed ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          {copied ? "Copied!" : "Copy Results"}
        </button>
        <button
          onClick={() => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n" + resultUrl)}`, "_blank", "noopener,noreferrer");
          }}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            padding: "0.8rem 1.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            borderRadius: "12px",
            opacity: guessed ? 1 : 0,
            pointerEvents: guessed ? "auto" : "none",
            transform: guessed ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          Share on X
        </button>
        <button
          onClick={() => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resultUrl)}`, "_blank", "noopener,noreferrer");
          }}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            padding: "0.8rem 1.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            borderRadius: "12px",
            opacity: guessed ? 1 : 0,
            pointerEvents: guessed ? "auto" : "none",
            transform: guessed ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          Share on FB
        </button>
        <button
          data-next
          onClick={handleNext}
          style={{
            background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
            border: "none",
            color: "white",
            padding: "0.8rem 3rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            borderRadius: "12px",
            boxShadow: "0 10px 20px rgba(88, 166, 255, 0.2)",
            opacity: guessed ? 1 : 0,
            pointerEvents: guessed ? "auto" : "none",
            transform: guessed ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          {isDailyDone ? "Go Endless \u2192" : "Next Challenge \u2192"}
        </button>
      </div>

      {milestone && (
        <div style={{ textAlign: "center", marginTop: "0.5rem", fontWeight: "bold", color: "var(--accent)" }}>
          {"\uD83C\uDF89"} {milestone} in a row! You&apos;re crushing it!
        </div>
      )}

      <a
        href="https://buymeacoffee.com/nweiler"
        target="_blank"
        rel="noopener noreferrer"
        className="bmc-float"
        aria-label="Buy Me a Coffee"
      >
        ☕
      </a>

      <footer style={{ marginTop: "auto", padding: "2rem", opacity: 0.5, fontSize: "0.8rem", textAlign: "center" }}>
        <p>Built with Next.js & GitHub API</p>
        <p style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <a 
            href="https://github.com/nweiler/code-guesser" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "var(--foreground)", textDecoration: "none" }}
          >
            View on GitHub
          </a>
          <a 
            href="https://github.com/nweiler/code-guesser/issues/new" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "var(--foreground)", textDecoration: "none" }}
          >
            Suggest a repo
          </a>
        </p>
      </footer>

      <HistoryDrawer
        open={historyOpen}
        stats={stats}
        onClose={() => setHistoryOpen(false)}
      />
    </main>
  );
}
