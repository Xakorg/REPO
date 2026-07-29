"use client";

import dynamic from "next/dynamic";

const SteampunkClockworkClimbGame = dynamic(
  () => import("@/components/game/steampunk-clockwork-climb"),
  { ssr: false }
);

export default function SteampunkClockworkClimbPage() {
  return <SteampunkClockworkClimbGame />;
}
