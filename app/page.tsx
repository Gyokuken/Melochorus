import { getServerAuthSession } from "@/lib/auth";
import { RoomLauncher } from "@/components/room-launcher";
import { SignInButton } from "@/components/sign-in-button";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl space-y-10 py-12">
        <div className="space-y-2 text-center">
          <h1 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Melochorus
          </h1>
          <p className="mx-auto max-w-md text-balance text-muted-foreground">
            Spin up a room, share the code, and let the crowd vote the playlist.
            The top track plays on the speaker — no DJ required.
          </p>
        </div>

        {session?.user ? (
          <RoomLauncher />
        ) : (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to host a room or join one with a code.
            </p>
            <SignInButton />
          </div>
        )}
      </main>
    </>
  );
}
