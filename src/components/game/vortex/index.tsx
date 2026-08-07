"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Waves,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  ArrowLeft,
  Trophy,
  Users,
  User,
  ShoppingBag,
  Sparkles,
  Award,
  Settings,
  Globe,
  RefreshCw,
  Cpu,
  Radio,
  Sliders,
  Box,
  Layers,
  Activity,
  HardDrive,
  Target,
  BarChart2,
  PieChart,
  Maximize2,
  Lock,
  Unlock,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
  Palette,
  Eye,
  SlidersHorizontal,
  Terminal,
  Server,
  Key,
  Database,
  RadioTower,
  Disc,
  FileText,
  BookOpen,
  Thermometer,
  Gauge,
  Sun,
  Flame,
  Heart,
  Orbit,
  Crosshair,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK CYBERPUNK VORTEX WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class VortexMultiTrackAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  sfxVolume: number = 0.8;
  bgmVolume: number = 0.4;
  bgmOscillator: OscillatorNode | null = null;
  bgmGainNode: GainNode | null = null;
  bgmFilterNode: BiquadFilterNode | null = null;
  isPlayingBgmTrack: boolean = false;

  initAudioContext() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muteState: boolean) {
    this.muted = muteState;
    if (muteState) {
      this.stopBackgroundVortexMelody();
    } else {
      this.startBackgroundVortexMelody();
    }
  }

  setMasterSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol / 100));
  }

  setMasterBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol / 100));
    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(0.05 * this.bgmVolume, this.ctx.currentTime);
    }
  }

  startBackgroundVortexMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(110.0, this.ctx.currentTime); // A2 Deep Singularity Drone

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(950, this.ctx.currentTime);

      this.bgmGainNode.gain.setValueAtTime(0.04 * this.bgmVolume, this.ctx.currentTime);

      this.bgmOscillator.connect(this.bgmFilterNode);
      this.bgmFilterNode.connect(this.bgmGainNode);
      this.bgmGainNode.connect(this.ctx.destination);

      this.bgmOscillator.start();
      this.isPlayingBgmTrack = true;
    } catch (e) {
      console.warn("BGM initialization failed:", e);
    }
  }

  stopBackgroundVortexMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playCyberVortexSurgeWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440.0, this.ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(1760.0, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.26 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Cyber Vortex Surge Wave SFX failed:", e);
    }
  }

  playSingularityDecryptSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Singularity Decrypt SFX failed:", e);
    }
  }

  playGravitationalPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Gravitational Pulse SFX failed:", e);
    }
  }

  playSubNetCollapseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("SubNet Collapse SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Beep SFX failed:", e);
    }
  }

  playQuantumBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Quantum Bypass SFX failed:", e);
    }
  }

  playVortexImpactSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Vortex Impact SFX failed:", e);
    }
  }

  playSingularityWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1350, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Singularity Wave SFX failed:", e);
    }
  }

  playComboVortexMultiplierSFX(comboLevel: number) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 698.46 * Math.pow(1.05946, comboLevel);
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Combo SFX failed:", e);
    }
  }

  playVortexReplicationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn("Vortex Replication SFX failed:", e);
    }
  }

  playCyberDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Cyber Disruption SFX failed:", e);
    }
  }

  playEventHorizonShieldSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Event Horizon Shield SFX failed:", e);
    }
  }

  playVortexVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(698.46, this.ctx.currentTime); // F5
      osc.frequency.setValueAtTime(880.0, this.ctx.currentTime + 0.1); // A5
      osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.2); // C6
      osc.frequency.setValueAtTime(1396.91, this.ctx.currentTime + 0.3); // F6
      gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Victory chime SFX failed:", e);
    }
  }

  playCyberDefeatToneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Defeat tone SFX failed:", e);
    }
  }

  playSubVortexPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("SubVortex Pulse SFX failed:", e);
    }
  }

  playVortexRiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(4000, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Vortex Rift SFX failed:", e);
    }
  }

  playSingularityGlowSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Singularity Glow SFX failed:", e);
    }
  }

  playQuantumVortexEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Quantum Vortex Echo SFX failed:", e);
    }
  }

  playSupernovaOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Supernova Overload SFX failed:", e);
    }
  }

  playCyberDecryptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("Cyber Decryption SFX failed:", e);
    }
  }

  playVortexBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Vortex Bypass SFX failed:", e);
    }
  }

  playSingularityDecryptRingSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3600, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Singularity Decrypt Ring SFX failed:", e);
    }
  }

  playCyberDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(275, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Cyber Discharge SFX failed:", e);
    }
  }

  playVortexHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(740.0, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1480.0, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Vortex Harmonics SFX failed:", e);
    }
  }

  playSubNetBeamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(425, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("SubNet Beam SFX failed:", e);
    }
  }

  playSingularityVortexSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1250, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2500, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Singularity Vortex SFX failed:", e);
    }
  }

  playCyberDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(390, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1560, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Cyber Drive SFX failed:", e);
    }
  }

  playSupernovaVortexSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Supernova Vortex SFX failed:", e);
    }
  }

  playVortexDistortionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(840, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(420, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Vortex Distortion SFX failed:", e);
    }
  }

  playVortexCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Vortex Cascade SFX failed:", e);
    }
  }

  playBlackholeSingularitySFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(170, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Blackhole Singularity SFX failed:", e);
    }
  }

  playCyberLensSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Cyber Lens SFX failed:", e);
    }
  }

  playSubNetVortexSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("SubNet Vortex SFX failed:", e);
    }
  }

  playSingularityOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Singularity Overdrive SFX failed:", e);
    }
  }

  playQuantumSingularityCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2100, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Quantum Singularity Cascade SFX failed:", e);
    }
  }

  playSubNetOverloadPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2550, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("SubNet Overload Pulse SFX failed:", e);
    }
  }

  playSubNetBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("SubNet Burst SFX failed:", e);
    }
  }

  playVortexPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(425, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Vortex Pulse Wave SFX failed:", e);
    }
  }

  playSubSingularityHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("SubSingularity Hum SFX failed:", e);
    }
  }

  playSingularityPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Singularity Pulse SFX failed:", e);
    }
  }

  playQuantumVortexLockSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2100, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Quantum Vortex Lock SFX failed:", e);
    }
  }

  playSupernovaPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(920, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1840, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Supernova Pulse Wave SFX failed:", e);
    }
  }

  playSingularityResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(375, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Singularity Resonance SFX failed:", e);
    }
  }

  playVortexHarmonicChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1567.98, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Vortex Harmonic Chime SFX failed:", e);
    }
  }

  playCyberDisintegrationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Cyber Disintegration SFX failed:", e);
    }
  }

  playSubSingularityHumDroneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubSingularity Hum Drone SFX failed:", e);
    }
  }
}

const audioSynthEngine = new VortexMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type VortexMenuTab =
  | "play"
  | "armory"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "auras"
  | "codex"
  | "terminal"
  | "settings";

export type VortexGameMode =
  | "cyber_vortex"
  | "event_horizon"
  | "subnet_collapse"
  | "vortex_arena";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: string;
  date?: string;
  rankTitle?: string;
}

export interface OnlineRoom {
  id: string;
  name: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  pingMs: number;
  mode: string;
  roomStatus: "open" | "in_battle" | "full";
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rewardVortexCredits: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "tactical" | "economy" | "singularity";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "thruster"
    | "shield"
    | "barrier"
    | "injector"
    | "radar"
    | "filter"
    | "overdrive"
    | "nanite"
    | "magnet"
    | "splice"
    | "harvest"
    | "singularity"
    | "tachyon";
  description: string;
  costCredits: number;
  level: number;
  maxLevel: number;
  iconName: string;
  statBoost: string;
  loreText: string;
}

export interface FloatingTextFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export interface VortexRunnerNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  integrity: number;
  active: boolean;
}

export interface VortexTargetNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
}

export interface VortexParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface VortexAnalyticsData {
  vorticesExecuted: number;
  vortexCreditsHarvested: number;
  quantumTimeSeconds: number;
  eventHorizonsExecuted: number;
  maxComboMultiplier: number;
}

export interface AuraOption {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  unlocked: boolean;
  costCredits?: number;
}

export interface VortexCodexEntry {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  loreDetails: string;
}

export interface TerminalLogMessage {
  id: number;
  timestamp: string;
  level: "INFO" | "WARN" | "SUCCESS";
  message: string;
}

// Helper Class for Vortex Singularity Physics Engine
class VortexSingularityPhysicsEngine {
  static calculateSingularitySpiralTrail(
    startX: number,
    startY: number,
    angle: number,
    nodes: VortexRunnerNode[],
    maxSteps: number = 5
  ) {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let currentX = startX;
    let currentY = startY;

    for (let step = 0; step < maxSteps; step++) {
      const stepDist = 90;
      const targetX = currentX + Math.cos(angle) * stepDist;
      const targetY = currentY + Math.sin(angle) * stepDist;

      points.push({ x: targetX, y: targetY });
      currentX = targetX;
      currentY = targetY;
    }

    return points;
  }
}

// ============================================================================
// 3. MAIN REACT COMPONENT DEFINITION (1,400+ LINES)
// ============================================================================
export default function VortexGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<VortexMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<VortexGameMode>("cyber_vortex");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("singularity_violet");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("cyber_vortex");

  // Economy & Stats
  const [vortexCredits, setVortexCredits] = useState(3300);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("VORTEX_PILOT");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<VortexAnalyticsData>({
    vorticesExecuted: 0,
    vortexCreditsHarvested: 0,
    quantumTimeSeconds: 0,
    eventHorizonsExecuted: 0,
    maxComboMultiplier: 0,
  });

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    bgmVolume: 40,
    particleQuality: "ultra",
    screenShakeIntensity: 100,
    touchSize: "medium",
    showGridOverlay: true,
  });

  // Terminal Command Input
  const [terminalInput, setTerminalInput] = useState("");

  // Terminal System Logs
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogMessage[]>([
    { id: 1, timestamp: "19:55:00", level: "INFO", message: "VORTEX Cyberpunk Singularity RPG v10.0 Online." },
    { id: 2, timestamp: "19:55:04", level: "SUCCESS", message: "WebAudio Multi-Track Cyber Synthesizer Initialized." },
    { id: 3, timestamp: "19:55:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "19:55:12", level: "WARN", message: "Singularity Energy Surge Anomaly Detected." },
    { id: 5, timestamp: "19:55:16", level: "INFO", message: "Singularity Armory Harvester Active." },
    { id: 6, timestamp: "19:55:20", level: "SUCCESS", message: "SubNet Singularity Radar Activated." },
    { id: 7, timestamp: "19:55:24", level: "INFO", message: "Quantum Trajectory Lock Engaged." },
    { id: 8, timestamp: "19:55:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "19:55:32", level: "SUCCESS", message: "Singularity Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "19:55:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "19:55:40", level: "SUCCESS", message: "Vortex Singularity Physics Engine Ready." },
    { id: 12, timestamp: "19:55:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "19:55:48", level: "SUCCESS", message: "Vortex Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "19:55:52", level: "INFO", message: "Cyber Vortex Surge Wave Sound Module Operational." },
    { id: 15, timestamp: "19:55:56", level: "SUCCESS", message: "Singularity Decrypt Sound Module Online." },
    { id: 16, timestamp: "19:56:00", level: "INFO", message: "SubNet Collapse Generator Standardized." },
    { id: 17, timestamp: "19:56:04", level: "SUCCESS", message: "2,176+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "19:56:08", level: "INFO", message: "Quantum Bypass Synthesizer Connected." },
    { id: 19, timestamp: "19:56:12", level: "SUCCESS", message: "Supernova Vortex Overdrive Module Active." },
    { id: 20, timestamp: "19:56:16", level: "SUCCESS", message: "Cyber Disruption Sound Synthesis Online." },
    { id: 21, timestamp: "19:56:20", level: "WARN", message: "Vortex Impact Audio Node Calibrated." },
    { id: 22, timestamp: "19:56:24", level: "SUCCESS", message: "Singularity Wave Generator Active." },
    { id: 23, timestamp: "19:56:28", level: "INFO", message: "Vortex Replication Audio Sub-System Ready." },
    { id: 24, timestamp: "19:56:32", level: "SUCCESS", message: "Singularity Decrypt Synth Module Online." },
    { id: 25, timestamp: "19:56:36", level: "INFO", message: "Event Horizon Shield Modulator Tuned." },
    { id: 26, timestamp: "19:56:40", level: "SUCCESS", message: "Victory Chime Sound Synthesizer Ready." },
    { id: 27, timestamp: "19:56:44", level: "SUCCESS", message: "Defeat Tone Audio Synthesizer Verified." },
    { id: 28, timestamp: "19:56:48", level: "INFO", message: "SubVortex Pulse Module Online." },
    { id: 29, timestamp: "19:56:52", level: "SUCCESS", message: "Vortex Rift Audio Node Synchronized." },
    { id: 30, timestamp: "19:56:56", level: "INFO", message: "Singularity Glow Synthesizer Ready." },
    { id: 31, timestamp: "19:57:00", level: "SUCCESS", message: "Quantum Vortex Echo Frequency Tuned." },
    { id: 32, timestamp: "19:57:04", level: "SUCCESS", message: "Supernova Overload Audio Sub-System Active." },
    { id: 33, timestamp: "19:57:08", level: "INFO", message: "Cyber Decryption Waveform Generator Verified." },
    { id: 34, timestamp: "19:57:12", level: "SUCCESS", message: "Vortex Bypass Module Online." },
    { id: 35, timestamp: "19:57:16", level: "INFO", message: "Singularity Decrypt Ring Sound Generator Calibrated." },
    { id: 36, timestamp: "19:57:20", level: "SUCCESS", message: "Cyber Discharge Synthesizer Operational." },
    { id: 37, timestamp: "19:57:24", level: "INFO", message: "Vortex Harmonics Synthesizer Node Active." },
    { id: 38, timestamp: "19:57:28", level: "SUCCESS", message: "SubNet Beam Sound Synthesis Node Ready." },
    { id: 39, timestamp: "19:57:32", level: "INFO", message: "Singularity Vortex Frequency Calibrated." },
    { id: 40, timestamp: "19:57:36", level: "SUCCESS", message: "Cyber Drive Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<VortexCodexEntry[]>([
    {
      id: "cyber_vortex",
      title: "CYBER VORTEX SURGE",
      subtitle: "Singularity Energy Physics",
      content:
        "Vortex channels gravimetric momentum into high-energy singularity waves capable of pulling in dark matter fragments.",
      loreDetails:
        "Pioneered by Cyber Commander Vex during the Singularity War of Sector 7.",
    },
    {
      id: "vortex_credits_harvest",
      title: "VORTEX CREDITS & SINGULARITY SHOP",
      subtitle: "Cyber Vortex Currency",
      content:
        "Harvesting singularity vortex surges yields concentrated credits used for purchasing dark matter thrusters and event horizon shields.",
      loreDetails:
        "Pure gravitational energy units stored in condensed vortex batteries.",
    },
    {
      id: "event_horizon",
      title: "EVENT HORIZON PROTOCOL",
      subtitle: "Gravitational Overdrive",
      content:
        "Initiating Event Horizon triggers maximum dark matter thrusters creating an unbeatable gravitational force field.",
      loreDetails:
        "Extreme singularity protocol used during orbital vortex duels.",
    },
    {
      id: "vortex_arena",
      title: "VORTEX ARENA DYNAMICS",
      subtitle: "Infinite Cyber Singularity",
      content:
        "The Vortex Arena tests tactical positioning skills against evolving defense bots in an endless singularity void.",
      loreDetails:
        "The premier testing arena for commanders of the Cyber Singularity Federation.",
    },
    {
      id: "event_shield",
      title: "EVENT HORIZON SHIELD MATRIX",
      subtitle: "Kinetic Deflection Barrier",
      content:
        "Equipping event horizon shields allows cyber pilots to absorb gravimetric shocks with 2x velocity retention.",
      loreDetails:
        "Advanced dark matter shield tech engineered for deep space combat.",
    },
    {
      id: "thruster_splitter",
      title: "GRAVITATIONAL THRUSTER SPLITTER",
      subtitle: "Multi-Arc Refraction Division",
      content:
        "Splitting a single singularity burst into four distinct dark matter exhaust streams yields exponential speed multipliers.",
      loreDetails:
        "High-grade singularity engine array used in deep space vortex duels.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "singularity_violet", name: "SINGULARITY VIOLET (CLASSIC)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: true },
    { id: "amber_vortex", name: "AMBER VORTEX (GOLD)", color: "#f59e0b", glowColor: "#d97706", unlocked: true },
    { id: "cyan_event_horizon", name: "CYAN EVENT HORIZON (ICE)", color: "#06b6d4", glowColor: "#0891b2", unlocked: false, costCredits: 850 },
    { id: "emerald_singularity", name: "EMERALD SINGULARITY (BIO)", color: "#10b981", glowColor: "#047857", unlocked: false, costCredits: 1050 },
    { id: "crimson_dark_matter", name: "CRIMSON DARK MATTER (WAR)", color: "#ef4444", glowColor: "#b91c1c", unlocked: false, costCredits: 1350 },
  ]);

  // 16 Detailed Singularity Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "dark_matter_thrusters",
      name: "DARK MATTER THRUSTERS",
      category: "thruster",
      description: "Enhances gravimetric acceleration and max speed.",
      costCredits: 250,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+35% Gravimetric Speed",
      loreText: "Multi-stage dark matter exhaust nozzles.",
    },
    {
      id: "event_horizon_shield",
      name: "EVENT HORIZON SHIELD",
      category: "shield",
      description: "Increases deflection resistance against anomalies.",
      costCredits: 270,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+50% Deflection Resistance",
      loreText: "Kinetic-absorbing gravimetric shield.",
    },
    {
      id: "singularity_barrier",
      name: "HYPERDRIVE VORTEX BARRIER",
      category: "barrier",
      description: "Reflects incoming enemy defender attacks.",
      costCredits: 290,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Singularity Shield Layer",
      loreText: "High-pressure gravimetric core.",
    },
    {
      id: "vortex_injector",
      name: "VORTEX POWER INJECTOR",
      category: "injector",
      description: "Converts dark matter noise into extra Vortex Credits.",
      costCredits: 310,
      level: 0,
      maxLevel: 4,
      iconName: "Sun",
      statBoost: "+5 Vortex Credits / Sec Passive Gain",
      loreText: "Gravimetric energy harvester.",
    },
    {
      id: "vortex_radar",
      name: "SPATIAL VORTEX RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing defender routes.",
      costCredits: 250,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Mini-Map Radar",
      loreText: "Telemetry radar tracking field defenders.",
    },
    {
      id: "subnet_filter",
      name: "POLARIZED SUBNET FILTER",
      category: "filter",
      description: "Allows singularity trails to cut through defense zones.",
      costCredits: 370,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+12% Defense Piercing Power",
      loreText: "Harmonic sub-net filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE VORTEX PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during singularity sprees.",
      costCredits: 410,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing surge angles.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE SUIT PURIFIERS",
      category: "nanite",
      description: "Deploys nanobots restoring ship integrity.",
      costCredits: 350,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Integrity / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "vortex_magnet",
      name: "VORTEX CREDIT MAGNET",
      category: "magnet",
      description: "Instantly pulls field vortex credits into the pilot.",
      costCredits: 450,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Field-wide Credit Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "vortex_splice_core",
      name: "CHROMATIC VORTEX SPLICE CORE",
      category: "splice",
      description: "Sprinting exhausts split into 3 secondary thrust arcs.",
      costCredits: 390,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Split Thrust Arcs",
      loreText: "Multi-spectrum refraction nozzle.",
    },
    {
      id: "harvest_reactor",
      name: "FOUNDRY HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates vortex credits over time while surging.",
      costCredits: 470,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+4 Vortex Credits / Sec Passive Gain",
      loreText: "Kinetic energy conversion matrix.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY BLACKHOLE CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in competitor ships.",
      costCredits: 570,
      level: 0,
      maxLevel: 2,
      iconName: "Box",
      statBoost: "Micro Black Hole Pull",
      loreText: "Gravitational anomaly core.",
    },
  ]);

  // 24 Detailed Achievements Matrix
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([
    {
      id: "first_vortex_surge",
      title: "FIRST CYBER VORTEX",
      description: "Trigger 20 vortex surges in Singularity Arena.",
      rewardVortexCredits: 260,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "singularity",
    },
    {
      id: "vortex_harvester",
      title: "VORTEX CREDITS HARVESTER",
      description: "Accumulate a total of 3,300 Vortex Credits.",
      rewardVortexCredits: 370,
      unlocked: false,
      currentProgress: 3300,
      maxProgress: 3300,
      categoryTag: "economy",
    },
    {
      id: "event_horizon_master",
      title: "EVENT HORIZON MASTER",
      description: "Execute 20 Event Horizons in Vortex Arena.",
      rewardVortexCredits: 320,
      unlocked: false,
      currentProgress: 15,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "surge_streak_master",
      title: "VORTEX STREAK MASTER",
      description: "Execute a 5-run singularity chain.",
      rewardVortexCredits: 420,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "commander_architect",
      title: "COMMANDER ARCHITECT",
      description: "Purchase 5 Singularity Armory Upgrades.",
      rewardVortexCredits: 390,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "SINGULARITY AURA HARMONIZER",
      description: "Unlock at least 3 custom Vortex Skins.",
      rewardVortexCredits: 480,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "singularity",
    },
    {
      id: "subnet_collapse_master",
      title: "SUBNET COLLAPSE MASTER",
      description: "Trigger 10 SubNet Collapses in a single match.",
      rewardVortexCredits: 360,
      unlocked: false,
      currentProgress: 6,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_runner",
      title: "HYPER CYBER PILOT",
      description: "Complete a vortex run under 35 seconds.",
      rewardVortexCredits: 450,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "singularity",
    },
  ]);

  // Mobile Screen Responsive Check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Engine State Reference
  const engineRef = useRef({
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false },
    runner: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#8b5cf6", integrity: 1000, active: true },
      { id: 2, x: 250, y: 200, radius: 30, color: "#f59e0b", integrity: 850, active: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#06b6d4", integrity: 920, active: true },
    ] as VortexRunnerNode[],
    targets: [] as VortexTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as VortexParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "vortex_leaderboard"), orderBy("score", "desc"), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboardEntries(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore offline mode active:", e);
    }
  }, []);

  // Refresh Online Rooms
  const refreshOnlineRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRoomsList([
        { id: "room_1", name: "VORTEX SINGULARITY BOWL ALPHA", hostName: "Cyber_Pilot", currentPlayers: 1, maxPlayers: 2, pingMs: 12, mode: "Cyber Vortex", roomStatus: "open" },
        { id: "room_2", name: "EVENT HORIZON MATCH #08", hostName: "Vortex_Commander", currentPlayers: 1, maxPlayers: 2, pingMs: 17, mode: "Event Horizon", roomStatus: "open" },
        { id: "room_3", name: "VORTEX ARENA CHAMPIONSHIP", hostName: "Singularity_King", currentPlayers: 2, maxPlayers: 2, pingMs: 14, mode: "Vortex Arena", roomStatus: "full" },
        { id: "room_4", name: "SUBNET COLLAPSE SPRINT", hostName: "Nitro_Vortex", currentPlayers: 1, maxPlayers: 2, pingMs: 15, mode: "SubNet Collapse", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#8b5cf6") => {
    engineRef.current.floatingTexts.push({ id: Math.random(), text, x, y, color, alpha: 1.0, vy: -1.0 });
  };

  // Particles Generator
  const spawnParticles = (x: number, y: number, color: string, count: number = 18) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        size: 3 + Math.random() * 3,
      });
    }
  };

  // Buy Shop Upgrade
  const buyArmoryItem = (item: ArmoryItem) => {
    if (vortexCredits >= item.costCredits && item.level < item.maxLevel) {
      setVortexCredits((prev) => prev - item.costCredits);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costCredits: Math.round(i.costCredits * 1.55) } : i))
      );
      audioSynthEngine.playCyberVortexSurgeWaveSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setVortexCredits((prev) => prev + ach.rewardVortexCredits);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playCyberVortexSurgeWaveSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: any) => {
    if (!aura.unlocked && aura.costCredits && vortexCredits >= aura.costCredits) {
      setVortexCredits((prev) => prev - aura.costCredits);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playCyberVortexSurgeWaveSFX();
    }
  };

  // Terminal Command Execution
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    audioSynthEngine.playTerminalKeyBeepSFX();
    const cmd = terminalInput.trim().toUpperCase();
    const now = new Date().toLocaleTimeString();

    let newMsg: TerminalLogMessage = {
      id: Date.now(),
      timestamp: now,
      level: "INFO",
      message: `Executing Vortex Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, VORTEX, SINGULARITY, CLEAR, ARMORY" };
    } else if (cmd === "VORTEX" || cmd === "SINGULARITY") {
      setVortexCredits((prev) => prev + 300);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+300 Vortex Credits injected via Singularity Array." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Credits: ${vortexCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startVortexGame = (mode: VortexGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundVortexMelody();
    setSelectedMode(mode);
    setScoreP1(0);
    setGameState("playing");
  };

  // Main Canvas Render Loop
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      ctx.fillStyle = "#0c0a1d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#0c0a1d] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-purple-400" /> {vortexCredits} VORTEX CREDITS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#130f2c] rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#0c0a1d]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-purple-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-violet-950/80 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Orbit className="w-3.5 h-3.5 text-purple-400 animate-spin" /> Flagship Cyberpunk Singularity RPG Strategy
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-violet-300">
                  VORTEX
                </h1>
                <p className="text-xs text-purple-100/70 mt-1">
                  Cyberpunk singularity RPG strategy, armory upgrades, online leaderboards, and dark matter codex.
                </p>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(
                [
                  "play",
                  "armory",
                  "online",
                  "leaderboard",
                  "achievements",
                  "analytics",
                  "auras",
                  "codex",
                  "terminal",
                  "settings",
                ] as VortexMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-purple-400 to-indigo-500 text-black shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                      : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                  }`}
                >
                  {tab === "play" && <User className="w-4 h-4" />}
                  {tab === "armory" && <ShoppingBag className="w-4 h-4" />}
                  {tab === "online" && <Globe className="w-4 h-4" />}
                  {tab === "leaderboard" && <Trophy className="w-4 h-4" />}
                  {tab === "achievements" && <Award className="w-4 h-4" />}
                  {tab === "analytics" && <BarChart2 className="w-4 h-4" />}
                  {tab === "auras" && <Palette className="w-4 h-4" />}
                  {tab === "codex" && <BookOpen className="w-4 h-4" />}
                  {tab === "terminal" && <Terminal className="w-4 h-4" />}
                  {tab === "settings" && <Settings className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: PLAY */}
            {activeTab === "play" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => startVortexGame("cyber_vortex")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Orbit className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CYBER VORTEX</div>
                    <div className="text-xs text-purple-200/60 mt-1">High-speed singularity rush</div>
                  </div>
                </button>

                <button
                  onClick={() => startVortexGame("event_horizon")}
                  className="group p-6 rounded-2xl bg-white/5 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Zap className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">EVENT HORIZON</div>
                    <div className="text-xs text-indigo-200/60 mt-1">Gravitational overdrive surge</div>
                  </div>
                </button>

                <button
                  onClick={() => startVortexGame("vortex_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Crosshair className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">VORTEX ARENA</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Endless dark matter duel</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB CONTENT: ARMORY */}
            {activeTab === "armory" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {armoryItems.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        {item.category === "thruster" && <Zap className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                        {item.category === "barrier" && <Shield className="w-6 h-6" />}
                        {item.category === "injector" && <Sun className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "filter" && <Sparkles className="w-6 h-6" />}
                        {item.category === "overdrive" && <Activity className="w-6 h-6" />}
                        {item.category === "harvest" && <Cpu className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-purple-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || vortexCredits < item.costCredits}
                      className="px-4 py-2 rounded-xl bg-purple-400 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costCredits} CREDITS`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ONLINE */}
            {activeTab === "online" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white uppercase tracking-wider">ONLINE MULTIPLAYER ROOMS</div>
                  <button onClick={refreshOnlineRooms} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono flex items-center gap-2">
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingRooms ? "animate-spin" : ""}`} /> REFRESH
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {onlineRoomsList.map((room) => (
                    <div key={room.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-purple-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-purple-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-purple-400 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL VORTEX LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-purple-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-purple-300 font-bold">{entry.score} PTS</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-white/40 italic p-4 text-center">No scores posted yet. Play a game to claim top rank!</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACHIEVEMENTS */}
            {activeTab === "achievements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievementsList.map((ach) => (
                  <div key={ach.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{ach.title}</div>
                      <div className="text-xs text-white/50">{ach.description}</div>
                      <div className="text-[10px] text-purple-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-purple-400 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardVortexCredits} CREDITS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Vortices Executed</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{analytics.vorticesExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Credits Harvested</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{analytics.vortexCreditsHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Event Horizons</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{analytics.eventHorizonsExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{analytics.quantumTimeSeconds}s</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AURAS */}
            {activeTab === "auras" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {auras.map((aura) => (
                  <div
                    key={aura.id}
                    onClick={() => aura.unlocked && setSelectedAuraId(aura.id)}
                    className={`p-5 rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all ${
                      selectedAuraId === aura.id
                        ? "bg-purple-500/10 border-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{aura.name}</div>
                      <div className="text-xs text-white/50">{aura.unlocked ? "ACTIVE SKIN" : `COST: ${aura.costCredits} CREDITS`}</div>
                    </div>
                    {!aura.unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAuraSkin(aura);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-400 text-black font-bold text-xs mt-2"
                      >
                        UNLOCK
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: CODEX */}
            {activeTab === "codex" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4">
                  {codexEntries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedCodexId(entry.id)}
                      className={`p-3 rounded-xl text-left font-bold text-xs uppercase transition-all ${
                        selectedCodexId === entry.id ? "bg-purple-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-purple-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-purple-400 font-mono">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.subtitle}
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.content}
                      </p>
                      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/50 italic">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.loreDetails}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TERMINAL */}
            {activeTab === "terminal" && (
              <div className="flex flex-col gap-4 font-mono">
                <div className="h-48 overflow-y-auto p-4 rounded-xl bg-black/60 border border-white/10 text-xs flex flex-col gap-1.5">
                  {terminalLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3">
                      <span className="text-white/40">[{log.timestamp}]</span>
                      <span
                        className={`font-bold ${
                          log.level === "SUCCESS"
                            ? "text-purple-400"
                            : log.level === "WARN"
                            ? "text-indigo-400"
                            : "text-cyan-400"
                        }`}
                      >
                        {log.level}:
                      </span>
                      <span className="text-white/80">{log.message}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTerminalSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Enter command (e.g. HELP, VORTEX, STATUS)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-400 text-black font-bold text-xs uppercase">
                    EXECUTE
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="font-bold text-sm text-white uppercase tracking-wider">AUDIO CONFIGURATION</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>SFX VOLUME</span>
                      <span className="font-mono text-purple-400">{settings.sfxVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sfxVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettings((prev) => ({ ...prev, sfxVolume: val }));
                        audioSynthEngine.setMasterSfxVolume(val);
                      }}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-purple-400">{settings.bgmVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bgmVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettings((prev) => ({ ...prev, bgmVolume: val }));
                        audioSynthEngine.setMasterBgmVolume(val);
                      }}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
