import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRoomByCodeOrThrow, type RoomContext } from "@/lib/rooms";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms/[code]
 * Auth required. Resolves the room, auto-joins the caller (opening a link = a
 * join), marks them present, and returns the room context for the client.
 */
export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to join a room." },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    const room = await getRoomByCodeOrThrow(params.code);

    // Opening a room link joins you (idempotent) and marks you present.
    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: room.id, userId } },
      create: { roomId: room.id, userId },
      update: { lastSeenAt: new Date() },
    });

    const memberCount = await prisma.roomMember.count({
      where: { roomId: room.id },
    });

    const context: RoomContext = {
      id: room.id,
      code: room.code,
      name: room.name,
      isHost: room.hostId === userId,
      memberCount,
    };
    return NextResponse.json(context);
  } catch (err) {
    return toErrorResponse(err);
  }
}
