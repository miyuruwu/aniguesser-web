import { ReactNode } from "react";

type BadgeVariant = "correct" | "earlier" | "later" | "higher" | "lower" | "incorrect" | "match" | "neutral";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  correct: "bg-anime-green/20 text-anime-green border-anime-green/50",
  earlier: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  later: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  higher: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  lower: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  incorrect: "bg-red-500/20 text-red-400 border-red-500/50",
  match: "bg-anime-green/20 text-anime-green border-anime-green/50",
  neutral: "bg-gray-500/20 text-gray-400 border-gray-500/50",
};

export default function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
