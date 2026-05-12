"use client";

import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fetchNewRound } from "./actions";
import { GameRound } from "@/lib/types";

const STORAGE_KEY = "codeguesser_score";

function loadPersistedScore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { score: 0, roundsPlayed: 0 };
    return JSON.parse(raw) as { score: number; roundsPlayed: number };
  } catch {
    return { score: 0, roundsPlayed: 0 };
  }
}

export default function Home() {
  const [round, setRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const prefetchRef = useRef<Promise<GameRound> | null>(null);

  useEffect(() => {
    const { score, roundsPlayed } = loadPersistedScore();
    setScore(score);
    setRoundsPlayed(roundsPlayed);
    loadNextRound();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, roundsPlayed }));
    } catch {}
  }, [score, roundsPlayed]);

  const loadNextRound = async (prefetched?: Promise<GameRound>) => {
    setLoading(true);
    setSelectedOption(null);
    setError(null);
    try {
      const newRound = await (prefetched ?? fetchNewRound());
      prefetchRef.current = null;
      setRound(newRound);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't load a snippet. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = (option: string) => {
    if (selectedOption || !round) return;

    setSelectedOption(option);
    if (option === round.correctAnswer) {
      setScore((s) => s + 1);
    }
    setRoundsPlayed((p) => p + 1);

    // Start fetching the next round in the background
    prefetchRef.current = fetchNewRound();
  };

  const handleNext = () => {
    const prefetched = prefetchRef.current ?? undefined;
    prefetchRef.current = null;
    loadNextRound(prefetched);
  };

  const guessed = !!selectedOption;
  const isRateLimit = error?.startsWith("Rate limited");

  return (
    <main>
      <header style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>CodeGuesser</h1>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold", background: "var(--card-bg)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          Score: {score} / {roundsPlayed}
        </div>
      </header>

      <div className="code-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "200px", flexDirection: "column", gap: "1rem" }}>
            <div className="spinner"></div>
            <p>Scanning GitHub for secrets...</p>
          </div>
        ) : error ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "200px", flexDirection: "column", gap: "1rem", padding: "1.5rem", textAlign: "center" }}>
            {isRateLimit ? (
              <>
                <p style={{ fontSize: "2rem" }}>⏳</p>
                <p style={{ color: "var(--foreground)", fontWeight: "bold" }}>{error}</p>
                <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
                  GitHub limits unauthenticated requests. Set a{" "}
                  <code>GITHUB_TOKEN</code> env var to get 5,000 requests/hour.
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "var(--error)" }}>{error}</p>
                <button onClick={() => loadNextRound()} style={{ color: "var(--foreground)" }}>Try Again</button>
              </>
            )}
          </div>
        ) : (
          <SyntaxHighlighter
            language={round?.language || "javascript"}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              fontSize: "0.9rem",
              background: "transparent",
            }}
            codeTagProps={{
              style: {
                fontFamily: 'var(--font-fira-code), monospace',
              },
            }}
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

      <div style={{ height: "3.5rem", display: "flex", alignItems: "center", marginTop: "1rem" }}>
        <button
          onClick={handleNext}
          style={{
            background: "var(--accent)",
            color: "white",
            padding: "0.8rem 2.5rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            boxShadow: "0 4px 14px 0 rgba(88, 166, 255, 0.39)",
            opacity: guessed ? 1 : 0,
            pointerEvents: guessed ? "auto" : "none",
            transition: "opacity 0.2s",
          }}
        >
          Next Challenge →
        </button>
      </div>

      <footer style={{ marginTop: "auto", padding: "2rem", opacity: 0.5, fontSize: "0.8rem", textAlign: "center" }}>
        <p>Built with Next.js & GitHub API</p>
      </footer>
    </main>
  );
}
