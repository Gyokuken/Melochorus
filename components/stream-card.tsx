"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { StreamDTO } from "@/lib/streams";

export function StreamCard({
  stream,
  rank,
  isAuthed,
  applyVote,
}: {
  stream: StreamDTO;
  rank: number;
  isAuthed: boolean;
  applyVote: (streamId: string, score: number, userVote: number) => void;
}) {
  const [pending, setPending] = useState(false);

  async function vote(direction: "up" | "down") {
    if (!isAuthed) {
      void signIn("google");
      return;
    }
    if (pending) return;

    setPending(true);
    try {
      const res = await fetch("/api/streams/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: stream.id, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Vote failed.");
      applyVote(stream.id, data.score, data.userVote);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vote failed.");
    } finally {
      setPending(false);
    }
  }

  const isTop = rank === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        isTop ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card",
      )}
    >
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => vote("up")}
          disabled={pending}
          aria-label="Upvote"
          className={cn(
            "rounded-md p-1 transition-colors hover:bg-accent disabled:opacity-50",
            stream.userVote === 1 && "text-primary",
          )}
        >
          <ArrowBigUp
            className={cn("h-5 w-5", stream.userVote === 1 && "fill-current")}
          />
        </button>
        <span
          className={cn(
            "min-w-[2ch] text-center text-sm font-semibold tabular-nums",
            stream.score > 0 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {stream.score}
        </span>
        <button
          type="button"
          onClick={() => vote("down")}
          disabled={pending}
          aria-label="Downvote"
          className={cn(
            "rounded-md p-1 transition-colors hover:bg-accent disabled:opacity-50",
            stream.userVote === -1 && "text-sky-400",
          )}
        >
          <ArrowBigDown
            className={cn("h-5 w-5", stream.userVote === -1 && "fill-current")}
          />
        </button>
      </div>

      <div className="hidden w-6 text-center text-sm font-medium text-muted-foreground sm:block">
        {rank}
      </div>

      <a
        href={stream.url}
        target="_blank"
        rel="noreferrer"
        className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:w-28"
      >
        <Image
          src={stream.thumbnail}
          alt=""
          fill
          sizes="112px"
          className="object-cover"
        />
      </a>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {stream.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar className="h-4 w-4">
            <AvatarImage src={stream.addedBy.image ?? undefined} alt="" />
            <AvatarFallback className="text-[8px]">
              {(stream.addedBy.name ?? "?").slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            {stream.isOwner ? "You" : stream.addedBy.name ?? "Someone"}
          </span>
        </div>
      </div>
    </div>
  );
}
