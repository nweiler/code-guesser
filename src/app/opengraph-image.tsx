import { ImageResponse } from "next/og";

export const alt = "CodeGuesser - Identify the GitHub repository from code snippets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0d1117",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          CodeGuesser
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#c9d1d9",
            marginTop: 20,
            opacity: 0.8,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Can you identify the GitHub repository from a code snippet?
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 20,
          }}
        >
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: "16px 28px",
              fontSize: 20,
              color: "#58a6ff",
              fontWeight: 600,
            }}
          >
            React
          </div>
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: "16px 28px",
              fontSize: 20,
              color: "#8b949e",
              fontWeight: 600,
            }}
          >
            Vue
          </div>
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: "16px 28px",
              fontSize: 20,
              color: "#8b949e",
              fontWeight: 600,
            }}
          >
            Django
          </div>
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: "16px 28px",
              fontSize: 20,
              color: "#8b949e",
              fontWeight: 600,
            }}
          >
            Linux
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
