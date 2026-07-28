"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Sparkles,
  Trophy,
  ArrowLeft,
  Flame,
  Award,
  Music,
  Radio,
  Disc,
  Activity,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & BEATMAP DEFINITIONS
// ==========================================
export type NoteLane = 0 | 1 | 2 | 3; // D, F, J, K keys

export interface BeatNote {
  id: string;
  lane: NoteLane;
  time: number; // millisecond timestamp
  hit: boolean;
  missed: boolean;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: number; // seconds
  color: string;
  notes: BeatNote[];
}

// PROCEDURAL BEATMAP GENERATOR
const generateBeatmap = (bpm: number, durationSec: number): BeatNote[] => {
  const notes: BeatNote[] = [];
  const beatInterval = (60 / bpm) * 1000;
  let idCounter = 0;

  for (let t = 2000; t < durationSec * 1000; t += beatInterval / 2) {
    if (Math.random() > 0.25) {
      const lane = Math.floor(Math.random() * 4) as NoteLane;
      notes.push({
        id: `note_${idCounter++}`,
        lane,
        time: t,
        hit: false,
        missed: false
      });
    }
  }
  return notes;
};

const TRACKS: SongTrack[] = [
  {
    id: "t1",
    title: "Neon Overdrive",
    artist: "SynthWave FX",
    bpm: 120,
    difficulty: "Easy",
    duration: 45,
    color: "#06b6d4",
    notes: generateBeatmap(120, 45)
  },
  {
    id: "t2",
    title: "Cybernetic Pulse",
    artist: "Aetheria Audio",
    bpm: 140,
    difficulty: "Medium",
    duration: 50,
    color: "#a855f7",
    notes: generateBeatmap(140, 50)
  },
  {
    id: "t3",
    title: "Hyperlight Horizon",
    artist: "Quantum Beats",
    bpm: 165,
    difficulty: "Hard",
    duration: 60,
    color: "#ec4899",
    notes: generateBeatmap(165, 60)
  }
];

// WEB AUDIO SYNTHESIZER FOR BEAT RUSH
class RhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  public playHitSound(rating: "perfect" | "great" | "good") {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freq = rating === "perfect" ? 880 : rating === "great" ? 660 : 440;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  public playMissSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  public playSynthBass(bpm: number, timeSec: number) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      const freq = 110 + (Math.floor(timeSec * 2) % 4) * 20;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }
}

const audio = new RhythmAudioEngine();

export default function SynthwaveBeatRushGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<"menu" | "playing" | "results">("menu");
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Gameplay Metrics
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastRating, setLastRating] = useState<string | null>(null);

  // Active Notes & Timer
  const engineRef = useRef({
    startTime: 0,
    activeNotes: [] as BeatNote[],
    animFrameId: 0,
    keyPresses: [false, false, false, false],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[]
  });

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const startSong = (trackIdx: number) => {
    setSelectedTrackIdx(trackIdx);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setMissCount(0);
    setLastRating(null);

    const track = TRACKS[trackIdx];
    engineRef.current.activeNotes = track.notes.map((n) => ({ ...n }));
    engineRef.current.startTime = performance.now();
    setGameState("playing");
  };

  // Handle Keyboard Hits (D, F, J, K or Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      const k = e.key.toLowerCase();
      let lane: NoteLane | null = null;

      if (k === "d" || k === "arrowleft") lane = 0;
      if (k === "f" || k === "arrowdown") lane = 1;
      if (k === "j" || k === "arrowup") lane = 2;
      if (k === "k" || k === "arrowright") lane = 3;

      if (lane !== null) {
        checkNoteHit(lane);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  const checkNoteHit = (lane: NoteLane) => {
    const songTime = performance.now() - engineRef.current.startTime;
    const active = engineRef.current.activeNotes;

    // Find closest note in this lane
    const target = active.find((n) => !n.hit && !n.missed && n.lane === lane && Math.abs(n.time - songTime) < 150);

    if (target) {
      const diff = Math.abs(target.time - songTime);
      target.hit = true;

      let pts = 0;
      let ratingStr = "";
      if (diff < 40) {
        pts = 300;
        ratingStr = "PERFECT";
        setPerfectCount((p) => p + 1);
        audio.playHitSound("perfect");
      } else if (diff < 80) {
        pts = 200;
        ratingStr = "GREAT";
        setGreatCount((g) => g + 1);
        audio.playHitSound("great");
      } else {
        pts = 100;
        ratingStr = "GOOD";
        setGoodCount((g) => g + 1);
        audio.playHitSound("good");
      }

      setScore((s) => s + pts);
      setCombo((c) => {
        const next = c + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setLastRating(ratingStr);

      // Spawn Hit Particles
      const laneX = lane * 100 + 100;
      for (let i = 0; i < 8; i++) {
        engineRef.current.particles.push({
          x: laneX,
          y: 460,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 20,
          color: TRACKS[selectedTrackIdx].color
        });
      }
    }
  };

  // Main Rhythm Render Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const track = TRACKS[selectedTrackIdx];
      const songTime = performance.now() - engineRef.current.startTime;

      // Play audio pulse beat
      if (Math.floor(songTime) % 500 < 20) {
        audio.playSynthBass(track.bpm, songTime / 1000);
      }

      // Check song completion
      if (songTime > track.duration * 1000) {
        setGameState("results");
        return;
      }

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 4 Highway Lanes
      const laneWidth = 100;
      const startX = 50;

      for (let i = 0; i < 4; i++) {
        const lx = startX + i * laneWidth;
        ctx.strokeStyle = "rgba(168, 85, 247, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(lx, 0, laneWidth, canvas.height);
      }

      // Draw Target Hit Line at Y = 460
      ctx.strokeStyle = track.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = track.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(50, 460);
      ctx.lineTo(450, 460);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Highway Notes
      const notes = engineRef.current.activeNotes;
      notes.forEach((n) => {
        if (n.hit) return;

        const timeDiff = n.time - songTime;
        const noteY = 460 - timeDiff * 0.6; // Scroll speed factor

        if (noteY > 520 && !n.missed) {
          n.missed = true;
          setCombo(0);
          setMissCount((m) => m + 1);
          setLastRating("MISS");
          audio.playMissSound();
        }

        if (noteY > -30 && noteY < 520) {
          const nx = startX + n.lane * laneWidth + 10;
          ctx.fillStyle = track.color;
          ctx.shadowColor = track.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(nx, noteY - 12, 80, 24);
          ctx.shadowBlur = 0;
        }
      });

      // Update Hit Particles
      engineRef.current.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      engineRef.current.particles = engineRef.current.particles.filter((p) => p.life > 0);

      engineRef.current.animFrameId = requestAnimationFrame(loop);
    };

    engineRef.current.animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(engineRef.current.animFrameId);
  }, [gameState, selectedTrackIdx]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 500;
      canvasRef.current.height = 540;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white flex flex-col items-center justify-center">
      {/* CANVAS CONTAINER */}
      <div className="relative w-[500px] h-[540px] bg-zinc-950 border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col justify-between">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* HUD OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center pointer-events-none z-10">
            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-purple-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                SCORE: {score}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                COMBO: {combo}x
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={toggleMute} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
          </div>
        )}

        {/* RATING DISPLAY */}
        {lastRating && gameState === "playing" && (
          <div className="absolute top-24 left-0 right-0 text-center pointer-events-none z-10">
            <span className={`text-2xl font-black tracking-widest ${lastRating === "PERFECT" ? "text-cyan-400 animate-bounce" : lastRating === "GREAT" ? "text-purple-400" : lastRating === "GOOD" ? "text-amber-400" : "text-rose-500"}`}>
              {lastRating}
            </span>
          </div>
        )}
      </div>

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-purple-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-black/80 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-8 text-center flex flex-col items-center shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center mb-6">
              <Music className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Synthwave Beat Rush
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              4-Lane synthwave rhythm game. Tap D, F, J, K or Arrow keys in perfect sync with the electro beats!
            </p>

            {/* SONG SELECTOR */}
            <div className="w-full flex flex-col gap-3 mb-8">
              {TRACKS.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => startSong(idx)}
                  className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 p-4 rounded-2xl flex justify-between items-center transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Disc className="w-6 h-6 text-purple-400 group-hover:rotate-180 transition-transform duration-700" />
                    <div className="text-left">
                      <div className="font-bold text-sm text-white">{t.title}</div>
                      <div className="text-xs text-zinc-400">{t.artist} • {t.bpm} BPM</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    {t.difficulty}
                  </span>
                </button>
              ))}
            </div>

            <Link
              href="/games"
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Arcade Hub
            </Link>
          </motion.div>
        </div>
      )}

      {/* RESULTS MODAL */}
      {gameState === "results" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-zinc-950 border border-purple-500/40 rounded-3xl p-8 text-center flex flex-col items-center"
          >
            <Trophy className="w-12 h-12 text-amber-400 mb-2" />
            <h2 className="text-3xl font-black uppercase tracking-wider text-purple-400 mb-1">Track Complete!</h2>
            <p className="text-xs text-zinc-400 mb-6">{TRACKS[selectedTrackIdx].title}</p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between"><span>Final Score:</span><span className="font-bold text-white">{score}</span></div>
              <div className="flex justify-between"><span>Max Combo:</span><span className="font-bold text-amber-400">{maxCombo}x</span></div>
              <div className="flex justify-between"><span>Perfect Hits:</span><span className="font-bold text-cyan-400">{perfectCount}</span></div>
              <div className="flex justify-between"><span>Great Hits:</span><span className="font-bold text-purple-400">{greatCount}</span></div>
              <div className="flex justify-between"><span>Good Hits:</span><span className="font-bold text-amber-400">{goodCount}</span></div>
              <div className="flex justify-between"><span>Misses:</span><span className="font-bold text-rose-500">{missCount}</span></div>
            </div>

            <button
              onClick={() => setGameState("menu")}
              className="w-full py-4 bg-purple-600 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-purple-500 transition-all"
            >
              Back to Track List
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
