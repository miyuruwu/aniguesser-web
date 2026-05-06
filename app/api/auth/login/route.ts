import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, sessionCookieArgs } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    const key = (username ?? "").trim().toLowerCase();
    const trimmedPassword = (password ?? "").trim();

    if (!key) {
      return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
    }
    if (!trimmedPassword) {
      return NextResponse.json({ error: "Password cannot be empty." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username: key } });
    if (!user) {
      return NextResponse.json(
        { error: "No account found. Create one first!" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.getTime(),
      },
    });
    response.cookies.set(...sessionCookieArgs(token));

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}