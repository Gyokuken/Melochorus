import Link from "next/link";

import { getServerAuthSession, isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { HostPlayer } from "@/components/host-player";
import { SignInButton } from "@/components/sign-in-button";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function HostPage() {
  const session = await getServerAuthSession();
  const authed = !!session?.user;
  const admin = isAdmin(session?.user?.email);

  return (
    <>
      <SiteHeader />
      <main className="container max-w-5xl py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Host · Speaker view
          </h1>
          <p className="text-sm text-muted-foreground">
            Plays the top-voted track and auto-advances when each one ends.
          </p>
        </div>

        {!authed ? (
          <GateCard
            title="Sign in to host"
            description="You need to sign in with an admin account to run the speaker."
          >
            <SignInButton />
          </GateCard>
        ) : !admin ? (
          <GateCard
            title="Not an admin"
            description="Your account isn't on the host allowlist (ADMIN_EMAILS). Ask whoever set up the room, or head back to vote."
          >
            <Button asChild variant="outline">
              <Link href="/">Back to the queue</Link>
            </Button>
          </GateCard>
        ) : (
          <HostPlayer />
        )}
      </main>
    </>
  );
}

function GateCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/50 p-12 text-center">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
