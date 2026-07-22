'use client';

import React, { useEffect, useState } from 'react';

interface Node {
  id: number;
  row: number;
  col: number;
  color: string;
  connected: boolean;
}

export default function HyperLink() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(25);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Array<[number, number]>>([]);

  const colorPalette = ['#00f3ff', '#ff0055', '#a855f7', '#ffe600', '#10b981'];

  const initLevel = (lvl: number) => {
    const pairCount = Math.min(3 + Math.floor(lvl / 2), 5);
    const newNodes: Node[] = [];
    let idCounter = 0;

    // Grid size 5x5
    const positions: Array<[number, number]> = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        positions.push([r, c]);
      }
    }
    // Shuffle positions
    positions.sort(() => Math.random() - 0.5);

    for (let i = 0; i < pairCount; i++) {
      const color = colorPalette[i % colorPalette.length];
      const p1 = positions.pop()!;
      const p2 = positions.pop()!;

      newNodes.push({ id: idCounter++, row: p1[0], col: p1[1], color, connected: false });
      newNodes.push({ id: idCounter++, row: p2[0], col: p2[1], color, connected: false });
    }

    setNodes(newNodes);
    setConnections([]);
    setSelectedNode(null);
    setTimeLeft(Math.max(12, 25 - lvl * 2));
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameState('PLAYING');
    initLevel(1);
  };

  const gameOver = (finalScore: number) => {
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          gameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score]);

  const handleNodeClick = (node: Node) => {
    if (gameState !== 'PLAYING' || node.connected) return;

    if (!selectedNode) {
      setSelectedNode(node);
    } else if (selectedNode.id === node.id) {
      setSelectedNode(null); // deselect
    } else if (selectedNode.color === node.color) {
      // Connect matching colors!
      const newConnections: Array<[number, number]> = [...connections, [selectedNode.id, node.id]];
      setConnections(newConnections);

      const updatedNodes = nodes.map((n) =>
        n.id === selectedNode.id || n.id === node.id ? { ...n, connected: true } : n
      );
      setNodes(updatedNodes);
      setSelectedNode(null);

      // Check if all connected
      if (updatedNodes.every((n) => n.connected)) {
        setTimeout(() => {
          const gained = 100 + level * 30 + timeLeft * 10;
          const nextScore = score + gained;
          setScore(nextScore);
          const nextLvl = level + 1;
          setLevel(nextLvl);
          initLevel(nextLvl);
        }, 300);
      }
    } else {
      // Mis-match
      setSelectedNode(node);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          HYPER LINK
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>LEVEL: <strong className="text-white">{level}</strong></span>
          <span>TIME: <strong className={timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}>{timeLeft}s</strong></span>
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative w-[340px] h-[340px] bg-zinc-900 border-2 border-cyan-500/30 rounded-xl p-4 shadow-2xl flex flex-col justify-between">
        {gameState === 'PLAYING' && (
          <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full">
            {Array.from({ length: 25 }).map((_, idx) => {
              const r = Math.floor(idx / 5);
              const c = idx % 5;
              const node = nodes.find((n) => n.row === r && n.col === c);

              const isSelected = selectedNode && node && selectedNode.id === node.id;

              return (
                <div
                  key={idx}
                  className="w-full h-full bg-zinc-950/60 rounded-lg border border-zinc-800 flex items-center justify-center relative"
                >
                  {node && (
                    <button
                      onClick={() => handleNodeClick(node)}
                      style={{
                        backgroundColor: node.color,
                        boxShadow: isSelected
                          ? `0 0 20px ${node.color}, 0 0 30px #ffffff`
                          : node.connected
                          ? `0 0 5px ${node.color}55`
                          : `0 0 12px ${node.color}`,
                        opacity: node.connected ? 0.4 : 1,
                      }}
                      className={`w-10 h-10 rounded-full transition-all duration-200 transform ${
                        isSelected ? 'scale-125 border-2 border-white' : 'hover:scale-110'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 rounded-xl">
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">
              {gameState === 'START' ? 'NETWORK LINKER' : 'CONNECTION LOST'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 max-w-xs leading-relaxed">
              {gameState === 'START'
                ? 'Click matching colored network nodes to establish data connections before timer expires!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)]"
            >
              {gameState === 'START' ? 'CONNECT NETWORK' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        Click a glowing node, then click its matching color partner node to link them!
      </div>
    </div>
  );
}
