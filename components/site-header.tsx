"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Headphones, LogOut, Music2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/sign-in-button";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Music2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Melochorus</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {status === "loading" ? null : user ? (
            <>
              {user.isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/host">
                    <Headphones className="h-4 w-4" />
                    <span className="hidden sm:inline">Host</span>
                  </Link>
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "You"}
                  />
                  <AvatarFallback>
                    {(user.name ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <SignInButton size="sm" />
          )}
        </div>
      </div>
    </header>
  );
}
