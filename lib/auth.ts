import { User } from "@/types/anime";

const USERS_KEY = "aniguesser-users";
const CURRENT_USER_KEY = "aniguesser-current-user";

function getUsers(): Record<string, User> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, User>) : {};
  } catch {
    return {};
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function signIn(username: string): { user: User | null; error?: string } {
  const key = username.trim().toLowerCase();
  if (!key) return { user: null, error: "Username cannot be empty." };

  const users = getUsers();
  if (!users[key]) {
    return { user: null, error: "No account found. Create one first!" };
  }

  const user = users[key];
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { user };
}

export function signUp(username: string): { user: User | null; error?: string } {
  const key = username.trim().toLowerCase();
  if (!key) return { user: null, error: "Username cannot be empty." };
  if (key.length < 3) return { user: null, error: "Username must be at least 3 characters." };
  if (key.length > 20) return { user: null, error: "Username must be 20 characters or fewer." };
  if (!/^[a-z0-9_]+$/.test(key)) {
    return { user: null, error: "Username can only contain letters, numbers, and underscores." };
  }

  const users = getUsers();
  if (users[key]) {
    return { user: null, error: "Username already taken. Try signing in instead!" };
  }

  const user: User = {
    id: `${key}-${Date.now()}`,
    username: username.trim(),
    createdAt: Date.now(),
  };

  users[key] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { user };
}

export function signOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
