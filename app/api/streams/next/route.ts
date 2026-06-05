import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/lib/rooms";
import { QUEUE_ORDER, serializeStream } from "@/lib/streams";

/**
 * POST /api/streams/next  { roomId: string }
 * Host only. Promotes the room's top unplayed track to "now playing" (marks it
 * played + stamps playedAt). Returns { nowPlaying } — null when the queue is
 * empty. Priority tracks are ordered first by QUEUE_ORDER, so a host "Play
 * next" pick is selected here automatically.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    let body: { roomId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }
    const roomId = body.roomId;
    if (!roomId) {
      return NextResponse.json({ error: "roomId is required." }, { status: 400 });
    }
    await requireHost(userId, roomId);

    const next = await prisma.$transaction(async (tx) => {
      const top = await tx.stream.findFirst({
        where: { roomId, played: false },
        orderBy: QUEUE_ORDER,
        select: { id: true },
      });
      if (!top) return null;

      return tx.stream.update({
        where: { id: top.id },
        data: { played: true, playedAt: new Date() },
        include: { addedBy: { select: { name: true, image: true } } },
      });
    });

    return NextResponse.json({
      nowPlaying: next ? serializeStream(next, userId) : null,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
