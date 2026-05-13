import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

interface Props {
  searchParams: Promise<{ score?: string; total?: string; streak?: string }>;
}

export default async function OG({ searchParams }: Props) {
  const params = await searchParams;
  const score = params.score ? parseInt(params.score, 10) : null;
  const total = params.total ? parseInt(params.total, 10) : null;
  const streak = params.streak ? parseInt(params.streak, 10) : null;

  const hasValid = score !== null && total !== null && total > 0 && score !== null && score >= 0 && score <= total;
  const accuracy = hasValid ? Math.round((score! / total!) * 100) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(88,166,255,0.15) 0%, rgba(188,140,255,0.1) 25%, transparent 60%)",
          }}
        />
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
          }}
        >
          CodeGuesser
        </div>

        {hasValid ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 96, fontWeight: 800, color: "#c9d1d9", lineHeight: 1, letterSpacing: -2 }}>
              {score}
              <span style={{ opacity: 0.3, fontWeight: 300, margin: "0 8px" }}>/</span>
              {total}
            </div>
            <div style={{ fontSize: 36, color: "#58a6ff", fontWeight: 600 }}>{accuracy}% accuracy</div>
            {streak !== null && streak >= 2 && (
              <div style={{ fontSize: 28, color: "#c9d1d9" }}>
                {"\uD83D\uDD25"} {streak} round streak
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 36, color: "#8b949e" }}>Name that repo. We show code, you guess the project.</div>
        )}

        <div style={{ fontSize: 20, color: "#8b949e", marginTop: 40 }}>codeguesser.xyz</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
