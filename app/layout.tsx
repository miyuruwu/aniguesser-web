import type { Metadata } from "next";
import { Inter, Bangers, Nabla } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});
const nabla = Nabla({
  subsets: ["latin"],
  variable: "--font-nabla",
});

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
      <body className={`${inter.variable} ${bangers.variable} ${nabla.variable} font-sans antialiased text-white min-h-screen relative`}>
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#132c33] via-[#0d161a] to-[#040809]" />
        {children}
      </body>
    </html>
  );
}
