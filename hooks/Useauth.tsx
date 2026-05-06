"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@/types/anime";

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<{ user: User | null; error?: string }>;
  register: (details: { username: string; email: string; password: string }) => Promise<{ user: User | null; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data: { user: User | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<{ user: User | null; error?: string }> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok) return { user: null, error: data.error };
      setUser(data.user ?? null);
      return { user: data.user ?? null };
    },
    []
  );

  const register = useCallback(
    async (details: { username: string; email: string; password: string }): Promise<{ user: User | null; error?: string }> => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(details),
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok) return { user: null, error: data.error };
      setUser(data.user ?? null);
      return { user: data.user ?? null };
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}