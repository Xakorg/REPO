"use client";

import dynamic from "next/dynamic";

const PyroCoreEscapeGame = dynamic(
  () => import("@/components/game/pyro-core-escape"),
  { ssr: false }
);

export default function PyroCoreEscapePage() {
  return <PyroCoreEscapeGame />;
}
