import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "accent" | "pink" | "cyan" | "none";
}

const glowMap = {
  accent: "glow-accent",
  pink: "glow-pink",
  cyan: "glow-cyan",
  none: "",
};

export default function Card({ children, className = "", glow = "none" }: CardProps) {
  return (
    <div
      className={`glass rounded-xl p-4 ${glowMap[glow]} transition-shadow ${className}`}
    >
      {children}
    </div>
  );
}
