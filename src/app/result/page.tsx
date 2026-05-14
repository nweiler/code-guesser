import Link from "next/link";
import { auth } from "@/auth";

interface Props {
  searchParams: Promise<{ score?: string; total?: string; streak?: string }>;
}

export default async function ResultPage({ searchParams }: Props) {
  const [params, session] = await Promise.all([searchParams, auth().catch(() => null)]);
  const score = params.score ? parseInt(params.score, 10) : null;
  const total = params.total ? parseInt(params.total, 10) : null;
  const streak = params.streak ? parseInt(params.streak, 10) : null;

  const hasValid = score !== null && total !== null && total > 0 && score >= 0 && score <= total;

  if (!hasValid) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1.5rem", textAlign: "center", padding: "2rem" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>CodeGuesser</h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.7, maxWidth: "500px" }}>
          No result to display. Play a round and share your score!
        </p>
        <Link href="/" style={{ padding: "1rem 3rem", fontSize: "1.1rem", fontWeight: "bold", background: "linear-gradient(135deg, #58a6ff, #bc8cff)", color: "white", borderRadius: "12px", textDecoration: "none" }}>
          Play Now
        </Link>
      </main>
    );
  }

  const accuracy = Math.round((score / total) * 100);
  const badge = accuracy >= 80 ? "Outstanding!" : accuracy >= 60 ? "Great job!" : accuracy >= 40 ? "Not bad!" : "Keep practicing!";

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "2rem", textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", margin: 0, background: "linear-gradient(135deg, #58a6ff, #bc8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        CodeGuesser
      </h1>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>
          {score} <span style={{ opacity: 0.4, fontWeight: 300 }}>/</span> {total}
        </div>
        <div style={{ fontSize: "1.5rem", opacity: 0.6 }}>{accuracy}% accuracy</div>
        {streak !== null && streak >= 2 && (
          <div style={{ fontSize: "1.2rem" }}>
            {"\uD83D\uDD25"} {streak} in a row
          </div>
        )}
      </div>

      <div style={{ fontSize: "1.3rem", fontWeight: 600 }}>{badge}</div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={{ padding: "1rem 3rem", fontSize: "1.1rem", fontWeight: "bold", background: "linear-gradient(135deg, #58a6ff, #bc8cff)", color: "white", borderRadius: "12px", textDecoration: "none", boxShadow: "0 10px 20px rgba(88, 166, 255, 0.2)" }}>
          Play Now
        </Link>
        <Link href="/leaderboard" style={{ padding: "1rem 2rem", fontSize: "1.1rem", fontWeight: "bold", background: "transparent", border: "1px solid rgba(88,166,255,0.4)", color: "white", borderRadius: "12px", textDecoration: "none" }}>
          Leaderboard
        </Link>
      </div>

      {!session && (
        <p style={{ fontSize: "0.85rem", opacity: 0.55, maxWidth: "340px" }}>
          Sign in with GitHub on{" "}
          <Link href="/" style={{ color: "inherit" }}>codeguesser.xyz</Link>{" "}
          to track your streak and compete on the leaderboard.
        </p>
      )}
    </main>
  );
}
