"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Volume2,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  ChevronRight,
  Settings,
  Users,
  Award,
  Zap,
  Clock,
  Eye,
  Plus,
  HelpCircle,
  Activity,
  Dices,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Preset Team Logos & Badges
const TEAM_LOGOS = [
  { id: "lion", name: "Lions FC", emoji: "🦁", color: "from-amber-500 to-red-600" },
  { id: "eagle", name: "Eagles FC", emoji: "🦅", color: "from-blue-600 to-cyan-500" },
  { id: "dragon", name: "Dragons United", emoji: "🐉", color: "from-emerald-500 to-teal-700" },
  { id: "panther", name: "Panthers City", emoji: "🐆", color: "from-purple-600 to-indigo-600" },
  { id: "shark", name: "Sharks Athletic", emoji: "🦈", color: "from-sky-500 to-blue-700" },
  { id: "phoenix", name: "Phoenix Real", emoji: "🔥", color: "from-orange-500 to-rose-600" },
];

export default function XakSportsPage() {
  const { toast } = useToast();

  // Sports Category Selection
  const [activeSport, setActiveSport] = useState<"soccer" | "basketball" | "tennis" | "volleyball" | "golf" | "all">("soccer");

  // Soccer Sub-Tabs
  const [soccerTab, setSoccerTab] = useState<"match" | "organize" | "watch" | "var">("organize");

  // Tournament Setup State
  const [tournamentName, setTournamentName] = useState("Family World Cup 2026");
  const [team1Name, setTeam1Name] = useState("Lions FC");
  const [team1Logo, setTeam1Logo] = useState(TEAM_LOGOS[0]);
  const [team2Name, setTeam2Name] = useState("Eagles FC");
  const [team2Logo, setTeam2Logo] = useState(TEAM_LOGOS[1]);
  const [matchDuration, setMatchDuration] = useState(5); // Minutes

  // Match State
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [matchTimeLeft, setMatchTimeLeft] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [goalCelebration, setGoalCelebration] = useState<{ team: string; logo: string; color: string } | null>(null);

  // AI Referee & VAR Settings
  const [varEnabled, setVarEnabled] = useState(true);
  const [offsideEnabled, setOffsideEnabled] = useState(true);
  const [varReviewing, setVarReviewing] = useState(false);
  const [cardsLog, setCardsLog] = useState<{ team: string; player: string; type: "yellow" | "red" }[]>([]);

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

  // Start Tournament Action
  const handleStartTournament = () => {
    setTeam1Score(0);
    setTeam2Score(0);
    setMatchTimeLeft(matchDuration * 60);
    setIsTimerRunning(true);
    setSoccerTab("match");
    toast({ title: "🏆 Tournament Started!", description: `${team1Name} vs ${team2Name} is now LIVE!` });
  };

  // Goal Trigger Action
  const triggerGoal = (team: 1 | 2) => {
    const scoredTeamName = team === 1 ? team1Name : team2Name;
    const scoredTeamLogo = team === 1 ? team1Logo.emoji : team2Logo.emoji;
    const scoredTeamColor = team === 1 ? team1Logo.color : team2Logo.color;

    if (team === 1) {
      setTeam1Score((prev) => prev + 1);
    } else {
      setTeam2Score((prev) => prev + 1);
    }

    setGoalCelebration({ team: scoredTeamName, logo: scoredTeamLogo, color: scoredTeamColor });
    toast({ title: "⚽ GOAL SCORED!", description: `${scoredTeamName} scored!` });

    setTimeout(() => {
      setGoalCelebration(null);
    }, 2800);
  };

  // Trigger VAR Check
  const triggerVarCheck = () => {
    setVarReviewing(true);
    toast({ title: "📺 VAR REVIEW IN PROGRESS...", description: "AI Referee inspecting replay footage..." });
    setTimeout(() => {
      setVarReviewing(false);
      const decision = Math.random() > 0.5 ? "GOAL CONFIRMED ✅" : "NO GOAL - OFFSIDE DETECTED ❌";
      toast({ title: `VAR Decision: ${decision}` });
    }, 3000);
  };

  // Issue Card Action
  const issueCard = (team: string, type: "yellow" | "red") => {
    const playerNum = Math.floor(Math.random() * 11) + 1;
    const player = `Player #${playerNum}`;
    setCardsLog((prev) => [{ team, player, type }, ...prev]);
    toast({
      title: `${type === "yellow" ? "🟨 Yellow Card" : "🟥 RED CARD"} Issued!`,
      description: `${player} (${team}) committed a foul!`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 arcade-grid opacity-10 pointer-events-none" />

      {/* Main Top Header */}
      <header className="border-b border-white/10 bg-[#09071b]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-emerald-400">
              XAKSPORTS <span className="text-xs font-mono text-emerald-500/70 not-italic uppercase ml-1 border border-emerald-500/30 px-2 py-0.5 rounded">Family Tournament Studio</span>
            </h1>
            <p className="text-xs text-gray-400">Organize, referee, and score live family sports tournaments!</p>
          </div>
        </div>

        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-3 py-1 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Live AI Referee Ready
        </Badge>
      </header>

      {/* Main Sports Category Navigation Tabs */}
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

      {/* Non-Soccer Placeholder Views */}
      {activeSport !== "soccer" && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-2xl">
            {activeSport === "basketball" ? "🏀" : activeSport === "tennis" ? "🎾" : activeSport === "volleyball" ? "🏐" : activeSport === "golf" ? "⛳" : "🏆"}
          </div>
          <h2 className="text-3xl font-black italic uppercase text-white">
            {activeSport.toUpperCase()} TOURNAMENT HUB
          </h2>
          <p className="text-gray-400 text-sm max-w-md">
            Tournament brackets, live scoreboards, and AI referee controls for {activeSport} are ready to launch! Switch to Soccer or start setup below.
          </p>
          <Button onClick={() => setActiveSport("soccer")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6">
            Switch to Soccer Tournament Studio ⚽
          </Button>
        </div>
      )}

      {/* Soccer Sports Hub */}
      {activeSport === "soccer" && (
        <div className="flex-1 flex flex-col">
          {/* Soccer Sub-Tabs */}
          <div className="bg-[#080616] border-b border-white/10 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoccerTab("organize")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  soccerTab === "organize" ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Organize Tournament</span>
              </button>
              <button
                onClick={() => setSoccerTab("match")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  soccerTab === "match" ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Live Match Arena</span>
              </button>
              <button
                onClick={() => setSoccerTab("var")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  soccerTab === "var" ? "bg-rose-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>AI Referee & VAR Studio</span>
              </button>
              <button
                onClick={() => setSoccerTab("watch")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  soccerTab === "watch" ? "bg-purple-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Watch Feed</span>
              </button>
            </div>
          </div>

          {/* TAB 1: ORGANIZE TOURNAMENT */}
          {soccerTab === "organize" && (
            <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-mono text-xs">
                  🏆 TOURNAMENT WIZARD
                </Badge>
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
                  Configure Family Soccer Tournament
                </h2>
                <p className="text-xs text-gray-400">Set team names, choose logos, set match durations, and enable AI VAR rules!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 Config */}
                <div className="bg-[#0b0818] p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <span className="font-black uppercase text-indigo-400 text-xs flex items-center">
                    <Shield className="w-4 h-4 mr-1.5" /> Team 1 Configuration (Home)
                  </span>
                  <Input
                    placeholder="Team 1 Name (e.g. Lions FC)"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    className="bg-black/40 border-indigo-500/20 text-white text-xs h-10"
                  />
                  <div className="space-y-2">
                    <span className="text-[11px] text-gray-400 font-medium">Select Team Logo:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {TEAM_LOGOS.map((logo) => (
                        <button
                          key={logo.id}
                          onClick={() => setTeam1Logo(logo)}
                          className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                            team1Logo.id === logo.id
                              ? "bg-indigo-600/30 border-indigo-400 text-white"
                              : "bg-black/30 border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-xl">{logo.emoji}</span>
                          <span className="text-[10px] font-bold truncate w-full">{logo.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team 2 Config */}
                <div className="bg-[#0b0818] p-5 rounded-2xl border border-rose-500/30 space-y-4">
                  <span className="font-black uppercase text-rose-400 text-xs flex items-center">
                    <Shield className="w-4 h-4 mr-1.5" /> Team 2 Configuration (Away)
                  </span>
                  <Input
                    placeholder="Team 2 Name (e.g. Eagles FC)"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    className="bg-black/40 border-rose-500/20 text-white text-xs h-10"
                  />
                  <div className="space-y-2">
                    <span className="text-[11px] text-gray-400 font-medium">Select Team Logo:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {TEAM_LOGOS.map((logo) => (
                        <button
                          key={logo.id}
                          onClick={() => setTeam2Logo(logo)}
                          className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                            team2Logo.id === logo.id
                              ? "bg-rose-600/30 border-rose-400 text-white"
                              : "bg-black/30 border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-xl">{logo.emoji}</span>
                          <span className="text-[10px] font-bold truncate w-full">{logo.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Settings & AI VAR Config */}
              <div className="bg-[#080616] p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400 uppercase flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" /> Match Duration & AI Referee Rules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1.5">Match Duration (Minutes):</span>
                    <div className="flex items-center space-x-2">
                      {[3, 5, 10, 15].map((mins) => (
                        <Button
                          key={mins}
                          size="xs"
                          variant={matchDuration === mins ? "secondary" : "outline"}
                          onClick={() => setMatchDuration(mins)}
                          className="h-8 text-xs border-white/20"
                        >
                          {mins}m
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-1.5">VAR Replays:</span>
                    <Button
                      size="xs"
                      variant={varEnabled ? "secondary" : "outline"}
                      onClick={() => setVarEnabled(!varEnabled)}
                      className="h-8 text-xs border-white/20 w-full"
                    >
                      {varEnabled ? "✅ VAR Enabled" : "❌ VAR Disabled"}
                    </Button>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-1.5">Offside Rule:</span>
                    <Button
                      size="xs"
                      variant={offsideEnabled ? "secondary" : "outline"}
                      onClick={() => setOffsideEnabled(!offsideEnabled)}
                      className="h-8 text-xs border-white/20 w-full"
                    >
                      {offsideEnabled ? "⚽ Offside ON" : "🚫 Offside OFF"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Launch Tournament Trigger */}
              <Button
                size="lg"
                onClick={handleStartTournament}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black italic uppercase tracking-wider text-base py-6 rounded-2xl shadow-2xl shadow-emerald-500/30"
              >
                <Trophy className="w-6 h-6 mr-2" /> Start Live Tournament Match Now!
              </Button>
            </div>
          )}

          {/* TAB 2: LIVE MATCH ARENA & CLICK TO SCORE */}
          {soccerTab === "match" && (
            <div className="flex-1 flex flex-col relative overflow-hidden select-none">
              {/* Top Scoreboard Header */}
              <div className="bg-[#070514]/90 border-b border-white/10 px-6 py-4 flex items-center justify-between z-20 backdrop-blur-md">
                {/* Team 1 Score Header */}
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{team1Logo.emoji}</div>
                  <div>
                    <span className="font-black italic text-lg text-emerald-400 uppercase block">{team1Name}</span>
                    <span className="text-xs font-bold text-gray-400">HOME TEAM</span>
                  </div>
                  <div className="text-5xl font-black text-white font-mono px-4 py-1 rounded-2xl bg-emerald-950/60 border border-emerald-500/40">
                    {team1Score}
                  </div>
                </div>

                {/* Center Timer & Match Controls */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-3xl font-black font-mono text-amber-400 bg-amber-950/60 px-6 py-1.5 rounded-2xl border border-amber-500/40 tracking-wider shadow-lg">
                    {formatTime(matchTimeLeft)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="xs"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={isTimerRunning ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}
                    >
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                      {isTimerRunning ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setTeam1Score(0);
                        setTeam2Score(0);
                        setMatchTimeLeft(matchDuration * 60);
                        setIsTimerRunning(false);
                      }}
                      className="border-white/20 text-gray-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                    </Button>
                  </div>
                </div>

                {/* Team 2 Score Header */}
                <div className="flex items-center space-x-3">
                  <div className="text-5xl font-black text-white font-mono px-4 py-1 rounded-2xl bg-rose-950/60 border border-rose-500/40">
                    {team2Score}
                  </div>
                  <div className="text-right">
                    <span className="font-black italic text-lg text-rose-400 uppercase block">{team2Name}</span>
                    <span className="text-xs font-bold text-gray-400">AWAY TEAM</span>
                  </div>
                  <div className="text-4xl">{team2Logo.emoji}</div>
                </div>
              </div>

              {/* Click-to-Score Pitch Arena Grid */}
              <div className="flex-1 grid grid-cols-2 relative bg-gradient-to-b from-emerald-950/40 to-[#05030d] p-4 gap-4">
                {/* Team 1 Side Pitch Click Area */}
                <div
                  onClick={() => triggerGoal(1)}
                  className="rounded-3xl border-2 border-dashed border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer group relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-4 left-4 text-xs font-bold text-emerald-400/60 uppercase">
                    CLICK THIS SIDE TO SCORE FOR {team1Name.toUpperCase()}
                  </div>
                  <div className="text-8xl mb-4 group-hover:scale-110 transition-transform">{team1Logo.emoji}</div>
                  <span className="text-2xl font-black italic uppercase tracking-tighter text-emerald-400 group-hover:text-white transition-colors">
                    {team1Name}
                  </span>
                  <span className="text-xs text-gray-400 mt-2 font-mono">Click to register Team 1 Goal ⚽</span>
                </div>

                {/* Team 2 Side Pitch Click Area */}
                <div
                  onClick={() => triggerGoal(2)}
                  className="rounded-3xl border-2 border-dashed border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer group relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-4 right-4 text-xs font-bold text-rose-400/60 uppercase">
                    CLICK THIS SIDE TO SCORE FOR {team2Name.toUpperCase()}
                  </div>
                  <div className="text-8xl mb-4 group-hover:scale-110 transition-transform">{team2Logo.emoji}</div>
                  <span className="text-2xl font-black italic uppercase tracking-tighter text-rose-400 group-hover:text-white transition-colors">
                    {team2Name}
                  </span>
                  <span className="text-xs text-gray-400 mt-2 font-mono">Click to register Team 2 Goal ⚽</span>
                </div>
              </div>

              {/* Animated GOOOOOAL Screen Overlay */}
              <AnimatePresence>
                {goalCelebration && (
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.6 }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl pointer-events-none p-6 text-center"
                  >
                    <div className="text-9xl mb-4 animate-bounce">{goalCelebration.logo}</div>
                    <h1 className="text-7xl md:text-[9rem] font-black italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(16,185,129,0.8)] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 animate-pulse">
                      GOOOOOAL!!!
                    </h1>
                    <p className="text-3xl font-black italic uppercase text-white mt-4">
                      {goalCelebration.team} SCORED A MAGNIFICENT GOAL! ⚽
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 3: AI REFEREE & VAR STUDIO */}
          {soccerTab === "var" && (
            <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-xs">
                  🤖 AI REFEREE & VAR DECISION CENTER
                </Badge>
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
                  Video Assistant Referee (VAR)
                </h2>
                <p className="text-xs text-gray-400">Trigger instant VAR checks, inspect fouls, issue cards, and configure rules!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  size="lg"
                  onClick={triggerVarCheck}
                  disabled={varReviewing}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-16 rounded-2xl flex flex-col items-center justify-center text-xs"
                >
                  <Tv className="w-5 h-5 mb-1" />
                  <span>{varReviewing ? "Reviewing VAR..." : "Trigger VAR Video Check 📺"}</span>
                </Button>

                <Button
                  size="lg"
                  onClick={() => issueCard(team1Name, "yellow")}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold h-16 rounded-2xl flex flex-col items-center justify-center text-xs"
                >
                  <span>🟨 Issue Yellow Card ({team1Name})</span>
                </Button>

                <Button
                  size="lg"
                  onClick={() => issueCard(team2Name, "red")}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold h-16 rounded-2xl flex flex-col items-center justify-center text-xs"
                >
                  <span>🟥 Issue Red Card ({team2Name})</span>
                </Button>
              </div>

              {/* Cards & Foul History */}
              <div className="bg-[#0b0818] p-5 rounded-2xl border border-white/10 space-y-3">
                <span className="font-bold text-xs text-gray-300 block">Foul & Disciplinary Log ({cardsLog.length}):</span>
                {cardsLog.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No cards or fouls issued yet in this match.</p>
                ) : (
                  <div className="space-y-2">
                    {cardsLog.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                        <span className="font-semibold text-gray-200">{log.player} ({log.team})</span>
                        <span className={`font-mono text-[11px] font-bold ${log.type === "yellow" ? "text-amber-400" : "text-rose-400"}`}>
                          {log.type === "yellow" ? "🟨 Yellow Card" : "🟥 RED CARD"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WATCH FEED */}
          {soccerTab === "watch" && (
            <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 font-mono text-xs">
                  📺 LIVE MATCH HIGHLIGHTS FEED
                </Badge>
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
                  Watch Replays & Tournament Feed
                </h2>
              </div>

              <div className="bg-black/60 rounded-3xl p-8 border border-white/10 text-center space-y-4 min-h-[300px] flex flex-col items-center justify-center">
                <Tv className="w-16 h-16 text-purple-400 animate-pulse" />
                <h3 className="text-xl font-bold text-white">Family Tournament Broadcast Feed Active</h3>
                <p className="text-xs text-gray-400 max-w-md">
                  Live highlight clips and replay recordings from {tournamentName} will be archived here!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
