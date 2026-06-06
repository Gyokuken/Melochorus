"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Power } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EndRoomButton({ code }: { code: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);

  async function end() {
    setEnding(true);
    try {
      const res = await fetch(`/api/rooms/${code}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't end the room.");
      }
      toast.success("Room ended.");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't end the room.");
      setEnding(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          End for everyone?
        </span>
        <Button
          size="sm"
          variant="destructive"
          onClick={end}
          disabled={ending}
        >
          {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, end"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={ending}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => setConfirming(true)}
    >
      <Power className="h-4 w-4" />
      <span className="hidden sm:inline">End room</span>
    </Button>
  );
}
