import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body },
    update: body,
  });
  return NextResponse.json(settings);
}
