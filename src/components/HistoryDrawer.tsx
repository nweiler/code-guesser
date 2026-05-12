"use client";

import { useEffect } from "react";
import { GameStats } from "@/lib/types";

interface Props {
  open: boolean;
  stats: GameStats | null;
  onClose: () => void;
}

export default function HistoryDrawer({ open, stats, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const hasRounds = stats && stats.roundsPlayed > 0;

  return (
    <>
      <div className="history-backdrop" onClick={onClose} />
      <div className="history-drawer">
        <div className="history-drawer-header">
          <span className="history-drawer-title">History</span>
          <button className="history-close-btn" onClick={onClose}>✕</button>
        </div>

        {!hasRounds ? (
          <p className="history-empty">Play some rounds to see your stats.</p>
        ) : (
          <>
            <div className="history-stats-grid">
              <div className="history-stat">
                <span className="history-stat-val">{Math.round(stats.accuracy * 100)}%</span>
                <span className="history-stat-label">Accuracy</span>
              </div>
              <div className="history-stat">
                <span className="history-stat-val">
                  {stats.currentStreak >= 2 ? "🔥 " : ""}{stats.currentStreak}
                </span>
                <span className="history-stat-label">Current streak</span>
              </div>
              <div className="history-stat">
                <span className="history-stat-val">{stats.bestStreak}</span>
                <span className="history-stat-label">Best streak</span>
              </div>
              <div className="history-stat">
                <span className="history-stat-val">{stats.roundsPlayed}</span>
                <span className="history-stat-label">Rounds played</span>
              </div>
            </div>

            <div className="history-section-label">Category accuracy</div>
            {stats.categoryStats.map(({ category, accuracy, total }) => (
              <div key={category} className="history-repo-row">
                <span className="history-repo-name" title={`${total} round${total !== 1 ? "s" : ""}`}>
                  {category}
                </span>
                <div className="history-bar-wrap">
                  <div
                    className={`history-bar ${accuracy >= 0.5 ? "history-bar--good" : "history-bar--bad"}`}
                    style={{ width: `${Math.round(accuracy * 100)}%` }}
                  />
                </div>
                <span className="history-repo-pct">{Math.round(accuracy * 100)}%</span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
