"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fetchNewRound, GameRound } from "./actions";

export default function Home() {
  const [round, setRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const loadNextRound = async () => {
    setLoading(true);
    setSelectedOption(null);
    try {
      const newRound = await fetchNewRound();
      setRound(newRound);
    } catch (error) {
      console.error("Failed to fetch round:", error);
      alert("Error fetching snippet. Check console or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNextRound();
  }, []);

  const handleGuess = (option: string) => {
    if (selectedOption || !round) return;

    setSelectedOption(option);
    setRoundsPlayed((p) => p + 1);
    if (option === round.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  return (
    <main>
      <header style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>CodeGuesser</h1>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold", background: "var(--card-bg)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          Score: {score} / {roundsPlayed}
        </div>
      </header>

      <div className="code-container" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", flexDirection: "column", gap: "1rem" }}>
            <div className="spinner"></div>
            <p>Scanning GitHub for secrets...</p>
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
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
              },
            }}
          >
            {round?.snippet || ""}
          </SyntaxHighlighter>
        )}
      </div>

      <div style={{ marginBottom: "1.5rem", width: "100%", display: "flex", justifyContent: "space-between", color: "var(--foreground)", opacity: 0.7, fontSize: "0.9rem" }}>
        <span>{round && !loading && `File: ${round.fileName}`}</span>
        <span>{round && !loading && `Language: ${round.language}`}</span>
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
              disabled={!!selectedOption || loading}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div style={{ height: "100px", display: "flex", alignItems: "center", marginTop: "1rem" }}>
        {selectedOption && (
          <button
            onClick={loadNextRound}
            style={{ 
              background: "var(--accent)", 
              color: "white", 
              padding: "0.8rem 2.5rem", 
              fontSize: "1.1rem",
              fontWeight: "bold",
              boxShadow: "0 4px 14px 0 rgba(88, 166, 255, 0.39)"
            }}
          >
            Next Challenge →
          </button>
        )}
      </div>

      <footer style={{ marginTop: "auto", padding: "2rem", opacity: 0.5, fontSize: "0.8rem", textAlign: "center" }}>
        <p>Built with Next.js & GitHub API</p>
        <p style={{ marginTop: "0.5rem" }}>
          Tip: Set <code>GITHUB_TOKEN</code> in your environment to avoid rate limits.
        </p>
      </footer>
    </main>
  );
}