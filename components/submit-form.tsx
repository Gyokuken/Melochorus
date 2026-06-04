"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignInButton } from "@/components/sign-in-button";

export function SubmitForm({
  isAuthed,
  onAdded,
}: {
  isAuthed: boolean;
  onAdded: () => void | Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add that track.");
      toast.success("Added to the queue!", { description: data.stream?.title });
      setUrl("");
      await onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that track.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthed) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Sign in to add tracks and vote on the queue.
        </p>
        <SignInButton />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a YouTube link…"
        inputMode="url"
        disabled={loading}
        className="h-11"
        aria-label="YouTube URL"
      />
      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="h-11 px-5"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Add</span>
      </Button>
    </form>
  );
}
