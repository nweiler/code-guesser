"use server";

import { getDb } from "@/db";
import { users, rounds } from "@/db/schema";
import { auth } from "@/auth";
import { count, eq, and, gte, sql } from "drizzle-orm";
import type { LeaderboardEntry, LeaderboardResult } from "@/lib/leaderboard-types";

interface LeaderboardFilters {
  timeWindow?: "all" | "today";
  category?: string | null;
}

export async function getLeaderboard(filters: LeaderboardFilters = {}): Promise<LeaderboardResult> {
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("[leaderboard] auth() failed:", err);
  }

  const conditions = [];
  if (filters.timeWindow === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    conditions.push(gte(rounds.createdAt, today));
  }
  if (filters.category) {
    conditions.push(eq(rounds.category, filters.category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const _db = getDb();
  const rows = await _db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      rounds: count(rounds.id),
      correct: sql<number>`SUM(CASE WHEN ${rounds.correct} THEN 1 ELSE 0 END)`,
      accuracy: sql<number>`ROUND(SUM(CASE WHEN ${rounds.correct} THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(${rounds.id}), 0) * 100, 0)`,
    })
    .from(users)
    .innerJoin(rounds, eq(rounds.userId, users.id))
    .where(where)
    .groupBy(users.id, users.name, users.avatar)
    .having(sql`COUNT(${rounds.id}) >= 10`)
    .limit(100);

  const entries = rows.sort((a, b) => b.accuracy - a.accuracy);

  let personalRank: LeaderboardResult["personalRank"] = null;

  if (session?.user?.id) {
    const userId = parseInt(session.user.id, 10);

    const userStats = entries.find((e) => e.id === userId);
    if (userStats) {
      personalRank = {
        rank: entries.indexOf(userStats) + 1,
        rounds: userStats.rounds,
        accuracy: userStats.accuracy,
      };
    } else {
      const userData = await _db
        .select({
          rounds: count(rounds.id),
          correct: sql<number>`SUM(CASE WHEN ${rounds.correct} THEN 1 ELSE 0 END)`,
        })
        .from(rounds)
        .where(where ? and(eq(rounds.userId, userId), where) : eq(rounds.userId, userId));

      const data = userData[0];
      if (data && data.rounds > 0) {
        personalRank = {
          rank: null,
          rounds: data.rounds,
          accuracy: Math.round((data.correct / data.rounds) * 100),
        };
      }
    }
  }

  return { entries: entries as LeaderboardEntry[], personalRank };
}
