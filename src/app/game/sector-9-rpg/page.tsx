"use client";

import dynamic from "next/dynamic";

const Sector9RpgGame = dynamic(
  () => import("@/components/game/sector-9-rpg/Sector9RpgGame"),
  { ssr: false }
);

export default function Sector9RpgPage() {
  return (
    <main className="w-full h-screen bg-black flex items-center justify-center">
      <Sector9RpgGame />
    </main>
  );
}
