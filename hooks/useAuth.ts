"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/anime";
import { getCurrentUser, signIn, signUp, signOut } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const login = useCallback(
    (username: string): { user: User | null; error?: string } => {
      const result = signIn(username);
      if (result.user) setUser(result.user);
      return result;
    },
    []
  );

  const register = useCallback(
    (username: string): { user: User | null; error?: string } => {
      const result = signUp(username);
      if (result.user) setUser(result.user);
      return result;
    },
    []
  );

  const logout = useCallback(() => {
    signOut();
    setUser(null);
  }, []);

  return { user, login, register, logout };
}
