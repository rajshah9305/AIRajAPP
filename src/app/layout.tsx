import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RAJ AI APP BUILDER - Generate React Apps with AI",
  description: "Build beautiful React applications instantly using AI. Powered by Cerebras AI for lightning-fast code generation.",
  keywords: ["AI", "React", "App Builder", "Code Generator", "Cerebras", "Next.js"],
  authors: [{ name: "RAJ" }],
  creator: "RAJ",
  publisher: "RAJ",
  robots: "index, follow",
  openGraph: {
    title: "RAJ AI APP BUILDER",
    description: "Generate React apps with AI in seconds",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RAJ AI APP BUILDER",
    description: "Generate React apps with AI in seconds",
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
