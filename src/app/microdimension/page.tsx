import React from "react";
import { SceneStateProvider } from "./components/SceneState";
import { SceneCanvas } from "./components/SceneCanvas";
import { EditorUI } from "./components/EditorUI";

export default function MicroDimensionPage() {
  return (
    <main className="relative w-full h-full flex-1 overflow-hidden bg-[#0a0a0a]">
      <SceneStateProvider>
        <SceneCanvas />
        <EditorUI />
      </SceneStateProvider>
    </main>
  );
}
