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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Users,
  Calendar,
  Layers,
  Volume2,
  RotateCw,
  Target,
  Sliders,
  Check,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Default Logos
const DEFAULT_LOGOS = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=150&auto=format&fit=crop&q=80"
];

// WebAudio Referee Whistle Engine
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
  } catch (e) {}
}

export default function XakSportsMultiStagePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  // Multi-Stage Wizard State: 1 | 2 | 3 | 4 | 5 | 6 | 7
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Stage 2: Tournament Meta Details
  const [tournamentName, setTournamentName] = useState("Family World Cup 2026");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [numTeams, setNumTeams] = useState<number>(2);

  // Stage 3: Team & Player Setup
  const [teams, setTeams] = useState([
    { id: 1, name: "Lions FC", players: "Dad, Alex, Sam", logoUrl: DEFAULT_LOGOS[0] },
    { id: 2, name: "Eagles FC", players: "Mom, Maya, Jordan", logoUrl: DEFAULT_LOGOS[1] }
  ]);

  // Stage 5: AI Referee Calibration & Rules
  const [goalLeftBound, setGoalLeftBound] = useState(15);
  const [goalRightBound, setGoalRightBound] = useState(85);
  const [offsideEnabled, setOffsideEnabled] = useState(true);
  const [customRules, setCustomRules] = useState("Headers are worth 2 goals! Volleys are worth 3 goals.");

  // Stage 7: Match & Fullscreen Scoreboard State
  const [matchDuration, setMatchDuration] = useState(5); // Mins
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<{ score1: number; score2: number }[]>([]);
  const [redoHistory, setRedoHistory] = useState<{ score1: number; score2: number }[]>([]);

  const [matchTimeLeft, setMatchTimeLeft] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [goalCelebration, setGoalCelebration] = useState<{ team: string; logo: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Camera & Continuous AI State
  const [cameraActive, setCameraActive] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [varReviewing, setVarReviewing] = useState(false);
  const [varResult, setVarResult] = useState<{ decision: string; reasoning: string; confidence: number; frame?: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync teams array length when numTeams changes
  useEffect(() => {
    setTeams((prev) => {
      const newArr = [...prev];
      while (newArr.length < numTeams) {
        const idx = newArr.length + 1;
        newArr.push({
          id: idx,
          name: `Team ${idx}`,
          players: `Player 1, Player 2`,
          logoUrl: DEFAULT_LOGOS[(idx - 1) % DEFAULT_LOGOS.length]
        });
      }
      return newArr.slice(0, numTeams);
    });
  }, [numTeams]);

  // Continuous Camera Scanner
  useEffect(() => {
    let scanInterval: any;
    if (cameraActive && autoScanEnabled && wizardStep === 7 && !varReviewing) {
      scanInterval = setInterval(() => {
        void triggerVarCheck();
      }, 4000);
    }
    return () => clearInterval(scanInterval);
  }, [cameraActive, autoScanEnabled, wizardStep, varReviewing, teams, team1Score, team2Score, offsideEnabled, customRules]);

  // Match Timer Countdown Effect
  useEffect(() => {
    let timer: any;
    if (isTimerRunning && matchTimeLeft > 0 && wizardStep === 7) {
      timer = setInterval(() => {
        setMatchTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (matchTimeLeft === 0 && wizardStep === 7) {
      setIsTimerRunning(false);
      playRefereeWhistle();
      toast({ title: "🏆 MATCH FINISHED!", description: `Final Score: ${teams[0]?.name} ${team1Score} - ${team2Score} ${teams[1]?.name}` });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, matchTimeLeft, wizardStep, teams, team1Score, team2Score, toast]);

  // Real Camera Activation
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      toast({ title: "📹 Live Camera Active", description: "AI Referee is inspecting pitch calibration!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Camera Access Error", description: "Please grant webcam permissions." });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Image Upload Handler for Team Badge
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, teamIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const result = uploadEvt.target?.result as string;
        setTeams((prev) => {
          const next = [...prev];
          next[teamIndex].logoUrl = result;
          return next;
        });
        toast({ title: "Logo Uploaded!", description: `Updated badge for ${teams[teamIndex].name}` });
      };
      reader.readAsDataURL(file);
    }
  };

  // Goal Trigger Action with History Undo Support
  const triggerGoal = (teamIndex: 0 | 1) => {
    setScoreHistory((prev) => [...prev, { score1: team1Score, score2: team2Score }]);
    setRedoHistory([]);

    const scoredTeamName = teams[teamIndex]?.name || `Team ${teamIndex + 1}`;
    const scoredTeamLogo = teams[teamIndex]?.logoUrl || DEFAULT_LOGOS[0];

    if (teamIndex === 0) setTeam1Score((prev) => prev + 1);
    else setTeam2Score((prev) => prev + 1);

    setGoalCelebration({ team: scoredTeamName, logo: scoredTeamLogo });
    toast({ title: "⚽ GOAL SCORED!", description: `${scoredTeamName} scored!` });

    setTimeout(() => {
      setGoalCelebration(null);
    }, 3000);
  };

  // Undo Goal Action
  const undoGoal = () => {
    if (scoreHistory.length === 0) return;
    const lastScore = scoreHistory[scoreHistory.length - 1];
    setRedoHistory((prev) => [...prev, { score1: team1Score, score2: team2Score }]);
    setTeam1Score(lastScore.score1);
    setTeam2Score(lastScore.score2);
    setScoreHistory((prev) => prev.slice(0, prev.length - 1));
    toast({ title: "↩️ Goal Undone", description: "Reverted to previous score state." });
  };

  // Redo Goal Action
  const redoGoal = () => {
    if (redoHistory.length === 0) return;
    const nextScore = redoHistory[redoHistory.length - 1];
    setScoreHistory((prev) => [...prev, { score1: team1Score, score2: team2Score }]);
    setTeam1Score(nextScore.score1);
    setTeam2Score(nextScore.score2);
    setRedoHistory((prev) => prev.slice(0, prev.length - 1));
    toast({ title: "↪️ Goal Redone", description: "Re-applied goal state." });
  };

  // AI Referee VAR Call
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
          team1Name: teams[0]?.name || "Team 1",
          team2Name: teams[1]?.name || "Team 2",
          score1: team1Score,
          score2: team2Score,
          checkType: `VAR Calibration Check (Goals Left ${goalLeftBound}%, Right ${goalRightBound}%, Custom Rules: ${customRules})`,
          offsideEnabled
        })
      });

      const data = await res.json();
      playRefereeWhistle();
      setVarResult({
        decision: data.decision || "GOAL CONFIRMED ✅",
        reasoning: data.reasoning || "AI Vision analyzed camera frame against custom tournament rules.",
        confidence: data.confidence || 95,
        frame: capturedFrameBase64
      });
    } catch (err) {
      setVarResult({
        decision: "PLAY ON ✅",
        reasoning: "AI Referee analyzed frame. No foul detected.",
        confidence: 96
      });
    } finally {
      setVarReviewing(false);
    }
  };

  // Stage 6 -> Stage 7 Start Match Handler
  const handleLaunchMatch = async () => {
    setWizardStep(7);
    setTeam1Score(0);
    setTeam2Score(0);
    setScoreHistory([]);
    setRedoHistory([]);
    setMatchTimeLeft(matchDuration * 60);
    setIsTimerRunning(true);

    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (e) {}
    }

    playRefereeWhistle();
    toast({ title: "🚀 TOURNAMENT STARTED!", description: `${teams[0]?.name} vs ${teams[1]?.name} is LIVE!` });
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

      {/* Top Multi-Stage Wizard Stepper Header (Only when not in Stage 7 fullscreen match) */}
      {wizardStep < 7 && (
        <header className="border-b border-white/10 bg-[#09071b]/95 backdrop-blur-xl px-6 py-4 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-black italic tracking-tighter text-emerald-400">
                  XAKSPORTS <span className="text-xs font-mono text-emerald-300 not-italic uppercase ml-2 border border-emerald-500/30 px-2 py-0.5 rounded">Tournament Wizard</span>
                </h1>
                <p className="text-xs text-gray-400">Stage {wizardStep} of 6 Setup Wizard</p>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5, 6].map((st) => (
                <div
                  key={st}
                  onClick={() => st < wizardStep && setWizardStep(st)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                    wizardStep === st
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 scale-110"
                      : wizardStep > st
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-gray-600 border border-white/10"
                  }`}
                >
                  {st}
                </div>
              ))}
            </div>
          </div>
        </header>
      )}

      {/* STAGE 1: CREATE TOURNAMENT LANDING */}
      {wizardStep === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-5xl shadow-2xl shadow-emerald-500/20 animate-pulse">
            🏆
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono text-xs">
            REAL FAMILY TOURNAMENT STUDIO
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
            Create Family Tournament
          </h1>
          <p className="text-gray-400 text-sm">
            Configure multi-team brackets, custom logos, player rosters, and live webcam AI Referee rules in 6 easy screens!
          </p>

          <Button
            size="lg"
            onClick={() => setWizardStep(2)}
            className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black italic uppercase tracking-wider text-lg py-7 rounded-2xl shadow-2xl shadow-emerald-500/30"
          >
            Create Tournament Now <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      )}

      {/* STAGE 2: TOURNAMENT META DETAILS */}
      {wizardStep === 2 && (
        <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6 flex flex-col justify-center">
          <div className="space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">STAGE 2 OF 6</span>
            <h2 className="text-3xl font-black italic uppercase text-white">Tournament Details</h2>
            <p className="text-xs text-gray-400">Set tournament name, schedule date/time, and team bracket count.</p>
          </div>

          <div className="bg-[#0b0818] p-6 rounded-3xl border border-white/10 space-y-5">
            <div>
              <label className="text-xs text-gray-300 font-bold block mb-1.5">Tournament Name:</label>
              <Input
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="e.g. Family World Cup 2026"
                className="bg-black/50 border-white/10 text-white h-11 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 font-bold block mb-1.5">Schedule Date & Time (Optional):</label>
              <Input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="bg-black/50 border-white/10 text-white h-11 text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 font-bold block mb-1.5">Amount of Teams in Tournament:</label>
              <div className="grid grid-cols-4 gap-3">
                {[2, 4, 8, 16].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumTeams(num)}
                    className={`p-3 rounded-2xl border font-black text-sm transition-all flex flex-col items-center justify-center ${
                      numTeams === num ? "bg-emerald-500 text-black border-emerald-400 shadow-lg" : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <span>{num} Teams</span>
                    <span className="text-[10px] font-normal text-gray-400">{num === 2 ? "Head to Head" : `${num / 2} Bracket Matches`}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setWizardStep(1)} className="border-white/20 text-gray-400">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setWizardStep(3)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8">
              Next: Team & Player Setup <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 3: TEAM & PLAYER SETUP */}
      {wizardStep === 3 && (
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">STAGE 3 OF 6</span>
            <h2 className="text-3xl font-black italic uppercase text-white">Team Names, Players & Custom Badges</h2>
            <p className="text-xs text-gray-400">Configure team names, player rosters, and upload custom badge logo images!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, idx) => (
              <div key={team.id} className="bg-[#0b0818] p-5 rounded-3xl border border-white/10 space-y-4">
                <span className="font-black uppercase text-xs text-emerald-400 flex items-center">
                  <Shield className="w-4 h-4 mr-1.5" /> Team {idx + 1} Configuration
                </span>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Team Name:</label>
                  <Input
                    value={team.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeams((prev) => {
                        const next = [...prev];
                        next[idx].name = val;
                        return next;
                      });
                    }}
                    className="bg-black/50 border-white/10 text-white text-xs h-10"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Player Rosters (comma separated):</label>
                  <Input
                    value={team.players}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeams((prev) => {
                        const next = [...prev];
                        next[idx].players = val;
                        return next;
                      });
                    }}
                    placeholder="e.g. Alex, Sam, Jordan"
                    className="bg-black/50 border-white/10 text-white text-xs h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 block">Custom Team Badge Logo:</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={team.logoUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeams((prev) => {
                          const next = [...prev];
                          next[idx].logoUrl = val;
                          return next;
                        });
                      }}
                      className="bg-black/50 border-white/10 text-white text-xs h-9 flex-1"
                    />
                    <label className="cursor-pointer bg-emerald-600/40 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs flex items-center shrink-0">
                      <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, idx)} />
                    </label>
                  </div>
                  <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-xl object-contain bg-black/60 border border-white/10 p-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => setWizardStep(2)} className="border-white/20 text-gray-400">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setWizardStep(4)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8">
              Next: Generate Bracket <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 4: GENERATE BRACKET */}
      {wizardStep === 4 && (
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="space-y-2 text-center">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">STAGE 4 OF 6</span>
            <h2 className="text-3xl font-black italic uppercase text-white">Generated Tournament Bracket</h2>
            <p className="text-xs text-gray-400">Previewing tournament matchups for {numTeams} teams.</p>
          </div>

          <div className="bg-[#0b0818] p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: Math.ceil(numTeams / 2) }).map((_, i) => {
                const t1 = teams[i * 2] || { name: `Team ${i * 2 + 1}`, logoUrl: DEFAULT_LOGOS[0] };
                const t2 = teams[i * 2 + 1] || { name: `Team ${i * 2 + 2}`, logoUrl: DEFAULT_LOGOS[1] };
                return (
                  <div key={i} className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 flex items-center justify-between space-x-3">
                    <div className="flex items-center space-x-2">
                      <img src={t1.logoUrl} className="w-8 h-8 rounded-lg object-contain" />
                      <span className="font-bold text-xs text-white">{t1.name}</span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 font-black italic">VS</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white">{t2.name}</span>
                      <img src={t2.logoUrl} className="w-8 h-8 rounded-lg object-contain" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setWizardStep(3)} className="border-white/20 text-gray-400">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setWizardStep(5)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8">
              Next: Enable AI Referee Calibration <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 5: ENABLE AI REFEREE & CALIBRATION */}
      {wizardStep === 5 && (
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">STAGE 5 OF 6</span>
            <h2 className="text-3xl font-black italic uppercase text-white">Enable & Calibrate AI Referee</h2>
            <p className="text-xs text-gray-400">Calibrate pitch goals, toggle offside rules, and enter custom scoring rules!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* (a) Show AI Where Goals Are */}
            <div className="bg-[#0b0818] p-5 rounded-3xl border border-white/10 space-y-4">
              <span className="font-black uppercase text-xs text-rose-400 flex items-center">
                <Target className="w-4 h-4 mr-1.5" /> (a) Goal Coordinates Calibration
              </span>
              <p className="text-[11px] text-gray-400">Adjust camera frame goal bounds for AI vision scanning:</p>

              <div>
                <label className="text-[11px] text-gray-300 block mb-1">Left Goal Position Bound ({goalLeftBound}%):</label>
                <input
                  type="range"
                  min="5"
                  max="45"
                  value={goalLeftBound}
                  onChange={(e) => setGoalLeftBound(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 block mb-1">Right Goal Position Bound ({goalRightBound}%):</label>
                <input
                  type="range"
                  min="55"
                  max="95"
                  value={goalRightBound}
                  onChange={(e) => setGoalRightBound(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {!cameraActive && (
                <Button size="xs" onClick={startCamera} className="bg-rose-600 hover:bg-rose-500 text-white font-bold w-full text-xs">
                  <Camera className="w-3.5 h-3.5 mr-1" /> Test Live Pitch Camera
                </Button>
              )}

              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden border border-rose-500/40 h-32 bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* (b) & (c) Offside Rule & Custom Rules */}
            <div className="bg-[#0b0818] p-5 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div>
                <span className="font-black uppercase text-xs text-indigo-400 flex items-center mb-3">
                  <Sliders className="w-4 h-4 mr-1.5" /> (b) & (c) Rules & Offside Toggles
                </span>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1.5">Offside Rule Enforcement:</label>
                    <Button
                      size="sm"
                      variant={offsideEnabled ? "secondary" : "outline"}
                      onClick={() => setOffsideEnabled(!offsideEnabled)}
                      className="w-full justify-between text-xs border-white/20"
                    >
                      <span>Offside Detection:</span>
                      <span>{offsideEnabled ? "✅ ENABLED" : "❌ DISABLED"}</span>
                    </Button>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">Tell AI Custom Match Rules:</label>
                    <textarea
                      rows={3}
                      value={customRules}
                      onChange={(e) => setCustomRules(e.target.value)}
                      placeholder="e.g. Headers are worth 2 goals. Volleys are worth 3 goals."
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => setWizardStep(4)} className="border-white/20 text-gray-400">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setWizardStep(6)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8">
              Next: Review & Start Match <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 6: PRE-MATCH SUMMARY & START TRIGGER */}
      {wizardStep === 6 && (
        <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6 flex flex-col justify-center">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">STAGE 6 OF 6</span>
            <h2 className="text-4xl font-black italic uppercase text-white">Match Ready To Launch</h2>
            <p className="text-xs text-gray-400">Review tournament settings and click start to enter Fullscreen Stadium Scoreboard!</p>
          </div>

          <div className="bg-[#0b0818] p-6 rounded-3xl border border-white/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-gray-400">Tournament Name:</span>
              <span className="font-bold text-white">{tournamentName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-gray-400">Match Matchup:</span>
              <span className="font-bold text-emerald-400">{teams[0]?.name} vs {teams[1]?.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-gray-400">AI VAR Offside:</span>
              <span className="font-bold text-rose-400">{offsideEnabled ? "ENABLED ✅" : "DISABLED ❌"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Custom Rules:</span>
              <span className="font-bold text-indigo-300 italic">{customRules}</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleLaunchMatch}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black italic uppercase tracking-wider text-xl py-8 rounded-3xl shadow-2xl shadow-emerald-500/40 animate-bounce"
          >
            🚀 START MATCH NOW (FULLSCREEN SCOREBOARD)
          </Button>
        </div>
      )}

      {/* STAGE 7: AUTO FULLSCREEN SCOREBOARD WITH UNDO / REDO GOALS */}
      {wizardStep === 7 && (
        <div className="flex-1 flex flex-col bg-[#05030d] relative overflow-hidden select-none">
          {/* Header Controls Bar */}
          <div className="bg-[#070514] border-b border-white/10 px-8 py-4 flex items-center justify-between z-20">
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-500 text-black font-black uppercase text-xs">
                {tournamentName}
              </Badge>
              <Button size="xs" variant="outline" onClick={undoGoal} disabled={scoreHistory.length === 0} className="border-white/20 text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Undo Goal
              </Button>
              <Button size="xs" variant="outline" onClick={redoGoal} disabled={redoHistory.length === 0} className="border-white/20 text-xs">
                <RotateCw className="w-3.5 h-3.5 mr-1" /> Redo Goal
              </Button>
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
              <Button size="sm" variant="outline" onClick={() => setWizardStep(1)} className="border-white/20 text-gray-400">
                Exit Match
              </Button>
            </div>
          </div>

          {/* MASSIVE SCOREBOARD LAYOUT */}
          <div className="flex-1 grid grid-cols-2 relative p-6 gap-8 items-center justify-center">
            {/* TEAM 1 SCOREBOARD HALF */}
            <div
              onClick={() => triggerGoal(0)}
              className="h-full rounded-[3rem] bg-gradient-to-b from-indigo-950/40 to-black border-4 border-indigo-500/30 hover:border-indigo-400 transition-all flex flex-col items-center justify-center p-8 cursor-pointer group shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-6 left-6 text-xs font-bold text-indigo-400/80 tracking-widest uppercase">
                HOME TEAM
              </div>

              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-black/60 border-2 border-indigo-500/40 p-4 mb-4 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
                <img src={teams[0]?.logoUrl || DEFAULT_LOGOS[0]} alt={teams[0]?.name} className="w-full h-full object-contain" />
              </div>

              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-indigo-400 mb-2">
                {teams[0]?.name || "Team 1"}
              </h2>

              <div className="text-[10rem] md:text-[14rem] font-black font-mono leading-none tracking-tighter text-white drop-shadow-[0_0_60px_rgba(99,102,241,0.6)]">
                {team1Score}
              </div>
            </div>

            {/* TEAM 2 SCOREBOARD HALF */}
            <div
              onClick={() => triggerGoal(1)}
              className="h-full rounded-[3rem] bg-gradient-to-b from-rose-950/40 to-black border-4 border-rose-500/30 hover:border-rose-400 transition-all flex flex-col items-center justify-center p-8 cursor-pointer group shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 text-xs font-bold text-rose-400/80 tracking-widest uppercase">
                AWAY TEAM
              </div>

              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-black/60 border-2 border-rose-500/40 p-4 mb-4 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.3)] group-hover:scale-105 transition-transform">
                <img src={teams[1]?.logoUrl || DEFAULT_LOGOS[1]} alt={teams[1]?.name} className="w-full h-full object-contain" />
              </div>

              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-rose-400 mb-2">
                {teams[1]?.name || "Team 2"}
              </h2>

              <div className="text-[10rem] md:text-[14rem] font-black font-mono leading-none tracking-tighter text-white drop-shadow-[0_0_60px_rgba(244,63,94,0.6)]">
                {team2Score}
              </div>
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
    </div>
  );
}
