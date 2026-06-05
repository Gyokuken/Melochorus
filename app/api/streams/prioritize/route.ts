import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/lib/rooms";

/**
 * POST /api/streams/prioritize  { streamId: string }
 * Host only (of the track's room). Toggles a track's "play next" priority. A
 * prioritized track sorts to the front of the queue for everyone (QUEUE_ORDER)
 * and is auto-selected by /api/streams/next. Calling again clears it.
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
      select: { priorityAt: true, played: true, roomId: true },
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

    // Toggle: set to now if not prioritized, clear if it already is.
    const priorityAt = stream.priorityAt ? null : new Date();
    await prisma.stream.update({
      where: { id: streamId },
      data: { priorityAt },
    });

    return NextResponse.json({ isPriority: priorityAt != null });
  } catch (err) {
    return toErrorResponse(err);
  }
}
