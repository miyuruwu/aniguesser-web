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

export function signIn(
  username: string,
  password: string
): { user: User | null; error?: string } {
  const key = username.trim().toLowerCase();
  const passwordTrimmed = password.trim();
  if (!key) return { user: null, error: "Username cannot be empty." };
  if (!passwordTrimmed) return { user: null, error: "Password cannot be empty." };

  const users = getUsers();
  if (!users[key]) {
    return { user: null, error: "No account found. Create one first!" };
  }

  const user = users[key];
  if (user.password !== passwordTrimmed) {
    return { user: null, error: "Incorrect password." };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { user };
}

export function signUp(details: {
  username: string;
  email: string;
  password: string;
}): { user: User | null; error?: string } {
  const trimmed = details.username.trim();
  const key = trimmed.toLowerCase();
  const trimmedEmail = details.email.trim();
  const trimmedPassword = details.password.trim();

  if (!key) return { user: null, error: "Username cannot be empty." };
  if (key.length < 3) return { user: null, error: "Username must be at least 3 characters." };
  if (key.length > 20) return { user: null, error: "Username must be 20 characters or fewer." };
  if (!/^[a-z0-9_]+$/i.test(trimmed)) {
    return { user: null, error: "Username can only contain letters, numbers, and underscores." };
  }
  if (!trimmedEmail) return { user: null, error: "Email cannot be empty." };
  if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
    return { user: null, error: "Enter a valid email address." };
  }
  if (!trimmedPassword) return { user: null, error: "Password cannot be empty." };
  if (trimmedPassword.length < 6) {
    return { user: null, error: "Password must be at least 6 characters." };
  }

  const users = getUsers();
  if (users[key]) {
    return { user: null, error: "Username already taken. Try signing in instead!" };
  }

  const user: User = {
    id: `${key}-${Date.now()}`,
    username: trimmed,
    email: trimmedEmail,
    password: trimmedPassword,
    createdAt: Date.now(),
  };

  users[key] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { user };
}

export function deleteAccount(username: string): { success: boolean; error?: string } {
  if (typeof window === "undefined") return { success: false, error: "Not in browser." };

  const key = username.trim().toLowerCase();
  if (!key) return { success: false, error: "Username cannot be empty." };

  const users = getUsers();
  if (!users[key]) {
    return { success: false, error: "Account not found." };
  }

  delete users[key];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const current = getCurrentUser();
  if (current?.username.trim().toLowerCase() === key) {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  return { success: true };
}

export function clearAllUsers(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function signOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
