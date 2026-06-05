import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRoomByCodeOrThrow } from "@/lib/rooms";

/**
 * POST /api/rooms/join  { code: string }
 * Auth required. Adds the caller to the room (idempotent). Returns { code, name }.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to join a room." },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    let body: { code?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }
    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "Enter a room code." }, { status: 400 });
    }

    const room = await getRoomByCodeOrThrow(code);

    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: room.id, userId } },
      create: { roomId: room.id, userId },
      update: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ code: room.code, name: room.name });
  } catch (err) {
    return toErrorResponse(err);
  }
}
