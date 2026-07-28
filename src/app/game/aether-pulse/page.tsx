"use client";

import dynamic from "next/dynamic";

const AetherPulseGame = dynamic(
  () => import("@/components/game/aether-pulse/AetherPulseGame"),
  { ssr: false }
);

export default function AetherPulsePage() {
  return (
    <main className="w-full h-screen bg-black flex items-center justify-center">
      <AetherPulseGame />
    </main>
  );
}
