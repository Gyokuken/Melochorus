import { NextResponse } from "next/server";

import { getServerAuthSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeStream } from "@/lib/streams";

/**
 * POST /api/streams/play  { streamId: string }
 * Admin (host) only. The DJ override: promote a *specific* track to
 * "now playing" immediately, ignoring the vote ranking. Same effect as
 * /next, but the host picks the track instead of it being the top-voted one.
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only the host can do that." },
      { status: 403 },
    );
  }

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
    select: { played: true },
  });
  if (!stream) {
    return NextResponse.json(
      { error: "That track no longer exists." },
      { status: 404 },
    );
  }
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
    nowPlaying: serializeStream(nowPlaying, session.user.id),
  });
}
