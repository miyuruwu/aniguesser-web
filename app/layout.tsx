import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AniGuesser – Anime Guessing Games",
  description:
    "Test your anime knowledge with Screenshot Guesser, Character Guesser, and Anime Wordle!",
  keywords: ["anime", "guessing game", "wordle", "quiz", "AniGuesser"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-anime-darker">
        {children}
      </body>
    </html>
  );
}
