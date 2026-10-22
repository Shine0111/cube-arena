import CompetitionTimer from "@/components/timer/competition-timer";

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold tracking-widest text-emerald-400">
          CUBE ARENA
        </p>

        <h1 className="mt-3 text-3xl font-bold">Competition Room</h1>

        <p className="mt-2 text-zinc-400">
          Timer prototype · Multiplayer integration coming next
        </p>

        <div className="mt-10">
          <CompetitionTimer />
        </div>
      </div>
    </main>
  );
}
