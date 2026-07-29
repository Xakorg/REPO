"use client";

import dynamic from "next/dynamic";

const ZeroGOrbitalRunnerGame = dynamic(
  () => import("@/components/game/zero-g-orbital-runner"),
  { ssr: false }
);

export default function ZeroGOrbitalRunnerPage() {
  return <ZeroGOrbitalRunnerGame />;
}
