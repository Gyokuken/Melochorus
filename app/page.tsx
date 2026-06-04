// Placeholder home page for Phase 1 — confirms the toolchain + dark theme boot.
// Phase 3 replaces this with the real submit form + voting leaderboard.

export default function Home() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Phase 1 · foundation online
      </span>

      <h1 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
        Melochorus
      </h1>

      <p className="max-w-md text-balance text-muted-foreground">
        The democratic music queue. Submit a track, let the room vote, and the
        highest-voted song plays next — no DJ required.
      </p>

      <div className="mt-2 rounded-xl border border-border bg-card/50 px-5 py-3 text-sm text-muted-foreground">
        Toolchain is wired up. Next: set your <code className="text-primary">.env</code>,
        run the migration, then we build the API + UI.
      </div>
    </main>
  );
}
