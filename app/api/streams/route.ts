import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUEUE_ORDER, serializeStream, type StreamsResponse } from "@/lib/streams";
import { extractYouTubeId, fetchYouTubeMeta } from "@/lib/youtube";

// Always fresh — this is the endpoint everyone polls every few seconds.
export const dynamic = "force-dynamic";

const ADDED_BY = { select: { name: true, image: true } } as const;

/**
 * GET /api/streams
 * Public. Returns the ranked pending queue + the current now-playing track.
 * If the viewer is signed in, each track carries their own vote (-1/0/1).
 */
export async function GET() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  const [queue, nowPlaying] = await Promise.all([
    prisma.stream.findMany({
      where: { played: false },
      orderBy: QUEUE_ORDER,
      include: {
        addedBy: ADDED_BY,
        votes: userId
          ? { where: { userId }, select: { value: true } }
          : false,
      },
    }),
    prisma.stream.findFirst({
      where: { played: true },
      orderBy: { playedAt: "desc" },
      include: { addedBy: ADDED_BY },
    }),
  ]);

  const body: StreamsResponse = {
    nowPlaying: nowPlaying ? serializeStream(nowPlaying, userId) : null,
    queue: queue.map((stream) => serializeStream(stream, userId)),
  };

  return NextResponse.json(body);
}

/**
 * POST /api/streams  { url: string }
 * Auth required. Parses the YouTube id, pulls title/thumbnail via oEmbed,
 * stores the track, and auto-upvotes it on the submitter's behalf.
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to add a track." },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

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

  // No duplicates while a track is still in the pending queue.
  const existing = await prisma.stream.findFirst({
    where: { extractedId: videoId, played: false },
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
}
