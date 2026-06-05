"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MemberDTO } from "@/lib/rooms";

/** Host's "who joined" panel — polls the members endpoint for live presence. */
export function MembersPanel({ code }: { code: string }) {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}/members`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data: { members: MemberDTO[] } = await res.json();
          if (active.current) setMembers(data.members);
        }
      } catch {
        // transient — next tick will retry
      }
      if (!cancelled) timer = setTimeout(tick, 8000);
    };
    void tick();

    return () => {
      cancelled = true;
      active.current = false;
      clearTimeout(timer);
    };
  }, [code]);

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-4 w-4" />
          Who&apos;s joined
        </h2>
        <span className="text-xs text-muted-foreground">
          {onlineCount} online · {members.length} total
        </span>
      </div>

      {members.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No one yet — share the room code!
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.image ?? undefined} alt={m.name ?? ""} />
                  <AvatarFallback>
                    {(m.name ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  title={m.online ? "Online" : "Away"}
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                    m.online ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                />
              </div>
              <span className="flex-1 truncate text-sm">
                {m.name ?? "Anonymous"}
              </span>
              {m.isHost && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Crown className="h-3 w-3 fill-current" />
                  Host
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
