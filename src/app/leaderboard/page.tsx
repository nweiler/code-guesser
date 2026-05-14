"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getLeaderboard, LeaderboardEntry } from "@/app/actions/leaderboard";
import { RepoCategory } from "@/lib/types";

const CATEGORIES: { value: RepoCategory | null; label: string }[] = [
  { value: null, label: "All Categories" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "ai-ml", label: "AI/ML" },
  { value: "languages", label: "Languages" },
  { value: "databases", label: "Databases" },
  { value: "devtools", label: "Dev Tools" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Data" },
];

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [personalRank, setPersonalRank] = useState<{ rank: number | null; rounds: number; accuracy: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<"all" | "today">("all");
  const [category, setCategory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboard({ timeWindow, category });
      setEntries(result.entries);
      setPersonalRank(result.personalRank ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [timeWindow, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main>
      <header style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>Leaderboard</h1>
        <a href="/" style={{ fontSize: "0.9rem", color: "var(--accent)", textDecoration: "none" }}>
          &larr; Back to Game
        </a>
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 0 }}>
          <button
            onClick={() => setTimeWindow("all")}
            style={{
              padding: "0.4rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: timeWindow === "all" ? "var(--accent)" : "var(--card-bg)",
              color: timeWindow === "all" ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "8px 0 0 8px",
            }}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeWindow("today")}
            style={{
              padding: "0.4rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: timeWindow === "today" ? "var(--accent)" : "var(--card-bg)",
              color: timeWindow === "today" ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "0 8px 8px 0",
            }}
          >
            Today
          </button>
        </div>

        <select
          value={category ?? ""}
          onChange={(e) => setCategory(e.target.value || null)}
          style={{
            padding: "0.4rem 0.75rem",
            fontSize: "0.85rem",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={label} value={value ?? ""}>{label}</option>
          ))}
        </select>
      </div>

      {personalRank && (
        <div style={{
          width: "100%",
          padding: "1rem 1.25rem",
          background: "var(--card-bg)",
          border: "1px solid var(--accent)",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
          <span style={{ fontWeight: 600 }}>Your Rank</span>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <span>{personalRank.rank ? `#${personalRank.rank}` : "Unranked (play more rounds)"}</span>
            <span>{personalRank.accuracy}%</span>
            <span>{personalRank.rounds} rounds</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--error)" }}>{error}</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
          {session ? "Play some rounds to appear on the leaderboard." : "No players yet. Sign in and start playing!"}
        </div>
      ) : (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
              }}
            >
              <span style={{ width: "2rem", fontWeight: 700, opacity: 0.5, textAlign: "center" }}>
                {i + 1}
              </span>
              <img
                src={entry.avatar}
                alt={entry.name}
                width={32}
                height={32}
                style={{ borderRadius: "50%" }}
              />
              <span style={{ flex: 1, fontWeight: 500 }}>{entry.name}</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{entry.accuracy}%</span>
              <span style={{ opacity: 0.5, fontSize: "0.85rem" }}>{entry.rounds} rounds</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
