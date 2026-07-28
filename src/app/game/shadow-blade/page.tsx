"use client";

import dynamic from "next/dynamic";

const ShadowBladeGame = dynamic(
  () => import("@/components/game/shadow-blade/ShadowBladeGame"),
  { ssr: false }
);

export default function ShadowBladePage() {
  return (
    <main className="w-full h-screen bg-black flex items-center justify-center">
      <ShadowBladeGame />
    </main>
  );
}
