"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}