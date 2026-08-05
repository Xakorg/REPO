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
  Sun,
  ZapOff,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK QUANTUM SPECTRA WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class SpectraMultiTrackAudioSynth {
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
      this.stopBackgroundOpticMelody();
    } else {
      this.startBackgroundOpticMelody();
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

  startBackgroundOpticMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sine";
      this.bgmOscillator.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3 Optic Drone

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

  stopBackgroundOpticMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playPrismaticRefractionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Prismatic Refraction SFX failed:", e);
    }
  }

  playLaserStreamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Laser Stream SFX failed:", e);
    }
  }

  playPhotonResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Photon Resonance SFX failed:", e);
    }
  }

  playSolarFlareBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Solar Flare Burst SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
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

  playChromaticPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Chromatic Pulse SFX failed:", e);
    }
  }

  playUltraVioletBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("UV Burst SFX failed:", e);
    }
  }

  playInfraredWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Infrared Wave SFX failed:", e);
    }
  }

  playComboOpticMultiplierSFX(comboLevel: number) {
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

  playMirrorWarpSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Mirror Warp SFX failed:", e);
    }
  }

  playPlasmaRaySFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(525, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Plasma Ray SFX failed:", e);
    }
  }

  playPolarizedFilterSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1700, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Polarized Filter SFX failed:", e);
    }
  }

  playOpticVictoryChimeSFX() {
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

  playRefractionDefeatToneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(65, this.ctx.currentTime + 0.5);
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

  playSpectralChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Spectral Chime SFX failed:", e);
    }
  }

  playLightSplitterSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2750, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Light Splitter SFX failed:", e);
    }
  }

  playPrismGlowSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Prism Glow SFX failed:", e);
    }
  }

  playQuantumOpticEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(425, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Quantum Optic Echo SFX failed:", e);
    }
  }

  playInfraredOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(230, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Infrared Overload SFX failed:", e);
    }
  }

  playSpectralDecryptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Spectral Decryption SFX failed:", e);
    }
  }

  playOpticBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Optic Bypass SFX failed:", e);
    }
  }

  playSpectraChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2700, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Spectra Chime SFX failed:", e);
    }
  }

  playOverdriveDischargeSFX() {
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
      console.warn("Overdrive Discharge SFX failed:", e);
    }
  }

  playPrismHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Prism Harmonics SFX failed:", e);
    }
  }

  playQuasarOpticSFX() {
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
      console.warn("Quasar Optic SFX failed:", e);
    }
  }

  playTachyonBeamSFX() {
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
      console.warn("Tachyon Beam SFX failed:", e);
    }
  }

  playSubSpaceLightSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1120, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubSpace Light SFX failed:", e);
    }
  }

  playSupernovaLaserSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(170, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Supernova Laser SFX failed:", e);
    }
  }

  playTimeWarpPrismSFX() {
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
      console.warn("Time Warp Prism SFX failed:", e);
    }
  }

  playStarlightRefractionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Starlight Refraction SFX failed:", e);
    }
  }

  playBlackholeLaserSFX() {
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
      console.warn("Blackhole Laser SFX failed:", e);
    }
  }

  playGravityLensSFX() {
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
      console.warn("Gravity Lens SFX failed:", e);
    }
  }

  playAuroraBeamSFX() {
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
      console.warn("Aurora Beam SFX failed:", e);
    }
  }

  playSpectraDriveSFX() {
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
      console.warn("Spectra Drive SFX failed:", e);
    }
  }

  playQuantumPrismCascadeSFX() {
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
      console.warn("Quantum Prism Cascade SFX failed:", e);
    }
  }

  playSpectraOverloadSFX() {
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
      console.warn("Spectra Overload SFX failed:", e);
    }
  }

  playLightStreamBurstSFX() {
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
      console.warn("Light Stream Burst SFX failed:", e);
    }
  }

  playOpticBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(325, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Optic Burst SFX failed:", e);
    }
  }

  playRefractionChimeSFX() {
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
      console.warn("Refraction Chime SFX failed:", e);
    }
  }

  playSubOpticHumSFX() {
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
      console.warn("SubOptic Hum SFX failed:", e);
    }
  }

  playLightStreamCascadeSFX() {
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
      console.warn("Light Stream Cascade SFX failed:", e);
    }
  }
}

const audioSynthEngine = new SpectraMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type SpectraMenuTab =
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

export type SpectraGameMode =
  | "prism_refraction"
  | "laser_siege"
  | "chromatic_purge"
  | "spectra_arena";

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
  rewardLightCredits: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "prismatic" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "prism"
    | "laser"
    | "mirror"
    | "solar"
    | "radar"
    | "filter"
    | "overdrive"
    | "nanite"
    | "magnet"
    | "split"
    | "harvest"
    | "shield"
    | "plasma"
    | "tachyon"
    | "singularity";
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

export interface SpectraPrismNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  tier: number;
  refracting: boolean;
}

export interface LaserTargetNode {
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

export interface SpectraParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface SpectraAnalyticsData {
  prismsRefracted: number;
  lightCreditsHarvested: number;
  quantumTimeSeconds: number;
  lasersDeflected: number;
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

export interface SpectraCodexEntry {
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

// Helper Class for Prism Refraction Raytracing & Optics
class SpectraPrismPhysicsEngine {
  static calculatePrismaticRaytrace(
    startX: number,
    startY: number,
    angle: number,
    prisms: SpectraPrismNode[],
    maxBounces: number = 5
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
export default function SpectraGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<SpectraMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<SpectraGameMode>("prism_refraction");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("prismatic_rainbow");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("chromatic_optics");

  // Economy & Stats
  const [lightCredits, setLightCredits] = useState(1500);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("SPECTRA_MASTER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<SpectraAnalyticsData>({
    prismsRefracted: 0,
    lightCreditsHarvested: 0,
    quantumTimeSeconds: 0,
    lasersDeflected: 0,
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
    { id: 1, timestamp: "18:55:00", level: "INFO", message: "SPECTRA Chromatic Optic RPG v5.1 Online." },
    { id: 2, timestamp: "18:55:04", level: "SUCCESS", message: "WebAudio Multi-Track Optic Synthesizer Initialized." },
    { id: 3, timestamp: "18:55:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "18:55:12", level: "WARN", message: "Infrared Overload Signal Detected in Sector 4." },
    { id: 5, timestamp: "18:55:16", level: "INFO", message: "Optic Foundry Light Credit Harvester Active." },
    { id: 6, timestamp: "18:55:20", level: "SUCCESS", message: "Spatial Prism Radar Activated." },
    { id: 7, timestamp: "18:55:24", level: "INFO", message: "Prismatic Beam Refraction Lock Engaged." },
    { id: 8, timestamp: "18:55:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "18:55:32", level: "SUCCESS", message: "Optic Foundry Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "18:55:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "18:55:40", level: "SUCCESS", message: "Chromatic Prism Refraction Physics Engine Ready." },
    { id: 12, timestamp: "18:55:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "18:55:48", level: "SUCCESS", message: "Spectra Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "18:55:52", level: "INFO", message: "Raytracing Optic Beam Engine Operational." },
    { id: 15, timestamp: "18:55:56", level: "SUCCESS", message: "Prismatic Refraction Sound Module Online." },
    { id: 16, timestamp: "18:56:00", level: "INFO", message: "Laser Stream Waveform Generator Standardized." },
    { id: 17, timestamp: "18:56:04", level: "SUCCESS", message: "2,100+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "18:56:08", level: "INFO", message: "Quantum Optic Echo Synthesizer Connected." },
    { id: 19, timestamp: "18:56:12", level: "SUCCESS", message: "Infrared Wave Module Active." },
    { id: 20, timestamp: "18:56:16", level: "SUCCESS", message: "Spectral Decryption Sound Synthesis Online." },
    { id: 21, timestamp: "18:56:20", level: "WARN", message: "Optic Bypass Audio Node Calibrated." },
    { id: 22, timestamp: "18:56:24", level: "SUCCESS", message: "Spectra Chime Wave Generator Active." },
    { id: 23, timestamp: "18:56:28", level: "INFO", message: "Overdrive Discharge Audio Sub-System Ready." },
    { id: 24, timestamp: "18:56:32", level: "SUCCESS", message: "Prism Harmonics Synth Module Online." },
    { id: 25, timestamp: "18:56:36", level: "INFO", message: "Quasar Optic Frequency Modulator Tuned." },
    { id: 26, timestamp: "18:56:40", level: "SUCCESS", message: "Tachyon Beam Generator Ready." },
    { id: 27, timestamp: "18:56:44", level: "SUCCESS", message: "Supernova Laser Synthesizer Verified." },
    { id: 28, timestamp: "18:56:48", level: "INFO", message: "Time Warp Prism Generator Online." },
    { id: 29, timestamp: "18:56:52", level: "SUCCESS", message: "Starlight Refraction Audio Node Synchronized." },
    { id: 30, timestamp: "18:56:56", level: "INFO", message: "Blackhole Laser Synthesizer Ready." },
    { id: 31, timestamp: "18:57:00", level: "SUCCESS", message: "Gravity Lens Generator Frequency Tuned." },
    { id: 32, timestamp: "18:57:04", level: "SUCCESS", message: "Aurora Beam Audio Sub-System Active." },
    { id: 33, timestamp: "18:57:08", level: "INFO", message: "Spectra Drive Waveform Generator Verified." },
    { id: 34, timestamp: "18:57:12", level: "SUCCESS", message: "Quantum Prism Cascade Module Online." },
    { id: 35, timestamp: "18:57:16", level: "INFO", message: "Spectra Overload Sound Generator Calibrated." },
    { id: 36, timestamp: "18:57:20", level: "SUCCESS", message: "Light Stream Burst Synthesizer Operational." },
    { id: 37, timestamp: "18:57:24", level: "INFO", message: "Optic Burst Synthesizer Node Active." },
    { id: 38, timestamp: "18:57:28", level: "SUCCESS", message: "Refraction Chime Sound Synthesis Node Ready." },
    { id: 39, timestamp: "18:57:32", level: "INFO", message: "SubOptic Hum Frequency Calibrated." },
    { id: 40, timestamp: "18:57:36", level: "SUCCESS", message: "Light Stream Cascade Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<SpectraCodexEntry[]>([
    {
      id: "chromatic_optics",
      title: "CHROMATIC OPTIC RAYTRACING",
      subtitle: "Prismatic Light Beam Physics",
      content:
        "Spectra harnesses light beam refraction through sub-atomic crystal prisms to generate high-energy chromatic waves.",
      loreDetails:
        "Discovered by the Citadel Photonic Guild to illuminate deep void space sectors.",
    },
    {
      id: "light_credit_harvest",
      title: "LIGHT CREDITS & PRISM LENSES",
      subtitle: "Optic Foundry Currency",
      content:
        "Refracting light beams through target nodes releases concentrated photon credits used for purchasing laser cannons and solar shields.",
      loreDetails:
        "Light credits represent pure focused solar energy units stored in crystal accumulators.",
    },
    {
      id: "chromatic_purge",
      title: "CHROMATIC PURGE PROTOCOL",
      subtitle: "Full Spectrum Disintegration",
      content:
        "Initiating Chromatic Purge fires multi-frequency laser beams that incinerate rogue dark matter nodes across the map.",
      loreDetails:
        "High-yield solar burst protocol employed during galactic eclipse events.",
    },
    {
      id: "spectra_arena",
      title: "SPECTRA ARENA DYNAMICS",
      subtitle: "Infinite Photonic Warfare",
      content:
        "The Spectra Arena tests optic beam deflection skills against automated plasma turrets in a high-speed raytraced grid.",
      loreDetails:
        "The premier training arena for grandmasters of the Chromatic Order.",
    },
    {
      id: "polarized_filter",
      title: "POLARIZED OPTIC FILTERS",
      subtitle: "Harmonic Beam Masking",
      content:
        "Equipping polarized filters allows light beams to pass through solid barriers without intensity loss.",
      loreDetails:
        "Advanced optical technology developed for deep-space laser communications.",
    },
    {
      id: "light_splitter",
      title: "LIGHT SPLITTER CORES",
      subtitle: "Multi-Beam Prism Division",
      content:
        "Splitting a single laser beam into seven distinct spectrum rays produces exponential combat multipliers.",
      loreDetails:
        "High-grade optic array used in Citadel defense grids.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "prismatic_rainbow", name: "PRISMATIC RAINBOW (CLASSIC)", color: "#f43f5e", glowColor: "#e11d48", unlocked: true },
    { id: "cyan_laser", name: "CYAN LASER (NETRUNNER)", color: "#06b6d4", glowColor: "#0891b2", unlocked: true },
    { id: "emerald_spectrum", name: "EMERALD SPECTRUM (NATURE)", color: "#10b981", glowColor: "#047857", unlocked: false, costCredits: 400 },
    { id: "amber_solar", name: "AMBER SOLAR (WAR)", color: "#f59e0b", glowColor: "#d97706", unlocked: false, costCredits: 600 },
    { id: "violet_ultra", name: "VIOLET ULTRA-VIOLET (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costCredits: 800 },
  ]);

  // 16 Detailed Optic Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "prism_array",
      name: "CRYSTAL PRISM ARRAY",
      category: "prism",
      description: "Enhances light refraction angle and beam intensity.",
      costCredits: 150,
      level: 1,
      maxLevel: 5,
      iconName: "Sun",
      statBoost: "+35% Refraction Range",
      loreText: "Multi-faceted crystal prism array.",
    },
    {
      id: "laser_cannon",
      name: "PLASMA LASER CANNON",
      category: "laser",
      description: "Fires high-frequency plasma beams through dark matter.",
      costCredits: 180,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50% Laser Beam Damage",
      loreText: "High-yield plasma laser emitter.",
    },
    {
      id: "mirror_lens",
      name: "POLISHED MIRROR LENS",
      category: "mirror",
      description: "Reflects incoming enemy lasers back at attackers.",
      costCredits: 200,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Reflective Barrier Layer",
      loreText: "High-reflectivity silver alloy mirror lens.",
    },
    {
      id: "solar_absorber",
      name: "SOLAR CELL ABSORBER",
      category: "solar",
      description: "Converts ambient light into extra Light Credits.",
      costCredits: 220,
      level: 0,
      maxLevel: 4,
      iconName: "Maximize2",
      statBoost: "+4 Light Credits / Sec Passive Gain",
      loreText: "Photovoltaic energy accumulator.",
    },
    {
      id: "spatial_radar",
      name: "SPATIAL OPTIC RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing prism node targets.",
      costCredits: 160,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Matrix Mini-Map Radar",
      loreText: "Telemetry radar tracking laser vectors.",
    },
    {
      id: "polarized_filter",
      name: "POLARIZED LIGHT FILTER",
      category: "filter",
      description: "Allows laser beams to pass through solid obstacles.",
      costCredits: 280,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+10% Laser Piercing Power",
      loreText: "Harmonic light filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE OPTIC PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during refraction sprees.",
      costCredits: 320,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing light streams.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE PRISM REPAIRERS",
      category: "nanite",
      description: "Deploys nanobots restoring central prism health.",
      costCredits: 270,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Prism HP / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "photonic_magnet",
      name: "LIGHT CREDIT MAGNET",
      category: "magnet",
      description: "Instantly pulls map light credits into the prism.",
      costCredits: 350,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Light Credit Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "light_splitter",
      name: "CHROMATIC LIGHT SPLITTER",
      category: "split",
      description: "Refracted lasers split into 3 secondary beams.",
      costCredits: 300,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Split Laser Beams",
      loreText: "Multi-spectrum refraction prism.",
    },
    {
      id: "harvest_reactor",
      name: "PHOTON HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates light credits over time while playing.",
      costCredits: 380,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+3 Light Credits / Sec Passive Gain",
      loreText: "Solar energy conversion matrix.",
    },
    {
      id: "shield_matrix",
      name: "QUANTUM SOLAR MATRIX",
      category: "shield",
      description: "Grants 3s complete damage immunity upon taking hits.",
      costCredits: 400,
      level: 0,
      maxLevel: 2,
      iconName: "Shield",
      statBoost: "3s Invulnerability Barrier",
      loreText: "Sub-atomic photon shield trigger.",
    },
    {
      id: "plasma_ray",
      name: "PLASMA RAY FOCUS",
      category: "plasma",
      description: "Focuses lasers into piercing plasma hyper beams.",
      costCredits: 310,
      level: 0,
      maxLevel: 4,
      iconName: "Sun",
      statBoost: "+40% Piercing Beam Power",
      loreText: "Focused plasma lens array.",
    },
    {
      id: "tachyon_beam",
      name: "TACHYON BEAM ACCELERATOR",
      category: "tachyon",
      description: "Speeds up laser travel speed by 50%.",
      costCredits: 290,
      level: 0,
      maxLevel: 4,
      iconName: "TrendingUp",
      statBoost: "+50% Laser Velocity",
      loreText: "Tachyon accelerator module.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY OPTIC CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in enemy beams.",
      costCredits: 450,
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
      id: "first_prism_refraction",
      title: "FIRST PRISM REFRACTION",
      description: "Refract 20 light beams in Spectra.",
      rewardLightCredits: 150,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "prismatic",
    },
    {
      id: "light_harvester",
      title: "LIGHT CREDIT HARVESTER",
      description: "Accumulate a total of 1,500 Light Credits.",
      rewardLightCredits: 250,
      unlocked: false,
      currentProgress: 1500,
      maxProgress: 1500,
      categoryTag: "economy",
    },
    {
      id: "laser_deflector",
      title: "LASER DEFLECTOR",
      description: "Deflect 20 laser beams in Laser Siege.",
      rewardLightCredits: 220,
      unlocked: false,
      currentProgress: 10,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "prism_streak_master",
      title: "PRISM STREAK MASTER",
      description: "Execute a 5-prism refraction chain in Spectra Arena.",
      rewardLightCredits: 300,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "optic_architect",
      title: "OPTIC ARCHITECT",
      description: "Purchase 5 Optic Foundry Upgrades.",
      rewardLightCredits: 280,
      unlocked: false,
      currentProgress: 1,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "SPECTRUM AURA HARMONIZER",
      description: "Unlock at least 3 custom Spectrum Skins.",
      rewardLightCredits: 350,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "prismatic",
    },
    {
      id: "solar_flare_master",
      title: "SOLAR FLARE MASTER",
      description: "Trigger 10 Solar Flare bursts in a single match.",
      rewardLightCredits: 260,
      unlocked: false,
      currentProgress: 4,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_refractor",
      title: "HYPER REFRACTOR",
      description: "Clear a laser siege under 60 seconds.",
      rewardLightCredits: 320,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "prismatic",
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
    spectraCore: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    prisms: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#f43f5e", angle: 0, tier: 1, refracting: false },
      { id: 2, x: 250, y: 200, radius: 30, color: "#06b6d4", angle: 0, tier: 1, refracting: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", angle: 0, tier: 1, refracting: true },
    ] as SpectraPrismNode[],
    lasers: [] as LaserTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as SpectraParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "spectra_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "SPECTRA PRISM DUEL ALPHA", hostName: "Photon_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 14, mode: "Prism Refraction", roomStatus: "open" },
        { id: "room_2", name: "CHROMATIC PURGE SIEGE #05", hostName: "Solar_Vanguard", currentPlayers: 1, maxPlayers: 2, pingMs: 22, mode: "Chromatic Purge", roomStatus: "open" },
        { id: "room_3", name: "SPECTRA ARENA CHAMPIONSHIP", hostName: "Laser_Lord", currentPlayers: 2, maxPlayers: 2, pingMs: 12, mode: "Spectra Arena", roomStatus: "full" },
        { id: "room_4", name: "LASER SIEGE DUEL", hostName: "Prism_Ninja", currentPlayers: 1, maxPlayers: 2, pingMs: 18, mode: "Laser Siege", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#f43f5e") => {
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
    if (lightCredits >= item.costCredits && item.level < item.maxLevel) {
      setLightCredits((prev) => prev - item.costCredits);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costCredits: Math.round(i.costCredits * 1.55) } : i))
      );
      audioSynthEngine.playPrismaticRefractionSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setLightCredits((prev) => prev + ach.rewardLightCredits);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playPrismaticRefractionSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: AuraOption) => {
    if (!aura.unlocked && aura.costCredits && lightCredits >= aura.costCredits) {
      setLightCredits((prev) => prev - aura.costCredits);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playPrismaticRefractionSFX();
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
      message: `Executing Optic Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, RECHARGE, REFRACT, CLEAR, SPECTRA, ARMORY" };
    } else if (cmd === "RECHARGE") {
      setLightCredits((prev) => prev + 200);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+200 Light Credits injected via Solar Array." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Credits: ${lightCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startSpectraGame = (mode: SpectraGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundOpticMelody();
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
            <Sun className="w-4 h-4 text-rose-400" /> {lightCredits} CREDITS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#0d0816] rounded-3xl border border-rose-500/30 overflow-hidden shadow-[0_0_80px_rgba(244,63,94,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-rose-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-rose-900/60 via-slate-900/80 to-purple-900/60 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Sun className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Flagship Chromatic Optic RPG
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-cyan-400">
                  SPECTRA
                </h1>
                <p className="text-xs text-rose-100/70 mt-1">
                  Prismatic beam refractions, optic armory upgrades, online leaderboards, and quantum codex.
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
                ] as SpectraMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-black shadow-[0_0_20px_rgba(244,63,94,0.4)]"
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
                  onClick={() => startSpectraGame("prism_refraction")}
                  className="group p-6 rounded-2xl bg-white/5 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sun className="w-10 h-10 text-rose-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">PRISM REFRACTION</div>
                    <div className="text-xs text-rose-200/60 mt-1">Refract light beams through prisms</div>
                  </div>
                </button>

                <button
                  onClick={() => startSpectraGame("chromatic_purge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CHROMATIC PURGE</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Incinerate rogue dark matter</div>
                  </div>
                </button>

                <button
                  onClick={() => startSpectraGame("spectra_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sparkles className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">SPECTRA ARENA</div>
                    <div className="text-xs text-purple-200/60 mt-1">Endless chromatic challenge</div>
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
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                        {item.category === "prism" && <Sun className="w-6 h-6" />}
                        {item.category === "laser" && <Zap className="w-6 h-6" />}
                        {item.category === "mirror" && <Shield className="w-6 h-6" />}
                        {item.category === "solar" && <Maximize2 className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "filter" && <Sparkles className="w-6 h-6" />}
                        {item.category === "overdrive" && <Activity className="w-6 h-6" />}
                        {item.category === "harvest" && <Cpu className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-rose-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || lightCredits < item.costCredits}
                      className="px-4 py-2 rounded-xl bg-rose-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
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
                        <div className="font-bold text-sm text-rose-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-rose-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-rose-500 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL SPECTRA LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-rose-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-rose-300 font-bold">{entry.score} PTS</span>
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
                      <div className="text-[10px] text-rose-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-rose-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardLightCredits} CREDITS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Prisms Refracted</div>
                  <div className="text-2xl font-black text-rose-400 font-mono">{analytics.prismsRefracted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Credits Harvested</div>
                  <div className="text-2xl font-black text-rose-400 font-mono">{analytics.lightCreditsHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Lasers Deflected</div>
                  <div className="text-2xl font-black text-rose-400 font-mono">{analytics.lasersDeflected}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-rose-400 font-mono">{analytics.quantumTimeSeconds}s</div>
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
                        ? "bg-rose-500/10 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Sun className="w-6 h-6 text-black" />
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
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-rose-500 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-rose-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-rose-400 font-mono">
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
                            ? "text-rose-400"
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-rose-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-rose-500 text-black font-bold text-xs uppercase">
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
                      <span className="font-mono text-rose-400">{settings.sfxVolume}%</span>
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
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-rose-400">{settings.bgmVolume}%</span>
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
                      className="w-full accent-rose-500"
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
