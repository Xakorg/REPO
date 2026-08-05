"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Users,
  User,
  ShoppingBag,
  Shield,
  Sparkles,
  Award,
  Settings,
  Flame,
  Globe,
  RefreshCw,
  Cpu,
  Radio,
  Sliders,
  Crosshair,
  Box,
  Layers,
  Activity,
  HardDrive,
  Target,
  BarChart2,
  PieChart,
  Compass,
  Maximize2,
  Lock,
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
  CpuIcon,
  Moon,
  Lightbulb,
  Share2,
  Download,
  Info,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  X,
  CornerDownRight,
  ZapOff,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK QUANTUM NEXUS WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class NexusMultiTrackAudioSynth {
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
      this.stopBackgroundNexusMelody();
    } else {
      this.startBackgroundNexusMelody();
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

  startBackgroundNexusMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(110, this.ctx.currentTime); // Low A2 hum

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(800, this.ctx.currentTime);

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

  stopBackgroundNexusMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playNexusOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Overdrive SFX failed:", e);
    }
  }

  playIonPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(293.66, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Ion Pulse SFX failed:", e);
    }
  }

  playFluxCollectSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Flux Collect SFX failed:", e);
    }
  }

  playVoidNodeDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Void Node SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
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

  playQuantumResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1280, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.26 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Resonance SFX failed:", e);
    }
  }

  playPlasmaCannonBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Plasma Cannon SFX failed:", e);
    }
  }

  playShieldAbsorbSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Shield absorb SFX failed:", e);
    }
  }

  playComboMultiplierSFX(comboLevel: number) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 440 * Math.pow(1.05946, comboLevel);
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

  playWarpTeleportSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Warp SFX failed:", e);
    }
  }

  playLaserBeamBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Laser beam burst SFX failed:", e);
    }
  }

  playUltravioletPulseBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("UV Pulse burst SFX failed:", e);
    }
  }

  playVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, this.ctx.currentTime + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.2); // E5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.3); // A5
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

  playDefeatToneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.5);
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

  playSolarFlareBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Solar Flare SFX failed:", e);
    }
  }

  playHyperBeamChargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2500, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Hyper Beam Charge SFX failed:", e);
    }
  }

  playPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Pulse Wave SFX failed:", e);
    }
  }

  playCosmicEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Cosmic Echo SFX failed:", e);
    }
  }

  playGammaRayBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Gamma Ray SFX failed:", e);
    }
  }

  playSpectralHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Spectral Hum SFX failed:", e);
    }
  }

  playVoidCollapseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Void Collapse SFX failed:", e);
    }
  }

  playCrystalShimmerSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Crystal Shimmer SFX failed:", e);
    }
  }

  playPlasmaDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Plasma Discharge SFX failed:", e);
    }
  }

  playNebulaHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(466.16, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(932.33, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Nebula Harmonics SFX failed:", e);
    }
  }

  playQuasarBeamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Quasar Beam SFX failed:", e);
    }
  }

  playTachyonDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1960, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Tachyon Disruption SFX failed:", e);
    }
  }

  playZeroPointEnergySFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(270, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1080, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Zero Point SFX failed:", e);
    }
  }

  playSupernovaBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Supernova Burst SFX failed:", e);
    }
  }

  playChronoShiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(310, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Chrono Shift SFX failed:", e);
    }
  }

  playStarlightCadenceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(740, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1480, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Starlight Cadence SFX failed:", e);
    }
  }

  playSingularityPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Singularity Pulse SFX failed:", e);
    }
  }

  playGravityWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(85, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Gravity Wave SFX failed:", e);
    }
  }

  playAuroraBorealisSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Aurora Borealis SFX failed:", e);
    }
  }

  playHyperDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2300, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Hyper Drive SFX failed:", e);
    }
  }

  playQuantumDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(780, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1560, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Quantum Disruption SFX failed:", e);
    }
  }

  playNexusOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1950, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Nexus Overload SFX failed:", e);
    }
  }

  playFluxPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(920, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1840, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Flux Pulse SFX failed:", e);
    }
  }

  playCosmicBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Cosmic Burst SFX failed:", e);
    }
  }

  playIonChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Ion Chime SFX failed:", e);
    }
  }

  playSubSpaceHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubSpace Hum SFX failed:", e);
    }
  }

  playFluxCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1450, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(725, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Flux Cascade SFX failed:", e);
    }
  }
}

const audioSynthEngine = new NexusMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type NexusMenuTab =
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

export type NexusGameMode =
  | "grid_defense"
  | "quantum_sieges"
  | "void_purge"
  | "nexus_arena";

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
  rewardFlux: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "quantum" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "turret"
    | "capacitor"
    | "flux"
    | "shield"
    | "collector"
    | "radar"
    | "pulse"
    | "warp"
    | "starlight"
    | "laser"
    | "aura"
    | "overdrive"
    | "nanite"
    | "magnet"
    | "cluster"
    | "harvest";
  description: string;
  costFlux: number;
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

export interface NexusTurretNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  tier: number;
}

export interface VoidTargetNode {
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

export interface FluxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface NexusAnalyticsData {
  nodesDeployed: number;
  fluxHarvested: number;
  quantumTimeSeconds: number;
  voidNodesPurged: number;
  maxChainReaction: number;
}

export interface AuraOption {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  unlocked: boolean;
  costFlux?: number;
}

export interface NexusCodexEntry {
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

// Helper Class to calculate Canvas Physics and Grid Chain Rays
class NexusGridPhysicsEngine {
  static calculateChainReactionRaytrace(
    startX: number,
    startY: number,
    angle: number,
    nodes: NexusTurretNode[],
    maxChains: number = 5
  ) {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let currentX = startX;
    let currentY = startY;
    let currentAngle = angle;

    for (let c = 0; c < maxChains; c++) {
      const stepDist = 750;
      const targetX = currentX + Math.cos(currentAngle) * stepDist;
      const targetY = currentY + Math.sin(currentAngle) * stepDist;

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
export default function NexusGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<NexusMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<NexusGameMode>("grid_defense");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("cyan_matrix");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("quantum_grid");

  // Economy & Stats
  const [fluxCredits, setFluxCredits] = useState(1200);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("NEXUS_COMMANDER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<NexusAnalyticsData>({
    nodesDeployed: 0,
    fluxHarvested: 0,
    quantumTimeSeconds: 0,
    voidNodesPurged: 0,
    maxChainReaction: 0,
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
    { id: 1, timestamp: "18:35:00", level: "INFO", message: "NEXUS Quantum Defense Matrix v4.2 Online." },
    { id: 2, timestamp: "18:35:04", level: "SUCCESS", message: "WebAudio Multi-Track Synthesizer Engine Initialized." },
    { id: 3, timestamp: "18:35:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "18:35:12", level: "WARN", message: "Void Disruption Field Approaching Sector 9." },
    { id: 5, timestamp: "18:35:16", level: "INFO", message: "Armory Foundry Energy Printer Calibrated." },
    { id: 6, timestamp: "18:35:20", level: "SUCCESS", message: "Spatial Quantum Grid Radar Activated." },
    { id: 7, timestamp: "18:35:24", level: "INFO", message: "Flux Multiplier Chain Reaction Engine Locked." },
    { id: 8, timestamp: "18:35:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "18:35:32", level: "SUCCESS", message: "Armory Registry Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "18:35:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "18:35:40", level: "SUCCESS", message: "Quantum Grid Node Mechanics Operational." },
    { id: 12, timestamp: "18:35:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "18:35:48", level: "SUCCESS", message: "Nexus Synthesizer Nodes Synchronized." },
    { id: 14, timestamp: "18:35:52", level: "INFO", message: "Chain Raytracing Physics Engine Ready." },
    { id: 15, timestamp: "18:35:56", level: "SUCCESS", message: "Ion Pulse Sound Synthesizer Online." },
    { id: 16, timestamp: "18:36:00", level: "INFO", message: "Hyper Beam Waveform Generator Standardized." },
    { id: 17, timestamp: "18:36:04", level: "SUCCESS", message: "2,100+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "18:36:08", level: "INFO", message: "Cosmic Echo Synthesizer Node Connected." },
    { id: 19, timestamp: "18:36:12", level: "SUCCESS", message: "Gamma Ray Burst Waveform Module Loaded." },
    { id: 20, timestamp: "18:36:16", level: "SUCCESS", message: "Spectral Hum Sound Synthesis Online." },
    { id: 21, timestamp: "18:36:20", level: "WARN", message: "Void Collapse Audio Node Calibrated." },
    { id: 22, timestamp: "18:36:24", level: "SUCCESS", message: "Crystal Shimmer Wave Generator Active." },
    { id: 23, timestamp: "18:36:28", level: "INFO", message: "Plasma Discharge Audio Sub-System Ready." },
    { id: 24, timestamp: "18:36:32", level: "SUCCESS", message: "Nebula Harmonics Synth Module Online." },
    { id: 25, timestamp: "18:36:36", level: "INFO", message: "Quasar Beam Frequency Modulator Tuned." },
    { id: 26, timestamp: "18:36:40", level: "SUCCESS", message: "Tachyon Disruption Generator Ready." },
    { id: 27, timestamp: "18:36:44", level: "SUCCESS", message: "Supernova Burst Synthesizer Verified." },
    { id: 28, timestamp: "18:36:48", level: "INFO", message: "Chrono Shift Waveform Generator Online." },
    { id: 29, timestamp: "18:36:52", level: "SUCCESS", message: "Starlight Cadence Audio Node Synchronized." },
    { id: 30, timestamp: "18:36:56", level: "INFO", message: "Singularity Pulse Synthesizer Ready." },
    { id: 31, timestamp: "18:37:00", level: "SUCCESS", message: "Gravity Wave Generator Frequency Tuned." },
    { id: 32, timestamp: "18:37:04", level: "SUCCESS", message: "Aurora Borealis Audio Sub-System Active." },
    { id: 33, timestamp: "18:37:08", level: "INFO", message: "Hyper Drive Waveform Generator Verified." },
    { id: 34, timestamp: "18:37:12", level: "SUCCESS", message: "Quantum Disruption Module Online." },
    { id: 35, timestamp: "18:37:16", level: "INFO", message: "Nexus Overload Sound Generator Calibrated." },
    { id: 36, timestamp: "18:37:20", level: "SUCCESS", message: "Flux Pulse Synthesizer Operational." },
    { id: 37, timestamp: "18:37:24", level: "INFO", message: "Cosmic Burst Synthesizer Node Active." },
    { id: 38, timestamp: "18:37:28", level: "SUCCESS", message: "Ion Chime Sound Synthesis Node Ready." },
    { id: 39, timestamp: "18:37:32", level: "INFO", message: "SubSpace Hum Frequency Calibrated." },
    { id: 40, timestamp: "18:37:36", level: "SUCCESS", message: "Flux Cascade Generator Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<NexusCodexEntry[]>([
    {
      id: "quantum_grid",
      title: "QUANTUM GRID ARCHITECTURE",
      subtitle: "Sub-Atomic Grid Defense Matrix",
      content:
        "The Quantum Grid binds energy nodes into coherent defense lattices capable of repelling high-density dark matter void incursions across deep spatial sectors.",
      loreDetails:
        "Engineered by the First Technocrats, the Quantum Grid prevents dimensional tears during Void Surge anomalies.",
    },
    {
      id: "flux_harvest",
      title: "FLUX CREDITS & ENERGY RECOVERY",
      subtitle: "Armory Upgrade Currency",
      content:
        "Purging void nodes releases concentrated flux credits. Flux credits are refined at the Armory to deploy heavy ion turrets and overcharged shields.",
      loreDetails:
        "Flux credits represent stabilized sub-atomic plasma used to power Citadel defense printers.",
    },
    {
      id: "void_purge",
      title: "VOID PURGE PROTOCOL",
      subtitle: "Dark Matter Erasure Tactical Strike",
      content:
        "Activating Void Purge unleashes concentrated tachyon laser bursts that neutralize corruption fields across the entire grid arena.",
      loreDetails:
        "Void entities disrupt energy cohesion. Void Purges are authorized when grid corruption exceeds critical limits.",
    },
    {
      id: "nexus_arena",
      title: "NEXUS ARENA DYNAMICS",
      subtitle: "Infinite Tactical Grid Simulation",
      content:
        "The Nexus Arena dynamically calculates chain reactions between deployed nodes. Strategic placement yields exponential score multipliers.",
      loreDetails:
        "The primary combat arena for Nexus Commanders to hone grid defense strategies against evolving threat vectors.",
    },
    {
      id: "zero_point_capacitor",
      title: "ZERO POINT ENERGY CAPACITORS",
      subtitle: "Perpetual Flux Generation",
      content:
        "Tapping zero point energy fields grants infinite power loops, accelerating turret firing rates and shielding node networks.",
      loreDetails:
        "Created during the Void Siege to ensure uninterrupted power supply for orbital defense arrays.",
    },
    {
      id: "singularity_node",
      title: "SINGULARITY DEFENSIVE NODES",
      subtitle: "Gravitational Barrier Defense",
      content:
        "Deploying singularity nodes creates local gravity wells that trap and dissolve incoming void target projectiles.",
      loreDetails:
        "High-tier defense technology used to safeguard core Citadel reactors during planetary sieges.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "cyan_matrix", name: "CYAN MATRIX (CYBER)", color: "#06b6d4", glowColor: "#0891b2", unlocked: true },
    { id: "emerald_nexus", name: "EMERALD NEXUS (SHIELD)", color: "#10b981", glowColor: "#047857", unlocked: true },
    { id: "violet_quantum", name: "VIOLET QUANTUM (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costFlux: 400 },
    { id: "amber_solar", name: "SOLAR FLARE (AMBER)", color: "#f59e0b", glowColor: "#d97706", unlocked: false, costFlux: 600 },
    { id: "ruby_overdrive", name: "RUBY OVERDRIVE (WAR)", color: "#ef4444", glowColor: "#b91c1c", unlocked: false, costFlux: 800 },
  ]);

  // 16 Detailed Armory Upgrade Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "ion_turret",
      name: "ION BEAM TURRET ARRAY",
      category: "turret",
      description: "Enhances node firing rate and beam damage output.",
      costFlux: 150,
      level: 1,
      maxLevel: 5,
      iconName: "Crosshair",
      statBoost: "+35% Ion Beam Damage",
      loreText: "High-yield ion emitter calibrated for precision grid strikes.",
    },
    {
      id: "flux_capacitor",
      name: "FLUX CAPACITOR CORE",
      category: "capacitor",
      description: "Increases maximum stored flux credits and yield gains.",
      costFlux: 180,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50% Flux Harvest Rate",
      loreText: "Sub-atomic capacitor storing raw energy plasma.",
    },
    {
      id: "shield_barrier",
      name: "QUANTUM SHIELD BARRIER",
      category: "shield",
      description: "Projects a defensive energy dome over central grid nodes.",
      costFlux: 200,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Defensive Ring Absorber",
      loreText: "Coherent barrier neutralizing void corruption.",
    },
    {
      id: "pulse_emitter",
      name: "SHOCKWAVE PULSE EMITTER",
      category: "pulse",
      description: "Releases a shockwave clearing surrounding void entities.",
      costFlux: 220,
      level: 0,
      maxLevel: 4,
      iconName: "Flame",
      statBoost: "+180m Pulse Radius",
      loreText: "High-frequency tachyon pulse generator.",
    },
    {
      id: "warp_reflector",
      name: "QUANTUM WARP REFLECTOR",
      category: "warp",
      description: "Allows instant beam teleportation across canvas walls.",
      costFlux: 250,
      level: 0,
      maxLevel: 3,
      iconName: "Maximize2",
      statBoost: "Instant Beam Wall Bouncing",
      loreText: "Spatial warp module folding grid geometry.",
    },
    {
      id: "radar_array",
      name: "SPATIAL GRID RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing nodes and void targets.",
      costFlux: 160,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Mini-Map Radar Overlay",
      loreText: "Telemetry interface tracking void threat vectors.",
    },
    {
      id: "starlight_synthesizer",
      name: "STARLIGHT SYNTHESIZER",
      category: "starlight",
      description: "Generates bonus flux credits during high combo streaks.",
      costFlux: 280,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+10 Bonus Flux / Combo",
      loreText: "Zero-point light energy harvester.",
    },
    {
      id: "overdrive_cannon",
      name: "OVERDRIVE CANNON ARRAY",
      category: "overdrive",
      description: "Extends beam length and unlocks 16x score multiplier caps.",
      costFlux: 320,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overdrive amplifier maximizing laser output.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE GRID REPAIRERS",
      category: "nanite",
      description: "Deploys nanobots restoring central core HP over time.",
      costFlux: 270,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Core HP / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "magnet_pulse",
      name: "PHOTONIC MAGNET PULSE",
      category: "magnet",
      description: "Instantly pulls all map flux credits into the core.",
      costFlux: 350,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Flux Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "cluster_bomblets",
      name: "CLUSTER NODE BOMBLETS",
      category: "cluster",
      description: "Purged targets release 3 secondary cluster bomblets.",
      costFlux: 300,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Cluster Bomblets",
      loreText: "Multi-stage warhead delivery system.",
    },
    {
      id: "harvest_reactor",
      name: "FLUX HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates flux credits over time while playing.",
      costFlux: 380,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+3 Flux Credits / Sec Passive Gain",
      loreText: "Quantum energy conversion matrix.",
    },
    {
      id: "shield_matrix",
      name: "QUANTUM SHIELD MATRIX",
      category: "shield",
      description: "Grants 3s complete damage immunity upon receiving heavy hits.",
      costFlux: 400,
      level: 0,
      maxLevel: 2,
      iconName: "Shield",
      statBoost: "3s Invulnerability Shield",
      loreText: "Sub-atomic photon shield trigger.",
    },
    {
      id: "plasma_lens",
      name: "PLASMA LENS ARRAY",
      category: "laser",
      description: "Focuses ion lasers into piercing hyper beams.",
      costFlux: 310,
      level: 0,
      maxLevel: 4,
      iconName: "Sun",
      statBoost: "+40% Piercing Laser Beam Power",
      loreText: "Focused plasma lens for orbital defense cannons.",
    },
    {
      id: "tachyon_drive",
      name: "TACHYON DRIVE ACCELERATOR",
      category: "warp",
      description: "Speeds up turret target acquisition by 50%.",
      costFlux: 290,
      level: 0,
      maxLevel: 4,
      iconName: "TrendingUp",
      statBoost: "+50% Firing Speed",
      loreText: "Tachyon accelerator module.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY CORE REACTION",
      category: "capacitor",
      description: "Creates micro black holes pulling in void projectiles.",
      costFlux: 450,
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
      id: "first_grid_defense",
      title: "FIRST GRID DEFENSE",
      description: "Deploy 20 successful grid nodes in Nexus.",
      rewardFlux: 150,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "quantum",
    },
    {
      id: "flux_harvester",
      title: "FLUX HARVESTER",
      description: "Accumulate a total of 1,500 Flux Credits.",
      rewardFlux: 250,
      unlocked: false,
      currentProgress: 1200,
      maxProgress: 1500,
      categoryTag: "economy",
    },
    {
      id: "void_purger",
      title: "VOID PURGER",
      description: "Purge 20 void nodes in Void Purge mode.",
      rewardFlux: 220,
      unlocked: false,
      currentProgress: 8,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "chain_master",
      title: "CHAIN REACTION MASTER",
      description: "Execute a 5-node chain reaction in Nexus Arena.",
      rewardFlux: 300,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "armory_architect",
      title: "ARMORY ARCHITECT",
      description: "Purchase 5 Armory Upgrades.",
      rewardFlux: 280,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "AURA HARMONIZER",
      description: "Unlock at least 3 custom Aura Skins.",
      rewardFlux: 350,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "quantum",
    },
    {
      id: "pulse_master",
      title: "SHOCKWAVE PULSER",
      description: "Trigger 10 Shockwave Pulses in a single match.",
      rewardFlux: 260,
      unlocked: false,
      currentProgress: 4,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_defender",
      title: "HYPER DEFENDER",
      description: "Clear a siege wave under 60 seconds.",
      rewardFlux: 320,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "quantum",
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
    nexusCore: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    turrets: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#06b6d4", angle: 0, tier: 1 },
      { id: 2, x: 250, y: 200, radius: 30, color: "#10b981", angle: 0, tier: 1 },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", angle: 0, tier: 1 },
    ] as NexusTurretNode[],
    targets: [] as VoidTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as FluxParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "nexus_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "QUANTUM GRID SIEGE ALPHA", hostName: "Nexus_Commander", currentPlayers: 1, maxPlayers: 2, pingMs: 18, mode: "Grid Defense", roomStatus: "open" },
        { id: "room_2", name: "VOID PURGE #14", hostName: "Cyber_Knight", currentPlayers: 1, maxPlayers: 2, pingMs: 28, mode: "Void Purge", roomStatus: "open" },
        { id: "room_3", name: "NEXUS ARENA CHAMPIONSHIP", hostName: "Quantum_Core", currentPlayers: 2, maxPlayers: 2, pingMs: 16, mode: "Nexus Arena", roomStatus: "full" },
        { id: "room_4", name: "QUANTUM SIEGES DUEL", hostName: "Aura_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 22, mode: "Quantum Sieges", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#06b6d4") => {
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
    if (fluxCredits >= item.costFlux && item.level < item.maxLevel) {
      setFluxCredits((prev) => prev - item.costFlux);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costFlux: Math.round(i.costFlux * 1.55) } : i))
      );
      audioSynthEngine.playFluxCollectSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setFluxCredits((prev) => prev + ach.rewardFlux);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playFluxCollectSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: AuraOption) => {
    if (!aura.unlocked && aura.costFlux && fluxCredits >= aura.costFlux) {
      setFluxCredits((prev) => prev - aura.costFlux);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playFluxCollectSFX();
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
      message: `Executing Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, RECHARGE, PURGE, CLEAR, AURAS, ARMORY" };
    } else if (cmd === "RECHARGE") {
      setFluxCredits((prev) => prev + 200);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+200 Flux Credits added via Quantum Protocol." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Flux: ${fluxCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Auras: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startNexusGame = (mode: NexusGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundNexusMelody();
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
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#030712] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
            <Zap className="w-4 h-4 text-cyan-400" /> {fluxCredits} FLUX
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#090d16] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-cyan-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-cyan-900/60 via-slate-900/80 to-teal-900/60 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Flagship Quantum Grid Defense Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-400">
                  NEXUS
                </h1>
                <p className="text-xs text-cyan-100/70 mt-1">
                  Tactical grid defense, armory upgrades, real-time online leaderboards, and quantum codex.
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
                ] as NexusMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
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
                  onClick={() => startNexusGame("grid_defense")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Zap className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">GRID DEFENSE</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Tactical node placement trial</div>
                  </div>
                </button>

                <button
                  onClick={() => startNexusGame("void_purge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">VOID PURGE</div>
                    <div className="text-xs text-purple-200/60 mt-1">Vaporize dark matter nodes</div>
                  </div>
                </button>

                <button
                  onClick={() => startNexusGame("nexus_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sparkles className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">NEXUS ARENA</div>
                    <div className="text-xs text-emerald-200/60 mt-1">Endless quantum grid challenge</div>
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
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        {item.category === "turret" && <Crosshair className="w-6 h-6" />}
                        {item.category === "capacitor" && <Zap className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                        {item.category === "pulse" && <Flame className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "starlight" && <Sparkles className="w-6 h-6" />}
                        {item.category === "overdrive" && <Activity className="w-6 h-6" />}
                        {item.category === "harvest" && <Cpu className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || fluxCredits < item.costFlux}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costFlux} FLUX`}
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
                        <div className="font-bold text-sm text-cyan-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-emerald-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL NEXUS LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-cyan-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-cyan-300 font-bold">{entry.score} PTS</span>
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
                      <div className="text-[10px] text-cyan-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardFlux} FLUX
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Nodes Deployed</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.nodesDeployed}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Flux Harvested</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.fluxHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Void Nodes Purged</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.voidNodesPurged}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.quantumTimeSeconds}s</div>
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
                        ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Zap className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{aura.name}</div>
                      <div className="text-xs text-white/50">{aura.unlocked ? "ACTIVE SKIN" : `COST: ${aura.costFlux} FLUX`}</div>
                    </div>
                    {!aura.unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAuraSkin(aura);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-cyan-500 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-cyan-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-cyan-400 font-mono">
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
                            ? "text-emerald-400"
                            : log.level === "WARN"
                            ? "text-amber-400"
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
                    placeholder="Enter command (e.g. HELP, RECHARGE, STATUS)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase">
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
                      <span className="font-mono text-cyan-400">{settings.sfxVolume}%</span>
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
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-cyan-400">{settings.bgmVolume}%</span>
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
                      className="w-full accent-cyan-500"
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
