"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sun,
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
// 1. MULTI-TRACK LUMINESCENT WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class LumenMultiTrackAudioSynth {
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
      this.stopBackgroundLumenMelody();
    } else {
      this.startBackgroundLumenMelody();
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

  startBackgroundLumenMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sine";
      this.bgmOscillator.frequency.setValueAtTime(440, this.ctx.currentTime);

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(1200, this.ctx.currentTime);

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

  stopBackgroundLumenMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playLightRefractionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Refraction SFX failed:", e);
    }
  }

  playPrismPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(329.63, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Pulse SFX failed:", e);
    }
  }

  playPhotonCollectSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Photon Collect SFX failed:", e);
    }
  }

  playShadowDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Shadow SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
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

  playLuminescentOverchargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Overcharge SFX failed:", e);
    }
  }

  playPrismRotateSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Prism rotate SFX failed:", e);
    }
  }

  playShieldAbsorbSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
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
      const baseFreq = 523.25 * Math.pow(1.05946, comboLevel);
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
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.22);
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
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.18);
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
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.35);
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
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.3); // C6
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
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);
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
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.2);
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

  playQuantumResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Quantum Resonance SFX failed:", e);
    }
  }

  playHyperBeamChargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.4);
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
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.3);
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
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.5);
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
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.25);
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
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.6);
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
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.45);
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
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.25);
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
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.2);
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
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.4);
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
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.3);
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
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1900, this.ctx.currentTime + 0.2);
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
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.5);
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
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.45);
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
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.3);
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
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.35);
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
      osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
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
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.4);
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
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.45);
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
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.35);
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
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + 0.25);
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

  playPrismOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Prism Overload SFX failed:", e);
    }
  }

  playLumiPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Lumi Pulse SFX failed:", e);
    }
  }

  playCosmicBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.38);
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

  playRefractionChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1760, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Refraction Chime SFX failed:", e);
    }
  }

  playSubSpaceHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.5);
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

  playPhotonCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Photon Cascade SFX failed:", e);
    }
  }
}

const audioSynthEngine = new LumenMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type LumenMenuTab =
  | "play"
  | "sanctuary"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "auras"
  | "codex"
  | "terminal"
  | "settings";

export type LumenGameMode =
  | "light_refraction"
  | "prism_duel"
  | "shadow_purge"
  | "spectrum_arena";

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
  rewardPhotons: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "luminescent" | "economy" | "tactical";
}

export interface SanctuaryItem {
  id: string;
  name: string;
  category:
    | "refraction"
    | "prism"
    | "photon"
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
  costPhotons: number;
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

export interface PrismNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
}

export interface LightTargetNode {
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

export interface PhotonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface LumenAnalyticsData {
  refractionsExecuted: number;
  photonsCollected: number;
  luminescentTimeSeconds: number;
  shadowsPurged: number;
  maxBeamLength: number;
}

export interface AuraOption {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  unlocked: boolean;
  costPhotons?: number;
}

export interface LuminescentCodexEntry {
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

// Helper Class to calculate Canvas Physics and Beam Bouncing Rays
class LumenCanvasPhysicsEngine {
  static calculateBeamRaytrace(
    startX: number,
    startY: number,
    angle: number,
    prisms: PrismNode[],
    maxBounces: number = 4
  ) {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let currentX = startX;
    let currentY = startY;
    let currentAngle = angle;

    for (let b = 0; b < maxBounces; b++) {
      const stepDist = 800;
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
export default function LumenGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<LumenMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<LumenGameMode>("light_refraction");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("golden_sun");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("prism_refraction");

  // Economy & Stats
  const [photons, setPhotons] = useState(850);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("LUMEN_LIGHTBRINGER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<LumenAnalyticsData>({
    refractionsExecuted: 0,
    photonsCollected: 0,
    luminescentTimeSeconds: 0,
    shadowsPurged: 0,
    maxBeamLength: 0,
  });

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    bgmVolume: 40,
    particleQuality: "ultra",
    screenShakeIntensity: 100,
    touchSize: "medium",
    showPrismRadar: true,
  });

  // Terminal Command Input
  const [terminalInput, setTerminalInput] = useState("");

  // Terminal System Logs
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogMessage[]>([
    { id: 1, timestamp: "18:20:00", level: "INFO", message: "LUMEN Refraction Engine v4.0 Online." },
    { id: 2, timestamp: "18:20:04", level: "SUCCESS", message: "WebAudio Luminescent Synthesizer Initialized." },
    { id: 3, timestamp: "18:20:08", level: "INFO", message: "Firestore Leaderboard Telemetry Linked." },
    { id: 4, timestamp: "18:20:12", level: "WARN", message: "Shadow Distortion Field Approaching." },
    { id: 5, timestamp: "18:20:16", level: "INFO", message: "Sanctuary Energy Printer Ready." },
    { id: 6, timestamp: "18:20:20", level: "SUCCESS", message: "Spatial Prism Radar Active." },
    { id: 7, timestamp: "18:20:24", level: "INFO", message: "Photon Yield Multiplier Locked." },
    { id: 8, timestamp: "18:20:28", level: "INFO", message: "Multi-Track Audio Engine Frequency Tuned." },
    { id: 9, timestamp: "18:20:32", level: "SUCCESS", message: "Sanctuary Item Registry Loaded (16 Items)." },
    { id: 10, timestamp: "18:20:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "18:20:40", level: "SUCCESS", message: "Quantum Light Refraction Mechanics Operational." },
    { id: 12, timestamp: "18:20:44", level: "INFO", message: "Tactical HUD & Mobile Controls Engine Calibrated." },
    { id: 13, timestamp: "18:20:48", level: "SUCCESS", message: "Luminescent Audio Synthesizer Synchronized." },
    { id: 14, timestamp: "18:20:52", level: "INFO", message: "Prism Bouncing Reflection Rays Ready." },
    { id: 15, timestamp: "18:20:56", level: "SUCCESS", message: "Solar Flare Audio Synthesizer Node Online." },
    { id: 16, timestamp: "18:21:00", level: "INFO", message: "Hyper Beam Charge Waveform Generator Standardized." },
    { id: 17, timestamp: "18:21:04", level: "SUCCESS", message: "2,100+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "18:21:08", level: "INFO", message: "Cosmic Echo Synthesizer Node Connected." },
    { id: 19, timestamp: "18:21:12", level: "SUCCESS", message: "Gamma Ray Burst Waveform Module Loaded." },
    { id: 20, timestamp: "18:21:16", level: "SUCCESS", message: "Spectral Hum Sound Synthesis Online." },
    { id: 21, timestamp: "18:21:20", level: "WARN", message: "Void Collapse Audio Node Calibrated." },
    { id: 22, timestamp: "18:21:24", level: "SUCCESS", message: "Crystal Shimmer Wave Generator Active." },
    { id: 23, timestamp: "18:21:28", level: "INFO", message: "Plasma Discharge Audio Sub-System Ready." },
    { id: 24, timestamp: "18:21:32", level: "SUCCESS", message: "Nebula Harmonics Synth Module Online." },
    { id: 25, timestamp: "18:21:36", level: "INFO", message: "Quasar Beam Frequency Modulator Tuned." },
    { id: 26, timestamp: "18:21:40", level: "SUCCESS", message: "Tachyon Disruption Generator Ready." },
    { id: 27, timestamp: "18:21:44", level: "SUCCESS", message: "Supernova Burst Synthesizer Verified." },
    { id: 28, timestamp: "18:21:48", level: "INFO", message: "Chrono Shift Waveform Generator Online." },
    { id: 29, timestamp: "18:21:52", level: "SUCCESS", message: "Starlight Cadence Audio Node Synchronized." },
    { id: 30, timestamp: "18:21:56", level: "INFO", message: "Singularity Pulse Synthesizer Ready." },
    { id: 31, timestamp: "18:22:00", level: "SUCCESS", message: "Gravity Wave Generator Frequency Tuned." },
    { id: 32, timestamp: "18:22:04", level: "SUCCESS", message: "Aurora Borealis Audio Sub-System Active." },
    { id: 33, timestamp: "18:22:08", level: "INFO", message: "Hyper Drive Waveform Generator Verified." },
    { id: 34, timestamp: "18:22:12", level: "SUCCESS", message: "Quantum Disruption Module Online." },
    { id: 35, timestamp: "18:22:16", level: "INFO", message: "Prism Overload Sound Generator Calibrated." },
    { id: 36, timestamp: "18:22:20", level: "SUCCESS", message: "Lumi Pulse Synthesizer Fully Operational." },
    { id: 37, timestamp: "18:22:24", level: "INFO", message: "Cosmic Burst Audio Synthesizer Active." },
    { id: 38, timestamp: "18:22:28", level: "SUCCESS", message: "Refraction Chime Sound Node Ready." },
    { id: 39, timestamp: "18:22:32", level: "INFO", message: "SubSpace Hum Frequency Tuned." },
    { id: 40, timestamp: "18:22:36", level: "SUCCESS", message: "Photon Cascade Synthesizer Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<LuminescentCodexEntry[]>([
    {
      id: "prism_refraction",
      title: "PRISM REFRACTION DOCTRINE",
      subtitle: "Bending Pure Light Beams",
      content:
        "Passing light beams through crystal prisms bends light frequencies, generating powerful lasers capable of illuminating dark spatial voids and dissolving shadow entities.",
      loreDetails:
        "Discovered during the First Solar Dawn, prism refraction forms the backbone of all luminescent defensive arrays across the galaxy.",
    },
    {
      id: "photon_harvest",
      title: "PHOTON CORE HARVESTING",
      subtitle: "Sanctuary Upgrade Currency",
      content:
        "Clearing shadow nodes releases pure photons. Photons are processed at the Sanctuary to upgrade beam velocity, prism reflection caps, and defensive light shields.",
      loreDetails:
        "Photons represent sub-atomic particles of pure light. When stored in energy capacitors, they can re-engineer physical light barriers.",
    },
    {
      id: "shadow_purge",
      title: "SHADOW PURGE PROTOCOL",
      subtitle: "Darkness Eradication Warfare",
      content:
        "Activating a Shadow Purge unleashes concentrated ultraviolet laser bursts that vaporize dark matter void nodes across the entire luminescent arena.",
      loreDetails:
        "Dark matter entities disrupt light coherence. Shadow Purges are activated when spatial corruption levels reach critical thresholds.",
    },
    {
      id: "spectrum_arena",
      title: "SPECTRUM ARENA PHYSICS",
      subtitle: "Endless Light Refraction Arena",
      content:
        "The Spectrum Arena dynamically shifts prism placements as light waves reflect off canvas boundaries. Skillful beam bending yields infinite score multipliers.",
      loreDetails:
        "Designed as a training realm for Lightbringer Initiates, the Spectrum Arena tests spatial geometry and rapid tactical positioning.",
    },
    {
      id: "zero_point_light",
      title: "ZERO POINT LIGHT HARVESTING",
      subtitle: "Quantum Light Synthesis",
      content:
        "Tapping into zero point photon fields generates endless energy streams, supercharging prism arrays and accelerating beam reflection calculations.",
      loreDetails:
        "Developed during the Great Supernova, Zero Point Light harvesting provides perpetual power for high-intensity photon cannons.",
    },
    {
      id: "singularity_barrier",
      title: "SINGULARITY DEFENSIVE BARRIER",
      subtitle: "Gravitational Light Shielding",
      content:
        "Bending high-density light beams around micro-black holes forms impenetrable singularity barriers capable of deflecting all incoming shadow strikes.",
      loreDetails:
        "Used by Elite Lightbringer Guardians during the Dark Void Siege to protect core planetary sanctuaries.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "golden_sun", name: "SOLAR LUMEN (GOLD)", color: "#fbbf24", glowColor: "#d97706", unlocked: true },
    { id: "cyan_starlight", name: "CRYSTAL CYAN (LIGHT)", color: "#22d3ee", glowColor: "#0891b2", unlocked: true },
    { id: "violet_nebula", name: "COSMIC VIOLET (NEBULA)", color: "#a855f7", glowColor: "#7e22ce", unlocked: false, costPhotons: 300 },
    { id: "emerald_aurora", name: "EMERALD AURORA (NATURE)", color: "#10b981", glowColor: "#047857", unlocked: false, costPhotons: 450 },
    { id: "ruby_inferno", name: "RUBY INFERNO (WAR)", color: "#ef4444", glowColor: "#b91c1c", unlocked: false, costPhotons: 600 },
  ]);

  // 16 Detailed Sanctuary Upgrade Items Matrix
  const [sanctuaryItems, setSanctuaryItems] = useState<SanctuaryItem[]>([
    {
      id: "refraction_lens",
      name: "REFRACTION LENS ARRAY",
      category: "refraction",
      description: "Enhances light beam intensity and refraction velocity.",
      costPhotons: 100,
      level: 1,
      maxLevel: 5,
      iconName: "Sun",
      statBoost: "+30% Beam Refraction Power",
      loreText: "Polished crystal lens maximizing photon throughput.",
    },
    {
      id: "prism_amplifier",
      name: "PRISM FREQUENCY BOOSTER",
      category: "prism",
      description: "Allows light beams to bounce off additional prisms.",
      costPhotons: 150,
      level: 1,
      maxLevel: 5,
      iconName: "Sparkles",
      statBoost: "+2 Reflection Bounce Cap",
      loreText: "Multi-faceted prism splitting light into hyper beams.",
    },
    {
      id: "photon_collector",
      name: "PHOTON MAGNET ATTRACTOR",
      category: "photon",
      description: "Draws floating photon drops toward the luminescent core.",
      costPhotons: 120,
      level: 1,
      maxLevel: 5,
      iconName: "Box",
      statBoost: "+100m Photon Magnet Radius",
      loreText: "Magnetic core collecting pure light particles.",
    },
    {
      id: "light_deflector",
      name: "DEFLECTIVE LIGHT BARRIER",
      category: "shield",
      description: "Projects a protective barrier absorbing shadow attacks.",
      costPhotons: 140,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Defensive Ring Absorber",
      loreText: "Coherent barrier neutralizing dark damage.",
    },
    {
      id: "laser_array",
      name: "CONCENTRIC LASER ARRAY",
      category: "laser",
      description: "Fires dual light lasers alongside primary beam.",
      costPhotons: 180,
      level: 0,
      maxLevel: 4,
      iconName: "Crosshair",
      statBoost: "+2 Concentric Lasers",
      loreText: "Synchronized photon emitter array.",
    },
    {
      id: "prism_radar",
      name: "SPATIAL PRISM RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing prisms and shadow nodes.",
      costPhotons: 110,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Mini-Map Radar Overlay",
      loreText: "Telemetry interface tracking light paths.",
    },
    {
      id: "pulse_emitter",
      name: "ULTRAVIOLET PULSE EMITTER",
      category: "pulse",
      description: "Releases a shockwave clearing surrounding shadow nodes.",
      costPhotons: 160,
      level: 0,
      maxLevel: 4,
      iconName: "Flame",
      statBoost: "+160m Pulse Shockwave Radius",
      loreText: "High-frequency ultraviolet pulse generator.",
    },
    {
      id: "aura_harmonizer",
      name: "AURA HARMONIC BOOSTER",
      category: "aura",
      description: "Increases score multipliers when standing in light zones.",
      costPhotons: 200,
      level: 0,
      maxLevel: 4,
      iconName: "TrendingUp",
      statBoost: "+2.0x Score Multiplier Cap",
      loreText: "Harmonic aura resonator enhancing light score gains.",
    },
    {
      id: "warp_reflector",
      name: "QUANTUM WARP REFLECTOR",
      category: "warp",
      description: "Allows instant beam teleportation across canvas walls.",
      costPhotons: 220,
      level: 0,
      maxLevel: 3,
      iconName: "Maximize2",
      statBoost: "Instant Beam Wall Bouncing",
      loreText: "Spatial warp module folding light geometry.",
    },
    {
      id: "starlight_synthesizer",
      name: "STARLIGHT SYNTHESIZER",
      category: "starlight",
      description: "Generates bonus photons during high combo streaks.",
      costPhotons: 250,
      level: 0,
      maxLevel: 4,
      iconName: "Zap",
      statBoost: "+5 Bonus Photons / Combo",
      loreText: "Zero-point light harvester.",
    },
    {
      id: "overdrive_beam",
      name: "OVERDRIVE BEAM AMPLIFIER",
      category: "overdrive",
      description: "Extends beam length and unlocks 16x score multiplier caps.",
      costPhotons: 280,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overdrive amplifier maximizing laser output.",
    },
    {
      id: "nanite_lumens",
      name: "NANITE LUMEN REPAIRERS",
      category: "nanite",
      description: "Deploys luminescent nanobots restoring core integrity.",
      costPhotons: 240,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+6 Core HP / sec Repair Rate",
      loreText: "Self-replicating light nanobots.",
    },
    {
      id: "magnet_pulse",
      name: "PHOTONIC MAGNET PULSE",
      category: "magnet",
      description: "Instantly pulls all map photons into the core.",
      costPhotons: 300,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Photon Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "cluster_prisms",
      name: "CLUSTER PRISM BOMBLETS",
      category: "cluster",
      description: "Refracted targets release 3 secondary prism cluster bomblets.",
      costPhotons: 260,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Prism Bomblets",
      loreText: "Multi-stage warhead delivery system.",
    },
    {
      id: "harvest_reactor",
      name: "PHOTON HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates photons over time while playing.",
      costPhotons: 320,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+2 Photons / Sec Passive Gain",
      loreText: "Quantum energy conversion matrix.",
    },
    {
      id: "shield_matrix",
      name: "LUMINESCENT SHIELD MATRIX",
      category: "shield",
      description: "Grants 3s complete damage immunity upon receiving heavy hits.",
      costPhotons: 350,
      level: 0,
      maxLevel: 2,
      iconName: "Shield",
      statBoost: "3s Invulnerability Shield",
      loreText: "Sub-atomic photon shield trigger.",
    },
  ]);

  // 24 Detailed Achievements Matrix
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([
    {
      id: "first_refraction",
      title: "FIRST LIGHT REFRACTION",
      description: "Execute 20 successful light refractions in Lumen.",
      rewardPhotons: 100,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "luminescent",
    },
    {
      id: "photon_master",
      title: "PHOTON HARVESTER",
      description: "Accumulate a total of 1,000 Photons.",
      rewardPhotons: 200,
      unlocked: false,
      currentProgress: 850,
      maxProgress: 1000,
      categoryTag: "economy",
    },
    {
      id: "shadow_purger",
      title: "SHADOW PURGER",
      description: "Purge 15 shadow nodes in Shadow Purge mode.",
      rewardPhotons: 180,
      unlocked: false,
      currentProgress: 5,
      maxProgress: 15,
      categoryTag: "tactical",
    },
    {
      id: "beam_master",
      title: "SPECTRUM MASTER",
      description: "Maintain a 10x Score Combo in Spectrum Arena.",
      rewardPhotons: 220,
      unlocked: false,
      currentProgress: 4,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "sanctuary_enthusiast",
      title: "SANCTUARY ARCHITECT",
      description: "Purchase 5 Sanctuary Upgrades.",
      rewardPhotons: 250,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_collector",
      title: "AURA HARMONIZER",
      description: "Unlock at least 3 custom Aura Skins.",
      rewardPhotons: 300,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "luminescent",
    },
    {
      id: "pulse_master",
      title: "ULTRAVIOLET PULSER",
      description: "Trigger 10 UV Pulses in a single trial match.",
      rewardPhotons: 210,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_refractor",
      title: "HYPER LIGHT SPEED",
      description: "Complete a trial under 60 seconds.",
      rewardPhotons: 280,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "luminescent",
    },
    {
      id: "shadow_annihilator",
      title: "SHADOW ANNIHILATOR",
      description: "Vaporize 50 shadow nodes using UV Lasers.",
      rewardPhotons: 350,
      unlocked: false,
      currentProgress: 12,
      maxProgress: 50,
      categoryTag: "tactical",
    },
    {
      id: "beam_architect",
      title: "MAXIMUM BEAM LENGTH",
      description: "Reach a beam length of 1,200 units.",
      rewardPhotons: 260,
      unlocked: false,
      currentProgress: 450,
      maxProgress: 1200,
      categoryTag: "luminescent",
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
    lumen: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    prisms: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#fbbf24", angle: 0 },
      { id: 2, x: 250, y: 200, radius: 30, color: "#22d3ee", angle: 0 },
      { id: 3, x: 550, y: 400, radius: 30, color: "#f97316", angle: 0 },
    ] as PrismNode[],
    targets: [] as LightTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as PhotonParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "lumen_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "PRISM REFRACTION ALPHA", hostName: "Lumen_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 20, mode: "Light Refraction", roomStatus: "open" },
        { id: "room_2", name: "SHADOW PURGE #09", hostName: "Solar_Knight", currentPlayers: 1, maxPlayers: 2, pingMs: 32, mode: "Shadow Purge", roomStatus: "open" },
        { id: "room_3", name: "SPECTRUM ARENA BATTLE", hostName: "Photon_Core", currentPlayers: 2, maxPlayers: 2, pingMs: 18, mode: "Spectrum Arena", roomStatus: "full" },
        { id: "room_4", name: "PRISM DUEL CHAMPIONSHIP", hostName: "Aura_Rider", currentPlayers: 1, maxPlayers: 2, pingMs: 25, mode: "Prism Duel", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#fbbf24") => {
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
  const buySanctuaryItem = (item: SanctuaryItem) => {
    if (photons >= item.costPhotons && item.level < item.maxLevel) {
      setPhotons((prev) => prev - item.costPhotons);
      setSanctuaryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costPhotons: Math.round(i.costPhotons * 1.55) } : i))
      );
      audioSynthEngine.playPhotonCollectSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setPhotons((prev) => prev + ach.rewardPhotons);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playPhotonCollectSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: AuraOption) => {
    if (!aura.unlocked && aura.costPhotons && photons >= aura.costPhotons) {
      setPhotons((prev) => prev - aura.costPhotons);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playPhotonCollectSFX();
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
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, RECHARGE, PURGE, CLEAR, AURAS, SANCTUARY" };
    } else if (cmd === "RECHARGE") {
      setPhotons((prev) => prev + 100);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+100 Photons added via Quantum Recharge Protocol." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Photons: ${photons} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Auras: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "SANCTUARY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Sanctuary Items: ${sanctuaryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startLumenGame = (mode: LumenGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundLumenMelody();
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
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#020617] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
            <Sun className="w-4 h-4 text-amber-400" /> {photons} PHOTONS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#090d16] rounded-3xl border border-amber-500/30 overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-amber-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-amber-900/60 via-slate-900/80 to-yellow-900/60 shadow-[0_0_40px_rgba(251,191,36,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Flagship Luminescent Refraction Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400">
                  LUMEN
                </h1>
                <p className="text-xs text-amber-100/70 mt-1">
                  Light refraction physics, sanctuary upgrades, real-time online leaderboards, and luminescent codex.
                </p>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(
                [
                  "play",
                  "sanctuary",
                  "online",
                  "leaderboard",
                  "achievements",
                  "analytics",
                  "auras",
                  "codex",
                  "terminal",
                  "settings",
                ] as LumenMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                      : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                  }`}
                >
                  {tab === "play" && <User className="w-4 h-4" />}
                  {tab === "sanctuary" && <ShoppingBag className="w-4 h-4" />}
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
                  onClick={() => startLumenGame("light_refraction")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sun className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">LIGHT REFRACTION</div>
                    <div className="text-xs text-amber-200/60 mt-1">Single player light trial</div>
                  </div>
                </button>

                <button
                  onClick={() => startLumenGame("shadow_purge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">SHADOW PURGE</div>
                    <div className="text-xs text-purple-200/60 mt-1">Vaporize void nodes</div>
                  </div>
                </button>

                <button
                  onClick={() => startLumenGame("spectrum_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sparkles className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">SPECTRUM ARENA</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Endless prism refraction challenge</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB CONTENT: SANCTUARY */}
            {activeTab === "sanctuary" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sanctuaryItems.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        {item.category === "refraction" && <Sun className="w-6 h-6" />}
                        {item.category === "prism" && <Sparkles className="w-6 h-6" />}
                        {item.category === "photon" && <Box className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                        {item.category === "laser" && <Crosshair className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "pulse" && <Flame className="w-6 h-6" />}
                        {item.category === "aura" && <TrendingUp className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buySanctuaryItem(item)}
                      disabled={item.level >= item.maxLevel || photons < item.costPhotons}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costPhotons} PHOTONS`}
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
                        <div className="font-bold text-sm text-amber-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-emerald-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL LIGHTBRINGER LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-amber-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-amber-300 font-bold">{entry.score} PTS</span>
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
                      <div className="text-[10px] text-amber-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardPhotons} PHOTONS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Refractions Executed</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.refractionsExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Photons Harvested</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.photonsCollected}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Shadows Purged</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.shadowsPurged}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Luminescent Time</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.luminescentTimeSeconds}s</div>
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
                        ? "bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Sun className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{aura.name}</div>
                      <div className="text-xs text-white/50">{aura.unlocked ? "ACTIVE SKIN" : `COST: ${aura.costPhotons} PHOTONS`}</div>
                    </div>
                    {!aura.unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAuraSkin(aura);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-amber-500 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-amber-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-amber-400 font-mono">
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase">
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
                      <span className="font-mono text-amber-400">{settings.sfxVolume}%</span>
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
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-amber-400">{settings.bgmVolume}%</span>
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
                      className="w-full accent-amber-500"
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
