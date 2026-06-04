import { NextResponse } from "next/server";

import { getServerAuthSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUEUE_ORDER, serializeStream } from "@/lib/streams";

/**
 * POST /api/streams/next
 * Admin (host) only. Promotes the top unplayed track to "now playing":
 * marks it played + stamps playedAt. The previously-playing track keeps an
 * earlier playedAt, so "now playing" is always the row with the latest stamp.
 * Returns { nowPlaying } — null when the queue is empty.
 */
export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only the host can advance the queue." },
      { status: 403 },
    );
  }

  const next = await prisma.$transaction(async (tx) => {
    const top = await tx.stream.findFirst({
      where: { played: false },
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
    nowPlaying: next ? serializeStream(next, session.user.id) : null,
  });
}
