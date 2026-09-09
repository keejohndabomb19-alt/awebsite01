import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

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
          "Play Slope, the fast-paced endless 3D runner. Roll down the neon slope, dodge obstacles, and beat your high score.",
      },
      { property: "og:title", content: "Slope - Endless 3D Runner Game" },
      {
        property: "og:description",
        content:
          "Play Slope, the fast-paced endless 3D runner. Roll down the neon slope, dodge obstacles, and beat your high score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="text-cyan-400">Loading Slope...</p>
          </div>
        </div>
      }
    >
      <SlopeGame />
    </Suspense>
  );
}
