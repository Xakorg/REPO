"use client";

import dynamic from "next/dynamic";

const ChronoshiftOverdriveGame = dynamic(
  () => import("@/components/game/chronoshift-overdrive"),
  { ssr: false }
);

export default function ChronoshiftOverdrivePage() {
  return <ChronoshiftOverdriveGame />;
}
