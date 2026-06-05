import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/lib/rooms";
import { serializeStream } from "@/lib/streams";

/**
 * POST /api/streams/play  { streamId: string }
 * Host only (of the track's room). The DJ override: promote a specific track to
 * "now playing" immediately, ignoring the vote ranking.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    let body: { streamId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }
    const { streamId } = body;
    if (!streamId) {
      return NextResponse.json(
        { error: "streamId is required." },
        { status: 400 },
      );
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { played: true, roomId: true },
    });
    if (!stream) {
      return NextResponse.json(
        { error: "That track no longer exists." },
        { status: 404 },
      );
    }
    await requireHost(userId, stream.roomId);
    if (stream.played) {
      return NextResponse.json(
        { error: "That track already played." },
        { status: 409 },
      );
    }

    const nowPlaying = await prisma.stream.update({
      where: { id: streamId },
      data: { played: true, playedAt: new Date() },
      include: { addedBy: { select: { name: true, image: true } } },
    });

    return NextResponse.json({
      nowPlaying: serializeStream(nowPlaying, userId),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
