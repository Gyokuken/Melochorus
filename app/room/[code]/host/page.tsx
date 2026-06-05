import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HostPlayer } from "@/components/host-player";
import { MembersPanel } from "@/components/members-panel";
import { SignInButton } from "@/components/sign-in-button";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function RoomHostPage({
  params,
}: {
  params: { code: string };
}) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return (
      <>
        <SiteHeader />
        <main className="container flex max-w-md flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Sign in to host</h1>
          <SignInButton />
        </main>
      </>
    );
  }

  const room = await prisma.room.findUnique({
    where: { code: params.code.toUpperCase() },
    select: { id: true, code: true, name: true, hostId: true },
  });

  if (!room) {
    return (
      <>
        <SiteHeader />
        <main className="container max-w-md space-y-4 py-20 text-center">
          <h1 className="text-xl font-semibold">That room doesn&apos;t exist.</h1>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </main>
      </>
    );
  }

  // Only the room's creator can host it.
  if (room.hostId !== session.user.id) {
    redirect(`/room/${room.code}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="container max-w-5xl space-y-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {room.name} · Host
            </h1>
            <p className="text-sm text-muted-foreground">
              Plays the top-voted track and auto-advances when each one ends.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/room/${room.code}`}>Room view</Link>
          </Button>
        </div>
        <HostPlayer roomId={room.id} />
        <MembersPanel code={room.code} />
      </main>
    </>
  );
}
