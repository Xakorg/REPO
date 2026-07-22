'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  owner: 'player' | 'ai' | 'neutral';
  count: number;
}

interface Particle {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  targetId: number;
  owner: 'player' | 'ai';
  count: number;
}

export default function ChronoClash() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const nodesRef = useRef<Node[]>([
    { id: 0, x: 100, y: 100, owner: 'player', count: 20 },
    { id: 1, x: 100, y: 300, owner: 'player', count: 15 },
    { id: 2, x: 300, y: 80, owner: 'neutral', count: 10 },
    { id: 3, x: 300, y: 200, owner: 'neutral', count: 15 },
    { id: 4, x: 300, y: 320, owner: 'neutral', count: 10 },
    { id: 5, x: 500, y: 100, owner: 'ai', count: 20 },
    { id: 6, x: 500, y: 300, owner: 'ai', count: 15 },
  ]);

  const particlesRef = useRef<Particle[]>([]);
  const [, setTick] = useState(0);

  const startGame = () => {
    nodesRef.current = [
      { id: 0, x: 100, y: 100, owner: 'player', count: 20 },
      { id: 1, x: 100, y: 300, owner: 'player', count: 15 },
      { id: 2, x: 300, y: 80, owner: 'neutral', count: 10 },
      { id: 3, x: 300, y: 200, owner: 'neutral', count: 15 },
      { id: 4, x: 300, y: 320, owner: 'neutral', count: 10 },
      { id: 5, x: 500, y: 100, owner: 'ai', count: 20 },
      { id: 6, x: 500, y: 300, owner: 'ai', count: 15 },
    ];
    particlesRef.current = [];
    setSelectedNode(null);
    setScore(0);
    setTimeLeft(45);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Timer interval
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Energy regeneration interval
    const regenInterval = setInterval(() => {
      nodesRef.current.forEach((node) => {
        if (node.owner !== 'neutral' && node.count < 60) {
          node.count += 1;
        }
      });
      setTick((t) => t + 1);
    }, 800);

    // AI decision interval
    const aiInterval = setInterval(() => {
      const aiNodes = nodesRef.current.filter((n) => n.owner === 'ai');
      if (aiNodes.length === 0) return;

      const sourceNode = aiNodes[Math.floor(Math.random() * aiNodes.length)];
      if (sourceNode.count > 10) {
        const targetNodes = nodesRef.current.filter((n) => n.id !== sourceNode.id);
        const target = targetNodes[Math.floor(Math.random() * targetNodes.length)];

        const sendAmount = Math.floor(sourceNode.count / 2);
        sourceNode.count -= sendAmount;

        particlesRef.current.push({
          id: Math.random(),
          fromX: sourceNode.x,
          fromY: sourceNode.y,
          toX: target.x,
          toY: target.y,
          progress: 0,
          targetId: target.id,
          owner: 'ai',
          count: sendAmount,
        });
      }
    }, 2000);

    // Animation frame for moving particles
    let animId: number;
    const animLoop = () => {
      let particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += 0.025;

        if (p.progress >= 1) {
          // Hit target
          const target = nodesRef.current.find((n) => n.id === p.targetId);
          if (target) {
            if (target.owner === p.owner) {
              target.count += p.count;
            } else {
              if (target.count >= p.count) {
                target.count -= p.count;
              } else {
                target.owner = p.owner;
                target.count = p.count - target.count;
              }
            }
          }
          particles.splice(i, 1);
        }
      }

      // Check win/loss
      const playerNodes = nodesRef.current.filter((n) => n.owner === 'player');
      const aiNodes = nodesRef.current.filter((n) => n.owner === 'ai');

      let currentScore = playerNodes.reduce((sum, n) => sum + n.count + 50, 0);
      setScore(currentScore);

      if (playerNodes.length === 0 || aiNodes.length === 0) {
        endGame();
        return;
      }

      setTick((t) => t + 1);
      animId = requestAnimationFrame(animLoop);
    };

    animId = requestAnimationFrame(animLoop);

    return () => {
      clearInterval(timerInterval);
      clearInterval(regenInterval);
      clearInterval(aiInterval);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const endGame = () => {
    const playerNodes = nodesRef.current.filter((n) => n.owner === 'player');
    const finalScore = playerNodes.reduce((sum, n) => sum + n.count + 50, 0);
    setScore(finalScore);
    window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    setGameState('GAMEOVER');
  };

  const handleNodeClick = (node: Node) => {
    if (gameState !== 'PLAYING') return;

    if (selectedNode === null) {
      if (node.owner === 'player') {
        setSelectedNode(node.id);
      }
    } else {
      if (selectedNode !== node.id) {
        const srcNode = nodesRef.current.find((n) => n.id === selectedNode);
        if (srcNode && srcNode.count > 1) {
          const sendAmount = Math.floor(srcNode.count / 2);
          srcNode.count -= sendAmount;

          particlesRef.current.push({
            id: Math.random(),
            fromX: srcNode.x,
            fromY: srcNode.y,
            toX: node.x,
            toY: node.y,
            progress: 0,
            targetId: node.id,
            owner: 'player',
            count: sendAmount,
          });
        }
      }
      setSelectedNode(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[600px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-400">Chrono Clash</h2>
          <p className="text-xs text-zinc-400">Select your node (Cyan) then click a node to send time forces</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-amber-300">Score: {score}</div>
          <div className="text-sm text-zinc-400">Time Left: {timeLeft}s</div>
        </div>
      </div>

      <div className="relative border border-amber-900/40 rounded-lg overflow-hidden w-[600px] h-[400px] bg-zinc-900">
        {/* Render node connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodesRef.current.map((n1, i) =>
            nodesRef.current.slice(i + 1).map((n2) => (
              <line
                key={`${n1.id}-${n2.id}`}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="#3f3f46"
                strokeWidth="2"
                strokeDasharray="4"
              />
            ))
          )}

          {/* Render traveling particles */}
          {particlesRef.current.map((p) => {
            const currentX = p.fromX + (p.toX - p.fromX) * p.progress;
            const currentY = p.fromY + (p.toY - p.fromY) * p.progress;
            return (
              <circle
                key={p.id}
                cx={currentX}
                cy={currentY}
                r="8"
                fill={p.owner === 'player' ? '#06b6d4' : '#ef4444'}
              />
            );
          })}
        </svg>

        {/* Render Nodes */}
        {nodesRef.current.map((node) => {
          const isSelected = selectedNode === node.id;
          let bgColor = 'bg-zinc-700 border-zinc-500';
          if (node.owner === 'player') bgColor = 'bg-cyan-600 border-cyan-300';
          if (node.owner === 'ai') bgColor = 'bg-red-600 border-red-300';

          return (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{ left: node.x - 30, top: node.y - 30 }}
              className={`absolute w-15 h-15 rounded-full border-2 flex items-center justify-center font-bold text-white shadow-lg transition-transform hover:scale-105 ${bgColor} ${
                isSelected ? 'ring-4 ring-amber-400 scale-110' : ''
              }`}
            >
              <div className="text-center">
                <div className="text-xs uppercase">{node.owner}</div>
                <div className="text-sm font-extrabold">{node.count}</div>
              </div>
            </button>
          );
        })}

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-amber-400 mb-2">CHRONO CLASH</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Capture all timeline nodes! Click your Cyan node then click a target node to deploy timeline forces.</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
            >
              Start Battle
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-amber-400 mb-2">TIMEWAR CONCLUDED</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-amber-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
