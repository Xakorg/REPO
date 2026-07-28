"use client";

import dynamic from "next/dynamic";

const GravityRacerGame = dynamic(
  () => import("@/components/game/gravity-racer/GravityRacerGame"),
  { ssr: false }
);

export default function GravityRacerPage() {
  return (
    <main className="w-full h-screen bg-black flex items-center justify-center">
      <GravityRacerGame />
    </main>
  );
}
