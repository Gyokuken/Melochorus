import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { markPresent, requireMembership } from "@/lib/rooms";
import { QUEUE_ORDER, serializeStream, type StreamsResponse } from "@/lib/streams";
import { extractYouTubeId, fetchYouTubeMeta } from "@/lib/youtube";

// Always fresh — this is the endpoint everyone polls every few seconds.
export const dynamic = "force-dynamic";

const ADDED_BY = { select: { name: true, image: true } } as const;

/**
 * GET /api/streams?roomId=...
 * Auth + membership required. Returns the room's ranked queue + now-playing,
 * with each track carrying the viewer's vote. This poll also doubles as the
 * presence heartbeat (bumps the caller's lastSeenAt).
 */
export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    const roomId = new URL(req.url).searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json({ error: "roomId is required." }, { status: 400 });
    }

    await requireMembership(userId, roomId);
    await markPresent(userId, roomId);

    const [queue, nowPlaying] = await Promise.all([
      prisma.stream.findMany({
        where: { roomId, played: false },
        orderBy: QUEUE_ORDER,
        include: {
          addedBy: ADDED_BY,
          votes: { where: { userId }, select: { value: true } },
        },
      }),
      prisma.stream.findFirst({
        where: { roomId, played: true },
        orderBy: { playedAt: "desc" },
        include: { addedBy: ADDED_BY },
      }),
    ]);

    const body: StreamsResponse = {
      nowPlaying: nowPlaying ? serializeStream(nowPlaying, userId) : null,
      queue: queue.map((stream) => serializeStream(stream, userId)),
    };
    return NextResponse.json(body);
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/streams  { url: string, roomId: string }
 * Auth + membership required. Parses the YouTube id, pulls title/thumbnail via
 * oEmbed, stores the track in the room, and auto-upvotes it for the submitter.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to add a track." },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    let body: { url?: string; roomId?: string };
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
    await requireMembership(userId, roomId);

    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json(
        { error: "Please paste a YouTube URL." },
        { status: 400 },
      );
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "That doesn't look like a valid YouTube link." },
        { status: 400 },
      );
    }

    // No duplicates while a track is still pending in this room.
    const existing = await prisma.stream.findFirst({
      where: { roomId, extractedId: videoId, played: false },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "That track is already in the queue — vote it up instead!" },
        { status: 409 },
      );
    }

    const meta = await fetchYouTubeMeta(videoId);

    const stream = await prisma.stream.create({
      data: {
        url,
        extractedId: videoId,
        title: meta.title,
        thumbnail: meta.thumbnail,
        score: 1, // the submitter's own auto-upvote
        roomId,
        addedById: userId,
        votes: { create: { value: 1, userId } },
      },
      include: {
        addedBy: ADDED_BY,
        votes: { where: { userId }, select: { value: true } },
      },
    });

    return NextResponse.json(
      { stream: serializeStream(stream, userId) },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
