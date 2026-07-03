"use client";

import React, { createContext, useContext, useState } from "react";

export type SceneObject = {
  id: string;
  type: "box" | "sphere" | "plane" | "character_base" | "weapon_base";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  name: string;
};

type SceneStateContextType = {
  objects: SceneObject[];
  setObjects: React.Dispatch<React.SetStateAction<SceneObject[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addObject: (type: SceneObject["type"], name: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  transformMode: "translate" | "rotate" | "scale";
  setTransformMode: (mode: "translate" | "rotate" | "scale") => void;
};

const SceneStateContext = createContext<SceneStateContextType | undefined>(undefined);

export function SceneStateProvider({ children }: { children: React.ReactNode }) {
  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: "base_plane",
      type: "plane",
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [10, 10, 1],
      color: "#222222",
      name: "Ground",
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");

  const addObject = (type: SceneObject["type"], name: string) => {
    const newObj: SceneObject = {
      id: Math.random().toString(36).substring(7),
      type,
      position: [0, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#aaaaaa",
      name,
    };
    setObjects((prev) => [...prev, newObj]);
    setSelectedId(newObj.id);
  };

  const updateObject = (id: string, updates: Partial<SceneObject>) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  const removeObject = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <SceneStateContext.Provider
      value={{
        objects,
        setObjects,
        selectedId,
        setSelectedId,
        addObject,
        updateObject,
        removeObject,
        transformMode,
        setTransformMode,
      }}
    >
      {children}
    </SceneStateContext.Provider>
  );
}

export function useSceneState() {
  const context = useContext(SceneStateContext);
  if (!context) {
    throw new Error("useSceneState must be used within a SceneStateProvider");
  }
  return context;
}
