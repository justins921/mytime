import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ADMIN_EMAIL } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, welcomeEmailHtml, verificationEmailHtml } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 signups per IP per 15 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limited = rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

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
      const role = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? "owner" : existing.role;
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
    const role = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? "owner" : "user";

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        passwordHash,
        role,
      },
    });

    // Send verification email
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${normalizedEmail}`,
        token: verifyToken,
        expires: verifyExpires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Verify your MyTime email address",
      html: verificationEmailHtml(verifyUrl),
    });

    // Send welcome email
    await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to MyTime!",
      html: welcomeEmailHtml(name?.trim() || null),
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
