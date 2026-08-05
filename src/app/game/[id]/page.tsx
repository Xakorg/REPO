"use client";
 
import { useParams, useRouter } from "next/navigation";
import { GAMES_DB } from "@/lib/games-db";
import { Loader, ArrowLeft, Trophy } from "lucide-react";
import { useState, useEffect, Suspense, lazy } from "react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc, increment } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
 
// --- Bespoke Game Engines ---
import dynamic from "next/dynamic";
 
const GAME_MAP: Record<string, React.ComponentType<any>> = {
  kinesis: dynamic(() => import("@/components/game/kinesis")),
  zenith: dynamic(() => import("@/components/game/zenith")),
  sonar: dynamic(() => import("@/components/game/sonar")),
  helix: dynamic(() => import("@/components/game/helix")),
  chrono: dynamic(() => import("@/components/game/chrono")),
  spectra: dynamic(() => import("@/components/game/spectra")),
  glitch: dynamic(() => import("@/components/game/glitch")),
  drift: dynamic(() => import("@/components/game/drift")),
  aether: dynamic(() => import("@/components/game/aether")),
  vortex: dynamic(() => import("@/components/game/vortex")),
  flux: dynamic(() => import("@/components/game/flux")),
  trench: dynamic(() => import("@/components/game/trench")),
  nexus: dynamic(() => import("@/components/game/nexus")),
  aura: dynamic(() => import("@/components/game/aura")),
  cinder: dynamic(() => import("@/components/game/cinder")),
  pulse: dynamic(() => import("@/components/game/pulse")),
  aegis: dynamic(() => import("@/components/game/aegis")),
  strata: dynamic(() => import("@/components/game/strata")),
  vault: dynamic(() => import("@/components/game/vault")),
  solace: dynamic(() => import("@/components/game/solace")),
  forge: dynamic(() => import("@/components/game/forge")),
  cipher: dynamic(() => import("@/components/game/cipher")),
  circuit: dynamic(() => import("@/components/game/circuit")),
  bastion: dynamic(() => import("@/components/game/bastion")),
  cyber_helix_quantum_siege: dynamic(() => import("@/components/game/cyber-helix-quantum-siege")),
  "cyber-helix-quantum-siege": dynamic(() => import("@/components/game/cyber-helix-quantum-siege")),
  apex: dynamic(() => import("@/components/game/apex")),
  rift: dynamic(() => import("@/components/game/rift")),
  sovereign: dynamic(() => import("@/components/game/sovereign")),
  stasis: dynamic(() => import("@/components/game/stasis")),
  vanguard: dynamic(() => import("@/components/game/vanguard")),
  gridiron: dynamic(() => import("@/components/game/gridiron")),
  aetheris_astral_eclipse: dynamic(() => import("@/components/game/aetheris-astral-eclipse")),
  "aetheris-astral-eclipse": dynamic(() => import("@/components/game/aetheris-astral-eclipse")),
  quantum_horizon_overdrive: dynamic(() => import("@/components/game/quantum-horizon-overdrive")),
  "quantum-horizon-overdrive": dynamic(() => import("@/components/game/quantum-horizon-overdrive")),
  hyper_aether_overdrive: dynamic(() => import("@/components/game/hyper-aether-overdrive")),
  "hyper-aether-overdrive": dynamic(() => import("@/components/game/hyper-aether-overdrive")),
  neon_vanguard_overdrive: dynamic(() => import("@/components/game/neon-vanguard-overdrive")),
  "neon-vanguard-overdrive": dynamic(() => import("@/components/game/neon-vanguard-overdrive")),
  cyber_phantom_odyssey: dynamic(() => import("@/components/game/cyber-phantom-odyssey")),
  "cyber-phantom-odyssey": dynamic(() => import("@/components/game/cyber-phantom-odyssey")),
  hyperion_void_surge: dynamic(() => import("@/components/game/hyperion-void-surge")),
  "hyperion-void-surge": dynamic(() => import("@/components/game/hyperion-void-surge")),
  solaris_valkyrie_odyssey: dynamic(() => import("@/components/game/solaris-valkyrie-odyssey")),
  "solaris-valkyrie-odyssey": dynamic(() => import("@/components/game/solaris-valkyrie-odyssey")),
  apex_valkyrie_overdrive: dynamic(() => import("@/components/game/apex-valkyrie-overdrive")),
  "apex-valkyrie-overdrive": dynamic(() => import("@/components/game/apex-valkyrie-overdrive")),
  astral_pulse_overdrive: dynamic(() => import("@/components/game/astral-pulse-overdrive")),
  "astral-pulse-overdrive": dynamic(() => import("@/components/game/astral-pulse-overdrive")),
  nebula_nexus_overdrive: dynamic(() => import("@/components/game/nebula-nexus-overdrive")),
  "nebula-nexus-overdrive": dynamic(() => import("@/components/game/nebula-nexus-overdrive")),
  shadow_shinobi_platformer: dynamic(() => import("@/components/game/shadow-shinobi-platformer")),
  "shadow-shinobi-platformer": dynamic(() => import("@/components/game/shadow-shinobi-platformer")),
  frost_bound_odyssey: dynamic(() => import("@/components/game/frost-bound-odyssey")),
  "frost-bound-odyssey": dynamic(() => import("@/components/game/frost-bound-odyssey")),
  pyro_core_escape: dynamic(() => import("@/components/game/pyro-core-escape")),
  "pyro-core-escape": dynamic(() => import("@/components/game/pyro-core-escape")),
  zero_g_orbital_runner: dynamic(() => import("@/components/game/zero-g-orbital-runner")),
  "zero-g-orbital-runner": dynamic(() => import("@/components/game/zero-g-orbital-runner")),
  steampunk_clockwork_climb: dynamic(() => import("@/components/game/steampunk-clockwork-climb")),
  "steampunk-clockwork-climb": dynamic(() => import("@/components/game/steampunk-clockwork-climb")),
  chronoshift_overdrive: dynamic(() => import("@/components/game/chronoshift-overdrive")),
  "chronoshift-overdrive": dynamic(() => import("@/components/game/chronoshift-overdrive")),
  nexus_arena_online: dynamic(() => import("@/components/game/nexus-arena-online")),
  "nexus-arena-online": dynamic(() => import("@/components/game/nexus-arena-online")),
  aether_mech_overdrive: dynamic(() => import("@/components/game/aether-mech-overdrive")),
  "aether-mech-overdrive": dynamic(() => import("@/components/game/aether-mech-overdrive")),
  plasma_strike_cyber_overdrive: dynamic(() => import("@/components/game/plasma-strike-cyber-overdrive")),
  "plasma-strike-cyber-overdrive": dynamic(() => import("@/components/game/plasma-strike-cyber-overdrive")),
  quantum_helix_cyber_odyssey: dynamic(() => import("@/components/game/quantum-helix-cyber-odyssey")),
  "quantum-helix-cyber-odyssey": dynamic(() => import("@/components/game/quantum-helix-cyber-odyssey")),
  neon_ascent: dynamic(() => import("@/components/game/neon-ascent")),
  "neon-ascent": dynamic(() => import("@/components/game/neon-ascent")),
  quantum_tactics: dynamic(() => import("@/components/game/quantum-tactics")),
  "quantum-tactics": dynamic(() => import("@/components/game/quantum-tactics")),
  orbital_puzzle: dynamic(() => import("@/components/game/orbital-puzzle")),
  "orbital-puzzle": dynamic(() => import("@/components/game/orbital-puzzle")),
  vector_dash: dynamic(() => import("@/components/game/vector-dash")),
  "vector-dash": dynamic(() => import("@/components/game/vector-dash")),
  starlight_commander: dynamic(() => import("@/components/game/starlight-commander")),
  "starlight-commander": dynamic(() => import("@/components/game/starlight-commander")),
  cyber_quest_platformer: dynamic(() => import("@/components/game/cyber-quest-platformer")),
  "cyber-quest-platformer": dynamic(() => import("@/components/game/cyber-quest-platformer")),
  cyber_dungeon_rpg: dynamic(() => import("@/components/game/cyber-dungeon-rpg")),
  "cyber-dungeon-rpg": dynamic(() => import("@/components/game/cyber-dungeon-rpg")),
  quantum_laser_puzzle: dynamic(() => import("@/components/game/quantum-laser-puzzle")),
  "quantum-laser-puzzle": dynamic(() => import("@/components/game/quantum-laser-puzzle")),
  neon_core_defense: dynamic(() => import("@/components/game/neon-core-defense")),
  "neon-core-defense": dynamic(() => import("@/components/game/neon-core-defense")),
  cyber_drift_runner: dynamic(() => import("@/components/game/cyber-drift-runner")),
  "cyber-drift-runner": dynamic(() => import("@/components/game/cyber-drift-runner")),
  cyber_leap_odyssey: dynamic(() => import("@/components/game/cyber-leap-odyssey")),
  "cyber-leap-odyssey": dynamic(() => import("@/components/game/cyber-leap-odyssey")),
  aetheria_realm_of_shadows: dynamic(() => import("@/components/game/aetheria-realm-of-shadows")),
  "aetheria-realm-of-shadows": dynamic(() => import("@/components/game/aetheria-realm-of-shadows")),
  aegis_protocol_td: dynamic(() => import("@/components/game/aegis-protocol-td")),
  "aegis-protocol-td": dynamic(() => import("@/components/game/aegis-protocol-td")),
  quantum_prism_puzzle: dynamic(() => import("@/components/game/quantum-prism-puzzle")),
  "quantum-prism-puzzle": dynamic(() => import("@/components/game/quantum-prism-puzzle")),
  synthwave_beat_rush: dynamic(() => import("@/components/game/synthwave-beat-rush")),
  "synthwave-beat-rush": dynamic(() => import("@/components/game/synthwave-beat-rush")),
  cyber_runner_platformer: dynamic(() => import("@/components/game/cyber-runner-platformer")),
  "cyber-runner-platformer": dynamic(() => import("@/components/game/cyber-runner-platformer")),
  quantum_grid_puzzle: dynamic(() => import("@/components/game/quantum-grid-puzzle")),
  "quantum-grid-puzzle": dynamic(() => import("@/components/game/quantum-grid-puzzle")),
  synthwave_velocity_runner: dynamic(() => import("@/components/game/synthwave-velocity-runner")),
  "synthwave-velocity-runner": dynamic(() => import("@/components/game/synthwave-velocity-runner")),
  cyber_pinball_odyssey: dynamic(() => import("@/components/game/cyber-pinball-odyssey")),
  "cyber-pinball-odyssey": dynamic(() => import("@/components/game/cyber-pinball-odyssey")),
  aether_pulse: dynamic(() => import("@/components/game/aether-pulse")),
  aether_pulse_2d: dynamic(() => import("@/components/game/aether-pulse")),
  "aether-pulse": dynamic(() => import("@/components/game/aether-pulse")),
  sector_9_rpg: dynamic(() => import("@/components/game/sector-9-rpg")),
  "sector-9-rpg": dynamic(() => import("@/components/game/sector-9-rpg")),
  gravity_racer: dynamic(() => import("@/components/game/gravity-racer")),
  gravity_racer_2d: dynamic(() => import("@/components/game/gravity-racer")),
  "gravity-racer": dynamic(() => import("@/components/game/gravity-racer")),
  aero_phantom: dynamic(() => import("@/components/game/aero-phantom")),
  "aero-phantom": dynamic(() => import("@/components/game/aero-phantom")),
  aether_strike: dynamic(() => import("@/components/game/aether-strike")),
  "aether-strike": dynamic(() => import("@/components/game/aether-strike")),
  titan_mech_survival: dynamic(() => import("@/components/game/titan-mech-survival")),
  "titan-mech-survival": dynamic(() => import("@/components/game/titan-mech-survival")),
  void_vanguard: dynamic(() => import("@/components/game/void-vanguard")),
  "void-vanguard": dynamic(() => import("@/components/game/void-vanguard")),
  nexus_grid_defense: dynamic(() => import("@/components/game/nexus-grid-defense")),
  "nexus-grid-defense": dynamic(() => import("@/components/game/nexus-grid-defense")),
  nexus_overdrive: dynamic(() => import("@/components/game/nexus-overdrive")),
  "nexus-overdrive": dynamic(() => import("@/components/game/nexus-overdrive")),
  cyber_nexus_survivor: dynamic(() => import("@/components/game/cyber-nexus-survivor")),
  "cyber-nexus-survivor": dynamic(() => import("@/components/game/cyber-nexus-survivor")),
  shadow_blade: dynamic(() => import("@/components/game/shadow-blade")),
  "shadow-blade": dynamic(() => import("@/components/game/shadow-blade")),
  stellar_overlord: dynamic(() => import("@/components/game/stellar-overlord")),
  "stellar-overlord": dynamic(() => import("@/components/game/stellar-overlord")),
  stellar_strike_2d: dynamic(() => import("@/components/game/stellar-strike-2d")),
  "stellar-strike-2d": dynamic(() => import("@/components/game/stellar-strike-2d")),
  super_stick_battles: dynamic(() => import("@/components/game/super-stick-battles")),
  "super-stick-battles": dynamic(() => import("@/components/game/super-stick-battles")),
  neon_ronin: dynamic(() => import("@/components/game/neon-ronin")),
  "neon-ronin": dynamic(() => import("@/components/game/neon-ronin")),

  starlight_valkyrie_horizon: dynamic(() => import("@/components/game/starlight-valkyrie-horizon")),
  starlightValkyrieHorizon: dynamic(() => import("@/components/game/starlight-valkyrie-horizon")),
  aether_zenith_cyber_horizon: dynamic(() => import("@/components/game/aether-zenith-cyber-horizon")),
  aetherZenithCyberHorizon: dynamic(() => import("@/components/game/aether-zenith-cyber-horizon")),
  void_sentinel_overdrive: dynamic(() => import("@/components/game/void-sentinel-overdrive")),
  voidSentinelOverdrive: dynamic(() => import("@/components/game/void-sentinel-overdrive")),
  chronos_nexus_overdrive: dynamic(() => import("@/components/game/chronos-nexus-overdrive")),
  chronosNexusOverdrive: dynamic(() => import("@/components/game/chronos-nexus-overdrive")),
  chrono_vanguard_paradox_shift: dynamic(() => import("@/components/game/chrono-vanguard-paradox-shift")),
  chronoVanguardParadoxShift: dynamic(() => import("@/components/game/chrono-vanguard-paradox-shift")),
  cyber_vortex_odyssey: dynamic(() => import("@/components/game/cyber-vortex-odyssey")),
  cyberVortexOdyssey:  dynamic(() => import("@/components/game/cyber-vortex-odyssey")),
  solar_tempest: dynamic(() => import("@/components/game/solar-tempest")),
  solarTempest:  dynamic(() => import("@/components/game/solar-tempest")),
  hyper_horizon: dynamic(() => import("@/components/game/hyper-horizon")),
  hyperHorizon:  dynamic(() => import("@/components/game/hyper-horizon")),
  quantum_surge: dynamic(() => import("@/components/game/quantum-surge")),
  cyber_pulse:  dynamic(() => import("@/components/game/cyber-pulse")),
  neon_velocity: dynamic(() => import("@/components/game/neon-velocity")),
  xaksports:    dynamic(() => import("@/components/game/xaksports")),
  xakarena:     dynamic(() => import("@/components/game/xakarena")),
  retro_engine: dynamic(() => import("@/components/game/retro-engine")),
  code_arena:   dynamic(() => import("@/components/game/code-arena")),
  neural_defense: dynamic(() => import("@/components/game/neural-defense")),
  neon_drift:   dynamic(() => import("@/components/game/neon-drift")),
  pixel_knight: dynamic(() => import("@/components/games/PixelKnight")),
  aim:          dynamic(() => import("@/components/games/AimTrainer")),
  balance:      dynamic(() => import("@/components/games/BalanceBoard")),
  basketball:   dynamic(() => import("@/components/games/Basketball")),
  breaker:      dynamic(() => import("@/components/games/BrickBreaker")),
  bubble:       dynamic(() => import("@/components/games/BubbleShooter")),
  // Batch 2
  clickSpeed:   dynamic(() => import("@/components/games/ClickSpeed")),
  clicker:      dynamic(() => import("@/components/games/IdleClicker")),
  colorMatch:   dynamic(() => import("@/components/games/ColorMatch")),
  connectFour:  dynamic(() => import("@/components/games/ConnectFour")),
  dodge:        dynamic(() => import("@/components/games/DodgeObjects")),
  drawing:      dynamic(() => import("@/components/games/DrawingCanvas")),
  fishing:      dynamic(() => import("@/components/games/FishingGame")),
  flappy:       dynamic(() => import("@/components/games/FlappyBird")),
  football3D:   dynamic(() => import("@/components/games/Football3D")),
  frogger:      dynamic(() => import("@/components/games/Frogger")),
  // Batch 3
  golf:         dynamic(() => import("@/components/games/MiniGolf")),
  gravity:      dynamic(() => import("@/components/games/GravityFlip")),
  invaders:     dynamic(() => import("@/components/games/SpaceInvaders")),
  jump:         dynamic(() => import("@/components/games/InfiniteJump")),
  knife:        dynamic(() => import("@/components/games/KnifeHit")),
  match3:       dynamic(() => import("@/components/games/Match3")),
  math:         dynamic(() => import("@/components/games/MathQuiz")),
  maze:         dynamic(() => import("@/components/games/MazeSolver")),
  memory:       dynamic(() => import("@/components/games/MemoryCards")),
  minesweeper:  dynamic(() => import("@/components/games/Minesweeper")),
  // Batch 4
  paint:        dynamic(() => import("@/components/games/PaintDraw")),
  parking:      dynamic(() => import("@/components/games/CarParking")),
  pinball:      dynamic(() => import("@/components/games/Pinball")),
  plinko:       dynamic(() => import("@/components/games/Plinko")),
  pong:         dynamic(() => import("@/components/games/Pong")),
  rps:          dynamic(() => import("@/components/games/RockPaperScissors")),
  reaction:     dynamic(() => import("@/components/games/ReactionTime")),
  sequence:     dynamic(() => import("@/components/games/MemorySequence")),
  snake:        dynamic(() => import("@/components/games/Snake")),
  spinWheel:    dynamic(() => import("@/components/games/SpinWheel")),
  // Batch 5
  stack:        dynamic(() => import("@/components/games/TowerStacker")),
  sudoku:       dynamic(() => import("@/components/games/Sudoku")),
  tictactoe:    dynamic(() => import("@/components/games/TicTacToe")),
  towerDefense: dynamic(() => import("@/components/games/TowerDefense")),
  trivia:       dynamic(() => import("@/components/games/TriviaQuiz")),
  tunnel3D:     dynamic(() => import("@/components/games/Tunnel3D")),
  twoZeroFourEight: dynamic(() => import("@/components/games/Game2048")),
  typing:       dynamic(() => import("@/components/games/TypingTest")),
  whack:        dynamic(() => import("@/components/games/WhackAMole")),
  word:         dynamic(() => import("@/components/games/WordSearch")),
  xbr:          dynamic(() => import("@/components/games/XBRArena")),
  blockDrop:    dynamic(() => import("@/components/games/BlockDrop")),
  mazeMuncher:  dynamic(() => import("@/components/games/MazeMuncher")),
  wordGuess:    dynamic(() => import("@/components/games/WordGuess")),
  spaceRocks:   dynamic(() => import("@/components/games/SpaceRocks")),
  rhythmTap:    dynamic(() => import("@/components/games/RhythmTap")),
};
 
export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const rawGameId = params?.id as string;
  const normalizedId = rawGameId?.replace(/-/g, "_");
  const game = GAMES_DB.find(g => g.id === normalizedId || g.id === rawGameId || g.route.endsWith(rawGameId));
  
  const [loading, setLoading] = useState(true);
  const [communityGameData, setCommunityGameData] = useState<any | null>(null);
  const [communityHtml, setCommunityHtml] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reward, setReward] = useState<{
    show: boolean;
    points: number;
    title: string;
    description: string;
  } | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    async function checkCommunityGame() {
      if (game) {
        setTimeout(() => setLoading(false), 1200);
        return;
      }
      
      if (!firestore) return;
      
      try {
        const docRef = doc(firestore, "publishedProjects", rawGameId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCommunityGameData(data);
          
          // Fetch the raw HTML to prevent forced download by Vercel Blob
          try {
            const res = await fetch(data.url);
            let htmlText = await res.text();
            
            // Inject <base> tag so relative paths work
            const baseUrl = data.url.substring(0, data.url.lastIndexOf('/') + 1);
            const baseTag = `<base href="${baseUrl}" />`;
            
            if (htmlText.includes('<head>')) {
              htmlText = htmlText.replace('<head>', '<head>' + baseTag);
            } else if (htmlText.includes('<html>')) {
              htmlText = htmlText.replace('<html>', '<html><head>' + baseTag + '</head>');
            } else {
              htmlText = '<head>' + baseTag + '</head>' + htmlText;
            }
            
            setCommunityHtml(htmlText);
          } catch (fetchErr) {
            console.error("Failed to fetch HTML content for iframe rendering", fetchErr);
          }
          
          setTimeout(() => setLoading(false), 1200);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      }
    }
    
    checkCommunityGame();
  }, [game, firestore, rawGameId]);
 
  // Playtime points logic (+2 points every 30s)
  useEffect(() => {
    if (!user || !firestore || !game) return;
    const isXakteirGame = game.developer === "xakteir" || game.developer === "Xakteir Studios";
    if (!isXakteirGame) return;
 
    const interval = setInterval(async () => {
      try {
        await setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || user.email?.split("@")[0] || "Anonymous",
            photoURL: user.photoURL || "",
            points: increment(2),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
        // Show reward alert
        setReward({
          show: true,
          points: 2,
          title: "Playtime Reward! ⏱️",
          description: `You earned +2 points just for playing ${game.title}!`
        });
        
        // Auto hide after 4 seconds
        setTimeout(() => {
          setReward(prev => prev && prev.title.includes("Playtime") ? null : prev);
        }, 4000);
 
        if (navigator.vibrate) navigator.vibrate(100);
      } catch (e) {
        console.error("Failed to add playtime points:", e);
      }
    }, 30000); // Every 30 seconds
 
    return () => clearInterval(interval);
  }, [user, firestore, game]);
 
  // Score event listener logic
  useEffect(() => {
    if (!user || !firestore || !game) return;
    const isXakteirGame = game.developer === "xakteir" || game.developer === "Xakteir Studios";
    if (!isXakteirGame) return;
 
    const handleScoreEvent = async (e: Event) => {
      const customEvent = e as CustomEvent<{ score: number; points: number }>;
      const { score, points } = customEvent.detail;
      if (!points || points <= 0) return;
 
      try {
        await setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || user.email?.split("@")[0] || "Anonymous",
            photoURL: user.photoURL || "",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
        // Show big reward modal
        setReward({
          show: true,
          points: points,
          title: "High Score! 🏆",
          description: `Wow! You scored ${score} in ${game.title} and got +${points} Leaderboard Points!`
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } catch (err) {
        console.error("Failed to save event score:", err);
      }
    };
 
    window.addEventListener("xakteir-game-score", handleScoreEvent);
    return () => window.removeEventListener("xakteir-game-score", handleScoreEvent);
  }, [user, firestore, game]);
 
  if (notFound) return <div className="p-20 text-white font-sans text-center">Game Not Found.</div>;
 
  const gameIdToUse = game ? game.id : rawGameId;
  const PascalId = gameIdToUse ? gameIdToUse.charAt(0).toUpperCase() + gameIdToUse.slice(1) : "";
  const GameComponent = 
    GAME_MAP[rawGameId] || 
    (normalizedId ? GAME_MAP[normalizedId] : null) || 
    (gameIdToUse ? GAME_MAP[gameIdToUse] : null) || 
    (gameIdToUse ? GAME_MAP[gameIdToUse.replace(/_/g, "-")] : null) || 
    (PascalId ? dynamic(() => import(`@/components/games/${PascalId}`)) : null);
 
  const KEY_CODES: Record<string, number> = {
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
    Space: 32,
    Enter: 13
  };

  const handleTouchStart = (e: React.TouchEvent, key: string) => {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(20);
    const keyCode = KEY_CODES[key] || 0;
    const actualKey = key === "Space" ? " " : key;
    const actualCode = key === "Space" ? "Space" : key;

    const event = new KeyboardEvent("keydown", {
      key: actualKey,
      code: actualCode,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    Object.defineProperty(event, 'which', { get: () => keyCode });

    window.dispatchEvent(event);
    document.dispatchEvent(event);
  };

  const handleTouchEnd = (e: React.TouchEvent, key: string) => {
    e.preventDefault();
    const keyCode = KEY_CODES[key] || 0;
    const actualKey = key === "Space" ? " " : key;
    const actualCode = key === "Space" ? "Space" : key;

    const event = new KeyboardEvent("keyup", {
      key: actualKey,
      code: actualCode,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    Object.defineProperty(event, 'which', { get: () => keyCode });

    window.dispatchEvent(event);
    document.dispatchEvent(event);
  };
 
  return (
    <div className="w-full h-full bg-black overflow-hidden relative font-sans text-white">
      {loading && (
        <div className="absolute inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 mb-8 overflow-hidden">
            <img src={game?.iconUrl || communityGameData?.thumbnailUrl} alt="Icon" className="w-full h-full object-cover" />
          </div>
          <Loader className="w-8 h-8 animate-spin text-white/50 mb-4" />
          <h2 className="text-xl font-bold tracking-widest uppercase">Initializing Engine...</h2>
          <p className="text-xs text-white/40 mt-2">Loading {game?.type || "Community"} Core for {game?.title || communityGameData?.name}</p>
        </div>
      )}
 
      <div className="w-full h-full">
        {!loading && game && GameComponent && <GameComponent />}
        {!loading && !game && communityHtml && (
          <iframe 
            srcDoc={communityHtml}
            className="w-full h-full border-0 bg-white"
            title={communityGameData?.name || "Community Game"}
            sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; game-pad; keyboard-map"
          />
        )}
      </div>
 
      {/* Mobile Virtual Gamepad */}
      {!loading && (
        <div className="md:hidden absolute inset-x-0 bottom-0 p-6 flex justify-between items-end pointer-events-none z-30 select-none">
          {/* D-Pad on Left */}
          <div className="relative w-36 h-36 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <button
              onTouchStart={(e) => handleTouchStart(e, "ArrowUp")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowUp")}
              className="absolute top-1 w-11 h-11 bg-white/10 active:bg-cyan-500/40 border border-white/10 rounded-xl flex items-center justify-center text-lg active:shadow-[0_0_15px_rgba(6,182,212,0.5)] active:border-cyan-400 transition-all text-white font-bold"
            >
              ▲
            </button>
            <button
              onTouchStart={(e) => handleTouchStart(e, "ArrowDown")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowDown")}
              className="absolute bottom-1 w-11 h-11 bg-white/10 active:bg-cyan-500/40 border border-white/10 rounded-xl flex items-center justify-center text-lg active:shadow-[0_0_15px_rgba(6,182,212,0.5)] active:border-cyan-400 transition-all text-white font-bold"
            >
              ▼
            </button>
            <button
              onTouchStart={(e) => handleTouchStart(e, "ArrowLeft")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowLeft")}
              className="absolute left-1 w-11 h-11 bg-white/10 active:bg-cyan-500/40 border border-white/10 rounded-xl flex items-center justify-center text-lg active:shadow-[0_0_15px_rgba(6,182,212,0.5)] active:border-cyan-400 transition-all text-white font-bold"
            >
              ◀
            </button>
            <button
              onTouchStart={(e) => handleTouchStart(e, "ArrowRight")}
              onTouchEnd={(e) => handleTouchEnd(e, "ArrowRight")}
              className="absolute right-1 w-11 h-11 bg-white/10 active:bg-cyan-500/40 border border-white/10 rounded-xl flex items-center justify-center text-lg active:shadow-[0_0_15px_rgba(6,182,212,0.5)] active:border-cyan-400 transition-all text-white font-bold"
            >
              ▶
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-950 border border-white/5 shadow-inner" />
          </div>
 
          {/* Action Buttons on Right */}
          <div className="flex gap-4 items-center pointer-events-auto select-none">
            <button
              onTouchStart={(e) => handleTouchStart(e, "Enter")}
              onTouchEnd={(e) => handleTouchEnd(e, "Enter")}
              className="w-16 h-16 rounded-full bg-rose-500/20 active:bg-rose-500/50 border border-rose-500/30 flex flex-col items-center justify-center text-white font-black text-sm shadow-[0_0_10px_rgba(244,63,94,0.1)] active:shadow-[0_0_25px_rgba(244,63,94,0.6)] active:border-rose-400 transition-all"
            >
              <span className="text-xs uppercase opacity-60">B</span>
              <span className="text-[10px] -mt-1 uppercase tracking-tight">Enter</span>
            </button>
            <button
              onTouchStart={(e) => handleTouchStart(e, "Space")}
              onTouchEnd={(e) => handleTouchEnd(e, "Space")}
              className="w-20 h-20 rounded-full bg-emerald-500/20 active:bg-emerald-500/50 border border-emerald-500/30 flex flex-col items-center justify-center text-white font-black text-base shadow-[0_0_10px_rgba(16,185,129,0.1)] active:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:border-emerald-400 transition-all"
            >
              <span className="text-sm uppercase opacity-60">A</span>
              <span className="text-[10px] -mt-1 uppercase tracking-wider">Space</span>
            </button>
          </div>
        </div>
      )}
 
      {/* Reward Popup */}
      <AnimatePresence>
        {reward?.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-auto"
          >
            <div className="bg-[#0e0c1b]/95 backdrop-blur-xl border border-emerald-500/40 p-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">{reward.title}</h3>
                <p className="text-xs text-white/70 font-semibold mt-1">{reward.description}</p>
                <div className="mt-2 text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <span>Score Recorded</span> • <span className="text-emerald-400">+{reward.points} Points</span>
                </div>
              </div>
              <button 
                onClick={() => setReward(null)} 
                className="text-white/40 hover:text-white text-xs font-black uppercase px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
              >
                Nice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
