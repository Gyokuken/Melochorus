"use client";

import { useSession } from "next-auth/react";

import { useStreams } from "@/hooks/use-streams";
import { NowPlaying } from "@/components/now-playing";
import { Queue } from "@/components/queue";
import { SubmitForm } from "@/components/submit-form";

export function HomeClient() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const { nowPlaying, queue, isLoading, error, refresh, applyVote } =
    useStreams();

  return (
    <main className="container max-w-3xl space-y-8 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          What should we play next?
        </h1>
        <p className="text-sm text-muted-foreground">
          Drop a track, vote, and the crowd&apos;s favorite plays on the speaker.
        </p>
      </div>

      <SubmitForm isAuthed={isAuthed} onAdded={refresh} />
      <NowPlaying stream={nowPlaying} />
      <Queue
        streams={queue}
        isLoading={isLoading}
        error={error}
        isAuthed={isAuthed}
        applyVote={applyVote}
      />
    </main>
  );
}
