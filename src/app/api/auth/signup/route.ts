import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ADMIN_EMAIL } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If account exists but has no password (pre-auth migration), let them set one
    if (existing && !existing.passwordHash) {
      const passwordHash = await bcrypt.hash(password, 12);
      const role = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? "admin" : existing.role;
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role,
          name: existing.name || name?.trim() || null,
        },
      });
      return NextResponse.json(
        { id: existing.id, email: existing.email, name: existing.name || name },
        { status: 200 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Auto-promote admin email
    const role = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        passwordHash,
        role,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
