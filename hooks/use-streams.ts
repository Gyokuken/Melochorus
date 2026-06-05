"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StreamDTO, StreamsResponse } from "@/lib/streams";

/**
 * Polls GET /api/streams?roomId=... on an interval (default 5s) — our
 * deploy-anywhere alternative to WebSockets, which also serves as the room
 * presence heartbeat (the server bumps lastSeenAt on each poll). Uses a
 * recursive timeout so requests never overlap, and exposes:
 *   - refresh():  force an immediate refetch (after submitting a track)
 *   - applyVote(): patch one track's score/vote locally for instant feedback,
 *                  re-sorting the queue; the next poll reconciles with the server.
 */
export function useStreams(roomId: string, intervalMs = 5000) {
  const [nowPlaying, setNowPlaying] = useState<StreamDTO | null>(null);
  const [queue, setQueue] = useState<StreamDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const active = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/streams?roomId=${encodeURIComponent(roomId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to load the queue.");
      const data: StreamsResponse = await res.json();
      if (!active.current) return;
      setNowPlaying(data.nowPlaying);
      setQueue(data.queue);
      setError(null);
    } catch (err) {
      if (active.current) {
        setError(err instanceof Error ? err.message : "Failed to load the queue.");
      }
    } finally {
      if (active.current) setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    active.current = true;
    let cancelled = false;

    const tick = async () => {
      await fetchStreams();
      if (!cancelled) timer.current = setTimeout(tick, intervalMs);
    };
    void tick();

    return () => {
      cancelled = true;
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fetchStreams, intervalMs]);

  const applyVote = useCallback(
    (streamId: string, score: number, userVote: number) => {
      setQueue((prev) => {
        const next = prev.map((s) =>
          s.id === streamId ? { ...s, score, userVote } : s,
        );
        // keep ordering: priority first, then score desc, then oldest first
        next.sort((a, b) => {
          if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
          return b.score - a.score || a.createdAt.localeCompare(b.createdAt);
        });
        return next;
      });
    },
    [],
  );

  return { nowPlaying, queue, isLoading, error, refresh: fetchStreams, applyVote };
}
