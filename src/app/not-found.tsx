import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ justifyContent: "center", textAlign: "center" }}>
      <h1 style={{ fontSize: "6rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ fontSize: "1.5rem", marginBottom: "2rem", opacity: 0.8 }}>
        This code snippet has gone missing!
      </p>
      <Link 
        href="/" 
        style={{
          background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
          color: "white",
          padding: "0.8rem 2rem",
          borderRadius: "10px",
          textDecoration: "none",
          fontWeight: "bold",
          boxShadow: "0 10px 20px rgba(88, 166, 255, 0.2)"
        }}
      >
        Back to the Game
      </Link>
    </main>
  );
}
