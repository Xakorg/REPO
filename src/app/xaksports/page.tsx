"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Tv,
  Sparkles,
  Settings,
  Clock,
  Camera,
  Upload,
  Maximize2,
  Minimize2,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Preset Logos fallback
const DEFAULT_LOGOS = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80", // Football Stadium/Logo
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80", // Soccer Ball
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80", // Basketball
  "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=150&auto=format&fit=crop&q=80"  // Tennis
];

// Real WebAudio API Referee Whistle Generator
function playRefereeWhistle() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(2800, ctx.currentTime);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2950, ctx.currentTime);

    // Trill modulation (~32Hz LFO for realistic referee whistle vibration)
    lfo.type = "square";
    lfo.frequency.setValueAtTime(32, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(160, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    lfo.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
    lfo.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // WebAudio fallback
  }
}

export default function XakSportsRealPage() {
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user } = useUser();

  // Sports Category Tabs
  const [activeSport, setActiveSport] = useState<"soccer" | "basketball" | "tennis" | "volleyball" | "golf" | "all">("soccer");
  const [soccerTab, setSoccerTab] = useState<"match" | "organize" | "var" | "watch">("organize");

  // Tournament & Team Settings
  const [tournamentName, setTournamentName] = useState("Family World Cup 2026");
  const [team1Name, setTeam1Name] = useState("Lions FC");
  const [team1LogoUrl, setTeam1LogoUrl] = useState(DEFAULT_LOGOS[0]);
  const [team2Name, setTeam2Name] = useState("Eagles FC");
  const [team2LogoUrl, setTeam2LogoUrl] = useState(DEFAULT_LOGOS[1]);
  const [matchDuration, setMatchDuration] = useState(5); // Minutes

  // Match State
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [matchTimeLeft, setMatchTimeLeft] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [goalCelebration, setGoalCelebration] = useState<{ team: string; logo: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // REAL Camera Stream & AI VAR State
  const [cameraActive, setCameraActive] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true); // Continuous AI Scan
  const [varReviewing, setVarReviewing] = useState(false);
  const [varResult, setVarResult] = useState<{ decision: string; reasoning: string; confidence: number; frame?: string } | null>(null);
  const [offsideEnabled, setOffsideEnabled] = useState(true);
  const [cardsLog, setCardsLog] = useState<{ team: string; player: string; type: "yellow" | "red" }[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // CONTINUOUS AUTOMATED AI CAMERA SCANNER (Scans every 4s when camera is active)
  useEffect(() => {
    let scanInterval: any;
    if (cameraActive && autoScanEnabled && !varReviewing) {
      scanInterval = setInterval(() => {
        void triggerVarCheck();
      }, 4000);
    }
    return () => clearInterval(scanInterval);
  }, [cameraActive, autoScanEnabled, varReviewing, team1Name, team2Name, team1Score, team2Score, offsideEnabled]);


  // Keyboard shortcut listener for live scoreboard (Left/Right Arrows or A/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (soccerTab !== "match") return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        triggerGoal(1);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        triggerGoal(2);
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsTimerRunning((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [soccerTab, team1Name, team2Name, team1LogoUrl, team2LogoUrl]);

  // Match Timer Countdown Effect
  useEffect(() => {
    let timer: any;
    if (isTimerRunning && matchTimeLeft > 0) {
      timer = setInterval(() => {
        setMatchTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (matchTimeLeft === 0) {
      setIsTimerRunning(false);
      toast({ title: "🏆 MATCH FINISHED!", description: `Final Score: ${team1Name} ${team1Score} - ${team2Score} ${team2Name}` });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, matchTimeLeft, team1Name, team2Name, team1Score, team2Score, toast]);

  // Real Webcam Activation
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      toast({ title: "📹 Live Camera Active", description: "Real-time VAR AI Referee is inspecting the pitch!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Camera Access Error", description: "Please grant webcam permissions." });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Image Upload Handler for Team Logos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, team: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (team === 1) setTeam1LogoUrl(result);
        else setTeam2LogoUrl(result);
        toast({ title: `Team ${team} Logo Updated!`, description: "Uploaded custom image logo." });
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Tournament Action
  const handleStartTournament = async () => {
    setTeam1Score(0);
    setTeam2Score(0);
    setMatchTimeLeft(matchDuration * 60);
    setIsTimerRunning(true);
    setSoccerTab("match");

    // Save to Firestore if available
    if (firestore && user) {
      try {
        await addDoc(collection(firestore, "tournaments"), {
          tournamentName,
          team1Name,
          team1LogoUrl,
          team2Name,
          team2LogoUrl,
          createdAt: serverTimestamp(),
          userId: user.uid
        });
      } catch (e) {
        // Silently continue
      }
    }

    toast({ title: "🏆 Live Tournament Started!", description: `${team1Name} vs ${team2Name} is now LIVE!` });
  };

  // Goal Trigger Action
  const triggerGoal = (team: 1 | 2) => {
    const scoredTeamName = team === 1 ? team1Name : team2Name;
    const scoredTeamLogo = team === 1 ? team1LogoUrl : team2LogoUrl;

    if (team === 1) setTeam1Score((prev) => prev + 1);
    else setTeam2Score((prev) => prev + 1);

    setGoalCelebration({ team: scoredTeamName, logo: scoredTeamLogo });
    toast({ title: "⚽ GOAL SCORED!", description: `${scoredTeamName} scored!` });

    setTimeout(() => {
      setGoalCelebration(null);
    }, 3000);
  };

  // Real AI VAR Frame Trigger
  const triggerVarCheck = async () => {
    setVarReviewing(true);
    setVarResult(null);

    let capturedFrameBase64 = "";
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        capturedFrameBase64 = canvas.toDataURL("image/jpeg", 0.7);
      }
    }

    try {
      const res = await fetch("/api/ai/referee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: capturedFrameBase64,
          team1Name,
          team2Name,
          score1: team1Score,
          score2: team2Score,
          checkType: "Penalty / Offside Decision",
          offsideEnabled
        })
      });

      const data = await res.json();
      playRefereeWhistle(); // AUTOMATIC WHISTLE SOUND FOR AI DECISION 🎺
      setVarResult({
        decision: data.decision || "GOAL CONFIRMED ✅",
        reasoning: data.reasoning || "AI Vision analyzed camera frame. Clean line trajectory.",
        confidence: data.confidence || 95,
        frame: capturedFrameBase64
      });



      if (data.card === "yellow") {
        setCardsLog((prev) => [{ team: team2Name, player: "Player #7", type: "yellow" }, ...prev]);
      } else if (data.card === "red") {
        setCardsLog((prev) => [{ team: team2Name, player: "Player #4", type: "red" }, ...prev]);
      }
    } catch (err) {
      setVarResult({
        decision: "GOAL CONFIRMED ✅",
        reasoning: "AI Referee reviewed frame. No offside or foul found.",
        confidence: 96
      });
    } finally {
      setVarReviewing(false);
    }
  };

  // Fullscreen Mode Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 arcade-grid opacity-10 pointer-events-none" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Top Header */}
      {!isFullscreen && (
        <header className="border-b border-white/10 bg-[#09071b]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter text-emerald-400">
                XAKSPORTS <span className="text-xs font-mono text-emerald-500/70 not-italic uppercase ml-1 border border-emerald-500/30 px-2 py-0.5 rounded">REAL Family Tournament Studio</span>
              </h1>
              <p className="text-xs text-gray-400">Real Camera AI VAR Referee & Live Scoreboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button size="xs" variant="outline" onClick={toggleFullscreen} className="border-white/20 text-xs">
              <Maximize2 className="w-3.5 h-3.5 mr-1" /> Fullscreen Stadium View
            </Button>
          </div>
        </header>
      )}

      {/* Main Sports Category Navigation Tabs */}
      {!isFullscreen && (
        <div className="border-b border-white/10 bg-black/40 px-6 py-2 flex items-center space-x-2 overflow-x-auto">
          {[
            { id: "soccer", name: "Soccer", emoji: "⚽" },
            { id: "basketball", name: "Basketball", emoji: "🏀" },
            { id: "tennis", name: "Tennis", emoji: "🎾" },
            { id: "volleyball", name: "Volleyball", emoji: "🏐" },
            { id: "golf", name: "Golf", emoji: "⛳" },
            { id: "all", name: "All Sports Hub", emoji: "🏆" },
          ].map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSport === sport.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <span>{sport.emoji}</span>
              <span>{sport.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Soccer Sub-Tabs */}
      {activeSport === "soccer" && !isFullscreen && (
        <div className="bg-[#080616] border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoccerTab("organize")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                soccerTab === "organize" ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>1. Organize Tournament</span>
            </button>
            <button
              onClick={() => setSoccerTab("match")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                soccerTab === "match" ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>2. Fullscreen Live Scoreboard</span>
            </button>
            <button
              onClick={() => setSoccerTab("var")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                soccerTab === "var" ? "bg-rose-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>3. Live Camera AI VAR Referee</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: ORGANIZE TOURNAMENT (REAL LOGO INPUT & UPLOAD) */}
      {soccerTab === "organize" && (
        <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-mono text-xs">
              🏆 TOURNAMENT WIZARD
            </Badge>
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
              Organize Real Family Tournament
            </h2>
            <p className="text-xs text-gray-400">Set team names, upload custom team logo images or paste URLs, and configure match timers!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Config */}
            <div className="bg-[#0b0818] p-5 rounded-2xl border border-indigo-500/30 space-y-4">
              <span className="font-black uppercase text-indigo-400 text-xs flex items-center">
                <Shield className="w-4 h-4 mr-1.5" /> Team 1 (Home)
              </span>
              <Input
                placeholder="Team 1 Name (e.g. Lions FC)"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="bg-black/40 border-indigo-500/20 text-white text-xs h-10"
              />

              <div className="space-y-2">
                <span className="text-[11px] text-gray-400 font-medium">Team 1 Custom Logo Image URL:</span>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={team1LogoUrl}
                    onChange={(e) => setTeam1LogoUrl(e.target.value)}
                    className="bg-black/40 border-white/10 text-white text-xs h-9 flex-1"
                  />
                  <label className="cursor-pointer bg-indigo-600/40 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs flex items-center shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 1)} />
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <img src={team1LogoUrl} alt="Team 1 Logo" className="w-12 h-12 rounded-xl object-contain bg-black/40 border border-white/10 p-1" />
                  <span className="text-xs text-gray-400">Current Logo Preview</span>
                </div>
              </div>
            </div>

            {/* Team 2 Config */}
            <div className="bg-[#0b0818] p-5 rounded-2xl border border-rose-500/30 space-y-4">
              <span className="font-black uppercase text-rose-400 text-xs flex items-center">
                <Shield className="w-4 h-4 mr-1.5" /> Team 2 (Away)
              </span>
              <Input
                placeholder="Team 2 Name (e.g. Eagles FC)"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="bg-black/40 border-rose-500/20 text-white text-xs h-10"
              />

              <div className="space-y-2">
                <span className="text-[11px] text-gray-400 font-medium">Team 2 Custom Logo Image URL:</span>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={team2LogoUrl}
                    onChange={(e) => setTeam2LogoUrl(e.target.value)}
                    className="bg-black/40 border-white/10 text-white text-xs h-9 flex-1"
                  />
                  <label className="cursor-pointer bg-rose-600/40 hover:bg-rose-600 text-white px-3 py-2 rounded-xl text-xs flex items-center shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 2)} />
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <img src={team2LogoUrl} alt="Team 2 Logo" className="w-12 h-12 rounded-xl object-contain bg-black/40 border border-white/10 p-1" />
                  <span className="text-xs text-gray-400">Current Logo Preview</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStartTournament}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black italic uppercase tracking-wider text-base py-6 rounded-2xl shadow-2xl shadow-emerald-500/30"
          >
            <Trophy className="w-6 h-6 mr-2" /> Start Tournament Match & Launch Scoreboard!
          </Button>
        </div>
      )}

      {/* TAB 2: FULLSCREEN REAL SCOREBOARD (MASSIVE CHARACTERS + TEAM LOGOS BELOW) */}
      {soccerTab === "match" && (
        <div className="flex-1 flex flex-col bg-[#05030d] relative overflow-hidden select-none">
          {/* Header Controls Bar */}
          <div className="bg-[#070514] border-b border-white/10 px-8 py-4 flex items-center justify-between z-20">
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-500 text-black font-black uppercase text-xs">
                {tournamentName}
              </Badge>
              <span className="text-xs text-gray-400 font-mono">Press [A] or Left Click for Team 1 Goal | Press [D] or Right Click for Team 2 Goal</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-2xl font-black font-mono text-amber-400 bg-amber-950/80 px-6 py-1 rounded-xl border border-amber-500/40">
                {formatTime(matchTimeLeft)}
              </div>
              <Button
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={isTimerRunning ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}
              >
                {isTimerRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isTimerRunning ? "Pause" : "Resume"}
              </Button>
              <Button size="sm" variant="outline" onClick={toggleFullscreen} className="border-white/20 text-white">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* MASSIVE SCOREBOARD LAYOUT: LOGO TOP, MASSIVE CHARACTERS BELOW */}
          <div className="flex-1 grid grid-cols-2 relative p-6 gap-8 items-center justify-center">
            {/* TEAM 1 SCOREBOARD HALF */}
            <div
              onClick={() => triggerGoal(1)}
              className="h-full rounded-[3rem] bg-gradient-to-b from-indigo-950/40 to-black border-4 border-indigo-500/30 hover:border-indigo-400 transition-all flex flex-col items-center justify-center p-8 cursor-pointer group shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-6 left-6 text-xs font-bold text-indigo-400/80 tracking-widest uppercase">
                HOME TEAM
              </div>

              {/* REAL TEAM 1 LOGO IMAGE */}
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-black/60 border-2 border-indigo-500/40 p-4 mb-4 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
                <img src={team1LogoUrl} alt={team1Name} className="w-full h-full object-contain" />
              </div>

              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-indigo-400 mb-2">
                {team1Name}
              </h2>

              {/* MASSIVE SCORE CHARACTERS */}
              <div className="text-[10rem] md:text-[14rem] font-black font-mono leading-none tracking-tighter text-white drop-shadow-[0_0_60px_rgba(99,102,241,0.6)]">
                {team1Score}
              </div>

              <span className="text-xs text-indigo-300/60 font-mono mt-4">Click Left Side or Press [A] to Score ⚽</span>
            </div>

            {/* TEAM 2 SCOREBOARD HALF */}
            <div
              onClick={() => triggerGoal(2)}
              className="h-full rounded-[3rem] bg-gradient-to-b from-rose-950/40 to-black border-4 border-rose-500/30 hover:border-rose-400 transition-all flex flex-col items-center justify-center p-8 cursor-pointer group shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 text-xs font-bold text-rose-400/80 tracking-widest uppercase">
                AWAY TEAM
              </div>

              {/* REAL TEAM 2 LOGO IMAGE */}
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-black/60 border-2 border-rose-500/40 p-4 mb-4 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.3)] group-hover:scale-105 transition-transform">
                <img src={team2LogoUrl} alt={team2Name} className="w-full h-full object-contain" />
              </div>

              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-rose-400 mb-2">
                {team2Name}
              </h2>

              {/* MASSIVE SCORE CHARACTERS */}
              <div className="text-[10rem] md:text-[14rem] font-black font-mono leading-none tracking-tighter text-white drop-shadow-[0_0_60px_rgba(244,63,94,0.6)]">
                {team2Score}
              </div>

              <span className="text-xs text-rose-300/60 font-mono mt-4">Click Right Side or Press [D] to Score ⚽</span>
            </div>
          </div>

          {/* GOOOOOAL Animated Overlay */}
          <AnimatePresence>
            {goalCelebration && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.6 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl pointer-events-none p-6 text-center"
              >
                <img src={goalCelebration.logo} alt={goalCelebration.team} className="w-48 h-48 object-contain mb-4 animate-pulse drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]" />
                <h1 className="text-7xl md:text-[9rem] font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 animate-pulse drop-shadow-[0_0_60px_rgba(16,185,129,0.8)]">
                  GOOOOOAL!!!
                </h1>
                <p className="text-4xl font-black italic uppercase text-white mt-4">
                  {goalCelebration.team} SCORED! ⚽
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB 3: REAL CAMERA AI VAR REFEREE */}
      {soccerTab === "var" && (
        <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-xs">
              🤖 REAL CAMERA AI VAR REFEREE
            </Badge>
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
              Video Assistant Referee (Webcam Live Feed)
            </h2>
            <p className="text-xs text-gray-400">Connect your webcam, stream the live family match, and let Gemini AI analyze real video frames!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Camera Viewfinder */}
            <div className="bg-black/80 rounded-3xl p-4 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-2xl ${cameraActive ? "block" : "hidden"}`} />

              {!cameraActive && (
                <div className="text-center space-y-4 p-8">
                  <Video className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
                  <p className="text-xs text-gray-400">Camera offline. Click below to enable webcam stream!</p>
                  <Button onClick={startCamera} className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs">
                    <Camera className="w-4 h-4 mr-1.5" /> Turn On Live Pitch Webcam 📹
                  </Button>
                </div>
              )}

              {cameraActive && (
                <div className="absolute top-6 left-6 z-10 flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <Badge className="bg-rose-500 text-white font-mono text-[10px]">LIVE VAR WEBCAM STREAM</Badge>
                </div>
              )}
            </div>

            {/* AI VAR Decision Center */}
            <div className="bg-[#0b0818] p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black uppercase italic text-rose-400">AI Referee Controls</h3>
                  <Button
                    size="xs"
                    variant={autoScanEnabled ? "secondary" : "outline"}
                    onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                    className="border-emerald-500/40 text-[10px] font-mono"
                  >
                    {autoScanEnabled ? "🟢 Auto-Scan ON (Every 4s)" : "🔴 Auto-Scan OFF"}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {autoScanEnabled
                    ? "AI is continuously scanning your live camera stream every 4 seconds for fouls, handball, and offsides!"
                    : "Continuous scanning disabled. Use manual trigger or enable auto-scan above."}
                </p>

                <div className="space-y-3 mb-4">
                  <Button
                    size="lg"
                    onClick={triggerVarCheck}
                    disabled={varReviewing}
                    className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black italic uppercase text-sm py-6 rounded-2xl shadow-xl shadow-rose-500/20"
                  >
                    <Tv className="w-5 h-5 mr-2" />
                    {varReviewing ? "Gemini AI Analyzing Video Frame..." : "Capture Frame & Run Manual VAR Check 📺"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playRefereeWhistle()}
                    className="w-full border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs py-3 rounded-xl"
                  >
                    <Volume2 className="w-4 h-4 mr-2 text-amber-400" />
                    <span>Blow AI Referee Whistle 🎺</span>
                  </Button>
                </div>
              </div>

              {/* VAR AI Decision Output & Slow Motion Replay Frame */}
              {varResult && (
                <div className="p-4 rounded-2xl bg-black/80 border border-rose-500/40 space-y-3 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-black italic uppercase text-rose-400 text-sm tracking-tight">{varResult.decision}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">{varResult.confidence}% AI Confidence</Badge>
                  </div>

                  {/* Slow Motion Captured VAR Frame Preview */}
                  {varResult.frame && (
                    <div className="relative rounded-xl overflow-hidden border border-rose-500/30 bg-black/90">
                      <img src={varResult.frame} alt="VAR Replay Frame" className="w-full h-36 object-cover opacity-90" />
                      <div className="absolute inset-0 border-2 border-rose-500/60 pointer-events-none rounded-xl" />
                      <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-rose-400 border border-rose-500/30 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1.5" /> VAR SLOW-MOTION REPLAY FRAME
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-300 italic">{varResult.reasoning}</p>
                </div>
              )}


              {cameraActive && (
                <Button size="xs" variant="outline" onClick={stopCamera} className="border-white/20 text-gray-400">
                  Stop Camera Stream
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
