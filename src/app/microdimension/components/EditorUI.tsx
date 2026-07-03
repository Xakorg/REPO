"use client";

import React, { useState } from "react";
import { useSceneState } from "./SceneState";
import { Box, Circle, SquareMousePointer, Maximize, RotateCw, Move, Sparkles, Wand2, Plus, Trash2 } from "lucide-react";

export function EditorUI() {
  const { objects, selectedId, setSelectedId, addObject, removeObject, transformMode, setTransformMode, updateObject } = useSceneState();
  const selectedObj = objects.find((o) => o.id === selectedId);

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    // Stub for future AI integration
    setTimeout(() => {
      setIsGenerating(false);
      setAiPrompt("");
      if (selectedObj) {
        // Mocking an AI texture color change
        const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
        updateObject(selectedObj.id, { color: randomColor });
      }
    }, 1500);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="pointer-events-auto flex items-center justify-between md-panel p-2 rounded-xl shadow-2xl">
        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h1 className="font-bold text-white text-sm tracking-widest uppercase">MicroDimension</h1>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex gap-1">
            <button
              onClick={() => setTransformMode("translate")}
              className={`p-2 rounded-lg transition-colors ${transformMode === "translate" ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:bg-white/5"}`}
              title="Translate (W)"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransformMode("rotate")}
              className={`p-2 rounded-lg transition-colors ${transformMode === "rotate" ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:bg-white/5"}`}
              title="Rotate (E)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransformMode("scale")}
              className={`p-2 rounded-lg transition-colors ${transformMode === "scale" ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:bg-white/5"}`}
              title="Scale (R)"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => addObject("box", "Cube")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-700">
            <Box className="w-3.5 h-3.5" /> + Cube
          </button>
          <button onClick={() => addObject("character_base", "Character Base")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-700">
            <SquareMousePointer className="w-3.5 h-3.5" /> + Character
          </button>
          <button onClick={() => addObject("weapon_base", "Weapon Base")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-700">
            <Plus className="w-3.5 h-3.5" /> + Weapon
          </button>
        </div>
      </div>

      <div className="flex justify-between flex-1 mt-4 mb-4">
        {/* Left Sidebar: Outliner */}
        <div className="pointer-events-auto md-panel w-64 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-black/20">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Scene Outliner</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {objects.map((obj) => (
              <div
                key={obj.id}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  selectedId === obj.id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-300 hover:bg-white/5"
                }`}
                onClick={() => setSelectedId(obj.id)}
              >
                <div className="flex items-center gap-2">
                  {obj.type === "box" ? <Box className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  {obj.name}
                </div>
                {obj.id !== "base_plane" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Properties & AI Forge */}
        {selectedObj && selectedObj.id !== "base_plane" && (
          <div className="pointer-events-auto md-panel w-72 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-zinc-800 bg-black/20">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Properties</h2>
            </div>
            
            <div className="p-4 space-y-6 overflow-y-auto">
              {/* Transform Stats */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Position</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {["X", "Y", "Z"].map((axis, i) => (
                      <div key={axis} className="bg-black/40 border border-zinc-800 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-[9px] text-zinc-600">{axis}</span>
                        <span className="text-xs font-mono">{selectedObj.position[i].toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Material */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Material Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedObj.color}
                    onChange={(e) => updateObject(selectedObj.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-xs font-mono text-zinc-400 uppercase">{selectedObj.color}</span>
                </div>
              </div>

              {/* AI Forge */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-purple-400">
                  <Wand2 className="w-4 h-4" />
                  <label className="text-[10px] uppercase font-bold tracking-wider">AI Texture Forge</label>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Describe a texture or material to generate and apply to {selectedObj.name}.
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Rusted cyberpunk metal panels..."
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 resize-none h-20 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <span className="animate-pulse">Forging...</span>
                  ) : (
                    <>Generate Material</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="pointer-events-auto flex items-center justify-between px-2 text-[10px] font-mono text-zinc-600">
        <div>MicroDimension Engine v1.0.0</div>
        <div>Ready • WebGL2</div>
      </div>
    </div>
  );
}
