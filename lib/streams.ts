// Shared DTO + serializer for streams, used by the API routes and the frontend
// so the client and server agree on the exact shape over the wire.

import type { Prisma } from "@prisma/client";

/** A single track as sent to the client. */
export type StreamDTO = {
  id: string;
  extractedId: string;
  title: string;
  thumbnail: string;
  url: string;
  score: number;
  createdAt: string;
  playedAt: string | null;
  addedBy: { name: string | null; image: string | null };
  /** The current viewer's vote on this track: -1, 0, or 1. */
  userVote: number;
  /** True if the current viewer is the one who submitted this track. */
  isOwner: boolean;
  /** True if the host has bumped this track to play next, regardless of votes. */
  isPriority: boolean;
};

/** Response of GET /api/streams (the polling endpoint). */
export type StreamsResponse = {
  nowPlaying: StreamDTO | null;
  queue: StreamDTO[];
};

/** Response of POST /api/streams/vote. */
export type VoteResponse = {
  score: number;
  userVote: number;
};

/**
 * Canonical queue ordering, shared by the leaderboard and the auto-advance:
 * host-prioritized tracks first (FIFO by when they were bumped), then by net
 * votes, then oldest first as a tie-breaker.
 */
export const QUEUE_ORDER: Prisma.StreamOrderByWithRelationInput[] = [
  { priorityAt: { sort: "asc", nulls: "last" } },
  { score: "desc" },
  { createdAt: "asc" },
];

// Minimal structural shape the serializer needs — satisfied by our Prisma
// queries (which include `addedBy` and optionally the viewer's `votes`).
type SerializableStream = {
  id: string;
  extractedId: string;
  title: string;
  thumbnail: string;
  url: string;
  score: number;
  createdAt: Date;
  playedAt: Date | null;
  priorityAt: Date | null;
  addedById: string;
  addedBy: { name: string | null; image: string | null } | null;
  votes?: { value: number }[];
};

/** Convert a Prisma Stream row (with relations) into the wire DTO. */
export function serializeStream(
  stream: SerializableStream,
  userId?: string,
): StreamDTO {
  return {
    id: stream.id,
    extractedId: stream.extractedId,
    title: stream.title,
    thumbnail: stream.thumbnail,
    url: stream.url,
    score: stream.score,
    createdAt: stream.createdAt.toISOString(),
    playedAt: stream.playedAt?.toISOString() ?? null,
    addedBy: {
      name: stream.addedBy?.name ?? null,
      image: stream.addedBy?.image ?? null,
    },
    userVote: stream.votes?.[0]?.value ?? 0,
    isOwner: !!userId && stream.addedById === userId,
    isPriority: stream.priorityAt != null,
  };
}
