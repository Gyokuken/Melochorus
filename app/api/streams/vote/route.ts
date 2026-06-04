import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { VoteResponse } from "@/lib/streams";

/**
 * POST /api/streams/vote  { streamId: string, direction: "up" | "down" }
 * Auth required. Toggle semantics:
 *   - no existing vote      -> cast it
 *   - same direction again  -> remove it (un-vote)
 *   - opposite direction    -> flip it
 * The stream's denormalized `score` is adjusted by the exact delta inside a
 * transaction, so concurrent votes can never corrupt the running total.
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to vote." },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  let body: { streamId?: string; direction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { streamId, direction } = body;
  if (!streamId || (direction !== "up" && direction !== "down")) {
    return NextResponse.json(
      { error: "streamId and direction ('up' | 'down') are required." },
      { status: 400 },
    );
  }
  const desired = direction === "up" ? 1 : -1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stream = await tx.stream.findUnique({
        where: { id: streamId },
        select: { played: true },
      });
      if (!stream) throw new HttpError(404, "That track no longer exists.");
      if (stream.played) {
        throw new HttpError(409, "You can't vote on a track that already played.");
      }

      const existing = await tx.vote.findUnique({
        where: { userId_streamId: { userId, streamId } },
        select: { value: true },
      });

      let delta: number;
      let userVote: number;

      if (!existing) {
        await tx.vote.create({ data: { value: desired, userId, streamId } });
        delta = desired;
        userVote = desired;
      } else if (existing.value === desired) {
        await tx.vote.delete({
          where: { userId_streamId: { userId, streamId } },
        });
        delta = -desired;
        userVote = 0;
      } else {
        await tx.vote.update({
          where: { userId_streamId: { userId, streamId } },
          data: { value: desired },
        });
        delta = desired - existing.value;
        userVote = desired;
      }

      const updated = await tx.stream.update({
        where: { id: streamId },
        data: { score: { increment: delta } },
        select: { score: true },
      });

      const response: VoteResponse = { score: updated.score, userVote };
      return response;
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[vote] unexpected error", err);
    return NextResponse.json(
      { error: "Something went wrong casting your vote." },
      { status: 500 },
    );
  }
}
