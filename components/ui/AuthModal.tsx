"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  onSignIn: (username: string, password: string) => Promise<{ error?: string }>;
  onSignUp: (details: { username: string; email: string; password: string }) => Promise<{
    error?: string;
  }>;
  onClose: () => void;
}

export default function AuthModal({ onSignIn, onSignUp, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const canSubmit = isSignup
    ? Boolean(username.trim() && email.trim() && password.trim())
    : Boolean(username.trim() && password.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "signin"
        ? await onSignIn(username, password)
        : await onSignUp({ username, email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm mx-4 glass rounded-2xl p-6 shadow-2xl border border-anime-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-anime-accent/20 border border-anime-accent/40 flex items-center justify-center">
              <User className="w-4 h-4 text-anime-accent" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "signup" ? "e.g. anime_fan_42" : "Your username"}
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl bg-anime-darker border border-anime-border text-white placeholder-gray-600 focus:outline-none focus:border-anime-accent/60 transition-colors text-sm"
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-anime-darker border border-anime-border text-white placeholder-gray-600 focus:outline-none focus:border-anime-accent/60 transition-colors text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "Create a password" : "Your password"}
              className="w-full px-3 py-2.5 rounded-xl bg-anime-darker border border-anime-border text-white placeholder-gray-600 focus:outline-none focus:border-anime-accent/60 transition-colors text-sm"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-anime-accent hover:bg-anime-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {mode === "signin" ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={toggleMode}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {isSignup && (
          <p className="mt-3 text-center text-xs text-gray-600">
            Username: 3–20 chars · letters, numbers and underscores only
          </p>
        )}
      </motion.div>
    </div>
  );
}
