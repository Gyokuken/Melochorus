import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/rooms";

/**
 * POST /api/rooms  { name?: string }
 * Auth required. Creates a room with a unique join code, makes the caller the
 * host, and adds them as the first member. Returns { code, name }.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a room." },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    let body: { name?: string } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine — we default the name below
    }
    const name = body.name?.trim().slice(0, 50) || "Melochorus room";

    // Generate a unique code (retry on the rare collision).
    let code = generateRoomCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await prisma.room.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!clash) break;
      code = generateRoomCode();
    }

    const room = await prisma.room.create({
      data: {
        code,
        name,
        hostId: userId,
        members: { create: { userId } },
      },
      select: { code: true, name: true },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
