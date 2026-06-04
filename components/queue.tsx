"use client";

import { ListMusic, Loader2 } from "lucide-react";

import { StreamCard } from "@/components/stream-card";
import type { StreamDTO } from "@/lib/streams";

export function Queue({
  streams,
  isLoading,
  error,
  isAuthed,
  applyVote,
}: {
  streams: StreamDTO[];
  isLoading: boolean;
  error: string | null;
  isAuthed: boolean;
  applyVote: (streamId: string, score: number, userVote: number) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ListMusic className="h-4 w-4" />
          Up next
        </h2>
        {streams.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {streams.length} track{streams.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          {error}
        </p>
      ) : isLoading && streams.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading the queue…
        </div>
      ) : streams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
          Nothing queued yet — paste a YouTube link above to start the party. 🎵
        </div>
      ) : (
        <div className="space-y-2">
          {streams.map((stream, i) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              rank={i + 1}
              isAuthed={isAuthed}
              applyVote={applyVote}
            />
          ))}
        </div>
      )}
    </section>
  );
}
