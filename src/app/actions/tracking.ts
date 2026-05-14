"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { rounds } from "@/db/schema";
import { and, eq, gte, count } from "drizzle-orm";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

interface RecordRoundInput {
  correctRepo: string;
  guessedRepo: string;
  correct: boolean;
  category: string;
}

export async function recordRound(input: RecordRoundInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  if (!input.correctRepo || !input.guessedRepo || input.correct === undefined || !input.category) {
    return { error: "Invalid round data" };
  }

  const userId = parseInt(session.user.id, 10);

  // Rate limit: check submissions in the last minute
  const recent = await db
    .select({ count: count() })
    .from(rounds)
    .where(
      and(
        eq(rounds.userId, userId),
        gte(rounds.createdAt, new Date(Date.now() - RATE_LIMIT_WINDOW_MS))
      )
    );

  if (Number(recent[0]?.count ?? 0) >= RATE_LIMIT_MAX) {
    return { error: "Rate limited. Try again shortly." };
  }

  // Check for exact duplicate in the last 5 seconds
  const duplicate = await db
    .select({ id: rounds.id })
    .from(rounds)
    .where(
      and(
        eq(rounds.userId, userId),
        eq(rounds.correctRepo, input.correctRepo),
        eq(rounds.guessedRepo, input.guessedRepo),
        gte(rounds.createdAt, new Date(Date.now() - 5000))
      )
    )
    .limit(1);

  if (duplicate.length > 0) {
    return { error: "Duplicate submission" };
  }

  await db.insert(rounds).values({
    userId,
    correctRepo: input.correctRepo,
    guessedRepo: input.guessedRepo,
    correct: input.correct,
    category: input.category,
  });

  return { success: true };
}
