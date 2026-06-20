import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildVerse AI",
  description: "An AI software company in your browser",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
