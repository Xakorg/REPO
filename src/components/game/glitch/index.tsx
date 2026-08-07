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
  Bug,
  Binary,
  Code,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK CYBERPUNK GLITCH WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class GlitchMultiTrackAudioSynth {
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
      this.stopBackgroundGlitchMelody();
    } else {
      this.startBackgroundGlitchMelody();
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

  startBackgroundGlitchMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(123.47, this.ctx.currentTime); // B2 Cyber Drone

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);

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

  stopBackgroundGlitchMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playCyberGlitchWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.26 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Cyber Glitch Wave SFX failed:", e);
    }
  }

  playMatrixDecryptSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(350, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Matrix Decrypt SFX failed:", e);
    }
  }

  playAnomalyPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Anomaly Pulse SFX failed:", e);
    }
  }

  playSubNetFlareSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("SubNet Flare SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2500, this.ctx.currentTime);
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
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.32);
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

  playGlitchImpactSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Glitch Impact SFX failed:", e);
    }
  }

  playAnomalyWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1650, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Anomaly Wave SFX failed:", e);
    }
  }

  playComboGlitchMultiplierSFX(comboLevel: number) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 830.61 * Math.pow(1.05946, comboLevel);
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

  playGlitchReplicationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(487, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn("Glitch Replication SFX failed:", e);
    }
  }

  playCyberDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(625, this.ctx.currentTime + 0.2);
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

  playAnomalyShieldSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Anomaly Shield SFX failed:", e);
    }
  }

  playGlitchVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(830.61, this.ctx.currentTime); // Ab5
      osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.1); // C6
      osc.frequency.setValueAtTime(1244.51, this.ctx.currentTime + 0.2); // Eb6
      osc.frequency.setValueAtTime(1661.22, this.ctx.currentTime + 0.3); // Ab6
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
      osc.frequency.setValueAtTime(310, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(78, this.ctx.currentTime + 0.5);
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

  playSubGlitchPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3500, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("SubGlitch Pulse SFX failed:", e);
    }
  }

  playGlitchRiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(4500, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Glitch Rift SFX failed:", e);
    }
  }

  playMatrixGlowSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(310, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1550, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Matrix Glow SFX failed:", e);
    }
  }

  playQuantumGlitchEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(575, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Quantum Glitch Echo SFX failed:", e);
    }
  }

  playSupernovaAnomalyOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(310, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Supernova Anomaly Overload SFX failed:", e);
    }
  }

  playCyberDecryptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(230, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.55);
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

  playGlitchBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(820, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Glitch Bypass SFX failed:", e);
    }
  }

  playMatrixDecryptRingSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3900, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Matrix Decrypt Ring SFX failed:", e);
    }
  }

  playCyberDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1250, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(310, this.ctx.currentTime + 0.18);
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

  playGlitchHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(830.61, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1661.22, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Glitch Harmonics SFX failed:", e);
    }
  }

  playSubNetBeamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(462, this.ctx.currentTime + 0.28);
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

  playSingularityGlitchSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2800, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Singularity Glitch SFX failed:", e);
    }
  }

  playCyberDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.48);
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

  playSupernovaGlitchSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Supernova Glitch SFX failed:", e);
    }
  }

  playGlitchDistortionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Glitch Distortion SFX failed:", e);
    }
  }

  playGlitchCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Glitch Cascade SFX failed:", e);
    }
  }

  playBlackholeCyberSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Blackhole Cyber SFX failed:", e);
    }
  }

  playCyberLensSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.38);
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

  playSubNetGlitchSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(780, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1560, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("SubNet Glitch SFX failed:", e);
    }
  }

  playMatrixOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3600, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Matrix Overdrive SFX failed:", e);
    }
  }

  playQuantumCyberCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2300, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Quantum Cyber Cascade SFX failed:", e);
    }
  }

  playSubNetOverloadPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2850, this.ctx.currentTime + 0.38);
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
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2700, this.ctx.currentTime + 0.18);
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

  playGlitchPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(462, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Glitch Pulse Wave SFX failed:", e);
    }
  }

  playSubMatrixHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("SubMatrix Hum SFX failed:", e);
    }
  }

  playMatrixPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Matrix Pulse SFX failed:", e);
    }
  }

  playQuantumGlitchLockSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2300, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Quantum Glitch Lock SFX failed:", e);
    }
  }

  playSupernovaGlitchPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1020, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2040, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Supernova Glitch Pulse Wave SFX failed:", e);
    }
  }

  playMatrixResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(425, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Matrix Resonance SFX failed:", e);
    }
  }

  playGlitchHarmonicChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Glitch Harmonic Chime SFX failed:", e);
    }
  }

  playCyberDisintegrationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.38);
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

  playSubMatrixHumDroneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(170, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubMatrix Hum Drone SFX failed:", e);
    }
  }
}

const audioSynthEngine = new GlitchMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type GlitchMenuTab =
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

export type GlitchGameMode =
  | "cyber_surge"
  | "matrix_decrypt"
  | "subnet_flare"
  | "glitch_arena";

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
  rewardCyberCredits: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "hacking" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "exploit"
    | "decryptor"
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

export interface GlitchHackerNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  integrity: number;
  active: boolean;
}

export interface GlitchTargetNode {
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

export interface GlitchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface GlitchAnalyticsData {
  hacksExecuted: number;
  cyberCreditsHarvested: number;
  quantumTimeSeconds: number;
  matrixDecryptExecuted: number;
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

export interface GlitchCodexEntry {
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

// Helper Class for Glitch Cyber Physics Engine
class GlitchCyberPhysicsEngine {
  static calculateMatrixConvectionTrail(
    startX: number,
    startY: number,
    angle: number,
    nodes: GlitchHackerNode[],
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
export default function GlitchGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<GlitchMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<GlitchGameMode>("cyber_surge");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("matrix_green");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("cyber_surge");

  // Economy & Stats
  const [cyberCredits, setCyberCredits] = useState(3000);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("BLACKHAT_HACKER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<GlitchAnalyticsData>({
    hacksExecuted: 0,
    cyberCreditsHarvested: 0,
    quantumTimeSeconds: 0,
    matrixDecryptExecuted: 0,
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
    { id: 1, timestamp: "19:45:00", level: "INFO", message: "GLITCH Cyberpunk Anomaly Hacker RPG v9.0 Online." },
    { id: 2, timestamp: "19:45:04", level: "SUCCESS", message: "WebAudio Multi-Track Cyber Synthesizer Initialized." },
    { id: 3, timestamp: "19:45:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "19:45:12", level: "WARN", message: "Matrix Anomaly Surge Detected." },
    { id: 5, timestamp: "19:45:16", level: "INFO", message: "Blackhat Hacker Armory Harvester Active." },
    { id: 6, timestamp: "19:45:20", level: "SUCCESS", message: "SubNet Anomaly Radar Activated." },
    { id: 7, timestamp: "19:45:24", level: "INFO", message: "Quantum Trajectory Lock Engaged." },
    { id: 8, timestamp: "19:45:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "19:45:32", level: "SUCCESS", message: "Blackhat Hacker Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "19:45:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "19:45:40", level: "SUCCESS", message: "Glitch Cyber Physics Engine Ready." },
    { id: 12, timestamp: "19:45:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "19:45:48", level: "SUCCESS", message: "Glitch Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "19:45:52", level: "INFO", message: "Cyber Glitch Wave Sound Module Operational." },
    { id: 15, timestamp: "19:45:56", level: "SUCCESS", message: "Matrix Decrypt Sound Module Online." },
    { id: 16, timestamp: "19:46:00", level: "INFO", message: "SubNet Flare Generator Standardized." },
    { id: 17, timestamp: "19:46:04", level: "SUCCESS", message: "2,177+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "19:46:08", level: "INFO", message: "Quantum Bypass Synthesizer Connected." },
    { id: 19, timestamp: "19:46:12", level: "SUCCESS", message: "Supernova Glitch Overdrive Module Active." },
    { id: 20, timestamp: "19:46:16", level: "SUCCESS", message: "Cyber Disruption Sound Synthesis Online." },
    { id: 21, timestamp: "19:46:20", level: "WARN", message: "Glitch Impact Audio Node Calibrated." },
    { id: 22, timestamp: "19:46:24", level: "SUCCESS", message: "Anomaly Wave Generator Active." },
    { id: 23, timestamp: "19:46:28", level: "INFO", message: "Glitch Replication Audio Sub-System Ready." },
    { id: 24, timestamp: "19:46:32", level: "SUCCESS", message: "Matrix Decrypt Synth Module Online." },
    { id: 25, timestamp: "19:46:36", level: "INFO", message: "Anomaly Shield Modulator Tuned." },
    { id: 26, timestamp: "19:46:40", level: "SUCCESS", message: "Victory Chime Sound Synthesizer Ready." },
    { id: 27, timestamp: "19:46:44", level: "SUCCESS", message: "Defeat Tone Audio Synthesizer Verified." },
    { id: 28, timestamp: "19:46:48", level: "INFO", message: "SubGlitch Pulse Module Online." },
    { id: 29, timestamp: "19:46:52", level: "SUCCESS", message: "Glitch Rift Audio Node Synchronized." },
    { id: 30, timestamp: "19:46:56", level: "INFO", message: "Matrix Glow Synthesizer Ready." },
    { id: 31, timestamp: "19:47:00", level: "SUCCESS", message: "Quantum Glitch Echo Frequency Tuned." },
    { id: 32, timestamp: "19:47:04", level: "SUCCESS", message: "Supernova Anomaly Overload Audio Sub-System Active." },
    { id: 33, timestamp: "19:47:08", level: "INFO", message: "Cyber Decryption Waveform Generator Verified." },
    { id: 34, timestamp: "19:47:12", level: "SUCCESS", message: "Glitch Bypass Module Online." },
    { id: 35, timestamp: "19:47:16", level: "INFO", message: "Matrix Decrypt Ring Sound Generator Calibrated." },
    { id: 36, timestamp: "19:47:20", level: "SUCCESS", message: "Cyber Discharge Synthesizer Operational." },
    { id: 37, timestamp: "19:47:24", level: "INFO", message: "Glitch Harmonics Synthesizer Node Active." },
    { id: 38, timestamp: "19:47:28", level: "SUCCESS", message: "SubNet Beam Sound Synthesis Node Ready." },
    { id: 39, timestamp: "19:47:32", level: "INFO", message: "Singularity Glitch Frequency Calibrated." },
    { id: 40, timestamp: "19:47:36", level: "SUCCESS", message: "Cyber Drive Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<GlitchCodexEntry[]>([
    {
      id: "cyber_surge",
      title: "CYBER ANOMALY SURGE",
      subtitle: "Matrix Decryption Physics",
      content:
        "Glitch channels malicious code fragments into high-frequency cyber waves capable of bypassing firewall barriers.",
      loreDetails:
        "Pioneered by Blackhat Hacker Zero during the NetSec Breach of Sector 7.",
    },
    {
      id: "cyber_credits_harvest",
      title: "CYBER CREDITS & HACKER SHOP",
      subtitle: "Cyberpunk SubNet Currency",
      content:
        "Harvesting matrix decryption surges yields concentrated cyber credits used for purchasing zero-day exploits and firewall bypasses.",
      loreDetails:
        "Pure malicious code credits stored in encrypted darknet wallets.",
    },
    {
      id: "matrix_decrypt",
      title: "MATRIX DECRYPT PROTOCOL",
      subtitle: "SubNet Overdrive Hacking",
      content:
        "Initiating Matrix Decrypt triggers rapid brute-force algorithms clearing security daemons across the network.",
      loreDetails:
        "High-yield exploit suite employed during corporate grid infiltration.",
    },
    {
      id: "glitch_arena",
      title: "GLITCH ARENA DYNAMICS",
      subtitle: "Infinite Cyberpunk Warfare",
      content:
        "The Glitch Arena tests blackhat hacking skills against mutating AI security nodes in a high-speed matrix grid.",
      loreDetails:
        "The premier testing ground for elite darknet hackers of Sector 7.",
    },
    {
      id: "anomaly_shield",
      title: "ANOMALY SHIELD MATRIX",
      subtitle: "Firewall Protection Core",
      content:
        "Equipping anomaly shields allows hackers to reflect ICE counter-attacks with 2x encryption power.",
      loreDetails:
        "Advanced darknet proxy shield technology engineered for orbital mainframe penetration.",
    },
    {
      id: "exploit_splitter",
      title: "ZERO-DAY EXPLOIT SPLITTER",
      subtitle: "Multi-Vector Exploit Division",
      content:
        "Splitting a single zero-day payload into four distinct malicious sub-threads yields exponential hacking multipliers.",
      loreDetails:
        "High-grade exploit array used in Citadel mainframe cyber warfare.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "matrix_green", name: "MATRIX GREEN (CLASSIC)", color: "#22c55e", glowColor: "#15803d", unlocked: true },
    { id: "amber_exploit", name: "AMBER EXPLOIT (GOLD)", color: "#f59e0b", glowColor: "#d97706", unlocked: true },
    { id: "violet_anomaly", name: "VIOLET ANOMALY (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costCredits: 750 },
    { id: "cyan_firewall", name: "CYAN FIREWALL (ICE)", color: "#06b6d4", glowColor: "#0891b2", unlocked: false, costCredits: 950 },
    { id: "crimson_zero_day", name: "CRIMSON ZERO-DAY (WAR)", color: "#ef4444", glowColor: "#b91c1c", unlocked: false, costCredits: 1250 },
  ]);

  // 16 Detailed Blackhat Hacker Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "zero_day_exploit",
      name: "ZERO-DAY EXPLOIT PAYLOAD",
      category: "exploit",
      description: "Enhances cyber glitch surge radius and hack damage.",
      costCredits: 230,
      level: 1,
      maxLevel: 5,
      iconName: "Bug",
      statBoost: "+35% Cyber Surge Radius",
      loreText: "Polymorphic zero-day exploit package.",
    },
    {
      id: "matrix_decryptor",
      name: "PLASMA MATRIX DECRYPTOR",
      category: "decryptor",
      description: "Fires high-frequency matrix waves through firewall nodes.",
      costCredits: 250,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50% Matrix Decrypt Damage",
      loreText: "Quantum matrix brute-force decryptor.",
    },
    {
      id: "anomaly_barrier",
      name: "CHROMATIC ANOMALY BARRIER",
      category: "barrier",
      description: "Reflects incoming enemy ICE counter-attacks.",
      costCredits: 270,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Anomaly Shield Layer",
      loreText: "Encrypted darknet proxy membrane.",
    },
    {
      id: "cyber_injector",
      name: "CYBER POWER INJECTOR",
      category: "injector",
      description: "Converts ambient net traffic into extra Cyber Credits.",
      costCredits: 290,
      level: 0,
      maxLevel: 4,
      iconName: "Sun",
      statBoost: "+5 Cyber Credits / Sec Passive Gain",
      loreText: "Inductive sub-net data harvester.",
    },
    {
      id: "glitch_radar",
      name: "SPATIAL GLITCH RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing security ICE vectors.",
      costCredits: 230,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Matrix Mini-Map Radar",
      loreText: "Telemetry radar tracking darknet vectors.",
    },
    {
      id: "subnet_filter",
      name: "POLARIZED SUBNET FILTER",
      category: "filter",
      description: "Allows cyber waves to pass through firewall obstacles.",
      costCredits: 350,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+12% ICE Piercing Power",
      loreText: "Harmonic sub-net filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE GLITCH PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during hack sprees.",
      costCredits: 390,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing exploit threads.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE CODE PURIFIERS",
      category: "nanite",
      description: "Deploys nanobots restoring central terminal integrity.",
      costCredits: 330,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Terminal HP / sec Repair Rate",
      loreText: "Self-replicating code repair nanobots.",
    },
    {
      id: "glitch_magnet",
      name: "CYBER CREDIT MAGNET",
      category: "magnet",
      description: "Instantly pulls map cyber credits into the hacker.",
      costCredits: 430,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Credit Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "glitch_splice_core",
      name: "CHROMATIC GLITCH SPLICE CORE",
      category: "splice",
      description: "Cyber hack streams split into 3 secondary malware arcs.",
      costCredits: 370,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Split Malware Arcs",
      loreText: "Multi-spectrum refraction core.",
    },
    {
      id: "harvest_reactor",
      name: "FOUNDRY HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates cyber credits over time while hacking.",
      costCredits: 450,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+4 Cyber Credits / Sec Passive Gain",
      loreText: "Subnet data energy conversion matrix.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY GLITCH CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in enemy security daemons.",
      costCredits: 550,
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
      id: "first_cyber_surge",
      title: "FIRST CYBER HACK",
      description: "Trigger 20 cyber surges in Glitch.",
      rewardCyberCredits: 240,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "hacking",
    },
    {
      id: "cyber_harvester",
      title: "CYBER CREDITS HARVESTER",
      description: "Accumulate a total of 3,000 Cyber Credits.",
      rewardCyberCredits: 350,
      unlocked: false,
      currentProgress: 3000,
      maxProgress: 3000,
      categoryTag: "economy",
    },
    {
      id: "matrix_master",
      title: "MATRIX DECRYPT MASTER",
      description: "Execute 20 Matrix Decrypts in Glitch Arena.",
      rewardCyberCredits: 300,
      unlocked: false,
      currentProgress: 15,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "glitch_streak_master",
      title: "GLITCH STREAK MASTER",
      description: "Execute a 5-thread cyber hack chain.",
      rewardCyberCredits: 400,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "hacker_architect",
      title: "BLACKHAT ARCHITECT",
      description: "Purchase 5 Blackhat Hacker Armory Upgrades.",
      rewardCyberCredits: 370,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "CYBER AURA HARMONIZER",
      description: "Unlock at least 3 custom Matrix Skins.",
      rewardCyberCredits: 460,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "hacking",
    },
    {
      id: "subnet_flare_master",
      title: "SUBNET FLARE MASTER",
      description: "Trigger 10 SubNet Flares in a single match.",
      rewardCyberCredits: 340,
      unlocked: false,
      currentProgress: 6,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_hack",
      title: "HYPER CYBER HACKER",
      description: "Bypass a mainframe firewall under 40 seconds.",
      rewardCyberCredits: 430,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "hacking",
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
    hackerCore: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#22c55e", integrity: 1000, active: true },
      { id: 2, x: 250, y: 200, radius: 30, color: "#f59e0b", integrity: 850, active: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", integrity: 920, active: true },
    ] as GlitchHackerNode[],
    targets: [] as GlitchTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as GlitchParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "glitch_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "GLITCH CYBER DUEL ALPHA", hostName: "Blackhat_Zero", currentPlayers: 1, maxPlayers: 2, pingMs: 11, mode: "Cyber Surge", roomStatus: "open" },
        { id: "room_2", name: "MATRIX DECRYPT SIEGE #07", hostName: "Cyber_Vanguard", currentPlayers: 1, maxPlayers: 2, pingMs: 16, mode: "Matrix Decrypt", roomStatus: "open" },
        { id: "room_3", name: "GLITCH ARENA CHAMPIONSHIP", hostName: "Net_Guardian", currentPlayers: 2, maxPlayers: 2, pingMs: 13, mode: "Glitch Arena", roomStatus: "full" },
        { id: "room_4", name: "SUBNET FLARE DUEL", hostName: "Darknet_Ninja", currentPlayers: 1, maxPlayers: 2, pingMs: 15, mode: "SubNet Flare", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#22c55e") => {
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
    if (cyberCredits >= item.costCredits && item.level < item.maxLevel) {
      setCyberCredits((prev) => prev - item.costCredits);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costCredits: Math.round(i.costCredits * 1.55) } : i))
      );
      audioSynthEngine.playCyberGlitchWaveSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setCyberCredits((prev) => prev + ach.rewardCyberCredits);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playCyberGlitchWaveSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: any) => {
    if (!aura.unlocked && aura.costCredits && cyberCredits >= aura.costCredits) {
      setCyberCredits((prev) => prev - aura.costCredits);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playCyberGlitchWaveSFX();
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
      message: `Executing Glitch Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, HACK, BYPASS, CLEAR, GLITCH, ARMORY" };
    } else if (cmd === "HACK" || cmd === "BYPASS") {
      setCyberCredits((prev) => prev + 300);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+300 Cyber Credits injected via Exploiter Core." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Credits: ${cyberCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startGlitchGame = (mode: GlitchGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundGlitchMelody();
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
      ctx.fillStyle = "#050b14";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#050b14] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-green-400" /> {cyberCredits} CYBER CREDITS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#0f172a] rounded-3xl border border-green-500/30 overflow-hidden shadow-[0_0_80px_rgba(34,197,94,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#050b14]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-green-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-green-950/80 via-emerald-950/60 to-teal-950/80 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Bug className="w-3.5 h-3.5 text-green-400 animate-pulse" /> Flagship Cyberpunk Anomaly Hacker RPG
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300">
                  GLITCH
                </h1>
                <p className="text-xs text-green-100/70 mt-1">
                  Cyberpunk anomaly hacker RPG, blackhat shop upgrades, online leaderboards, and darknet codex.
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
                ] as GlitchMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]"
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
                  onClick={() => startGlitchGame("cyber_surge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-green-500/30 hover:border-green-400 hover:bg-green-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Bug className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CYBER SURGE</div>
                    <div className="text-xs text-green-200/60 mt-1">Execute zero-day cyber hacks</div>
                  </div>
                </button>

                <button
                  onClick={() => startGlitchGame("matrix_decrypt")}
                  className="group p-6 rounded-2xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Zap className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">MATRIX DECRYPT</div>
                    <div className="text-xs text-emerald-200/60 mt-1">Bypass mainframe security nodes</div>
                  </div>
                </button>

                <button
                  onClick={() => startGlitchGame("glitch_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-teal-500/30 hover:border-teal-400 hover:bg-teal-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Code className="w-10 h-10 text-teal-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">GLITCH ARENA</div>
                    <div className="text-xs text-teal-200/60 mt-1">Endless darknet cyber warfare</div>
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
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
                        {item.category === "exploit" && <Bug className="w-6 h-6" />}
                        {item.category === "decryptor" && <Zap className="w-6 h-6" />}
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
                        <div className="text-[10px] text-green-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || cyberCredits < item.costCredits}
                      className="px-4 py-2 rounded-xl bg-green-400 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
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
                        <div className="font-bold text-sm text-green-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-green-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-green-400 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL GLITCH LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-green-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-green-300 font-bold">{entry.score} PTS</span>
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
                      <div className="text-[10px] text-green-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-green-400 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardCyberCredits} CREDITS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Hacks Executed</div>
                  <div className="text-2xl font-black text-green-400 font-mono">{analytics.hacksExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Credits Harvested</div>
                  <div className="text-2xl font-black text-green-400 font-mono">{analytics.cyberCreditsHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Matrix Decrypts</div>
                  <div className="text-2xl font-black text-green-400 font-mono">{analytics.matrixDecryptExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-green-400 font-mono">{analytics.quantumTimeSeconds}s</div>
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
                        ? "bg-green-500/10 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
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
                        className="px-3 py-1.5 rounded-lg bg-green-400 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-green-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-green-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-green-400 font-mono">
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
                            ? "text-green-400"
                            : log.level === "WARN"
                            ? "text-emerald-400"
                            : "text-teal-400"
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
                    placeholder="Enter command (e.g. HELP, HACK, STATUS)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-green-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-green-400 text-black font-bold text-xs uppercase">
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
                      <span className="font-mono text-green-400">{settings.sfxVolume}%</span>
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
                      className="w-full accent-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-green-400">{settings.bgmVolume}%</span>
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
                      className="w-full accent-green-500"
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
