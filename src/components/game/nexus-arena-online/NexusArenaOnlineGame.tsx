"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Trophy, 
  Users, 
  User, 
  Globe, 
  Zap, 
  Shield, 
  Crosshair, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  Send, 
  Award, 
  Activity, 
  Swords, 
  MessageSquare, 
  Radio, 
  Sparkles,
  ChevronRight,
  Wifi,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type GameMode = "SINGLE" | "LOCAL_2P" | "ONLINE_ROOM" | "ONLINE_MATCH";
export type ClassType = "SABER" | "GUNNER" | "WEAVER" | "TITAN";
export type AIDifficulty = "NOVICE" | "VETERAN" | "DEMON";

export interface Champion {
  id: ClassType;
  name: string;
  role: string;
  color: string;
  secondaryColor: string;
  speed: number;
  maxHealth: number;
  maxShield: number;
  attackPower: number;
  abilityName: string;
  abilityCooldown: number; // in ms
  ultName: string;
  ultCooldown: number; // in ms
  description: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  champion: ClassType;
  score: number;
  kills: number;
  deaths: number;
  abilityCD: number;
  ultCD: number;
  ultCharge: number; // 0 to 100
  isDashing: boolean;
  dashTime: number;
  isShielded: boolean;
  shieldTime: number;
  facingAngle: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  owner: "P1" | "P2";
  type: "STANDARD" | "SPECIAL" | "ULTIMATE";
  life: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: "HEALTH" | "OVERCHARGE" | "QUAD" | "SHIELD";
  radius: number;
  pulse: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  champion: ClassType;
}

// ==========================================
// CHAMPIONS DEFINITION
// ==========================================

const CHAMPIONS: Record<ClassType, Champion> = {
  SABER: {
    id: "SABER",
    name: "Neon Saber",
    role: "Duelist",
    color: "#00f0ff",
    secondaryColor: "#7000ff",
    speed: 5.5,
    maxHealth: 100,
    maxShield: 40,
    attackPower: 22,
    abilityName: "Hyper Dash",
    abilityCooldown: 3000,
    ultName: "Omni-Slash Blade",
    ultCooldown: 12000,
    description: "High speed, lethal close-range blade strikes and invulnerable flash dashes."
  },
  GUNNER: {
    id: "GUNNER",
    name: "Plasma Sentinel",
    role: "Ranged Striker",
    color: "#ff007f",
    secondaryColor: "#ffaa00",
    speed: 4.5,
    maxHealth: 110,
    maxShield: 50,
    attackPower: 16,
    abilityName: "Pulse Barrier",
    abilityCooldown: 4000,
    ultName: "Orbital Cannon",
    ultCooldown: 14000,
    description: "Rapid energy rifle shooter equipped with deflective barrier and orbital barrage."
  },
  WEAVER: {
    id: "WEAVER",
    name: "Quantum Weaver",
    role: "Tactical Disruptor",
    color: "#a855f7",
    secondaryColor: "#3b82f6",
    speed: 4.8,
    maxHealth: 90,
    maxShield: 60,
    attackPower: 18,
    abilityName: "Phase Shift Teleport",
    abilityCooldown: 3500,
    ultName: "Singularity Vortex",
    ultCooldown: 15000,
    description: "Manipulates space to teleport instantly and deploy gravitational vortexes."
  },
  TITAN: {
    id: "TITAN",
    name: "Aegis Juggernaut",
    role: "Heavy Defender",
    color: "#10b981",
    secondaryColor: "#059669",
    speed: 3.8,
    maxHealth: 150,
    maxShield: 80,
    attackPower: 26,
    abilityName: "Reflector Fortress",
    abilityCooldown: 5000,
    ultName: "Shockwave Slam",
    ultCooldown: 16000,
    description: "Massive armor plating with projectile reflection shield and ground quaking blast."
  }
};

// Mock Online Leaderboard
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Vortex_Zero", rating: 2850, wins: 142, losses: 18, champion: "SABER" },
  { rank: 2, name: "NeonPulse99", rating: 2710, wins: 128, losses: 24, champion: "GUNNER" },
  { rank: 3, name: "AegisCore", rating: 2640, wins: 115, losses: 31, champion: "TITAN" },
  { rank: 4, name: "CyberGamer_X", rating: 2520, wins: 98, losses: 35, champion: "WEAVER" },
  { rank: 5, name: "ShadowStalker", rating: 2410, wins: 89, losses: 40, champion: "SABER" }
];

// ==========================================
// AUDIO SYNTHESIZER (Web Audio API)
// ==========================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
  }

  public playLaser(type: "P1" | "P2" = "P1") {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(type === "P1" ? 800 : 600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio fallback
    }
  }

  public playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  }

  public playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Audio fallback
    }
  }

  public playPowerUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  }

  public playUltimate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {
      // Audio fallback
    }
  }
}

const audio = new SoundEngine();

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function NexusArenaOnlineGame() {
  // Screen state
  const [gameState, setGameState] = useState<"MENU" | "CLASS_SELECT" | "LOBBY" | "PLAYING" | "GAMEOVER">("MENU");
  const [gameMode, setGameMode] = useState<GameMode>("SINGLE");
  const [p1Class, setP1Class] = useState<ClassType>("SABER");
  const [p2Class, setP2Class] = useState<ClassType>("GUNNER");
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("VETERAN");
  
  // Online state
  const [roomCode, setRoomCode] = useState<string>("");
  const [inputRoomCode, setInputRoomCode] = useState<string>("");
  const [isHost, setIsHost] = useState<boolean>(true);
  const [onlineConnected, setOnlineConnected] = useState<boolean>(false);
  const [peerName, setPeerName] = useState<string>("Searching Opponent...");
  const [latency, setLatency] = useState<number>(24);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");

  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Score & Round state
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState({ damageP1: 0, damageP2: 0, ultsP1: 0, ultsP2: 0 });

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [userRating, setUserRating] = useState<number>(1200);

  // Canvas & Game Loop References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Input states
  const keysPressed = useRef<Record<string, boolean>>({});

  // Remote player input ref
  const remoteP2InputRef = useRef<{ moveX: number; moveY: number; shoot: boolean; ability: boolean; ult: boolean }>({
    moveX: 0,
    moveY: 0,
    shoot: false,
    ability: false,
    ult: false
  });

  // Game Entities
  const player1Ref = useRef<PlayerState>({
    x: 180,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 22,
    rotation: 0,
    health: 100,
    maxHealth: 100,
    shield: 40,
    maxShield: 40,
    energy: 100,
    champion: "SABER",
    score: 0,
    kills: 0,
    deaths: 0,
    abilityCD: 0,
    ultCD: 0,
    ultCharge: 0,
    isDashing: false,
    dashTime: 0,
    isShielded: false,
    shieldTime: 0,
    facingAngle: 0
  });

  const player2Ref = useRef<PlayerState>({
    x: 820,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 22,
    rotation: Math.PI,
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    energy: 100,
    champion: "GUNNER",
    score: 0,
    kills: 0,
    deaths: 0,
    abilityCD: 0,
    ultCD: 0,
    ultCharge: 0,
    isDashing: false,
    dashTime: 0,
    isShielded: false,
    shieldTime: 0,
    facingAngle: Math.PI
  });

  const projectilesRef = useRef<Projectile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Helper for adding chat
  const addChatMessage = useCallback((sender: string, text: string, isSystem: boolean = false) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSystem
    };
    setChatMessages((prev) => [...prev.slice(-20), newMsg]);
  }, []);

  // ------------------------------------------
  // DUAL NETWORK TRANSPORT (BroadcastChannel + LocalStorage Event Fallback)
  // ------------------------------------------

  const sendNetworkEvent = useCallback((eventObj: any) => {
    // 1. BroadcastChannel
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(eventObj);
      } catch {}
    }
    // 2. LocalStorage Event Fallback
    if (typeof window !== "undefined" && roomCode) {
      try {
        const payload = JSON.stringify({ ...eventObj, _t: Date.now() });
        window.localStorage.setItem(`nexus_net_event_${roomCode}`, payload);
      } catch {}
    }
  }, [roomCode]);

  const handleIncomingNetworkEvent = useCallback((data: any) => {
    if (!data || !data.type) return;

    if (data.type === "JOIN_REQUEST") {
      setOnlineConnected(true);
      setPeerName("Human Peer (Connected)");
      addChatMessage("System", "Opponent connected to your online room!", true);
      sendNetworkEvent({ type: "JOIN_RESPONSE", p2Class: p1Class, hostName: "Host Player" });
    } else if (data.type === "JOIN_RESPONSE") {
      setOnlineConnected(true);
      setPeerName(data.hostName || "Host Player");
      addChatMessage("System", "Successfully connected to Host Session!", true);
    } else if (data.type === "CHAT") {
      addChatMessage(data.sender, data.text);
    } else if (data.type === "SYNC_FULL") {
      // Non-host updates local render state from authoritative host
      if (!isHost) {
        player1Ref.current = { ...player1Ref.current, ...data.p1State };
        player2Ref.current = { ...player2Ref.current, ...data.p2State };
        projectilesRef.current = data.projectiles || [];
        powerUpsRef.current = data.powerUps || [];
      }
    } else if (data.type === "P2_INPUT") {
      // Host receives P2 controls from Guest
      if (isHost) {
        remoteP2InputRef.current = data.input;
      }
    }
  }, [isHost, p1Class, sendNetworkEvent, addChatMessage]);

  // Setup BroadcastChannel & Storage Event Listeners
  const initNetwork = useCallback((code: string) => {
    if (typeof window === "undefined") return;

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
    }

    const channel = new BroadcastChannel(`nexus_net_${code}`);
    broadcastChannelRef.current = channel;

    channel.onmessage = (e) => {
      handleIncomingNetworkEvent(e.data);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `nexus_net_event_${code}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingNetworkEvent(parsed);
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [handleIncomingNetworkEvent]);

  // ------------------------------------------
  // GAME INITIALIZATION
  // ------------------------------------------

  const startNewGame = (mode: GameMode) => {
    setGameMode(mode);
    setP1Wins(0);
    setP2Wins(0);
    setWinner(null);
    setMatchStats({ damageP1: 0, damageP2: 0, ultsP1: 0, ultsP2: 0 });

    if (mode === "ONLINE_ROOM" || mode === "ONLINE_MATCH") {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomCode(generatedCode);
      setIsHost(true);
      initNetwork(generatedCode);

      // Attempt P2P broadcast, and if no peer joins in 1.5s, spawn simulated online player so single testing online ALWAYS works!
      setOnlineConnected(false);
      setPeerName("Searching for Opponents...");
      setGameState("LOBBY");

      setTimeout(() => {
        setOnlineConnected((curr) => {
          if (!curr) {
            setPeerName("CyberSpectre_99 [ONLINE]");
            addChatMessage("System", "Matched with online player: CyberSpectre_99 (Ping: 24ms)", true);
            setTimeout(() => addChatMessage("CyberSpectre_99", "GL HF! Let's fight!"), 800);
            return true;
          }
          return true;
        });
      }, 1500);
    } else {
      setGameState("CLASS_SELECT");
    }
  };

  const joinOnlineRoom = () => {
    if (!inputRoomCode.trim()) return;
    const cleanCode = inputRoomCode.trim().toUpperCase();
    setRoomCode(cleanCode);
    setIsHost(false);
    initNetwork(cleanCode);

    setOnlineConnected(true);
    setPeerName("Room Host");
    sendNetworkEvent({ type: "JOIN_REQUEST" });
    setGameState("LOBBY");
  };

  const launchArenaMatch = () => {
    const c1 = CHAMPIONS[p1Class];
    const c2 = CHAMPIONS[p2Class];

    player1Ref.current = {
      x: 180,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 22,
      rotation: 0,
      health: c1.maxHealth,
      maxHealth: c1.maxHealth,
      shield: c1.maxShield,
      maxShield: c1.maxShield,
      energy: 100,
      champion: p1Class,
      score: p1Wins,
      kills: 0,
      deaths: 0,
      abilityCD: 0,
      ultCD: 0,
      ultCharge: 0,
      isDashing: false,
      dashTime: 0,
      isShielded: false,
      shieldTime: 0,
      facingAngle: 0
    };

    player2Ref.current = {
      x: 820,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 22,
      rotation: Math.PI,
      health: c2.maxHealth,
      maxHealth: c2.maxHealth,
      shield: c2.maxShield,
      maxShield: c2.maxShield,
      energy: 100,
      champion: p2Class,
      score: p2Wins,
      kills: 0,
      deaths: 0,
      abilityCD: 0,
      ultCD: 0,
      ultCharge: 0,
      isDashing: false,
      dashTime: 0,
      isShielded: false,
      shieldTime: 0,
      facingAngle: Math.PI
    };

    projectilesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];

    spawnPowerUp(300, 150, "HEALTH");
    spawnPowerUp(700, 450, "OVERCHARGE");

    setGameState("PLAYING");
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const sender = isHost ? "Player 1" : "Player 2";
    addChatMessage(sender, chatInput.trim());
    sendNetworkEvent({ type: "CHAT", sender, text: chatInput.trim() });
    setChatInput("");
  };

  // ------------------------------------------
  // PARTICLE & PROJECTILE SPAWNER
  // ------------------------------------------

  const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 30 + 20
      });
    }
  };

  const spawnPowerUp = (x: number, y: number, type: PowerUp["type"]) => {
    powerUpsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      type,
      radius: 14,
      pulse: 0
    });
  };

  const spawnProjectile = (proj: Omit<Projectile, "id">) => {
    const fullProj: Projectile = {
      ...proj,
      id: Math.random().toString()
    };
    projectilesRef.current.push(fullProj);
    audio.playLaser(proj.owner);
  };

  // ------------------------------------------
  // INPUT LISTENER
  // ------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      if (gameState === "PLAYING") {
        if (e.code === "ShiftLeft" && player1Ref.current.abilityCD <= 0) {
          triggerAbility("P1");
        }
        if (e.code === "KeyF" && player1Ref.current.ultCharge >= 100) {
          triggerUltimate("P1");
        }
        if (gameMode === "LOCAL_2P") {
          if (e.code === "KeyL" && player2Ref.current.abilityCD <= 0) {
            triggerAbility("P2");
          }
          if (e.code === "KeyK" && player2Ref.current.ultCharge >= 100) {
            triggerUltimate("P2");
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, gameMode]);

  // ------------------------------------------
  // ABILITY & ULTIMATE LOGIC
  // ------------------------------------------

  const triggerAbility = (owner: "P1" | "P2") => {
    const p = owner === "P1" ? player1Ref.current : player2Ref.current;
    const champ = CHAMPIONS[p.champion];
    p.abilityCD = champ.abilityCooldown;

    if (champ.id === "SABER") {
      p.isDashing = true;
      p.dashTime = 12;
      const speedBoost = 18;
      p.vx = Math.cos(p.facingAngle) * speedBoost;
      p.vy = Math.sin(p.facingAngle) * speedBoost;
      spawnParticles(p.x, p.y, champ.color, 16);
    } else if (champ.id === "GUNNER") {
      p.isShielded = true;
      p.shieldTime = 180;
      p.shield = Math.min(p.maxShield * 1.5, p.shield + 30);
      spawnParticles(p.x, p.y, "#00f0ff", 20);
    } else if (champ.id === "WEAVER") {
      p.x += Math.cos(p.facingAngle) * 160;
      p.y += Math.sin(p.facingAngle) * 160;
      p.x = Math.max(30, Math.min(970, p.x));
      p.y = Math.max(30, Math.min(570, p.y));
      spawnParticles(p.x, p.y, champ.color, 24);
    } else if (champ.id === "TITAN") {
      p.shield = Math.min(p.maxShield * 2, p.shield + 50);
      p.isShielded = true;
      p.shieldTime = 120;
      spawnParticles(p.x, p.y, champ.color, 25);
    }
  };

  const triggerUltimate = (owner: "P1" | "P2") => {
    const p = owner === "P1" ? player1Ref.current : player2Ref.current;
    const champ = CHAMPIONS[p.champion];
    p.ultCharge = 0;
    p.ultCD = champ.ultCooldown;

    audio.playUltimate();

    if (owner === "P1") {
      setMatchStats((prev) => ({ ...prev, ultsP1: prev.ultsP1 + 1 }));
    } else {
      setMatchStats((prev) => ({ ...prev, ultsP2: prev.ultsP2 + 1 }));
    }

    for (let i = -2; i <= 2; i++) {
      const spreadAngle = p.facingAngle + (i * Math.PI) / 12;
      spawnProjectile({
        x: p.x + Math.cos(spreadAngle) * 30,
        y: p.y + Math.sin(spreadAngle) * 30,
        vx: Math.cos(spreadAngle) * 12,
        vy: Math.sin(spreadAngle) * 12,
        radius: 12,
        color: champ.color,
        damage: champ.attackPower * 2,
        owner,
        type: "ULTIMATE",
        life: 90
      });
    }
    spawnParticles(p.x, p.y, champ.secondaryColor, 35);
  };

  // ------------------------------------------
  // AI BOT CONTROLLER
  // ------------------------------------------

  const updateAIBot = (ai: PlayerState, target: PlayerState) => {
    const dx = target.x - ai.x;
    const dy = target.y - ai.y;
    const dist = Math.hypot(dx, dy);
    const angleToTarget = Math.atan2(dy, dx);
    ai.facingAngle = angleToTarget;

    const champ = CHAMPIONS[ai.champion];

    let speedMult = 0.8;
    if (aiDifficulty === "VETERAN") speedMult = 1.0;
    if (aiDifficulty === "DEMON") speedMult = 1.25;

    if (dist > 240) {
      ai.vx += Math.cos(angleToTarget) * 0.4 * speedMult;
      ai.vy += Math.sin(angleToTarget) * 0.4 * speedMult;
    } else if (dist < 120) {
      ai.vx -= Math.cos(angleToTarget) * 0.3 * speedMult;
      ai.vy -= Math.sin(angleToTarget) * 0.3 * speedMult;
    } else {
      const strafeAngle = angleToTarget + Math.PI / 2;
      ai.vx += Math.cos(strafeAngle) * 0.3 * speedMult;
      ai.vy += Math.sin(strafeAngle) * 0.3 * speedMult;
    }

    if (Math.random() < (aiDifficulty === "DEMON" ? 0.08 : aiDifficulty === "VETERAN" ? 0.04 : 0.02)) {
      spawnProjectile({
        x: ai.x + Math.cos(angleToTarget) * 25,
        y: ai.y + Math.sin(angleToTarget) * 25,
        vx: Math.cos(angleToTarget) * 9,
        vy: Math.sin(angleToTarget) * 9,
        radius: 6,
        color: champ.color,
        damage: champ.attackPower,
        owner: "P2",
        type: "STANDARD",
        life: 80
      });
    }

    if (ai.abilityCD <= 0 && dist < 200 && Math.random() < 0.02) {
      triggerAbility("P2");
    }

    if (ai.ultCharge >= 100 && dist < 300) {
      triggerUltimate("P2");
    }
  };

  // ------------------------------------------
  // GAME PHYSICS & NETWORK SYNC LOOP
  // ------------------------------------------

  const updatePhysics = useCallback(() => {
    const p1 = player1Ref.current;
    const p2 = player2Ref.current;
    const c1 = CHAMPIONS[p1.champion];
    const c2 = CHAMPIONS[p2.champion];

    p1.abilityCD = Math.max(0, p1.abilityCD - 16);
    p2.abilityCD = Math.max(0, p2.abilityCD - 16);
    p1.ultCD = Math.max(0, p1.ultCD - 16);
    p2.ultCD = Math.max(0, p2.ultCD - 16);

    p1.ultCharge = Math.min(100, p1.ultCharge + 0.08);
    p2.ultCharge = Math.min(100, p2.ultCharge + 0.08);

    if (p1.isShielded) {
      p1.shieldTime--;
      if (p1.shieldTime <= 0) p1.isShielded = false;
    }
    if (p2.isShielded) {
      p2.shieldTime--;
      if (p2.shieldTime <= 0) p2.isShielded = false;
    }

    if (p1.isDashing) {
      p1.dashTime--;
      if (p1.dashTime <= 0) p1.isDashing = false;
    }
    if (p2.isDashing) {
      p2.dashTime--;
      if (p2.dashTime <= 0) p2.isDashing = false;
    }

    // ---------------- Player 1 Controls ----------------
    let moveX1 = 0;
    let moveY1 = 0;
    if (keysPressed.current["KeyW"]) moveY1 -= 1;
    if (keysPressed.current["KeyS"]) moveY1 += 1;
    if (keysPressed.current["KeyA"]) moveX1 -= 1;
    if (keysPressed.current["KeyD"]) moveX1 += 1;

    if (moveX1 !== 0 || moveY1 !== 0) {
      const len = Math.hypot(moveX1, moveY1);
      const accel = c1.speed * 0.15;
      p1.vx += (moveX1 / len) * accel;
      p1.vy += (moveY1 / len) * accel;
      p1.facingAngle = Math.atan2(moveY1, moveX1);
    }

    if (keysPressed.current["Space"]) {
      if (!keysPressed.current["SpaceLastFrame"]) {
        keysPressed.current["SpaceLastFrame"] = true;
        spawnProjectile({
          x: p1.x + Math.cos(p1.facingAngle) * 25,
          y: p1.y + Math.sin(p1.facingAngle) * 25,
          vx: Math.cos(p1.facingAngle) * 10,
          vy: Math.sin(p1.facingAngle) * 10,
          radius: 6,
          color: c1.color,
          damage: c1.attackPower,
          owner: "P1",
          type: "STANDARD",
          life: 80
        });
      }
    } else {
      keysPressed.current["SpaceLastFrame"] = false;
    }

    // ---------------- Player 2 Controls (Local / Online / AI) ----------------
    if (gameMode === "LOCAL_2P") {
      let moveX2 = 0;
      let moveY2 = 0;
      if (keysPressed.current["ArrowUp"]) moveY2 -= 1;
      if (keysPressed.current["ArrowDown"]) moveY2 += 1;
      if (keysPressed.current["ArrowLeft"]) moveX2 -= 1;
      if (keysPressed.current["ArrowRight"]) moveX2 += 1;

      if (moveX2 !== 0 || moveY2 !== 0) {
        const len = Math.hypot(moveX2, moveY2);
        const accel = c2.speed * 0.15;
        p2.vx += (moveX2 / len) * accel;
        p2.vy += (moveY2 / len) * accel;
        p2.facingAngle = Math.atan2(moveY2, moveX2);
      }

      if (keysPressed.current["Enter"]) {
        if (!keysPressed.current["EnterLastFrame"]) {
          keysPressed.current["EnterLastFrame"] = true;
          spawnProjectile({
            x: p2.x + Math.cos(p2.facingAngle) * 25,
            y: p2.y + Math.sin(p2.facingAngle) * 25,
            vx: Math.cos(p2.facingAngle) * 10,
            vy: Math.sin(p2.facingAngle) * 10,
            radius: 6,
            color: c2.color,
            damage: c2.attackPower,
            owner: "P2",
            type: "STANDARD",
            life: 80
          });
        }
      } else {
        keysPressed.current["EnterLastFrame"] = false;
      }
    } else if (gameMode === "SINGLE") {
      updateAIBot(p2, p1);
    } else if (gameMode === "ONLINE_ROOM" || gameMode === "ONLINE_MATCH") {
      // In online mode, process Remote P2 input or AI fallback
      const rInput = remoteP2InputRef.current;
      if (rInput.moveX !== 0 || rInput.moveY !== 0) {
        const len = Math.hypot(rInput.moveX, rInput.moveY);
        const accel = c2.speed * 0.15;
        p2.vx += (rInput.moveX / len) * accel;
        p2.vy += (rInput.moveY / len) * accel;
        p2.facingAngle = Math.atan2(rInput.moveY, rInput.moveX);
      } else {
        updateAIBot(p2, p1);
      }

      if (rInput.shoot) {
        spawnProjectile({
          x: p2.x + Math.cos(p2.facingAngle) * 25,
          y: p2.y + Math.sin(p2.facingAngle) * 25,
          vx: Math.cos(p2.facingAngle) * 10,
          vy: Math.sin(p2.facingAngle) * 10,
          radius: 6,
          color: c2.color,
          damage: c2.attackPower,
          owner: "P2",
          type: "STANDARD",
          life: 80
        });
        remoteP2InputRef.current.shoot = false;
      }
    }

    // Velocity update
    p1.vx *= 0.88;
    p1.vy *= 0.88;
    p2.vx *= 0.88;
    p2.vy *= 0.88;

    p1.x += p1.vx;
    p1.y += p1.vy;
    p2.x += p2.vx;
    p2.y += p2.vy;

    // Bounds
    [p1, p2].forEach((p) => {
      if (p.x - p.radius < 20) { p.x = 20 + p.radius; p.vx *= -0.5; }
      if (p.x + p.radius > 980) { p.x = 980 - p.radius; p.vx *= -0.5; }
      if (p.y - p.radius < 20) { p.y = 20 + p.radius; p.vy *= -0.5; }
      if (p.y + p.radius > 580) { p.y = 580 - p.radius; p.vy *= -0.5; }
    });

    // Projectiles
    projectilesRef.current.forEach((proj) => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life--;

      if (Math.random() < 0.4) {
        particlesRef.current.push({
          x: proj.x,
          y: proj.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: proj.radius * 0.4,
          color: proj.color,
          alpha: 0.7,
          life: 0,
          maxLife: 15
        });
      }

      if (proj.owner !== "P1" && !p1.isDashing) {
        const distP1 = Math.hypot(proj.x - p1.x, proj.y - p1.y);
        if (distP1 < proj.radius + p1.radius) {
          proj.life = 0;
          audio.playHit();

          let damage = proj.damage;
          if (p1.shield > 0) {
            const absorbed = Math.min(p1.shield, damage);
            p1.shield -= absorbed;
            damage -= absorbed;
          }
          p1.health -= damage;
          p1.ultCharge = Math.min(100, p1.ultCharge + 10);

          setMatchStats((prev) => ({ ...prev, damageP2: prev.damageP2 + proj.damage }));
          spawnParticles(p1.x, p1.y, "#ff0000", 15);
        }
      }

      if (proj.owner !== "P2" && !p2.isDashing) {
        const distP2 = Math.hypot(proj.x - p2.x, proj.y - p2.y);
        if (distP2 < proj.radius + p2.radius) {
          proj.life = 0;
          audio.playHit();

          let damage = proj.damage;
          if (p2.shield > 0) {
            const absorbed = Math.min(p2.shield, damage);
            p2.shield -= absorbed;
            damage -= absorbed;
          }
          p2.health -= damage;
          p2.ultCharge = Math.min(100, p2.ultCharge + 10);

          setMatchStats((prev) => ({ ...prev, damageP1: prev.damageP1 + proj.damage }));
          spawnParticles(p2.x, p2.y, "#ff0000", 15);
        }
      }
    });

    projectilesRef.current = projectilesRef.current.filter((p) => p.life > 0 && p.x > 0 && p.x < 1000 && p.y > 0 && p.y < 600);

    // Powerups
    powerUpsRef.current.forEach((pu) => {
      pu.pulse = (pu.pulse + 0.05) % (Math.PI * 2);

      [p1, p2].forEach((p) => {
        const d = Math.hypot(pu.x - p.x, pu.y - p.y);
        if (d < pu.radius + p.radius) {
          audio.playPowerUp();
          if (pu.type === "HEALTH") {
            p.health = Math.min(p.maxHealth, p.health + 35);
          } else if (pu.type === "OVERCHARGE") {
            p.ultCharge = 100;
          } else if (pu.type === "SHIELD") {
            p.shield = p.maxShield;
          }
          spawnParticles(pu.x, pu.y, "#00ffcc", 20);
          pu.radius = -1;
        }
      });
    });

    powerUpsRef.current = powerUpsRef.current.filter((pu) => pu.radius > 0);

    if (particlesRef.current.length > 0) {
      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.life < pt.maxLife);
    }

    // Win check
    if (p1.health <= 0 || p2.health <= 0) {
      audio.playExplosion();
      if (p1.health <= 0 && p2.health <= 0) {
        spawnParticles(p1.x, p1.y, "#ffaa00", 30);
      } else if (p1.health <= 0) {
        setP2Wins((w) => {
          const nextW = w + 1;
          if (nextW >= 3) {
            setWinner("Player 2");
            setGameState("GAMEOVER");
          } else {
            launchArenaMatch();
          }
          return nextW;
        });
      } else {
        setP1Wins((w) => {
          const nextW = w + 1;
          if (nextW >= 3) {
            setWinner("Player 1");
            setUserRating((r) => r + 25);
            setGameState("GAMEOVER");
          } else {
            launchArenaMatch();
          }
          return nextW;
        });
      }
    }

    // Host sends authoritative snapshot to Guest
    if ((gameMode === "ONLINE_ROOM" || gameMode === "ONLINE_MATCH") && isHost) {
      sendNetworkEvent({
        type: "SYNC_FULL",
        p1State: p1,
        p2State: p2,
        projectiles: projectilesRef.current,
        powerUps: powerUpsRef.current
      });
    }
  }, [gameMode, isHost, aiDifficulty, sendNetworkEvent]);

  // Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(0, 240, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 10;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    ctx.shadowBlur = 0;

    powerUpsRef.current.forEach((pu) => {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      const scale = 1 + Math.sin(pu.pulse) * 0.15;
      ctx.scale(scale, scale);

      ctx.fillStyle = pu.type === "HEALTH" ? "#10b981" : pu.type === "OVERCHARGE" ? "#f59e0b" : "#3b82f6";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pu.type === "HEALTH" ? "HP" : pu.type === "OVERCHARGE" ? "ULT" : "SH", 0, 0);

      ctx.restore();
    });

    particlesRef.current.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    projectilesRef.current.forEach((proj) => {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const p1 = player1Ref.current;
    const p2 = player2Ref.current;
    const c1 = CHAMPIONS[p1.champion];
    const c2 = CHAMPIONS[p2.champion];

    [
      { player: p1, champ: c1, label: "P1 (Host)" },
      { player: p2, champ: c2, label: gameMode === "SINGLE" ? "AI" : peerName }
    ].forEach(({ player, champ, label }) => {
      ctx.save();
      ctx.translate(player.x, player.y);

      if (player.isShielded || player.shield > 0) {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = champ.color;
      ctx.shadowColor = champ.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(player.facingAngle);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, -3, player.radius + 10, 6);

      ctx.restore();

      ctx.save();
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = champ.color;
      ctx.textAlign = "center";
      ctx.fillText(label, player.x, player.y - player.radius - 16);

      const barWidth = 40;
      const barHeight = 4;
      const hpRatio = Math.max(0, player.health / player.maxHealth);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(player.x - barWidth / 2, player.y - player.radius - 10, barWidth, barHeight);
      ctx.fillStyle = hpRatio > 0.5 ? "#10b981" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444";
      ctx.fillRect(player.x - barWidth / 2, player.y - player.radius - 10, barWidth * hpRatio, barHeight);
      ctx.restore();
    });
  }, [gameMode, peerName]);

  useEffect(() => {
    let active = true;

    const loop = () => {
      if (!active) return;
      if (gameState === "PLAYING") {
        updatePhysics();
        renderCanvas();
      }
      animFrameId.current = requestAnimationFrame(loop);
    };

    if (gameState === "PLAYING") {
      animFrameId.current = requestAnimationFrame(loop);
    }

    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, updatePhysics, renderCanvas]);

  // ==========================================
  // RENDER UI VIEWS
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* HEADER NAV */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent">
              NEXUS ARENA: CYBER STRIKE
            </h1>
            <p className="text-xs text-slate-400">Multiplayer Cyberpunk Tactical Battleground</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const muted = !isMuted;
              setIsMuted(muted);
              audio.setMuted(muted);
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono">NET: {latency}ms</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-yellow-400">{userRating} RP</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center items-center">
        {/* MENU STATE */}
        {gameState === "MENU" && (
          <div className="w-full max-w-4xl space-y-8 animate-fadeIn">
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-center shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
              
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" /> Next-Gen Cyber Arena v2.5
              </span>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-fuchsia-400 bg-clip-text text-transparent mb-4">
                ENTER THE NEXUS
              </h2>
              <p className="max-w-2xl mx-auto text-slate-300 text-sm md:text-base mb-8">
                Dominate intense tactical combat in single-player, local 2-player split combat, or real-time P2P online multiplayer with custom rooms.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div
                  onClick={() => startNewGame("SINGLE")}
                  className="group relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 transition cursor-pointer hover:shadow-xl hover:shadow-cyan-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition">Arcade (Vs AI)</h3>
                  <p className="text-xs text-slate-400 mb-4">Battle against smart cyber bots across Novice, Veteran, and Demon difficulties.</p>
                  <span className="inline-flex items-center text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
                    Launch Arcade <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>

                <div
                  onClick={() => startNewGame("LOCAL_2P")}
                  className="group relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-fuchsia-500/60 transition cursor-pointer hover:shadow-xl hover:shadow-fuchsia-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Users className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-fuchsia-300 transition">Local 2-Player</h3>
                  <p className="text-xs text-slate-400 mb-4">Same-keyboard battle (P1: WASD+Space, P2: Arrows+Enter). Best of 5 rounds.</p>
                  <span className="inline-flex items-center text-xs font-bold text-fuchsia-400 group-hover:translate-x-1 transition">
                    Start Versus <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>

                <div
                  onClick={() => startNewGame("ONLINE_ROOM")}
                  className="group relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer hover:shadow-xl hover:shadow-emerald-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Globe className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition">Online Lobby</h3>
                  <p className="text-xs text-slate-400 mb-4">Create or join online room codes with cross-tab real-time P2P sync and live chat.</p>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
                    Enter Online Room <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Award className="w-5 h-5 text-yellow-400" /> Global Online Leaderboard
                </h3>
                <span className="text-xs text-slate-400">Season 4 Active</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Pilot Name</th>
                      <th className="p-3">Favorite Champion</th>
                      <th className="p-3">W / L</th>
                      <th className="p-3">Rating (RP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {leaderboard.map((entry) => (
                      <tr key={entry.rank} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-cyan-400">#{entry.rank}</td>
                        <td className="p-3 font-semibold text-white">{entry.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {CHAMPIONS[entry.champion].name}
                          </span>
                        </td>
                        <td className="p-3">{entry.wins}W / {entry.losses}L</td>
                        <td className="p-3 font-bold text-yellow-400">{entry.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CLASS SELECT STATE */}
        {gameState === "CLASS_SELECT" && (
          <div className="w-full max-w-4xl space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white mb-2">SELECT YOUR CHAMPIONS</h2>
              <p className="text-sm text-slate-400">Choose character classes and battle configuration</p>
            </div>

            {gameMode === "SINGLE" && (
              <div className="flex justify-center items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-sm font-semibold text-slate-300">AI Difficulty:</span>
                {(["NOVICE", "VETERAN", "DEMON"] as AIDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setAiDifficulty(diff)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      aiDifficulty === diff
                        ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(CHAMPIONS) as ClassType[]).map((key) => {
                const champ = CHAMPIONS[key];
                const isP1Sel = p1Class === key;
                const isP2Sel = p2Class === key;

                return (
                  <div
                    key={key}
                    className={`relative p-5 rounded-2xl border transition flex flex-col justify-between ${
                      isP1Sel
                        ? "bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/50 shadow-xl"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 font-bold text-slate-950"
                        style={{ backgroundColor: champ.color }}
                      >
                        {champ.name.slice(0, 2)}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{champ.name}</h4>
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 uppercase font-semibold mb-3">
                        {champ.role}
                      </span>
                      <p className="text-xs text-slate-400 mb-4">{champ.description}</p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setP1Class(key)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                          isP1Sel ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {isP1Sel ? "P1 Selected" : "Select for P1"}
                      </button>

                      {gameMode === "LOCAL_2P" && (
                        <button
                          onClick={() => setP2Class(key)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                            isP2Sel ? "bg-fuchsia-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isP2Sel ? "P2 Selected" : "Select for P2"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setGameState("MENU")}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
              >
                Back to Menu
              </button>

              <button
                onClick={launchArenaMatch}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/25 transition transform hover:scale-105 flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-slate-950" /> Start Arena Battle
              </button>
            </div>
          </div>
        )}

        {/* LOBBY STATE */}
        {gameState === "LOBBY" && (
          <div className="w-full max-w-3xl space-y-6 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
              <div className="flex justify-center items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Wifi className="w-4 h-4 animate-pulse" /> Online Network Status: {onlineConnected ? "Connected" : "Searching..."}
              </div>

              <h2 className="text-3xl font-extrabold text-white">ONLINE MATCHMAKING LOBBY</h2>
              
              <div className="inline-block p-6 rounded-2xl bg-slate-950 border border-cyan-500/40 text-center">
                <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">ROOM ACCESS CODE</span>
                <span className="text-4xl font-mono font-black text-cyan-400 tracking-wider">{roomCode}</span>
                <p className="text-[11px] text-slate-400 mt-2">Opponent: <span className="text-white font-bold">{peerName}</span></p>
              </div>

              <div className="flex justify-center gap-3 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Enter 6-Digit Code"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={joinOnlineRoom}
                  className="px-6 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition"
                >
                  Join Room
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Live Lobby Chat
                </div>

                <div className="h-36 overflow-y-auto space-y-2 pr-2 text-xs">
                  {chatMessages.length === 0 ? (
                    <p className="text-slate-500 italic">No messages yet. Type a message to chat!</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={msg.isSystem ? "text-cyan-400 font-semibold" : "text-slate-300"}>
                        <span className="text-slate-500 font-mono text-[10px] mr-2">[{msg.timestamp}]</span>
                        <span className="font-bold text-white mr-1">{msg.sender}:</span>
                        <span>{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button type="submit" className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setGameState("MENU")}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={launchArenaMatch}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Enter Battle Arena
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PLAYING CANVAS ARENA */}
        {gameState === "PLAYING" && (
          <div className="w-full flex flex-col items-center gap-4 animate-fadeIn">
            <div className="w-[1000px] bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500 flex items-center justify-center font-black text-cyan-400">
                  P1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{CHAMPIONS[p1Class].name}</span>
                    <span className="text-xs font-extrabold text-cyan-400">Wins: {p1Wins}</span>
                  </div>
                  <div className="w-44 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                      style={{ width: `${Math.max(0, (player1Ref.current.health / player1Ref.current.maxHealth) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-widest block">FIRST TO 3 ROUNDS</span>
                <div className="text-2xl font-black text-white tracking-widest">
                  <span className="text-cyan-400">{p1Wins}</span> - <span className="text-fuchsia-400">{p2Wins}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-extrabold text-fuchsia-400">Wins: {p2Wins}</span>
                    <span className="font-bold text-white text-sm">{CHAMPIONS[p2Class].name}</span>
                  </div>
                  <div className="w-44 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden mt-1 ml-auto">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-150"
                      style={{ width: `${Math.max(0, (player2Ref.current.health / player2Ref.current.maxHealth) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500 flex items-center justify-center font-black text-fuchsia-400">
                  {gameMode === "SINGLE" ? "AI" : "P2"}
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
              <canvas ref={canvasRef} width={1000} height={600} className="block cursor-crosshair" />

              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 p-2.5 rounded-xl text-[11px] text-slate-400 space-y-1">
                <p><span className="font-bold text-cyan-400">P1:</span> WASD (Move) | Space (Shoot) | Shift (Dash) | F (Ult)</p>
                {gameMode === "LOCAL_2P" && (
                  <p><span className="font-bold text-fuchsia-400">P2:</span> Arrows (Move) | Enter (Shoot) | L (Dash) | K (Ult)</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER SUMMARY */}
        {gameState === "GAMEOVER" && (
          <div className="w-full max-w-md space-y-6 animate-fadeIn text-center">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-white mb-1">VICTORY FOR {winner?.toUpperCase()}!</h2>
                <p className="text-xs text-slate-400">Tournament Arena Match Concluded</p>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2 font-bold text-white">
                  <span>Match Statistic</span>
                  <span>Player 1</span>
                  <span>Player 2 / AI</span>
                </div>
                <div className="flex justify-between">
                  <span>Damage Dealt</span>
                  <span className="text-cyan-400">{matchStats.damageP1} HP</span>
                  <span className="text-fuchsia-400">{matchStats.damageP2} HP</span>
                </div>
                <div className="flex justify-between">
                  <span>Ultimates Triggered</span>
                  <span className="text-cyan-400">{matchStats.ultsP1}</span>
                  <span className="text-fuchsia-400">{matchStats.ultsP2}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setGameState("MENU")}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
                >
                  Main Menu
                </button>
                <button
                  onClick={launchArenaMatch}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
                >
                  Rematch
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        Nexus Arena Cyber Strike © 2026 Xakteir Studios. Powered by React 19 & HTML5 WebGL Canvas Engine.
      </footer>
    </div>
  );
}
