"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { NowPlaying } from "@/components/now-playing";
import { Queue } from "@/components/queue";
import { RoomHeader } from "@/components/room-header";
import { SubmitForm } from "@/components/submit-form";
import { Button } from "@/components/ui/button";
import { useStreams } from "@/hooks/use-streams";
import type { RoomContext } from "@/lib/rooms";

export function RoomClient({ code }: { code: string }) {
  const [room, setRoom] = useState<RoomContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load this room.");
        if (!cancelled) setRoom(data as RoomContext);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load this room.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <main className="container max-w-md space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{error}</h1>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="container flex max-w-3xl items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Joining room…
      </main>
    );
  }

  return <RoomBody room={room} />;
}

function RoomBody({ room }: { room: RoomContext }) {
  const router = useRouter();
  const { nowPlaying, queue, isLoading, error, roomClosed, refresh, applyVote } =
    useStreams(room.id);

  useEffect(() => {
    if (roomClosed) {
      toast.info("This room has ended.");
      router.push("/");
    }
  }, [roomClosed, router]);

  return (
    <main className="container max-w-3xl space-y-6 py-6">
      <RoomHeader
        name={room.name}
        code={room.code}
        memberCount={room.memberCount}
        isHost={room.isHost}
      />
      <SubmitForm roomId={room.id} onAdded={refresh} />
      <NowPlaying stream={nowPlaying} />
      <Queue
        streams={queue}
        isLoading={isLoading}
        error={error}
        isAuthed
        applyVote={applyVote}
      />
    </main>
  );
}
