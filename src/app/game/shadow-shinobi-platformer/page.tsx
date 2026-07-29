"use client";

import dynamic from "next/dynamic";

const ShadowShinobiPlatformerGame = dynamic(
  () => import("@/components/game/shadow-shinobi-platformer"),
  { ssr: false }
);

export default function ShadowShinobiPlatformerPage() {
  return <ShadowShinobiPlatformerGame />;
}
