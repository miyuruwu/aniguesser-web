"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Trophy, LogOut, User } from "lucide-react";
import { GameMode } from "@/types/anime";
import AnimeWordle from "@/components/modes/AnimeWordle";
import ScreenshotGuesser from "@/components/modes/ScreenshotGuesser";
import MovieWordle from "@/components/modes/MovieWordle";
import Leaderboard from "@/components/Leaderboard";
import AuthModal from "@/components/ui/AuthModal";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<GameMode>("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading, login, register, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onSignIn={(username, password) => login(username, password)}
            onSignUp={(details) => register(details)}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Header Navigation */}
      <header className="w-full z-50 py-8 px-12 flex items-center justify-between relative">
        <div
          className="flex items-center gap-2 cursor-pointer z-10"
          onClick={() => setActiveMode("home")}
        >
          <span className="font-nabla text-2xl tracking-wider text-white select-none brightness-0 invert">ANIGUESSER</span>
        </div>

        <nav className="flex items-center space-x-12 z-10 mx-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={() => setActiveMode("home")}
            className={`relative px-5 py-2 text-sm font-semibold transition-all ${activeMode === 'home' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            {activeMode === 'home' && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white/10 rounded-full" transition={{ type: "spring", duration: 0.5 }} />
            )}
            <span className="relative z-10 uppercase tracking-widest text-xs">HOME</span>
          </button>
          <button
            onClick={() => setActiveMode("screenshot")}
            className={`relative px-5 py-2 text-sm font-semibold transition-all ${activeMode === 'screenshot' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            {activeMode === 'screenshot' && (
              <motion.div layoutId="nav-line" className="absolute bottom-1 left-5 right-5 h-0.5 bg-white rounded-full" transition={{ type: "spring", duration: 0.5 }} />
            )}
            <span className="relative z-10 uppercase tracking-widest text-xs">SCREENSHOT GUESS</span>
          </button>
          <button
            onClick={() => setActiveMode("wordle")}
            className={`relative px-5 py-2 text-sm font-semibold transition-all ${activeMode === 'wordle' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            {activeMode === 'wordle' && (
              <motion.div layoutId="nav-line" className="absolute bottom-1 left-5 right-5 h-0.5 bg-white rounded-full" transition={{ type: "spring", duration: 0.5 }} />
            )}
            <span className="relative z-10 uppercase tracking-widest text-xs">ANIME WORDLE</span>
          </button>
          <button
            onClick={() => setActiveMode("movie")}
            className={`relative px-5 py-2 text-sm font-semibold transition-all ${activeMode === 'movie' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            {activeMode === 'movie' && (
              <motion.div layoutId="nav-line" className="absolute bottom-1 left-5 right-5 h-0.5 bg-white rounded-full" transition={{ type: "spring", duration: 0.5 }} />
            )}
            <span className="relative z-10 uppercase tracking-widest text-xs">MOVIE WORDLE</span>
          </button>
          <button
            onClick={() => setActiveMode("leaderboard")}
            className={`relative px-5 py-2 text-sm font-semibold transition-all ${activeMode === 'leaderboard' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            {activeMode === 'leaderboard' && (
              <motion.div layoutId="nav-line" className="absolute bottom-1 left-5 right-5 h-0.5 bg-white rounded-full" transition={{ type: "spring", duration: 0.5 }} />
            )}
            <span className="relative z-10 uppercase tracking-widest text-xs flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              LEADERBOARD
            </span>
          </button>
        </nav>

        <div className="z-10 flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-gray-500 tracking-wide">Checking session…</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <User className="w-3.5 h-3.5 text-anime-accent" />
                <span className="font-medium text-white">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-sm font-semibold tracking-wide text-white hover:text-gray-300 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-12 relative z-10 flex flex-col justify-center pb-20">
        <AnimatePresence mode="wait">
          {activeMode === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex-1 flex items-center justify-between relative mt-8"
            >
              <div className="w-1/2 space-y-8 z-20">
                <h1 className="font-nabla text-[4rem] leading-none text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] select-none brightness-0 invert">
                  ANIGUESSER
                </h1>
                <p className="text-gray-300 font-medium text-[15px] leading-relaxed max-w-md mix-blend-lighten">
                  AniGuesser is a website to test and connect anime
                  <br />
                  lovers global. Show the world how big is your love
                  <br />
                  for anime &lt;3
                </p>
                <div className="flex items-center gap-4 pt-6">
                  <button
                    onClick={() => setActiveMode("screenshot")}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 transition-all rounded-full text-white font-semibold text-sm tracking-wide gradiant"
                  >
                    Screenshot Guess
                    <span className="text-gray-400 group-hover:text-white transition-colors">&rsaquo;</span>
                  </button>
                  <button
                    onClick={() => setActiveMode("wordle")}
                    className="flex items-center gap-2 px-6 py-3 hover:text-gray-300 transition-all text-white font-semibold text-sm tracking-wide group"
                  >
                    Anime Wordle
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">&rsaquo;</span>
                  </button>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className="w-1/2 flex justify-center items-center h-full pointer-events-none z-10"
              >
                <Image
                  src="/images/Rimuru_Full_Art.webp"
                  alt="Rimuru Tempest"
                  width={800}
                  height={800}
                  className="object-contain w-full h-auto drop-shadow-[0_0_50px_rgba(0,180,255,0.25)] scale-125 translate-y-[-1%]"
                  priority
                />
              </motion.div>
            </motion.div>
          )}

          {activeMode === "wordle" && (
            <motion.div
              key="wordle-game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl mx-auto mt-24"
            >
              <AnimeWordle />
            </motion.div>
          )}

          {activeMode === "screenshot" && (
            <motion.div
              key="screenshot-game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl mx-auto mt-24"
            >
              <ScreenshotGuesser />
            </motion.div>
          )}

          {activeMode === "movie" && (
            <motion.div
              key="movie-game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl mx-auto mt-24"
            >
              <MovieWordle />
            </motion.div>
          )}

          {activeMode === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-3xl mx-auto mt-24"
            >
              <Leaderboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
