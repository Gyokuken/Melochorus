import { getServerAuthSession } from "@/lib/auth";
import { RoomClient } from "@/components/room-client";
import { SignInButton } from "@/components/sign-in-button";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: { code: string };
}) {
  const session = await getServerAuthSession();

  return (
    <>
      <SiteHeader />
      {session?.user ? (
        <RoomClient code={params.code.toUpperCase()} />
      ) : (
        <main className="container flex max-w-md flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Sign in to join this room</h1>
          <p className="text-sm text-muted-foreground">
            You need a Google account to add tracks and vote.
          </p>
          <SignInButton />
        </main>
      )}
    </>
  );
}
