"use client";

import dynamic from "next/dynamic";

const NexusGridDefenseGame = dynamic(
  () => import("@/components/game/nexus-grid-defense/NexusGridDefenseGame"),
  { ssr: false }
);

export default function NexusGridDefensePage() {
  return (
    <main className="w-full h-screen bg-black flex items-center justify-center">
      <NexusGridDefenseGame />
    </main>
  );
}
