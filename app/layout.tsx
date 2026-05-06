import type { Metadata } from "next";
import "./globals.css";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";

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
      <body className="font-sans antialiased text-white min-h-screen relative">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#132c33] via-[#0d161a] to-[#040809]" />
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}