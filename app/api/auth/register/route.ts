import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, sessionCookieArgs } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body as {
      username?: string;
      email?: string;
      password?: string;
    };

    const trimmed = (username ?? "").trim();
    // Store and look up usernames in lowercase for consistent case-insensitive matching
    const key = trimmed.toLowerCase();
    const trimmedEmail = (email ?? "").trim().toLowerCase();
    const trimmedPassword = (password ?? "").trim();

    if (!key) {
      return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
    }
    if (key.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }
    if (key.length > 20) {
      return NextResponse.json(
        { error: "Username must be 20 characters or fewer." },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9_]+$/.test(key)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores." },
        { status: 400 }
      );
    }
    if (!trimmedEmail) {
      return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
    }
    // ReDoS-safe email format check (dots excluded from domain segments)
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s.]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!trimmedPassword) {
      return NextResponse.json({ error: "Password cannot be empty." }, { status: 400 });
    }
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username: key } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken. Try signing in instead!" },
        { status: 409 }
      );
    }

    const emailExists = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (emailExists) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 12);

    const user = await prisma.user.create({
      data: {
        username: key,
        email: trimmedEmail,
        password: hashedPassword,
      },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    const token = await signToken({ userId: user.id, username: user.username });

    const response = NextResponse.json(
      { user: { ...user, createdAt: user.createdAt.getTime() } },
      { status: 201 }
    );
    response.cookies.set(...sessionCookieArgs(token));

    return response;
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}