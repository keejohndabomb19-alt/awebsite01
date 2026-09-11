import { useState } from "react";
import { setPlayerName } from "@/lib/player";

export function NameGate({
  initialName,
  onDone,
  onCancel,
}: {
  initialName?: string;
  onDone: (name: string) => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initialName ?? "");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (name.length < 2 || name.length > 16) {
      setError("Pick a name between 2 and 16 characters.");
      return;
    }
    setPlayerName(name);
    onDone(name);
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-sm text-center">
        <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent">
          SLOPE
        </h1>
        <p className="mb-6 text-white/70">
          Choose a name for the worldwide leaderboard.
        </p>
        <input
          autoFocus
          value={value}
          maxLength={16}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-cyan-500/40 bg-black/50 px-4 py-3 text-center font-mono text-lg text-white outline-none focus:border-cyan-400"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-cyan-500 px-8 py-3 font-bold text-black transition-all hover:scale-105 hover:bg-cyan-400"
          >
            Start playing
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/20 px-6 py-3 font-bold text-white/70 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
