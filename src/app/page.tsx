import type { Metadata } from "next";
import Game from "@/components/Game";

export const metadata: Metadata = {
  title: "CodeGuesser v5",
  description: "Test your open-source knowledge! Can you guess the GitHub repository from code snippets?",
  openGraph: {
    title: "CodeGuesser v5",
    description: "Identify the GitHub repository from random code snippets.",
    url: "https://www.codeguesser.xyz",
    siteName: "CodeGuesser",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.codeguesser.xyz/og-image.png?v=5",
        secureUrl: "https://www.codeguesser.xyz/og-image.png?v=5",
        width: 1200,
        height: 630,
        alt: "CodeGuesser - Identify the GitHub repository from random code snippets",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeGuesser v5",
    description: "Test your open-source knowledge! Can you guess the GitHub repository from code snippets?",
    images: ["https://www.codeguesser.xyz/og-image.png?v=5"],
    creator: "@nweiler",
  },
};

export default function Page() {
  return <Game />;
}
