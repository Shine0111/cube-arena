import CreateRoomForm from "@/components/rooms/create-room-form";

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold tracking-widest text-emerald-400">
          CUBE ARENA
        </p>

        <h1 className="mt-3 text-3xl font-bold">Create a room</h1>

        <p className="mt-2 text-zinc-400">
          Set up a room and invite other players with its room code.
        </p>

        <div className="mt-10">
          <CreateRoomForm />
        </div>
      </div>
    </main>
  );
}
