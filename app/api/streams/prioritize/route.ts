import { NextResponse } from "next/server";

import { getServerAuthSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/streams/prioritize  { streamId: string }
 * Admin (host) only. Toggles a track's "play next" priority. A prioritized
 * track sorts to the front of the queue for everyone (see QUEUE_ORDER) and is
 * auto-selected by /api/streams/next when the current song ends — regardless
 * of its vote score. Calling again clears it.
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Only the host can prioritize tracks." },
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
    select: { priorityAt: true, played: true },
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

  // Toggle: set to now if not prioritized, clear if it already is.
  const priorityAt = stream.priorityAt ? null : new Date();
  await prisma.stream.update({
    where: { id: streamId },
    data: { priorityAt },
  });

  return NextResponse.json({ isPriority: priorityAt != null });
}
