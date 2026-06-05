"use client";

import { type ComponentType, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toast } from "sonner";
import {
  ListMusic,
  ListStart,
  Loader2,
  Play,
  Plus,
  SkipForward,
} from "lucide-react";
import type { YouTubeProps } from "react-youtube";

import { SubmitForm } from "@/components/submit-form";
import { Button } from "@/components/ui/button";
import { useStreams } from "@/hooks/use-streams";
import { cn } from "@/lib/utils";
import type { StreamDTO } from "@/lib/streams";

// react-youtube touches the window/IFrame API, so load it client-only.
// (resolve to the default export + cast — its bundled propTypes don't line up
// with next/dynamic's loader generics otherwise.)
const YouTube = dynamic(
  () =>
    import("react-youtube").then(
      (mod) => mod.default as unknown as ComponentType<YouTubeProps>,
    ),
  { ssr: false },
);

const PLAYER_OPTS: YouTubeProps["opts"] = {
  width: "100%",
  height: "100%",
  playerVars: { autoplay: 1, modestbranding: 1, rel: 0 },
};

export function HostPlayer({ roomId }: { roomId: string }) {
  const { nowPlaying, queue, refresh } = useStreams(roomId);
  const [current, setCurrent] = useState<StreamDTO | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [busy, setBusy] = useState(false);

  // On first load, resume whatever the server says is currently playing.
  useEffect(() => {
    if (!bootstrapped && nowPlaying) {
      setCurrent(nowPlaying);
      setBootstrapped(true);
    }
  }, [nowPlaying, bootstrapped]);

  // Advance to the next track. The server orders priority tracks first, so a
  // host "Play next" pick is auto-selected here without any client tracking.
  async function advance() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/streams/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't advance the queue.");
      setCurrent(data.nowPlaying as StreamDTO | null);
      setBootstrapped(true);
      await refresh();
      if (!data.nowPlaying) toast.info("Queue's empty — add more tracks!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't advance the queue.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Host override: play a specific track right now, bypassing the vote order.
  async function playNow(streamId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/streams/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't play that track.");
      setCurrent(data.nowPlaying as StreamDTO | null);
      setBootstrapped(true);
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't play that track.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Host override: toggle a track's "play next" priority (persisted server-side).
  async function togglePriority(streamId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/streams/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't update priority.");
      await refresh();
      toast.success(
        data.isPriority ? "Bumped to play next." : "Priority removed.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't update priority.",
      );
    } finally {
      setBusy(false);
    }
  }

  const onEnd: YouTubeProps["onEnd"] = () => {
    void advance();
  };
  const onError: YouTubeProps["onError"] = () => {
    toast.error("That video couldn't play — skipping.");
    void advance();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
          {current ? (
            <YouTube
              key={current.id}
              videoId={current.extractedId}
              opts={PLAYER_OPTS}
              onEnd={onEnd}
              onError={onError}
              className="absolute inset-0 h-full w-full"
              iframeClassName="absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                {queue.length ? "Ready when you are." : "No tracks queued yet."}
              </p>
              {queue.length > 0 && (
                <Button onClick={() => void advance()} disabled={busy}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start playing
                </Button>
              )}
            </div>
          )}
        </div>

        {current && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold leading-snug">
                {current.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                added by {current.addedBy.name ?? "someone"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void advance()}
              disabled={busy}
              className="shrink-0"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SkipForward className="h-4 w-4" />
              )}
              Skip
            </Button>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="space-y-2 pb-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Plus className="h-4 w-4" />
            Add a track
          </h2>
          <SubmitForm roomId={roomId} onAdded={refresh} />
        </div>

        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ListMusic className="h-4 w-4" />
          Up next · {queue.length}
        </h2>
        {queue.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center text-xs text-muted-foreground">
            The queue is empty.
          </p>
        ) : (
          <ol className="space-y-2">
            {queue.map((s, i) => (
              <li
                key={s.id}
                className={cn(
                  "space-y-2 rounded-lg border bg-card p-2",
                  s.isPriority ? "border-primary/50" : "border-border",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-4 text-center text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="relative aspect-video w-14 shrink-0 overflow-hidden rounded bg-muted">
                    <Image
                      src={s.thumbnail}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <p className="line-clamp-2 min-w-0 flex-1 text-xs font-medium leading-snug">
                    {s.title}
                  </p>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {s.score}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={s.isPriority ? "default" : "outline"}
                    onClick={() => void togglePriority(s.id)}
                    disabled={busy}
                    className="h-7 flex-1 px-2 text-xs"
                  >
                    <ListStart className="h-3.5 w-3.5" />
                    {s.isPriority ? "Priority" : "Play next"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void playNow(s.id)}
                    disabled={busy}
                    className="h-7 flex-1 px-2 text-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Now
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
