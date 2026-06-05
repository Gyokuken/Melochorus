import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  getRoomByCodeOrThrow,
  ONLINE_WINDOW_MS,
  requireMembership,
  type MemberDTO,
} from "@/lib/rooms";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms/[code]/members
 * Auth + membership required. Returns the member list with live online status,
 * host first. Powers the host's "who joined" panel.
 */
export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    const room = await getRoomByCodeOrThrow(params.code);
    await requireMembership(userId, room.id);

    const members = await prisma.roomMember.findMany({
      where: { roomId: room.id },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        joinedAt: true,
        lastSeenAt: true,
        userId: true,
        user: { select: { name: true, image: true } },
      },
    });

    const now = Date.now();
    const dto: MemberDTO[] = members
      .map((m) => ({
        id: m.id,
        name: m.user.name,
        image: m.user.image,
        isHost: m.userId === room.hostId,
        joinedAt: m.joinedAt.toISOString(),
        online: now - m.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
      }))
      .sort((a, b) => Number(b.isHost) - Number(a.isHost));

    return NextResponse.json({ members: dto });
  } catch (err) {
    return toErrorResponse(err);
  }
}
