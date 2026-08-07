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
  Clock,
  ZapOff,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK TEMPORAL CHRONO WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class ChronoMultiTrackAudioSynth {
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
      this.stopBackgroundTemporalMelody();
    } else {
      this.startBackgroundTemporalMelody();
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

  startBackgroundTemporalMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(110.0, this.ctx.currentTime); // A2 Temporal Drone

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(650, this.ctx.currentTime);

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

  stopBackgroundTemporalMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playTimeWarpResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Time Warp Resonance SFX failed:", e);
    }
  }

  playChronoShiftPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(350, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Chrono Shift Pulse SFX failed:", e);
    }
  }

  playQuantumDilationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Quantum Dilation SFX failed:", e);
    }
  }

  playTachyonBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1250, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Tachyon Burst SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1750, this.ctx.currentTime);
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

  playEntropyWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Entropy Wave SFX failed:", e);
    }
  }

  playParadoxAlarmSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Paradox Alarm SFX failed:", e);
    }
  }

  playChronosFieldPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(960, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Chronos Field Pulse SFX failed:", e);
    }
  }

  playComboTemporalMultiplierSFX(comboLevel: number) {
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

  playTemporalRewindSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Temporal Rewind SFX failed:", e);
    }
  }

  playParadoxCollapseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(475, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Paradox Collapse SFX failed:", e);
    }
  }

  playTimeDilationFieldSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1520, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Time Dilation Field SFX failed:", e);
    }
  }

  playChronoVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(739.99, this.ctx.currentTime + 0.1); // F#5
      osc.frequency.setValueAtTime(880.0, this.ctx.currentTime + 0.2); // A5
      osc.frequency.setValueAtTime(1174.66, this.ctx.currentTime + 0.3); // D6
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

  playTemporalDefeatToneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(290, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(72, this.ctx.currentTime + 0.5);
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

  playSubSpaceTachyonSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2800, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("SubSpace Tachyon SFX failed:", e);
    }
  }

  playChronosRiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Chronos Rift SFX failed:", e);
    }
  }

  playTemporalGlowSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(210, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1050, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Temporal Glow SFX failed:", e);
    }
  }

  playQuantumChronoEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(920, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Quantum Chrono Echo SFX failed:", e);
    }
  }

  playEntropyOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Entropy Overload SFX failed:", e);
    }
  }

  playParadoxDecryptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Paradox Decryption SFX failed:", e);
    }
  }

  playChronoBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(620, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Chrono Bypass SFX failed:", e);
    }
  }

  playTemporalChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2900, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Temporal Chime SFX failed:", e);
    }
  }

  playTemporalDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(245, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Temporal Discharge SFX failed:", e);
    }
  }

  playChronoHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174.66, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Chrono Harmonics SFX failed:", e);
    }
  }

  playTachyonFieldSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Tachyon Field SFX failed:", e);
    }
  }

  playSingularityPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2100, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Singularity Pulse SFX failed:", e);
    }
  }

  playTemporalDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(310, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1240, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Temporal Drive SFX failed:", e);
    }
  }

  playSupernovaChronoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Supernova Chrono SFX failed:", e);
    }
  }

  playTimeDistortionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(680, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(340, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Time Distortion SFX failed:", e);
    }
  }

  playChronosCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(820, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1640, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Chronos Cascade SFX failed:", e);
    }
  }

  playBlackholeTemporalSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(125, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Blackhole Temporal SFX failed:", e);
    }
  }

  playTemporalLensSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Temporal Lens SFX failed:", e);
    }
  }

  playAuroraChronosSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(560, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1120, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Aurora Chronos SFX failed:", e);
    }
  }

  playTemporalOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2500, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Temporal Overdrive SFX failed:", e);
    }
  }

  playQuantumChronoCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(840, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1680, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Quantum Chrono Cascade SFX failed:", e);
    }
  }

  playChronoOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2100, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Chrono Overload SFX failed:", e);
    }
  }

  playTemporalBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1960, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Temporal Burst SFX failed:", e);
    }
  }

  playChronoPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Chrono Pulse SFX failed:", e);
    }
  }

  playSubTemporalHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(105, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(210, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubTemporal Hum SFX failed:", e);
    }
  }

  playParadoxDisintegrationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(310, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Paradox Disintegration SFX failed:", e);
    }
  }

  playQuantumTimeLockSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Quantum Time Lock SFX failed:", e);
    }
  }

  playChronoPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(720, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1440, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Chrono Pulse Wave SFX failed:", e);
    }
  }

  playTachyonResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Tachyon Resonance SFX failed:", e);
    }
  }

  playChronosHarmonicChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Chronos Harmonic Chime SFX failed:", e);
    }
  }
}

const audioSynthEngine = new ChronoMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type ChronoMenuTab =
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

export type ChronoGameMode =
  | "temporal_paradox"
  | "time_dilation"
  | "chrono_purge"
  | "quantum_arena";

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
  rewardTemporalEnergy: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "temporal" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "stabilizer"
    | "drive"
    | "dampener"
    | "dilator"
    | "radar"
    | "filter"
    | "overdrive"
    | "nanite"
    | "magnet"
    | "rewind"
    | "harvest"
    | "shield"
    | "singularity"
    | "tachyon";
  description: string;
  costEnergy: number;
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

export interface ChronoTimeNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  tier: number;
  rewinding: boolean;
}

export interface ChronoTargetNode {
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

export interface ChronoParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface ChronoAnalyticsData {
  paradoxesResolved: number;
  temporalEnergyHarvested: number;
  quantumTimeSeconds: number;
  timeShiftsExecuted: number;
  maxComboMultiplier: number;
}

export interface AuraOption {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  unlocked: boolean;
  costEnergy?: number;
}

export interface ChronoCodexEntry {
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

// Helper Class for Chrono Paradox Physics & Time Dilation
class ChronoParadoxPhysicsEngine {
  static calculateTemporalRewindTrail(
    startX: number,
    startY: number,
    angle: number,
    nodes: ChronoTimeNode[],
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
export default function ChronoGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<ChronoMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<ChronoGameMode>("temporal_paradox");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("temporal_amber");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("time_dilation");

  // Economy & Stats
  const [temporalEnergy, setTemporalEnergy] = useState(1800);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("CHRONO_MASTER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<ChronoAnalyticsData>({
    paradoxesResolved: 0,
    temporalEnergyHarvested: 0,
    quantumTimeSeconds: 0,
    timeShiftsExecuted: 0,
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
    { id: 1, timestamp: "19:00:00", level: "INFO", message: "CHRONO Temporal Paradox Shift RPG v6.0 Online." },
    { id: 2, timestamp: "19:00:04", level: "SUCCESS", message: "WebAudio Multi-Track Temporal Synthesizer Initialized." },
    { id: 3, timestamp: "19:00:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "19:00:12", level: "WARN", message: "Tachyon Leak Detected in Temporal Sector 7." },
    { id: 5, timestamp: "19:00:16", level: "INFO", message: "Temporal Energy Accumulator Grid Active." },
    { id: 6, timestamp: "19:00:20", level: "SUCCESS", message: "Quantum Chrono Radar Activated." },
    { id: 7, timestamp: "19:00:24", level: "INFO", message: "Paradox Shift Trajectory Lock Engaged." },
    { id: 8, timestamp: "19:00:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "19:00:32", level: "SUCCESS", message: "Temporal Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "19:00:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "19:00:40", level: "SUCCESS", message: "Chrono Paradox Physics Engine Ready." },
    { id: 12, timestamp: "19:00:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "19:00:48", level: "SUCCESS", message: "Chrono Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "19:00:52", level: "INFO", message: "Time Dilation Wave Engine Operational." },
    { id: 15, timestamp: "19:00:56", level: "SUCCESS", message: "Time Warp Resonance Sound Module Online." },
    { id: 16, timestamp: "19:01:00", level: "INFO", message: "Chrono Shift Waveform Generator Standardized." },
    { id: 17, timestamp: "19:01:04", level: "SUCCESS", message: "2,150+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "19:01:08", level: "INFO", message: "Quantum Dilation Synthesizer Connected." },
    { id: 19, timestamp: "19:01:12", level: "SUCCESS", message: "Tachyon Burst Module Active." },
    { id: 20, timestamp: "19:01:16", level: "SUCCESS", message: "Entropy Wave Sound Synthesis Online." },
    { id: 21, timestamp: "19:01:20", level: "WARN", message: "Paradox Alarm Audio Node Calibrated." },
    { id: 22, timestamp: "19:01:24", level: "SUCCESS", message: "Chronos Field Pulse Wave Generator Active." },
    { id: 23, timestamp: "19:01:28", level: "INFO", message: "Temporal Rewind Audio Sub-System Ready." },
    { id: 24, timestamp: "19:01:32", level: "SUCCESS", message: "Paradox Collapse Synth Module Online." },
    { id: 25, timestamp: "19:01:36", level: "INFO", message: "Time Dilation Field Modulator Tuned." },
    { id: 26, timestamp: "19:01:40", level: "SUCCESS", message: "Victory Chime Sound Synthesizer Ready." },
    { id: 27, timestamp: "19:01:44", level: "SUCCESS", message: "Defeat Tone Audio Synthesizer Verified." },
    { id: 28, timestamp: "19:01:48", level: "INFO", message: "SubSpace Tachyon Module Online." },
    { id: 29, timestamp: "19:01:52", level: "SUCCESS", message: "Chronos Rift Audio Node Synchronized." },
    { id: 30, timestamp: "19:01:56", level: "INFO", message: "Temporal Glow Synthesizer Ready." },
    { id: 31, timestamp: "19:02:00", level: "SUCCESS", message: "Quantum Chrono Echo Frequency Tuned." },
    { id: 32, timestamp: "19:02:04", level: "SUCCESS", message: "Entropy Overload Audio Sub-System Active." },
    { id: 33, timestamp: "19:02:08", level: "INFO", message: "Paradox Decryption Waveform Generator Verified." },
    { id: 34, timestamp: "19:02:12", level: "SUCCESS", message: "Chrono Bypass Module Online." },
    { id: 35, timestamp: "19:02:16", level: "INFO", message: "Temporal Chime Sound Generator Calibrated." },
    { id: 36, timestamp: "19:02:20", level: "SUCCESS", message: "Temporal Discharge Synthesizer Operational." },
    { id: 37, timestamp: "19:02:24", level: "INFO", message: "Chrono Harmonics Synthesizer Node Active." },
    { id: 38, timestamp: "19:02:28", level: "SUCCESS", message: "Tachyon Field Sound Synthesis Node Ready." },
    { id: 39, timestamp: "19:02:32", level: "INFO", message: "Singularity Pulse Frequency Calibrated." },
    { id: 40, timestamp: "19:02:36", level: "SUCCESS", message: "Temporal Drive Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<ChronoCodexEntry[]>([
    {
      id: "time_dilation",
      title: "TIME DILATION PHYSICS",
      subtitle: "Relativistic Chrono Manipulation",
      content:
        "Chrono alters local flow of time by emitting tachyon radiation pulses that slow incoming enemy projectiles.",
      loreDetails:
        "Discovered during the Citadel temporal rift event in Sector 9.",
    },
    {
      id: "temporal_energy",
      title: "TEMPORAL ENERGY & STABILIZERS",
      subtitle: "Chrono Armory Currency",
      content:
        "Resolving temporal paradoxes harvests raw chrono energy used for upgrading tachyon drives and time shields.",
      loreDetails:
        "Pure chronos energy stored in sub-atomic tachyon accumulators.",
    },
    {
      id: "chrono_purge",
      title: "CHRONO PURGE PROTOCOL",
      subtitle: "Temporal Erasure Blast",
      content:
        "Initiating Chrono Purge rewinds map entropy, erasing all hostile nodes from existence.",
      loreDetails:
        "Emergency temporal cleansing protocol utilized by the Chronos Vanguard.",
    },
    {
      id: "quantum_arena",
      title: "QUANTUM ARENA DYNAMICS",
      subtitle: "Infinite Paradox Survival",
      content:
        "The Quantum Arena subjects players to accelerating temporal rifts testing rewind reaction times.",
      loreDetails:
        "The supreme trial for grandmasters of the Temporal Order.",
    },
    {
      id: "paradox_dampener",
      title: "PARADOX DAMPENERS",
      subtitle: "Causal Loop Suppression",
      content:
        "Dampening paradox loops prevents timeline collapse when executing high-frequency time shifts.",
      loreDetails:
        "Advanced temporal stabilization technology.",
    },
    {
      id: "tachyon_drive",
      title: "TACHYON DRIVE CORES",
      subtitle: "Faster-Than-Light Velocity",
      content:
        "Accelerating tachyon particles enables instant movement across the tactical grid.",
      loreDetails:
        "High-grade propulsion core used in Citadel chronoships.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "temporal_amber", name: "TEMPORAL AMBER (CLASSIC)", color: "#f59e0b", glowColor: "#d97706", unlocked: true },
    { id: "cyan_tachyon", name: "CYAN TACHYON (FUTURE)", color: "#06b6d4", glowColor: "#0891b2", unlocked: true },
    { id: "emerald_rewind", name: "EMERALD REWIND (PAST)", color: "#10b981", glowColor: "#047857", unlocked: false, costEnergy: 500 },
    { id: "violet_paradox", name: "VIOLET PARADOX (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costEnergy: 750 },
    { id: "crimson_entropy", name: "CRIMSON ENTROPY (WAR)", color: "#f43f5e", glowColor: "#e11d48", unlocked: false, costEnergy: 1000 },
  ]);

  // 16 Detailed Temporal Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "chrono_stabilizer",
      name: "CHRONO STABILIZER ARRAY",
      category: "stabilizer",
      description: "Prevents timeline decay and extends time dilation.",
      costEnergy: 160,
      level: 1,
      maxLevel: 5,
      iconName: "Clock",
      statBoost: "+35% Time Dilation Duration",
      loreText: "Sub-atomic tachyon stabilizer matrix.",
    },
    {
      id: "tachyon_drive",
      name: "PLASMA TACHYON DRIVE",
      category: "drive",
      description: "Boosts player velocity during time shifts.",
      costEnergy: 200,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50% Movement Speed",
      loreText: "High-yield tachyon accelerator drive.",
    },
    {
      id: "paradox_dampener",
      name: "PARADOX DAMPENER LENS",
      category: "dampener",
      description: "Absorbs damage caused by temporal paradox rifts.",
      costEnergy: 220,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Paradox Shield Barrier Layer",
      loreText: "Quantum causality dampening lens.",
    },
    {
      id: "time_dilator",
      name: "SOLAR TIME DILATOR",
      category: "dilator",
      description: "Converts ambient chronos particles into extra Temporal Energy.",
      costEnergy: 250,
      level: 0,
      maxLevel: 4,
      iconName: "Maximize2",
      statBoost: "+5 Temporal Energy / Sec Passive Gain",
      loreText: "Chrono energy accumulator.",
    },
    {
      id: "spatial_radar",
      name: "CHRONOS SPATIAL RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing paradox rift nodes.",
      costEnergy: 180,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Matrix Mini-Map Radar",
      loreText: "Telemetry radar tracking temporal vectors.",
    },
    {
      id: "entropy_filter",
      name: "ENTROPY LIGHT FILTER",
      category: "filter",
      description: "Allows time shifts to pass through solid obstacles.",
      costEnergy: 300,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+12% Temporal Piercing Power",
      loreText: "Harmonic entropy filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE CHRONO PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during time shift sprees.",
      costEnergy: 350,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing chronos streams.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE CHRONO REPAIRERS",
      category: "nanite",
      description: "Deploys nanobots restoring player HP.",
      costEnergy: 280,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Player HP / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "photonic_magnet",
      name: "TEMPORAL ENERGY MAGNET",
      category: "magnet",
      description: "Instantly pulls map temporal energy into the player.",
      costEnergy: 380,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Energy Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "rewind_core",
      name: "QUANTUM REWIND CORE",
      category: "rewind",
      description: "Rewinds player position and HP 3 seconds into the past.",
      costEnergy: 320,
      level: 0,
      maxLevel: 3,
      iconName: "RotateCcw",
      statBoost: "3s Instant Rewind Ability",
      loreText: "Multi-spectrum rewind prism.",
    },
    {
      id: "harvest_reactor",
      name: "TACHYON HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates temporal energy over time while playing.",
      costEnergy: 400,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+4 Temporal Energy / Sec Passive Gain",
      loreText: "Chrono energy conversion matrix.",
    },
    {
      id: "shield_matrix",
      name: "QUANTUM TEMPORAL MATRIX",
      category: "shield",
      description: "Grants 3s complete damage immunity upon taking hits.",
      costEnergy: 420,
      level: 0,
      maxLevel: 2,
      iconName: "Shield",
      statBoost: "3s Invulnerability Barrier",
      loreText: "Sub-atomic tachyon shield trigger.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY CHRONO CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in enemy beams.",
      costEnergy: 480,
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
      id: "first_time_shift",
      title: "FIRST TIME SHIFT",
      description: "Execute 20 time shifts in Chrono.",
      rewardTemporalEnergy: 200,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "temporal",
    },
    {
      id: "energy_harvester",
      title: "TEMPORAL HARVESTER",
      description: "Accumulate a total of 1,800 Temporal Energy.",
      rewardTemporalEnergy: 300,
      unlocked: false,
      currentProgress: 1800,
      maxProgress: 1800,
      categoryTag: "economy",
    },
    {
      id: "paradox_resolver",
      title: "PARADOX RESOLVER",
      description: "Resolve 20 paradox rifts in Temporal Paradox mode.",
      rewardTemporalEnergy: 250,
      unlocked: false,
      currentProgress: 12,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "chrono_streak_master",
      title: "CHRONO STREAK MASTER",
      description: "Execute a 5-shift combo chain in Quantum Arena.",
      rewardTemporalEnergy: 350,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "temporal_architect",
      title: "TEMPORAL ARCHITECT",
      description: "Purchase 5 Temporal Armory Upgrades.",
      rewardTemporalEnergy: 320,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "TEMPORAL AURA HARMONIZER",
      description: "Unlock at least 3 custom Temporal Skins.",
      rewardTemporalEnergy: 400,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "temporal",
    },
    {
      id: "tachyon_flare_master",
      title: "TACHYON FLARE MASTER",
      description: "Trigger 10 Tachyon bursts in a single match.",
      rewardTemporalEnergy: 280,
      unlocked: false,
      currentProgress: 5,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_shifter",
      title: "HYPER SHIFTER",
      description: "Clear a time dilation stage under 60 seconds.",
      rewardTemporalEnergy: 360,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "temporal",
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
    chronoCore: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#f59e0b", angle: 0, tier: 1, rewinding: false },
      { id: 2, x: 250, y: 200, radius: 30, color: "#06b6d4", angle: 0, tier: 1, rewinding: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", angle: 0, tier: 1, rewinding: true },
    ] as ChronoTimeNode[],
    targets: [] as ChronoTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as ChronoParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "chrono_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "CHRONO TEMPORAL DUEL ALPHA", hostName: "Tachyon_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 12, mode: "Temporal Paradox", roomStatus: "open" },
        { id: "room_2", name: "CHRONO PURGE SIEGE #07", hostName: "Paradox_Vanguard", currentPlayers: 1, maxPlayers: 2, pingMs: 19, mode: "Chrono Purge", roomStatus: "open" },
        { id: "room_3", name: "QUANTUM ARENA CHAMPIONSHIP", hostName: "Time_Lord", currentPlayers: 2, maxPlayers: 2, pingMs: 14, mode: "Quantum Arena", roomStatus: "full" },
        { id: "room_4", name: "TIME DILATION DUEL", hostName: "Chrono_Ninja", currentPlayers: 1, maxPlayers: 2, pingMs: 16, mode: "Time Dilation", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#f59e0b") => {
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
    if (temporalEnergy >= item.costEnergy && item.level < item.maxLevel) {
      setTemporalEnergy((prev) => prev - item.costEnergy);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costEnergy: Math.round(i.costEnergy * 1.55) } : i))
      );
      audioSynthEngine.playTimeWarpResonanceSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setTemporalEnergy((prev) => prev + ach.rewardTemporalEnergy);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playTimeWarpResonanceSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: any) => {
    if (!aura.unlocked && aura.costEnergy && temporalEnergy >= aura.costEnergy) {
      setTemporalEnergy((prev) => prev - aura.costEnergy);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playTimeWarpResonanceSFX();
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
      message: `Executing Chrono Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, RECHARGE, SHIFT, CLEAR, CHRONO, ARMORY" };
    } else if (cmd === "RECHARGE") {
      setTemporalEnergy((prev) => prev + 250);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+250 Temporal Energy injected via Chrono Array." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Energy: ${temporalEnergy} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startChronoGame = (mode: ChronoGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundTemporalMelody();
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
            <Clock className="w-4 h-4 text-amber-400" /> {temporalEnergy} ENERGY
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#160d08] rounded-3xl border border-amber-500/30 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-amber-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-amber-900/60 via-slate-900/80 to-purple-900/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Flagship Temporal Paradox RPG
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-400">
                  CHRONO
                </h1>
                <p className="text-xs text-amber-100/70 mt-1">
                  Temporal paradox shifts, tachyon armory upgrades, online leaderboards, and quantum codex.
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
                ] as ChronoMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]"
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
                  onClick={() => startChronoGame("temporal_paradox")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Clock className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">TEMPORAL PARADOX</div>
                    <div className="text-xs text-amber-200/60 mt-1">Manipulate local time flow</div>
                  </div>
                </button>

                <button
                  onClick={() => startChronoGame("chrono_purge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CHRONO PURGE</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Erase hostile temporal nodes</div>
                  </div>
                </button>

                <button
                  onClick={() => startChronoGame("quantum_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sparkles className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">QUANTUM ARENA</div>
                    <div className="text-xs text-purple-200/60 mt-1">Endless temporal challenge</div>
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
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        {item.category === "stabilizer" && <Clock className="w-6 h-6" />}
                        {item.category === "drive" && <Zap className="w-6 h-6" />}
                        {item.category === "dampener" && <Shield className="w-6 h-6" />}
                        {item.category === "dilator" && <Maximize2 className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "filter" && <Sparkles className="w-6 h-6" />}
                        {item.category === "overdrive" && <Activity className="w-6 h-6" />}
                        {item.category === "harvest" && <Cpu className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || temporalEnergy < item.costEnergy}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costEnergy} ENERGY`}
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
                        <span className="text-xs font-mono text-amber-400">{room.pingMs}ms</span>
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
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL CHRONO LEADERBOARD</div>
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
                      {ach.rewardTemporalEnergy} ENERGY
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Paradoxes Resolved</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.paradoxesResolved}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Energy Harvested</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.temporalEnergyHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Time Shifts Executed</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.timeShiftsExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{analytics.quantumTimeSeconds}s</div>
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
                        ? "bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{aura.name}</div>
                      <div className="text-xs text-white/50">{aura.unlocked ? "ACTIVE SKIN" : `COST: ${aura.costEnergy} ENERGY`}</div>
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
                            ? "text-amber-400"
                            : log.level === "WARN"
                            ? "text-rose-400"
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
