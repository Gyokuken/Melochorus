import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ROOM_TTL_MS } from "@/lib/rooms";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup
 * Scheduled sweep (Vercel Cron — daily, see vercel.json). Deletes rooms older
 * than ROOM_TTL_MS whose every member has been idle past the TTL — i.e. truly
 * abandoned rooms nobody reopened (the lazy prune handles rooms someone tries
 * to revisit). Protected by CRON_SECRET, which Vercel sends as a Bearer token.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ROOM_TTL_MS);
  const result = await prisma.room.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      members: { every: { lastSeenAt: { lt: cutoff } } },
    },
  });

  return NextResponse.json({ deleted: result.count });
}
