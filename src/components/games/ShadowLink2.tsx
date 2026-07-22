"use client";

import React, { useEffect, useState } from "react";

interface Node {
  id: number; // pair id 1, 2, 3, 4
  color: string;
  x: number; // grid col 0-4
  y: number; // grid row 0-4
}

interface Path {
  nodeId: number;
  color: string;
  points: { x: number; y: number }[];
}

const COLOR_PALETTE = ["#38bdf8", "#f43f5e", "#10b981", "#eab308", "#a855f7"];

export default function ShadowLink2() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(40);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  // Generate random node pairs for 5x5 grid
  const generatePuzzle = () => {
    const pairCount = Math.min(5, 3 + Math.floor((level - 1) / 2));
    const newNodes: Node[] = [];
    const usedPositions = new Set<string>();

    for (let p = 1; p <= pairCount; p++) {
      const color = COLOR_PALETTE[(p - 1) % COLOR_PALETTE.length];
      for (let instance = 0; instance < 2; instance++) {
        let gx: number, gy: number, key: string;
        do {
          gx = Math.floor(Math.random() * 5);
          gy = Math.floor(Math.random() * 5);
          key = `${gx},${gy}`;
        } while (usedPositions.has(key));

        usedPositions.add(key);
        newNodes.push({ id: p, color, x: gx, y: gy });
      }
    }

    setNodes(newNodes);
    setPaths([]);
    setActiveNodeId(null);
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(40);
    generatePuzzle();
    setGameState("playing");
  };

  const handleCellClick = (gx: number, gy: number) => {
    if (gameState !== "playing") return;

    const clickedNode = nodes.find((n) => n.x === gx && n.y === gy);

    if (clickedNode) {
      if (activeNodeId === null) {
        // Start drawing path for this node pair
        setActiveNodeId(clickedNode.id);
        const existingIdx = paths.findIndex((p) => p.nodeId === clickedNode.id);
        const newPaths = [...paths];
        if (existingIdx !== -1) newPaths.splice(existingIdx, 1);
        newPaths.push({
          nodeId: clickedNode.id,
          color: clickedNode.color,
          points: [{ x: gx, y: gy }],
        });
        setPaths(newPaths);
      } else if (activeNodeId === clickedNode.id) {
        // Finishing path on matching node!
        const currentPath = paths.find((p) => p.nodeId === activeNodeId);
        if (currentPath && currentPath.points.length > 1) {
          const firstPoint = currentPath.points[0];
          if (firstPoint.x !== gx || firstPoint.y !== gy) {
            // Completed pair link!
            const newPoints = [...currentPath.points, { x: gx, y: gy }];
            const updatedPaths = paths.map((p) =>
              p.nodeId === activeNodeId ? { ...p, points: newPoints } : p
            );
            setPaths(updatedPaths);
            setActiveNodeId(null);

            checkPuzzleCompletion(updatedPaths);
          }
        }
      }
    } else if (activeNodeId !== null) {
      // Continue path to adjacent cell
      const currentPath = paths.find((p) => p.nodeId === activeNodeId);
      if (currentPath) {
        const lastPoint = currentPath.points[currentPath.points.length - 1];
        const dist = Math.abs(lastPoint.x - gx) + Math.abs(lastPoint.y - gy);
        if (dist === 1) {
          const newPoints = [...currentPath.points, { x: gx, y: gy }];
          setPaths(paths.map((p) => (p.nodeId === activeNodeId ? { ...p, points: newPoints } : p)));
        }
      }
    }
  };

  const checkPuzzleCompletion = (currentPaths: Path[]) => {
    const pairIds = Array.from(new Set(nodes.map((n) => n.id)));
    const allLinked = pairIds.every((id) => {
      const p = currentPaths.find((path) => path.nodeId === id);
      if (!p || p.points.length < 2) return false;
      const startP = p.points[0];
      const endP = p.points[p.points.length - 1];
      const n1 = nodes.find((n) => n.id === id && n.x === startP.x && n.y === startP.y);
      const n2 = nodes.find((n) => n.id === id && n.x === endP.x && n.y === endP.y);
      return Boolean(n1 && n2 && n1 !== n2);
    });

    if (allLinked) {
      setTimeout(() => {
        setScore((prev) => prev + 150 + timeLeft * 10);
        setLevel((prev) => prev + 1);
        setTimeLeft((prev) => Math.min(60, prev + 15));
        generatePuzzle();
      }, 250);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState("gameover");
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score } }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score]);

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-zinc-950 text-white relative p-4 select-none">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-indigo-400 mb-3 tracking-wider">SHADOW LINK 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Connect matching glowing shadow nodes without letting paths cross!
          </p>
          <p className="text-sm text-zinc-400 mb-6">Click a node to start a path, step along adjacent cells to pair up.</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl shadow-lg transition"
          >
            BEGIN LINKING
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">SHADOW OUT OF SYNC</h2>
          <p className="text-xl text-zinc-200 mb-1">Levels Solved: {level - 1}</p>
          <p className="text-2xl font-bold text-indigo-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY MATRIX
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
        <div>
          <span className="text-zinc-400 text-xs block">LEVEL</span>
          <span className="text-lg font-bold text-indigo-400">{level}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-xs block">SCORE</span>
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-xs block">TIME</span>
          <span className={`text-lg font-bold ${timeLeft < 10 ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* 5x5 Grid */}
      <div className="grid grid-cols-5 gap-2 bg-zinc-900/60 p-4 rounded-2xl border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative">
        {Array.from({ length: 25 }).map((_, idx) => {
          const gx = idx % 5;
          const gy = Math.floor(idx / 5);
          const node = nodes.find((n) => n.x === gx && n.y === gy);

          // Find if cell is part of a drawn path
          const path = paths.find((p) => p.points.some((pt) => pt.x === gx && pt.y === gy));

          return (
            <button
              key={idx}
              onClick={() => handleCellClick(gx, gy)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border transition relative ${
                path
                  ? "bg-zinc-800 border-zinc-600"
                  : "bg-zinc-900/90 border-zinc-800 hover:border-indigo-500/50"
              }`}
            >
              {/* Path glow background */}
              {path && (
                <div
                  className="absolute inset-2 rounded-lg opacity-40 blur-sm"
                  style={{ backgroundColor: path.color }}
                />
              )}

              {/* Node Orb */}
              {node && (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg border-2 z-10 transition-transform ${
                    activeNodeId === node.id ? "scale-110 animate-bounce" : ""
                  }`}
                  style={{ backgroundColor: node.color, borderColor: "#ffffff" }}
                >
                  {node.id}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={generatePuzzle}
        className="mt-4 text-xs text-zinc-400 hover:text-white underline transition"
      >
        Reset Paths (Skip Puzzle)
      </button>
    </div>
  );
}
