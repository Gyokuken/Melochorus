import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

// Unambiguous alphabet (no 0/O/1/I/L) for human-typed join codes.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/** How recently a member must have polled to count as "online". */
export const ONLINE_WINDOW_MS = 30_000;

/** A room with nobody present for this long is considered ended (idle expiry). */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Room context handed to the client when it loads a room. */
export type RoomContext = {
  id: string;
  code: string;
  name: string;
  isHost: boolean;
  memberCount: number;
};

/** One member row for the host's "who joined" panel. */
export type MemberDTO = {
  id: string;
  name: string | null;
  image: string | null;
  isHost: boolean;
  joinedAt: string;
  online: boolean;
};

/** Random 6-char join code from the unambiguous alphabet. */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Find a room by its (case-insensitive) code or throw 404. */
export async function getRoomByCodeOrThrow(code: string) {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!room) throw new HttpError(404, "That room doesn't exist.");
  return room;
}

/**
 * Delete the room if nobody has been present for ROOM_TTL_MS (idle expiry).
 * Returns true if it was pruned. Call on user-facing entry points (opening /
 * joining) so a long-dead room reads as "doesn't exist".
 */
export async function pruneIfStale(room: {
  id: string;
  createdAt: Date;
}): Promise<boolean> {
  const { _max } = await prisma.roomMember.aggregate({
    where: { roomId: room.id },
    _max: { lastSeenAt: true },
  });
  const lastSeen = _max.lastSeenAt ?? room.createdAt;
  if (Date.now() - lastSeen.getTime() > ROOM_TTL_MS) {
    await prisma.room.delete({ where: { id: room.id } }).catch(() => {});
    return true;
  }
  return false;
}

/** Throw 403 unless the user has joined the room. */
export async function requireMembership(userId: string, roomId: string) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { id: true },
  });
  if (!member) throw new HttpError(403, "You haven't joined this room.");
}

/** Throw 403 unless the user is the room's host. Returns the room id + host. */
export async function requireHost(userId: string, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, hostId: true },
  });
  if (!room) throw new HttpError(404, "That room doesn't exist.");
  if (room.hostId !== userId) {
    throw new HttpError(403, "Only the host can do that.");
  }
  return room;
}

/** Bump the member's lastSeenAt (presence heartbeat). No-op if not a member. */
export async function markPresent(userId: string, roomId: string) {
  await prisma.roomMember.updateMany({
    where: { roomId, userId },
    data: { lastSeenAt: new Date() },
  });
}
