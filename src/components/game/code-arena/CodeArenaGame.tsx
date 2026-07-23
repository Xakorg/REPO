"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/firebase/provider";
import { useFirestore } from "@/firebase";
import { collection, doc, onSnapshot, setDoc, updateDoc, getDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Users, Trophy, Loader2, Code2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- CHALLENGE DEFINITIONS ---
const CHALLENGES = {
  "two-sum": {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution.",
    starterCode: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] }
    ],
    verify: (fn: Function) => {
      let passed = 0;
      let total = 3;
      try {
        if (JSON.stringify(fn([2, 7, 11, 15], 9)) === JSON.stringify([0, 1])) passed++;
        if (JSON.stringify(fn([3, 2, 4], 6)) === JSON.stringify([1, 2])) passed++;
        if (JSON.stringify(fn([3, 3], 6)) === JSON.stringify([0, 1])) passed++;
      } catch (e) {
        throw e;
      }
      return { passed, total };
    }
  },
  "fibonacci": {
    id: "fibonacci",
    title: "Nth Fibonacci",
    difficulty: "Easy",
    description: "The Fibonacci numbers form a sequence where each number is the sum of the two preceding ones, starting from 0 and 1. Write a function to return the nth Fibonacci number.",
    starterCode: "function fibonacci(n) {\n  // Write your code here\n  \n}",
    testCases: [
      { input: { n: 2 }, expected: 1 },
      { input: { n: 3 }, expected: 2 },
      { input: { n: 4 }, expected: 3 }
    ],
    verify: (fn: Function) => {
      let passed = 0;
      let total = 3;
      try {
        if (fn(2) === 1) passed++;
        if (fn(3) === 2) passed++;
        if (fn(4) === 3) passed++;
      } catch (e) {
        throw e;
      }
      return { passed, total };
    }
  }
};

type RoomState = "lobby" | "playing" | "finished";
type PlayerInfo = { id: string; email: string; name: string; ready: boolean; progress: number; finished: boolean; winner?: boolean };

export default function CodeArenaGame() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // App State
  const [roomId, setRoomId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [roomState, setRoomState] = useState<RoomState>("lobby");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [challengeId, setChallengeId] = useState<keyof typeof CHALLENGES>("two-sum");
  
  // Game State
  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<PlayerInfo | null>(null);

  const activeChallenge = CHALLENGES[challengeId];

  // Join or Create Room
  const handleJoinRoom = async () => {
    if (!user) return toast({ title: "Must be signed in", variant: "destructive" });
    if (!roomId.trim()) return toast({ title: "Enter a room ID", variant: "destructive" });
    if (!firestore) return toast({ title: "Database loading...", variant: "destructive" });

    const roomRef = doc(firestore!, "arena_rooms", roomId.toUpperCase());
    const roomSnap = await getDoc(roomRef);

    const playerObj = {
      id: user.uid,
      email: user.email || "",
      name: user.displayName || user.email?.split("@")[0] || "Player",
      ready: false,
      progress: 0,
      finished: false
    };

    if (!roomSnap.exists()) {
      // Create new room
      await setDoc(roomRef, {
        state: "lobby",
        challengeId: "two-sum",
        players: [playerObj],
        createdAt: serverTimestamp()
      });
    } else {
      // Join existing
      const data = roomSnap.data();
      if (data.state !== "lobby") {
        return toast({ title: "Game already in progress", variant: "destructive" });
      }
      const existingPlayers: PlayerInfo[] = data.players || [];
      if (!existingPlayers.find(p => p.id === user.uid)) {
        await updateDoc(roomRef, {
          players: arrayUnion(playerObj)
        });
      }
    }

    setInRoom(true);
    setCode(CHALLENGES["two-sum"].starterCode); // default
  };

  // Listen to Room Changes
  useEffect(() => {
    if (!inRoom || !roomId || !firestore) return;
    const roomRef = doc(firestore!, "arena_rooms", roomId.toUpperCase());
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomState(data.state);
        setPlayers(data.players || []);
        if (data.challengeId && data.challengeId !== challengeId) {
          setChallengeId(data.challengeId as keyof typeof CHALLENGES);
          if (data.state === "lobby") setCode(CHALLENGES[data.challengeId as keyof typeof CHALLENGES].starterCode);
        }
        
        // Check for winner
        const winPlayer = (data.players as PlayerInfo[]).find(p => p.winner);
        if (winPlayer) setWinner(winPlayer);
      }
    });
    return () => unsub();
  }, [inRoom, roomId]);

  // Toggle Ready
  const toggleReady = async () => {
    if (!user || !firestore) return;
    const roomRef = doc(firestore!, "arena_rooms", roomId.toUpperCase());
    const updatedPlayers = players.map(p => p.id === user.uid ? { ...p, ready: !p.ready } : p);
    await updateDoc(roomRef, { players: updatedPlayers });

    // Check if everyone is ready to start
    if (updatedPlayers.every(p => p.ready) && updatedPlayers.length >= 1) {
      await updateDoc(roomRef, { state: "playing" });
    }
  };

  // Run Code
  const runCode = async () => {
    if (!user || roomState !== "playing") return;
    setIsRunning(true);
    setConsoleOutput("Running tests...\n");

    try {
      const runFn = new Function("return " + code)();
      
      const { passed, total } = activeChallenge.verify(runFn);
      
      setConsoleOutput(`Tests complete!\nPassed: ${passed} / ${total}\n`);

      // Update progress
      const progressPercent = Math.floor((passed / total) * 100);
      if (!firestore) return;
      const roomRef = doc(firestore!, "arena_rooms", roomId.toUpperCase());
      const updatedPlayers = players.map(p => {
        if (p.id === user.uid) {
          return { ...p, progress: progressPercent, finished: passed === total, winner: passed === total && !players.find(x => x.winner) };
        }
        return p;
      });

      await updateDoc(roomRef, { players: updatedPlayers });
      
      if (passed === total) {
        setConsoleOutput(prev => prev + "\n🎉 ALL TESTS PASSED! YOU WIN!");
        if (!players.find(x => x.winner)) {
           await updateDoc(roomRef, { state: "finished" });
        }
      }

    } catch (err: any) {
      setConsoleOutput(`Error: ${err.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) {
    return <div className="p-10 text-center text-white">Sign in to play Code Arena.</div>;
  }

  // --- UI: LOBBY ENTRY ---
  if (!inRoom) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        
        <Card className="w-full max-w-md p-8 bg-zinc-950/80 border-white/10 backdrop-blur-xl relative z-10 shadow-2xl rounded-3xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Code2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center mb-2 tracking-tight text-white">Code Arena</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Join a multiplayer battle and race to solve algorithms.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-2 block">Room Code</label>
              <Input 
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                placeholder="e.g. XAK123"
                className="bg-black/50 border-white/10 text-center text-xl font-mono uppercase h-14"
              />
            </div>
            <Button onClick={handleJoinRoom} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl">
              Join or Create Room
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- UI: IN ROOM (LOBBY OR PLAYING) ---
  return (
    <div className="min-h-screen bg-black text-white flex flex-col h-screen">
      {/* HEADER */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-blue-500" />
          <h1 className="font-bold text-lg tracking-tight">Xakteir Code Arena</h1>
          <Badge variant="outline" className="ml-2 font-mono border-white/20">Room: {roomId}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
            <Users className="w-4 h-4" />
            {players.length} Players
          </div>
          {roomState === "lobby" && (
            <Button 
              onClick={toggleReady} 
              variant={players.find(p => p.id === user.uid)?.ready ? "default" : "secondary"}
              className={players.find(p => p.id === user.uid)?.ready ? "bg-green-600 hover:bg-green-500 text-white" : ""}
            >
              {players.find(p => p.id === user.uid)?.ready ? "Ready!" : "Click when ready"}
            </Button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      {roomState === "lobby" ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black mb-3">Waiting for players...</h2>
              <p className="text-zinc-400">Everyone must click Ready to start the match.</p>
            </div>
            
            <Card className="bg-zinc-950/80 border-white/10 overflow-hidden rounded-2xl">
              {players.map((p, i) => (
                <div key={p.id} className={cn("p-4 flex items-center justify-between border-b border-white/5", i === players.length - 1 && "border-0")}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-400">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-lg">{p.name} {p.id === user.uid && "(You)"}</span>
                  </div>
                  {p.ready ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 py-1">Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-500 border-zinc-700 py-1">Not Ready</Badge>
                  )}
                </div>
              ))}
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Challenge & Leaderboard */}
          <div className="w-[350px] border-r border-white/10 flex flex-col bg-zinc-950">
            <div className="p-6 border-b border-white/10 flex-1 overflow-y-auto">
              <Badge className="mb-3 bg-blue-600 text-white hover:bg-blue-600">{activeChallenge.difficulty}</Badge>
              <h2 className="text-2xl font-black mb-4">{activeChallenge.title}</h2>
              <div className="prose prose-invert prose-sm">
                {activeChallenge.description.split('\n').map((line, i) => (
                  <p key={i} className="text-zinc-300">{line}</p>
                ))}
              </div>
              
              <div className="mt-8">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Live Progress</h3>
                <div className="space-y-4">
                  {players.map(p => (
                    <div key={p.id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={cn("font-medium", p.id === user.uid ? "text-blue-400" : "text-zinc-300")}>
                          {p.name} {p.winner && "👑"}
                        </span>
                        <span className="text-zinc-500 font-mono">{p.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", p.winner ? "bg-yellow-500" : p.progress === 100 ? "bg-green-500" : "bg-blue-600")}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE/RIGHT: Editor & Output */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={val => setCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  fontFamily: "JetBrains Mono, monospace",
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                }}
              />
              {/* Winner Overlay */}
              <AnimatePresence>
                {roomState === "finished" && winner && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
                      <h2 className="text-5xl font-black text-white mb-4">{winner.name} Wins!</h2>
                      <p className="text-xl text-zinc-400">Match complete.</p>
                      <Button onClick={() => window.location.reload()} className="mt-8 bg-white text-black hover:bg-zinc-200">
                        Play Again
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* CONSOLE */}
            <div className="h-[250px] border-t border-white/10 bg-[#1e1e1e] flex flex-col shrink-0">
              <div className="flex items-center justify-between px-4 h-12 border-b border-white/5 bg-zinc-950">
                <span className="text-sm font-medium text-zinc-400 font-mono">Console Output</span>
                <Button 
                  onClick={runCode} 
                  disabled={isRunning || roomState === "finished"}
                  size="sm" 
                  className="bg-green-600 hover:bg-green-500 text-white h-8"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                  Run Tests
                </Button>
              </div>
              <div className="flex-1 p-4 font-mono text-sm text-zinc-300 overflow-y-auto whitespace-pre-wrap">
                {consoleOutput || "Ready to run tests..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
