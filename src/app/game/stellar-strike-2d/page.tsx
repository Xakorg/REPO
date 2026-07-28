"use client";

import dynamic from "next/dynamic";

const StellarStrikeGame = dynamic(
  () => import("@/components/game/stellar-strike-2d/StellarStrikeGame"),
  { ssr: false }
);

export default function StellarStrikePage() {
  return (
    <main className="w-full h-screen bg-black flex items-center justify-center">
      <StellarStrikeGame />
    </main>
  );
}
