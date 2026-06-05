"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Headphones, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RoomHeader({
  name,
  code,
  memberCount,
  isHost,
}: {
  name: string;
  code: string;
  memberCount: number;
  isHost: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Room code copied!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — the code is " + code);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight">{name}</h1>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {memberCount} in the room
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copyCode}
          title="Copy room code"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-sm font-semibold tracking-[0.2em] transition-colors hover:bg-accent"
        >
          {code}
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {isHost && (
          <Button asChild size="sm">
            <Link href={`/room/${code}/host`}>
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Host view</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
