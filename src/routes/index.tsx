import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";
import { NameGate } from "@/components/NameGate";
import { getPlayerName } from "@/lib/player";

const SlopeGame = lazy(() =>
  import("../components/SlopeGame").then((mod) => ({ default: mod.SlopeGame }))
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Slope - Endless 3D Runner Game" },
      {
        name: "description",
        content:
          "Play Slope, the fast-paced endless 3D runner. Roll down the neon slope, dodge obstacles, and climb the worldwide distance leaderboard.",
      },
      { property: "og:title", content: "Slope - Endless 3D Runner Game" },
      {
        property: "og:description",
        content:
          "Play Slope, the fast-paced endless 3D runner. Roll down the neon slope, dodge obstacles, and climb the worldwide distance leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const Loading = ({ label }: { label: string }) => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f]">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      <p className="text-cyan-400">{label}</p>
    </div>
  </div>
);

function Index() {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(getPlayerName());
    setReady(true);
  }, []);

  if (!ready) return <Loading label="Loading Slope..." />;

  if (!name || editing) {
    return (
      <div className="relative h-screen w-screen bg-[#0a0a0f]">
        <NameGate
          initialName={name ?? ""}
          onDone={(newName) => {
            setName(newName);
            setEditing(false);
          }}
          {...(name ? { onCancel: () => setEditing(false) } : {})}
        />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading label="Loading Slope..." />}>
      <SlopeGame playerName={name} onChangeName={() => setEditing(true)} />
    </Suspense>
  );
}
