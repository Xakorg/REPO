"use client";

import dynamic from "next/dynamic";

const FrostBoundOdysseyGame = dynamic(
  () => import("@/components/game/frost-bound-odyssey"),
  { ssr: false }
);

export default function FrostBoundOdysseyPage() {
  return <FrostBoundOdysseyGame />;
}
