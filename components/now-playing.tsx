import Image from "next/image";
import { Radio } from "lucide-react";

import type { StreamDTO } from "@/lib/streams";

export function NowPlaying({ stream }: { stream: StreamDTO | null }) {
  if (!stream) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
      <div className="flex items-center gap-4 p-4">
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
          <Image
            src={stream.thumbnail}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Now playing
          </div>
          <p className="line-clamp-2 font-semibold leading-snug">
            {stream.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            added by {stream.addedBy.name ?? "someone"}
          </p>
        </div>
      </div>
    </div>
  );
}
