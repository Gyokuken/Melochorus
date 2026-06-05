"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function RoomLauncher() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the room.");
      router.push(`/room/${data.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the room.");
      setCreating(false);
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value || joining) return;
    setJoining(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't join the room.");
      router.push(`/room/${data.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join the room.");
      setJoining(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Host a room</CardTitle>
          <CardDescription>Start a queue and get a code to share.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createRoom} className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room name (optional)"
              maxLength={50}
              aria-label="Room name"
            />
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create room
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join a room</CardTitle>
          <CardDescription>Enter the code your host shared.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={joinRoom} className="space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              aria-label="Room code"
              className="text-center font-mono text-lg uppercase tracking-[0.3em]"
            />
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={joining || !code.trim()}
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Join room
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
