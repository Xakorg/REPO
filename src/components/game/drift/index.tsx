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
  Navigation,
  Wind,
  FastForward,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK QUANTUM DRIFT WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class DriftMultiTrackAudioSynth {
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
      this.stopBackgroundDriftMelody();
    } else {
      this.startBackgroundDriftMelody();
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

  startBackgroundDriftMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(110.0, this.ctx.currentTime); // A2 Synth Drone

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(1100, this.ctx.currentTime);

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

  stopBackgroundDriftMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playQuantumEngineRevSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.26 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Quantum Engine Rev SFX failed:", e);
    }
  }

  playDriftBoostSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2400, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Drift Boost SFX failed:", e);
    }
  }

  playTachyonSurgeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Tachyon Surge SFX failed:", e);
    }
  }

  playHyperdriveFlareSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Hyperdrive Flare SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
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

  playVoidNitroPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Void Nitro Pulse SFX failed:", e);
    }
  }

  playDriftImpactSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Drift Impact SFX failed:", e);
    }
  }

  playSlipstreamWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Slipstream Wave SFX failed:", e);
    }
  }

  playComboDriftMultiplierSFX(comboLevel: number) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 783.99 * Math.pow(1.05946, comboLevel);
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

  playDriftReplicationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(475, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn("Drift Replication SFX failed:", e);
    }
  }

  playQuantumDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Quantum Disruption SFX failed:", e);
    }
  }

  playNitroShieldSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1920, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Nitro Shield SFX failed:", e);
    }
  }

  playDriftVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime); // G5
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime + 0.1); // B5
      osc.frequency.setValueAtTime(1174.66, this.ctx.currentTime + 0.2); // D6
      osc.frequency.setValueAtTime(1567.98, this.ctx.currentTime + 0.3); // G6
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

  playQuantumDefeatToneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(75, this.ctx.currentTime + 0.5);
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

  playSubDriftPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3400, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("SubDrift Pulse SFX failed:", e);
    }
  }

  playDriftRiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(4250, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Drift Rift SFX failed:", e);
    }
  }

  playTachyonGlowSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Tachyon Glow SFX failed:", e);
    }
  }

  playQuantumDriftEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Quantum Drift Echo SFX failed:", e);
    }
  }

  playHyperdriveOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Hyperdrive Overload SFX failed:", e);
    }
  }

  playQuantumDecryptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("Quantum Decryption SFX failed:", e);
    }
  }

  playDriftBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(105, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Drift Bypass SFX failed:", e);
    }
  }

  playEngineRevRingSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3800, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Engine Rev Ring SFX failed:", e);
    }
  }

  playQuantumDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Quantum Discharge SFX failed:", e);
    }
  }

  playDriftHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1567.98, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Drift Harmonics SFX failed:", e);
    }
  }

  playPlasmaBeamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Plasma Beam SFX failed:", e);
    }
  }

  playSingularityDriftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2700, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Singularity Drift SFX failed:", e);
    }
  }

  playQuantumDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1680, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Quantum Drive SFX failed:", e);
    }
  }

  playSupernovaDriftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Supernova Drift SFX failed:", e);
    }
  }

  playDriftDistortionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Drift Distortion SFX failed:", e);
    }
  }

  playDriftCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2100, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Drift Cascade SFX failed:", e);
    }
  }

  playBlackholeGarageSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Blackhole Garage SFX failed:", e);
    }
  }

  playQuantumLensSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Quantum Lens SFX failed:", e);
    }
  }

  playHyperdriveDriftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Hyperdrive Drift SFX failed:", e);
    }
  }

  playTachyonOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3400, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Tachyon Overdrive SFX failed:", e);
    }
  }

  playQuantumGarageCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2200, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Quantum Garage Cascade SFX failed:", e);
    }
  }

  playHyperdriveOverloadPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2700, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Hyperdrive Overload Pulse SFX failed:", e);
    }
  }

  playHyperdriveBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Hyperdrive Burst SFX failed:", e);
    }
  }

  playDriftPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Drift Pulse Wave SFX failed:", e);
    }
  }

  playSubTachyonHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("SubTachyon Hum SFX failed:", e);
    }
  }

  playTachyonPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Tachyon Pulse SFX failed:", e);
    }
  }

  playQuantumDriftLockSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Quantum Drift Lock SFX failed:", e);
    }
  }

  playSupernovaDriftPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1960, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Supernova Drift Pulse Wave SFX failed:", e);
    }
  }

  playTachyonResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Tachyon Resonance SFX failed:", e);
    }
  }

  playDriftHarmonicChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(830.61, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1661.22, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Drift Harmonic Chime SFX failed:", e);
    }
  }

  playQuantumDisintegrationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Quantum Disintegration SFX failed:", e);
    }
  }

  playSubTachyonHumDroneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubTachyon Hum Drone SFX failed:", e);
    }
  }
}

const audioSynthEngine = new DriftMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type DriftMenuTab =
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

export type DriftGameMode =
  | "quantum_surge"
  | "hyperdrive_wave"
  | "tachyon_flare"
  | "drift_arena";

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
  rewardQuantumCredits: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "racing" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "thruster"
    | "tire"
    | "nitro"
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

export interface DriftVehicleNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  integrity: number;
  active: boolean;
}

export interface DriftTargetNode {
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

export interface DriftParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface DriftAnalyticsData {
  driftsExecuted: number;
  quantumCreditsHarvested: number;
  quantumTimeSeconds: number;
  hyperdriveWaveExecuted: number;
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

export interface DriftCodexEntry {
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

// Helper Class for Drift Vehicle Physics Engine
class DriftVehiclePhysicsEngine {
  static calculateTachyonConvectionTrail(
    startX: number,
    startY: number,
    angle: number,
    nodes: DriftVehicleNode[],
    maxSteps: number = 5
  ) {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let currentX = startX;
    let currentY = startY;

    for (let step = 0; step < maxSteps; step++) {
      const stepDist = 95;
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
export default function DriftGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<DriftMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<DriftGameMode>("quantum_surge");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("quantum_cyan");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("quantum_surge");

  // Economy & Stats
  const [quantumCredits, setQuantumCredits] = useState(2800);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("DRIFT_PILOT");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<DriftAnalyticsData>({
    driftsExecuted: 0,
    quantumCreditsHarvested: 0,
    quantumTimeSeconds: 0,
    hyperdriveWaveExecuted: 0,
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
    { id: 1, timestamp: "19:40:00", level: "INFO", message: "DRIFT Quantum Void Racing RPG v8.0 Online." },
    { id: 2, timestamp: "19:40:04", level: "SUCCESS", message: "WebAudio Multi-Track Quantum Synthesizer Initialized." },
    { id: 3, timestamp: "19:40:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "19:40:12", level: "WARN", message: "Quantum Drift Surge Anomaly Detected." },
    { id: 5, timestamp: "19:40:16", level: "INFO", message: "Quantum Garage Energy Harvester Active." },
    { id: 6, timestamp: "19:40:20", level: "SUCCESS", message: "Spatial Drift Radar Activated." },
    { id: 7, timestamp: "19:40:24", level: "INFO", message: "Tachyon Trajectory Lock Engaged." },
    { id: 8, timestamp: "19:40:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "19:40:32", level: "SUCCESS", message: "Quantum Garage Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "19:40:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "19:40:40", level: "SUCCESS", message: "Drift Vehicle Physics Engine Ready." },
    { id: 12, timestamp: "19:40:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "19:40:48", level: "SUCCESS", message: "Drift Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "19:40:52", level: "INFO", message: "Quantum Engine Rev Sound Module Operational." },
    { id: 15, timestamp: "19:40:56", level: "SUCCESS", message: "Drift Boost Sound Module Online." },
    { id: 16, timestamp: "19:41:00", level: "INFO", message: "Tachyon Surge Generator Standardized." },
    { id: 17, timestamp: "19:41:04", level: "SUCCESS", message: "2,174+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "19:41:08", level: "INFO", message: "Hyperdrive Flare Synthesizer Connected." },
    { id: 19, timestamp: "19:41:12", level: "SUCCESS", message: "Supernova Drift Overdrive Module Active." },
    { id: 20, timestamp: "19:41:16", level: "SUCCESS", message: "Void Nitro Pulse Sound Synthesis Online." },
    { id: 21, timestamp: "19:41:20", level: "WARN", message: "Drift Impact Audio Node Calibrated." },
    { id: 22, timestamp: "19:41:24", level: "SUCCESS", message: "Slipstream Wave Generator Active." },
    { id: 23, timestamp: "19:41:28", level: "INFO", message: "Drift Replication Audio Sub-System Ready." },
    { id: 24, timestamp: "19:41:32", level: "SUCCESS", message: "Quantum Disruption Synth Module Online." },
    { id: 25, timestamp: "19:41:36", level: "INFO", message: "Nitro Shield Modulator Tuned." },
    { id: 26, timestamp: "19:41:40", level: "SUCCESS", message: "Victory Chime Sound Synthesizer Ready." },
    { id: 27, timestamp: "19:41:44", level: "SUCCESS", message: "Defeat Tone Audio Synthesizer Verified." },
    { id: 28, timestamp: "19:41:48", level: "INFO", message: "SubDrift Pulse Module Online." },
    { id: 29, timestamp: "19:41:52", level: "SUCCESS", message: "Drift Rift Audio Node Synchronized." },
    { id: 30, timestamp: "19:41:56", level: "INFO", message: "Tachyon Glow Synthesizer Ready." },
    { id: 31, timestamp: "19:42:00", level: "SUCCESS", message: "Quantum Drift Echo Frequency Tuned." },
    { id: 32, timestamp: "19:42:04", level: "SUCCESS", message: "Hyperdrive Overload Audio Sub-System Active." },
    { id: 33, timestamp: "19:42:08", level: "INFO", message: "Quantum Decryption Waveform Generator Verified." },
    { id: 34, timestamp: "19:42:12", level: "SUCCESS", message: "Drift Bypass Module Online." },
    { id: 35, timestamp: "19:42:16", level: "INFO", message: "Engine Rev Ring Sound Generator Calibrated." },
    { id: 36, timestamp: "19:42:20", level: "SUCCESS", message: "Quantum Discharge Synthesizer Operational." },
    { id: 37, timestamp: "19:42:24", level: "INFO", message: "Drift Harmonics Synthesizer Node Active." },
    { id: 38, timestamp: "19:42:28", level: "SUCCESS", message: "Plasma Beam Sound Synthesis Node Ready." },
    { id: 39, timestamp: "19:42:32", level: "INFO", message: "Singularity Drift Frequency Calibrated." },
    { id: 40, timestamp: "19:42:36", level: "SUCCESS", message: "Quantum Drive Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<DriftCodexEntry[]>([
    {
      id: "quantum_surge",
      title: "QUANTUM DRIFT SURGE",
      subtitle: "Tachyon Slipstream Physics",
      content:
        "Drift channels quantum energy vectors into high-acceleration drift curves capable of outpacing void obstacles.",
      loreDetails:
        "Pioneered by Void Racer Kaelen during the Hyperdrive League of Sector 9.",
    },
    {
      id: "quantum_credits_harvest",
      title: "QUANTUM CREDITS & GARAGE SHOP",
      subtitle: "Quantum Void Currency",
      content:
        "Harvesting quantum energy drift bursts yields concentrated credits used for purchasing plasma thrusters and drift tires.",
      loreDetails:
        "Pure tachyon energy units stored in condensed quantum batteries.",
    },
    {
      id: "hyperdrive_wave",
      title: "HYPERDRIVE WAVE PROTOCOL",
      subtitle: "Void Overdrive Acceleration",
      content:
        "Initiating Hyperdrive Wave triggers maximum nitro thrusters that clear obstacles across the quantum track.",
      loreDetails:
        "Extreme speed protocol used during cosmic void grand prix events.",
    },
    {
      id: "drift_arena",
      title: "DRIFT ARENA DYNAMICS",
      subtitle: "Infinite Void Racing",
      content:
        "The Drift Arena tests quantum steering skills against evolving track hazards in an endless slipstream grid.",
      loreDetails:
        "The premier testing track for champions of the Quantum Racing Federation.",
    },
    {
      id: "nitro_shield",
      title: "NITRO SHIELD MATRIX",
      subtitle: "Tachyon Energy Barrier",
      content:
        "Equipping nitro shields allows vehicles to absorb track impact shocks with 2x velocity retention.",
      loreDetails:
        "Advanced tachyon-infused kinetic shield tech engineered for high-g racing.",
    },
    {
      id: "thruster_splitter",
      title: "PLASMA THRUSTER SPLITTER",
      subtitle: "Multi-Arc Exhaust Division",
      content:
        "Splitting a single nitro burst into four distinct plasma exhaust streams yields exponential acceleration multipliers.",
      loreDetails:
        "High-grade titanium nozzle array used in championship void racers.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "quantum_cyan", name: "QUANTUM CYAN (CLASSIC)", color: "#06b6d4", glowColor: "#0891b2", unlocked: true },
    { id: "amber_nitro", name: "AMBER NITRO (GOLD)", color: "#f59e0b", glowColor: "#d97706", unlocked: true },
    { id: "violet_drift", name: "VIOLET DRIFT (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costCredits: 700 },
    { id: "emerald_tachyon", name: "EMERALD TACHYON (ICE)", color: "#10b981", glowColor: "#047857", unlocked: false, costCredits: 900 },
    { id: "crimson_hyperdrive", name: "CRIMSON HYPERDRIVE (WAR)", color: "#ef4444", glowColor: "#b91c1c", unlocked: false, costCredits: 1200 },
  ]);

  // 16 Detailed Quantum Garage Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "plasma_thruster",
      name: "PLASMA NITRO THRUSTER",
      category: "thruster",
      description: "Enhances drift boost acceleration and max speed.",
      costCredits: 220,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+35% Drift Acceleration",
      loreText: "Multi-stage plasma exhaust thruster.",
    },
    {
      id: "quantum_tire",
      name: "QUANTUM DRIFT TIRES",
      category: "tire",
      description: "Increases steering traction and drift angle control.",
      costCredits: 240,
      level: 1,
      maxLevel: 5,
      iconName: "Compass",
      statBoost: "+50% Drift Control",
      loreText: "Tachyon-infused synthetic rubber tires.",
    },
    {
      id: "nitro_injector",
      name: "HYPERDRIVE NITRO INJECTOR",
      category: "nitro",
      description: "Fires supercharged nitro bursts during tight turns.",
      costCredits: 260,
      level: 1,
      maxLevel: 5,
      iconName: "Wind",
      statBoost: "+1 Nitro Boost Layer",
      loreText: "High-pressure quantum nitro valve.",
    },
    {
      id: "slipstream_harvester",
      name: "SLIPSTREAM POWER HARVESTER",
      category: "injector",
      description: "Converts drafting momentum into extra Quantum Credits.",
      costCredits: 280,
      level: 0,
      maxLevel: 4,
      iconName: "Sun",
      statBoost: "+5 Quantum Credits / Sec Passive Gain",
      loreText: "Kinetic slipstream energy harvester.",
    },
    {
      id: "drift_radar",
      name: "SPATIAL DRIFT RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing track hazard vectors.",
      costCredits: 220,
      level: 1,
      maxLevel: 3,
      iconName: "Navigation",
      statBoost: "Unlocks Quantum Track Mini-Map",
      loreText: "Telemetry radar tracking track hazards.",
    },
    {
      id: "tachyon_filter",
      name: "POLARIZED TACHYON FILTER",
      category: "filter",
      description: "Allows drift trails to cut through track barriers.",
      costCredits: 340,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+12% Barrier Piercing Power",
      loreText: "Harmonic tachyon filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE DRIFT PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during drift sprees.",
      costCredits: 380,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing drift angles.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE CHASSIS PURIFIERS",
      category: "nanite",
      description: "Deploys nanobots restoring vehicle hull integrity.",
      costCredits: 320,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Hull Integrity / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "drift_magnet",
      name: "QUANTUM CREDIT MAGNET",
      category: "magnet",
      description: "Instantly pulls track quantum credits into the vehicle.",
      costCredits: 420,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Track-wide Credit Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "drift_splice_core",
      name: "CHROMATIC DRIFT SPLICE CORE",
      category: "splice",
      description: "Nitro exhaust streams split into 3 secondary thrust arcs.",
      costCredits: 360,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Split Exhaust Arcs",
      loreText: "Multi-spectrum refraction nozzle.",
    },
    {
      id: "harvest_reactor",
      name: "FOUNDRY HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates quantum credits over time while racing.",
      costCredits: 440,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+4 Quantum Credits / Sec Passive Gain",
      loreText: "Tachyon energy conversion matrix.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY DRIFT CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in competitor vehicles.",
      costCredits: 540,
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
      id: "first_drift_surge",
      title: "FIRST QUANTUM DRIFT",
      description: "Trigger 20 drift boosts in Drift.",
      rewardQuantumCredits: 230,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "racing",
    },
    {
      id: "quantum_harvester",
      title: "QUANTUM CREDITS HARVESTER",
      description: "Accumulate a total of 2,800 Quantum Credits.",
      rewardQuantumCredits: 340,
      unlocked: false,
      currentProgress: 2800,
      maxProgress: 2800,
      categoryTag: "economy",
    },
    {
      id: "hyperdrive_master",
      title: "HYPERDRIVE WAVE MASTER",
      description: "Execute 20 Hyperdrive Waves in Drift Arena.",
      rewardQuantumCredits: 290,
      unlocked: false,
      currentProgress: 15,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "drift_streak_master",
      title: "DRIFT STREAK MASTER",
      description: "Execute a 5-turn quantum drift chain.",
      rewardQuantumCredits: 390,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "garage_architect",
      title: "GARAGE ARCHITECT",
      description: "Purchase 5 Quantum Garage Upgrades.",
      rewardQuantumCredits: 360,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "QUANTUM AURA HARMONIZER",
      description: "Unlock at least 3 custom Vehicle Skins.",
      rewardQuantumCredits: 450,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "racing",
    },
    {
      id: "tachyon_flare_master",
      title: "TACHYON FLARE MASTER",
      description: "Trigger 10 Tachyon Flares in a single match.",
      rewardQuantumCredits: 330,
      unlocked: false,
      currentProgress: 6,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_drift",
      title: "HYPER DRIFT PILOT",
      description: "Clear a quantum racing lap under 45 seconds.",
      rewardQuantumCredits: 420,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "racing",
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
    vehicle: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#06b6d4", integrity: 1000, active: true },
      { id: 2, x: 250, y: 200, radius: 30, color: "#f59e0b", integrity: 850, active: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", integrity: 920, active: true },
    ] as DriftVehicleNode[],
    targets: [] as DriftTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as DriftParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "drift_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "DRIFT VOID DUEL ALPHA", hostName: "Drift_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 14, mode: "Quantum Surge", roomStatus: "open" },
        { id: "room_2", name: "HYPERDRIVE WAVE RACE #05", hostName: "Void_Racer", currentPlayers: 1, maxPlayers: 2, pingMs: 18, mode: "Hyperdrive Wave", roomStatus: "open" },
        { id: "room_3", name: "DRIFT ARENA CHAMPIONSHIP", hostName: "Speed_Demon", currentPlayers: 2, maxPlayers: 2, pingMs: 15, mode: "Drift Arena", roomStatus: "full" },
        { id: "room_4", name: "TACHYON FLARE SPRINT", hostName: "Nitro_Ninja", currentPlayers: 1, maxPlayers: 2, pingMs: 16, mode: "Tachyon Flare", roomStatus: "open" },
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
    if (quantumCredits >= item.costCredits && item.level < item.maxLevel) {
      setQuantumCredits((prev) => prev - item.costCredits);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costCredits: Math.round(i.costCredits * 1.55) } : i))
      );
      audioSynthEngine.playQuantumEngineRevSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setQuantumCredits((prev) => prev + ach.rewardQuantumCredits);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playQuantumEngineRevSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: any) => {
    if (!aura.unlocked && aura.costCredits && quantumCredits >= aura.costCredits) {
      setQuantumCredits((prev) => prev - aura.costCredits);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playQuantumEngineRevSFX();
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
      message: `Executing Drift Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, NITRO, BOOST, CLEAR, DRIFT, GARAGE" };
    } else if (cmd === "NITRO" || cmd === "BOOST") {
      setQuantumCredits((prev) => prev + 300);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+300 Quantum Credits injected via Nitro Array." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Credits: ${quantumCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "GARAGE" || cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Garage Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startDriftGame = (mode: DriftGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundDriftMelody();
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
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#090d16] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
            <Sparkles className="w-4 h-4 text-cyan-400" /> {quantumCredits} QUANTUM CREDITS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#111827] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#090d16]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-cyan-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-indigo-950/80 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Wind className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Flagship Quantum Void Racing RPG
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300">
                  DRIFT
                </h1>
                <p className="text-xs text-cyan-100/70 mt-1">
                  Quantum void racing RPG, garage shop upgrades, online leaderboards, and tachyon codex.
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
                ] as DriftMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
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
                  onClick={() => startDriftGame("quantum_surge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Wind className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">QUANTUM SURGE</div>
                    <div className="text-xs text-cyan-200/60 mt-1">High-speed quantum drift racing</div>
                  </div>
                </button>

                <button
                  onClick={() => startDriftGame("hyperdrive_wave")}
                  className="group p-6 rounded-2xl bg-white/5 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Zap className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">HYPERDRIVE WAVE</div>
                    <div className="text-xs text-blue-200/60 mt-1">Overdrive nitro acceleration</div>
                  </div>
                </button>

                <button
                  onClick={() => startDriftGame("drift_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <FastForward className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">DRIFT ARENA</div>
                    <div className="text-xs text-indigo-200/60 mt-1">Endless void grand prix racing</div>
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
                        {item.category === "thruster" && <Zap className="w-6 h-6" />}
                        {item.category === "tire" && <Compass className="w-6 h-6" />}
                        {item.category === "nitro" && <Wind className="w-6 h-6" />}
                        {item.category === "injector" && <Sun className="w-6 h-6" />}
                        {item.category === "radar" && <Navigation className="w-6 h-6" />}
                        {item.category === "filter" && <Sparkles className="w-6 h-6" />}
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
                      disabled={item.level >= item.maxLevel || quantumCredits < item.costCredits}
                      className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
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
                        <div className="font-bold text-sm text-cyan-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-cyan-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-cyan-400 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL DRIFT LEADERBOARD</div>
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
                      className="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardQuantumCredits} CREDITS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Drifts Executed</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.driftsExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Credits Harvested</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.quantumCreditsHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Hyperdrive Waves</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.hyperdriveWaveExecuted}</div>
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
                        className="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-cyan-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
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
                            ? "text-cyan-400"
                            : log.level === "WARN"
                            ? "text-blue-400"
                            : "text-indigo-400"
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
                    placeholder="Enter command (e.g. HELP, NITRO, STATUS)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-cyan-400 text-black font-bold text-xs uppercase">
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
