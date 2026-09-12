import { MAPS, saveMapId } from "@/lib/maps";

export function MapSelect({
  currentId,
  onSelect,
  onCancel,
}: {
  currentId?: string | null;
  onSelect: (id: string) => void;
  onCancel?: () => void;
}) {
  function choose(id: string) {
    saveMapId(id);
    onSelect(id);
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/85 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl text-center">
        <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent">
          CHOOSE YOUR MAP
        </h1>
        <p className="mb-8 text-white/70">Each map has its own look, curves and speed.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {MAPS.map((m) => (
            <button
              key={m.id}
              onClick={() => choose(m.id)}
              style={{ borderColor: m.swatch }}
              className={`rounded-xl border bg-black/50 p-5 text-left transition-all hover:scale-[1.02] ${
                currentId === m.id ? "ring-2 ring-white/70" : ""
              }`}
            >
              <div className="mb-2 flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: m.swatch }}
                />
                <span className="text-lg font-bold" style={{ color: m.swatch }}>
                  {m.name}
                </span>
              </div>
              <p className="text-sm text-white/70">{m.tagline}</p>
              <p className="mt-2 font-mono text-xs text-white/50">
                Start speed {m.baseSpeed} • {m.id === "void" ? "Hard" : m.id === "ice" ? "Tricky" : m.id === "canyon" ? "Relaxed" : "Balanced"}
              </p>
            </button>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-8 rounded-full border border-white/20 px-6 py-3 font-bold text-white/70 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
