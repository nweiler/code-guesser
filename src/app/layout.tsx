import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.codeguesser.xyz"),
  title: "CodeGuesser",
  description: "Test your open-source knowledge! Can you guess the GitHub repository from code snippets?",
  openGraph: {
    title: "CodeGuesser",
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
    title: "CodeGuesser",
    description: "Test your open-source knowledge! Can you guess the GitHub repository from code snippets?",
    images: ["https://www.codeguesser.xyz/og-image.png?v=5"],
    creator: "@nweiler",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body>
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-5YDV49WMP4" />
      </body>
    </html>
  );
}
