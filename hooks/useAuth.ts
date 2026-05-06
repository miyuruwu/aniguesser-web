"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/anime";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data: { user: User | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ user: User | null; error?: string }> => {
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
    async (details: {
      username: string;
      email: string;
      password: string;
    }): Promise<{ user: User | null; error?: string }> => {
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

  return { user, login, register, logout };
}
