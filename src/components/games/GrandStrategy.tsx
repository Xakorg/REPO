"use client";

import React, { useEffect, useState } from "react";

interface Node {
  id: number;
  name: string;
  owner: "PLAYER" | "AI" | "NEUTRAL";
  troops: number;
  income: number;
  x: number;
  y: number;
}

const INITIAL_NODES: Node[] = [
  { id: 0, name: "Capital Alpha", owner: "PLAYER", troops: 20, income: 10, x: 100, y: 150 },
  { id: 1, name: "North Citadel", owner: "NEUTRAL", troops: 10, income: 5, x: 300, y: 80 },
  { id: 2, name: "South Outpost", owner: "NEUTRAL", troops: 10, income: 5, x: 300, y: 220 },
  { id: 3, name: "Central Haven", owner: "NEUTRAL", troops: 15, income: 8, x: 450, y: 150 },
  { id: 4, name: "East Fortress", owner: "NEUTRAL", troops: 15, income: 8, x: 600, y: 80 },
  { id: 5, name: "Capital Omega", owner: "AI", troops: 20, income: 10, x: 650, y: 220 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [2, 3],
  [1, 4], [2, 5],
  [3, 4], [3, 5],
  [4, 5],
];

export default function GrandStrategy() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [gold, setGold] = useState(50);
  const [turn, setTurn] = useState(1);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "WON" | "LOST">("START");
  const [score, setScore] = useState(0);

  const startGame = () => {
    setNodes(INITIAL_NODES.map((n) => ({ ...n })));
    setGold(50);
    setTurn(1);
    setSelectedNode(null);
    setScore(0);
    setGameState("PLAYING");
  };

  const endTurn = () => {
    if (gameState !== "PLAYING") return;

    // Player & AI Income
    let playerIncome = 0;
    let aiIncome = 0;

    const newNodes = nodes.map((node) => {
      let extra = 0;
      if (node.owner === "PLAYER") {
        playerIncome += node.income;
        extra = 2;
      } else if (node.owner === "AI") {
        aiIncome += node.income;
        extra = 2;
      }
      return { ...node, troops: node.troops + extra };
    });

    setGold((g) => g + playerIncome);

    // AI Turn Logic
    const aiNodes = newNodes.filter((n) => n.owner === "AI");
    if (aiNodes.length > 0) {
      const source = aiNodes[Math.floor(Math.random() * aiNodes.length)];
      // Find connected targets
      const connectedIds = CONNECTIONS.filter(([a, b]) => a === source.id || b === source.id).map(
        ([a, b]) => (a === source.id ? b : a)
      );
      const targets = newNodes.filter((n) => connectedIds.includes(n.id) && n.owner !== "AI");
      if (targets.length > 0 && source.troops > 10) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const attackTroops = Math.floor(source.troops / 2);
        source.troops -= attackTroops;

        if (attackTroops > target.troops) {
          target.owner = "AI";
          target.troops = attackTroops - target.troops;
        } else {
          target.troops -= attackTroops;
        }
      }
    }

    setNodes(newNodes);
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    // Check Win/Loss conditions
    const playerCount = newNodes.filter((n) => n.owner === "PLAYER").length;
    const aiCount = newNodes.filter((n) => n.owner === "AI").length;

    if (playerCount === newNodes.length) {
      const finalScore = 5000 + gold - nextTurn * 100;
      setScore(finalScore);
      setGameState("WON");
      window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: finalScore } }));
    } else if (playerCount === 0 || nextTurn > 25) {
      const finalScore = playerCount * 800 + gold;
      setScore(finalScore);
      setGameState(playerCount > aiCount ? "WON" : "LOST");
      window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: finalScore } }));
    }
  };

  const handleNodeClick = (id: number) => {
    if (gameState !== "PLAYING") return;

    if (selectedNode === null) {
      if (nodes[id].owner === "PLAYER") {
        setSelectedNode(id);
      }
    } else {
      if (selectedNode === id) {
        setSelectedNode(null);
        return;
      }
      // Check if connected
      const isConnected = CONNECTIONS.some(
        ([a, b]) => (a === selectedNode && b === id) || (b === selectedNode && a === id)
      );

      if (isConnected) {
        const newNodes = [...nodes];
        const source = newNodes[selectedNode];
        const target = newNodes[id];

        if (source.troops > 5) {
          const sent = Math.floor(source.troops / 2);
          source.troops -= sent;

          if (target.owner === "PLAYER") {
            target.troops += sent;
          } else {
            if (sent > target.troops) {
              target.owner = "PLAYER";
              target.troops = sent - target.troops;
            } else {
              target.troops -= sent;
            }
          }
          setNodes(newNodes);
        }
      }
      setSelectedNode(null);
    }
  };

  const recruitTroops = () => {
    if (selectedNode === null || gold < 20) return;
    const newNodes = [...nodes];
    newNodes[selectedNode].troops += 10;
    setNodes(newNodes);
    setGold((g) => g - 20);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-blue-400 mb-2 uppercase tracking-wider">
        Grand Strategy
      </h1>

      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Turn: <span className="text-amber-400">{turn}/25</span></div>
        <div>Gold: <span className="text-yellow-400">{gold}g</span></div>
      </div>

      <div className="relative w-[800px] h-[360px] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 overflow-hidden">
        {/* Draw Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {CONNECTIONS.map(([a, b], idx) => (
            <line
              key={idx}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="#3f3f46"
              strokeWidth="4"
            />
          ))}
        </svg>

        {/* Draw Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode === node.id;
          const bg =
            node.owner === "PLAYER"
              ? "bg-blue-600 border-blue-400"
              : node.owner === "AI"
              ? "bg-rose-600 border-rose-400"
              : "bg-zinc-700 border-zinc-500";

          return (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              style={{ left: `${node.x - 40}px`, top: `${node.y - 40}px` }}
              className={`absolute w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-transform shadow-xl ${bg} ${
                isSelected ? "scale-110 ring-4 ring-yellow-400" : "hover:scale-105"
              }`}
            >
              <span className="text-xs font-bold truncate max-w-[70px]">{node.name}</span>
              <span className="text-sm font-black">{node.troops}⚔️</span>
            </button>
          );
        })}

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="text-3xl font-extrabold text-blue-400 uppercase tracking-widest">
              {gameState === "START" ? "Conquer the Realm" : gameState === "WON" ? "Victory!" : "Defeat"}
            </h2>
            {gameState !== "START" && <p className="text-xl font-bold">Score: {score}</p>}
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "START" ? "Start Campaign" : "Play Again"}
            </button>
          </div>
        )}
      </div>

      {gameState === "PLAYING" && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={recruitTroops}
            disabled={selectedNode === null || gold < 20}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl font-bold transition"
          >
            Recruit (+10 Troops / 20g)
          </button>
          <button
            onClick={endTurn}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition uppercase tracking-wider"
          >
            End Turn
          </button>
        </div>
      )}
    </div>
  );
}
