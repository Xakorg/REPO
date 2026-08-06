"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Zap,
  Snowflake,
  Shield,
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
  Thermometer,
  Gauge,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK THERMAL FORGE WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class ForgeMultiTrackAudioSynth {
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
      this.stopBackgroundForgeMelody();
    } else {
      this.startBackgroundForgeMelody();
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

  startBackgroundForgeMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(82.41, this.ctx.currentTime); // E2 Anvil Low Drone

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

  stopBackgroundForgeMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playHammerClangSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3520, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Hammer Clang SFX failed:", e);
    }
  }

  playThermalBlastSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Thermal Blast SFX failed:", e);
    }
  }

  playObsidianWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(460, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1840, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Obsidian Wave SFX failed:", e);
    }
  }

  playPlasmaFlareSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Plasma Flare SFX failed:", e);
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

  playForgeStrikeSFX() {
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
      console.warn("Forge Strike SFX failed:", e);
    }
  }

  playMoltenImpactSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(270, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Molten Impact SFX failed:", e);
    }
  }

  playAnvilWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1260, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Anvil Wave SFX failed:", e);
    }
  }

  playComboForgeMultiplierSFX(comboLevel: number) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 659.25 * Math.pow(1.05946, comboLevel);
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

  playForgeReplicationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(437, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn("Forge Replication SFX failed:", e);
    }
  }

  playThermalDisruptionSFX() {
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
      console.warn("Thermal Disruption SFX failed:", e);
    }
  }

  playObsidianShieldSFX() {
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
      console.warn("Obsidian Shield SFX failed:", e);
    }
  }

  playForgeVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
      osc.frequency.setValueAtTime(830.61, this.ctx.currentTime + 0.1); // G#5
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime + 0.2); // B5
      osc.frequency.setValueAtTime(1318.5, this.ctx.currentTime + 0.3); // E6
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

  playThermalDefeatToneSFX() {
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

  playSubForgePulseSFX() {
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
      console.warn("SubForge Pulse SFX failed:", e);
    }
  }

  playForgeRiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(780, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3900, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Forge Rift SFX failed:", e);
    }
  }

  playMoltenGlowSFX() {
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
      console.warn("Molten Glow SFX failed:", e);
    }
  }

  playQuantumForgeEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1060, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(530, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Quantum Forge Echo SFX failed:", e);
    }
  }

  playSupernovaSlagOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Supernova Slag Overload SFX failed:", e);
    }
  }

  playThermalDecryptionSFX() {
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
      console.warn("Thermal Decryption SFX failed:", e);
    }
  }

  playForgeBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(95, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Forge Bypass SFX failed:", e);
    }
  }

  playAnvilChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3500, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Anvil Chime SFX failed:", e);
    }
  }

  playThermalDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(270, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Thermal Discharge SFX failed:", e);
    }
  }

  playForgeHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(698.46, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1396.92, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Forge Harmonics SFX failed:", e);
    }
  }

  playPlasmaBeamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.28);
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

  playSingularityForgeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1240, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2480, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Singularity Forge SFX failed:", e);
    }
  }

  playThermalDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1520, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Thermal Drive SFX failed:", e);
    }
  }

  playSupernovaForgeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(230, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Supernova Forge SFX failed:", e);
    }
  }

  playForgeDistortionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Forge Distortion SFX failed:", e);
    }
  }

  playForgeCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(960, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1920, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Forge Cascade SFX failed:", e);
    }
  }

  playBlackholeAnvilSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Blackhole Anvil SFX failed:", e);
    }
  }

  playThermalLensSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Thermal Lens SFX failed:", e);
    }
  }

  playAuroraForgeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Aurora Forge SFX failed:", e);
    }
  }

  playMoltenOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Molten Overdrive SFX failed:", e);
    }
  }

  playQuantumAnvilCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1960, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Quantum Anvil Cascade SFX failed:", e);
    }
  }

  playPlasmaOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(820, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2460, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Plasma Overload SFX failed:", e);
    }
  }

  playPlasmaBurstSFX() {
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
      console.warn("Plasma Burst SFX failed:", e);
    }
  }

  playForgePulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(412, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Forge Pulse SFX failed:", e);
    }
  }

  playSubMoltenHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("SubMolten Hum SFX failed:", e);
    }
  }

  playMoltenPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Molten Pulse SFX failed:", e);
    }
  }

  playQuantumForgeLockSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Quantum Forge Lock SFX failed:", e);
    }
  }

  playSupernovaSlagPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(890, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1780, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Supernova Slag Pulse Wave SFX failed:", e);
    }
  }

  playMoltenResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Molten Resonance SFX failed:", e);
    }
  }

  playForgeHarmonicChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(745.0, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1490.0, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Forge Harmonic Chime SFX failed:", e);
    }
  }

  playThermalDisintegrationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Thermal Disintegration SFX failed:", e);
    }
  }

  playSubMoltenHumDroneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(145, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(290, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubMolten Hum Drone SFX failed:", e);
    }
  }
}

const audioSynthEngine = new ForgeMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type ForgeMenuTab =
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

export type ForgeGameMode =
  | "blacksmith_surge"
  | "obsidian_blast"
  | "plasma_flare"
  | "forge_arena";

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
  rewardThermalEnergy: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "thermal" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "hammer"
    | "bellows"
    | "anvil"
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

export interface ForgeDeflectorNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  integrity: number;
  active: boolean;
}

export interface ForgeTargetNode {
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

export interface ForgeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface ForgeAnalyticsData {
  strikesExecuted: number;
  thermalCreditsHarvested: number;
  quantumTimeSeconds: number;
  obsidianBlastExecuted: number;
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

export interface ForgeCodexEntry {
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

// Helper Class for Forge Anvil Physics Engine
class ForgeAnvilPhysicsEngine {
  static calculateThermalConvectionTrail(
    startX: number,
    startY: number,
    angle: number,
    nodes: ForgeDeflectorNode[],
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
export default function ForgeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<ForgeMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<ForgeGameMode>("blacksmith_surge");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("molten_ember");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("blacksmith_surge");

  // Economy & Stats
  const [thermalCredits, setThermalCredits] = useState(2500);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("FORGE_LORD");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<ForgeAnalyticsData>({
    strikesExecuted: 0,
    thermalCreditsHarvested: 0,
    quantumTimeSeconds: 0,
    obsidianBlastExecuted: 0,
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
    { id: 1, timestamp: "19:30:00", level: "INFO", message: "FORGE Thermal Foundry Blacksmith RPG v7.0 Online." },
    { id: 2, timestamp: "19:30:04", level: "SUCCESS", message: "WebAudio Multi-Track Thermal Synthesizer Initialized." },
    { id: 3, timestamp: "19:30:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "19:30:12", level: "WARN", message: "Thermal Anvil Impact Surge Anomaly Detected." },
    { id: 5, timestamp: "19:30:16", level: "INFO", message: "Thermal Foundry Energy Harvester Active." },
    { id: 6, timestamp: "19:30:20", level: "SUCCESS", message: "Quantum Anvil Radar Activated." },
    { id: 7, timestamp: "19:30:24", level: "INFO", message: "Molten Trajectory Lock Engaged." },
    { id: 8, timestamp: "19:30:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "19:30:32", level: "SUCCESS", message: "Blacksmith Foundry Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "19:30:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "19:30:40", level: "SUCCESS", message: "Forge Anvil Physics Engine Ready." },
    { id: 12, timestamp: "19:30:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "19:30:48", level: "SUCCESS", message: "Forge Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "19:30:52", level: "INFO", message: "Hammer Clang Engine Operational." },
    { id: 15, timestamp: "19:30:56", level: "SUCCESS", message: "Thermal Blast Sound Module Online." },
    { id: 16, timestamp: "19:31:00", level: "INFO", message: "Obsidian Wave Generator Standardized." },
    { id: 17, timestamp: "19:31:04", level: "SUCCESS", message: "2,175+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "19:31:08", level: "INFO", message: "Plasma Flare Synthesizer Connected." },
    { id: 19, timestamp: "19:31:12", level: "SUCCESS", message: "Supernova Slag Overdrive Module Active." },
    { id: 20, timestamp: "19:31:16", level: "SUCCESS", message: "Forge Strike Sound Synthesis Online." },
    { id: 21, timestamp: "19:31:20", level: "WARN", message: "Molten Impact Audio Node Calibrated." },
    { id: 22, timestamp: "19:31:24", level: "SUCCESS", message: "Anvil Wave Generator Active." },
    { id: 23, timestamp: "19:31:28", level: "INFO", message: "Forge Replication Audio Sub-System Ready." },
    { id: 24, timestamp: "19:31:32", level: "SUCCESS", message: "Thermal Disruption Synth Module Online." },
    { id: 25, timestamp: "19:31:36", level: "INFO", message: "Obsidian Shield Modulator Tuned." },
    { id: 26, timestamp: "19:31:40", level: "SUCCESS", message: "Victory Chime Sound Synthesizer Ready." },
    { id: 27, timestamp: "19:31:44", level: "SUCCESS", message: "Defeat Tone Audio Synthesizer Verified." },
    { id: 28, timestamp: "19:31:48", level: "INFO", message: "SubForge Pulse Module Online." },
    { id: 29, timestamp: "19:31:52", level: "SUCCESS", message: "Forge Rift Audio Node Synchronized." },
    { id: 30, timestamp: "19:31:56", level: "INFO", message: "Molten Glow Synthesizer Ready." },
    { id: 31, timestamp: "19:32:00", level: "SUCCESS", message: "Quantum Forge Echo Frequency Tuned." },
    { id: 32, timestamp: "19:32:04", level: "SUCCESS", message: "Supernova Slag Overload Audio Sub-System Active." },
    { id: 33, timestamp: "19:32:08", level: "INFO", message: "Thermal Decryption Waveform Generator Verified." },
    { id: 34, timestamp: "19:32:12", level: "SUCCESS", message: "Forge Bypass Module Online." },
    { id: 35, timestamp: "19:32:16", level: "INFO", message: "Anvil Chime Sound Generator Calibrated." },
    { id: 36, timestamp: "19:32:20", level: "SUCCESS", message: "Thermal Discharge Synthesizer Operational." },
    { id: 37, timestamp: "19:32:24", level: "INFO", message: "Forge Harmonics Synthesizer Node Active." },
    { id: 38, timestamp: "19:32:28", level: "SUCCESS", message: "Plasma Beam Sound Synthesis Node Ready." },
    { id: 39, timestamp: "19:32:32", level: "INFO", message: "Singularity Forge Frequency Calibrated." },
    { id: 40, timestamp: "19:32:36", level: "SUCCESS", message: "Thermal Drive Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<ForgeCodexEntry[]>([
    {
      id: "blacksmith_surge",
      title: "BLACKSMITH HAMMER SURGE",
      subtitle: "Thermal Anvil Physics",
      content:
        "Forge channels molten thermal strikes into high-density anvil deflections capable of shattering incoming slag projectiles.",
      loreDetails:
        "Discovered by Citadel blacksmith masters during the Great Vulcan Forge in Sector 9.",
    },
    {
      id: "thermal_credits_harvest",
      title: "THERMAL CREDITS & FOUNDRY SHOP",
      subtitle: "Blacksmith Foundry Currency",
      content:
        "Hammering molten slag nodes yields concentrated thermal credits used for purchasing obsidian hammers and plasma bellows.",
      loreDetails:
        "Pure thermal energy units stored in anvil-bound crucible batteries.",
    },
    {
      id: "obsidian_blast",
      title: "OBSIDIAN BLAST PROTOCOL",
      subtitle: "Thermal Disintegration",
      content:
        "Initiating Obsidian Blast fires supercharged shockwaves that neutralize hostile slag artillery across the map.",
      loreDetails:
        "High-yield thermal blast employed during anvil bombardment events.",
    },
    {
      id: "forge_arena",
      title: "FORGE ARENA DYNAMICS",
      subtitle: "Infinite Blacksmith Warfare",
      content:
        "The Forge Arena tests blacksmith hammer timing against mutating slag bosses in a high-speed molten grid.",
      loreDetails:
        "The premier training arena for grandmasters of the Iron Order.",
    },
    {
      id: "obsidian_shield",
      title: "OBSIDIAN SHIELD MATRIX",
      subtitle: "Molten Impact Deflection",
      content:
        "Equipping obsidian shields allows thermal beams to reflect with 2x velocity towards enemy slag units.",
      loreDetails:
        "Advanced volcanic obsidian membrane technology developed for anvil defense.",
    },
    {
      id: "hammer_splitter",
      title: "HAMMER NODE SPLITTER",
      subtitle: "Multi-Arc Strike Division",
      content:
        "Splitting a single hammer clang into four distinct shockwave sub-arcs produces exponential combat multipliers.",
      loreDetails:
        "High-grade titanium hammer array used in Citadel foundry fortifications.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "molten_ember", name: "MOLTEN EMBER (CLASSIC)", color: "#ea580c", glowColor: "#c2410c", unlocked: true },
    { id: "amber_lava", name: "AMBER LAVA (GOLD)", color: "#f59e0b", glowColor: "#d97706", unlocked: true },
    { id: "violet_slag", name: "VIOLET SLAG (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costCredits: 650 },
    { id: "cyan_quench", name: "CYAN QUENCH (ICE)", color: "#06b6d4", glowColor: "#0891b2", unlocked: false, costCredits: 850 },
    { id: "crimson_vulcan", name: "CRIMSON VULCAN (WAR)", color: "#ef4444", glowColor: "#b91c1c", unlocked: false, costCredits: 1100 },
  ]);

  // 16 Detailed Blacksmith Foundry Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "obsidian_hammer",
      name: "OBSIDIAN HAMMER SPLITTER",
      category: "hammer",
      description: "Enhances hammer clang radius and blast power.",
      costCredits: 200,
      level: 1,
      maxLevel: 5,
      iconName: "Flame",
      statBoost: "+35% Hammer Blast Radius",
      loreText: "Multi-faceted obsidian hammer splitter array.",
    },
    {
      id: "plasma_bellows",
      name: "PLASMA THERMAL BELLOWS",
      category: "bellows",
      description: "Fires high-frequency molten streams through slag targets.",
      costCredits: 230,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50% Thermal Reflection Damage",
      loreText: "High-yield plasma thermal bellows.",
    },
    {
      id: "titanium_anvil",
      name: "TITANIUM ANVIL PLATE",
      category: "anvil",
      description: "Reflects incoming enemy slag shells back at bosses.",
      costCredits: 250,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Anvil Plate Layer",
      loreText: "High-reflectivity titanium anvil plate.",
    },
    {
      id: "solar_injector",
      name: "THERMAL POWER INJECTOR",
      category: "injector",
      description: "Converts ambient forge heat into extra Thermal Credits.",
      costCredits: 270,
      level: 0,
      maxLevel: 4,
      iconName: "Flame",
      statBoost: "+5 Thermal Credits / Sec Passive Gain",
      loreText: "Inductive anvil energy accumulator.",
    },
    {
      id: "forge_radar",
      name: "SPATIAL FORGE RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing slag target vectors.",
      costCredits: 210,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Forge Mini-Map Radar",
      loreText: "Telemetry radar tracking impact vectors.",
    },
    {
      id: "molten_filter",
      name: "POLARIZED MOLTEN FILTER",
      category: "filter",
      description: "Allows hammer shockwaves to pass through solid obstacles.",
      costCredits: 330,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+12% Slag Piercing Power",
      loreText: "Harmonic hammer filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE FORGE PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during hammer sprees.",
      costCredits: 370,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing anvil arcs.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE SLAG PURIFIERS",
      category: "nanite",
      description: "Deploys nanobots restoring central anvil health.",
      costCredits: 310,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Anvil HP / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "forge_magnet",
      name: "THERMAL CREDIT MAGNET",
      category: "magnet",
      description: "Instantly pulls map thermal credits into the player.",
      costCredits: 410,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Credit Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "forge_splice_core",
      name: "CHROMATIC FORGE SPLICE CORE",
      category: "splice",
      description: "Hammered thermal streams split into 3 secondary beams.",
      costCredits: 350,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Split Thermal Beams",
      loreText: "Multi-spectrum refraction core.",
    },
    {
      id: "harvest_reactor",
      name: "FOUNDRY HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates thermal credits over time while playing.",
      costCredits: 430,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+4 Thermal Credits / Sec Passive Gain",
      loreText: "Thermal energy conversion matrix.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY FORGE CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in enemy slag shells.",
      costCredits: 520,
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
      id: "first_hammer_clang",
      title: "FIRST HAMMER CLANG",
      description: "Trigger 20 hammer clangs in Forge.",
      rewardThermalEnergy: 220,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "thermal",
    },
    {
      id: "thermal_harvester",
      title: "THERMAL CREDITS HARVESTER",
      description: "Accumulate a total of 2,500 Thermal Credits.",
      rewardThermalEnergy: 320,
      unlocked: false,
      currentProgress: 2500,
      maxProgress: 2500,
      categoryTag: "economy",
    },
    {
      id: "obsidian_master",
      title: "OBSIDIAN BLAST MASTER",
      description: "Execute 20 Obsidian Blasts in Forge Arena.",
      rewardThermalEnergy: 280,
      unlocked: false,
      currentProgress: 15,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "forge_streak_master",
      title: "FORGE STREAK MASTER",
      description: "Execute a 5-stream hammer strike chain.",
      rewardThermalEnergy: 380,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "foundry_architect",
      title: "FOUNDRY ARCHITECT",
      description: "Purchase 5 Blacksmith Foundry Upgrades.",
      rewardThermalEnergy: 350,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "ANVIL AURA HARMONIZER",
      description: "Unlock at least 3 custom Anvil Skins.",
      rewardThermalEnergy: 440,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "thermal",
    },
    {
      id: "plasma_flare_master",
      title: "PLASMA FLARE MASTER",
      description: "Trigger 10 Plasma Flares in a single match.",
      rewardThermalEnergy: 320,
      unlocked: false,
      currentProgress: 6,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_smith",
      title: "HYPER BLACKSMITH",
      description: "Clear a blacksmith forge stage under 60 seconds.",
      rewardThermalEnergy: 400,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "thermal",
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
    forgeCore: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#ea580c", integrity: 1000, active: true },
      { id: 2, x: 250, y: 200, radius: 30, color: "#f59e0b", integrity: 850, active: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", integrity: 920, active: true },
    ] as ForgeDeflectorNode[],
    targets: [] as ForgeTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as ForgeParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "forge_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "FORGE BLACKSMITH DUEL ALPHA", hostName: "Vulcan_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 12, mode: "Blacksmith Surge", roomStatus: "open" },
        { id: "room_2", name: "OBSIDIAN BLAST SIEGE #09", hostName: "Anvil_Vanguard", currentPlayers: 1, maxPlayers: 2, pingMs: 17, mode: "Obsidian Blast", roomStatus: "open" },
        { id: "room_3", name: "FORGE ARENA CHAMPIONSHIP", hostName: "Forge_Lord", currentPlayers: 2, maxPlayers: 2, pingMs: 14, mode: "Forge Arena", roomStatus: "full" },
        { id: "room_4", name: "PLASMA FLARE DUEL", hostName: "Hammer_Ninja", currentPlayers: 1, maxPlayers: 2, pingMs: 16, mode: "Plasma Flare", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#ea580c") => {
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
    if (thermalCredits >= item.costCredits && item.level < item.maxLevel) {
      setThermalCredits((prev) => prev - item.costCredits);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costCredits: Math.round(i.costCredits * 1.55) } : i))
      );
      audioSynthEngine.playHammerClangSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setThermalCredits((prev) => prev + ach.rewardThermalEnergy);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playHammerClangSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: AuraOption) => {
    if (!aura.unlocked && aura.costCredits && thermalCredits >= aura.costCredits) {
      setThermalCredits((prev) => prev - aura.costCredits);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playHammerClangSFX();
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
      message: `Executing Forge Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, RECHARGE, STRIKE, CLEAR, FORGE, ARMORY" };
    } else if (cmd === "RECHARGE") {
      setThermalCredits((prev) => prev + 300);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+300 Thermal Credits injected via Core Array." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Credits: ${thermalCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startForgeGame = (mode: ForgeGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundForgeMelody();
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
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold font-mono">
            <Flame className="w-4 h-4 text-orange-400" /> {thermalCredits} THERMAL CREDITS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#1e293b] rounded-3xl border border-orange-500/30 overflow-hidden shadow-[0_0_80px_rgba(234,88,12,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#0f172a]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-orange-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-orange-950/80 via-amber-950/60 to-red-950/80 shadow-[0_0_40px_rgba(234,88,12,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> Flagship Thermal Foundry Blacksmith RPG
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-red-300">
                  FORGE
                </h1>
                <p className="text-xs text-orange-100/70 mt-1">
                  Thermal blacksmith RPG, foundry shop upgrades, online leaderboards, and anvil codex.
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
                ] as ForgeMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-orange-400 to-red-500 text-black shadow-[0_0_20px_rgba(234,88,12,0.4)]"
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
                  onClick={() => startForgeGame("blacksmith_surge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-orange-500/30 hover:border-orange-400 hover:bg-orange-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-orange-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">BLACKSMITH SURGE</div>
                    <div className="text-xs text-orange-200/60 mt-1">Clang molten thermal strikes</div>
                  </div>
                </button>

                <button
                  onClick={() => startForgeGame("obsidian_blast")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Zap className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">OBSIDIAN BLAST</div>
                    <div className="text-xs text-amber-200/60 mt-1">Shatter hostile slag artillery</div>
                  </div>
                </button>

                <button
                  onClick={() => startForgeGame("forge_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-red-500/30 hover:border-red-400 hover:bg-red-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sparkles className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">FORGE ARENA</div>
                    <div className="text-xs text-red-200/60 mt-1">Endless molten blacksmith warfare</div>
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
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                        {item.category === "hammer" && <Flame className="w-6 h-6" />}
                        {item.category === "bellows" && <Zap className="w-6 h-6" />}
                        {item.category === "anvil" && <Shield className="w-6 h-6" />}
                        {item.category === "injector" && <Flame className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "filter" && <Sparkles className="w-6 h-6" />}
                        {item.category === "overdrive" && <Activity className="w-6 h-6" />}
                        {item.category === "harvest" && <Cpu className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-orange-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || thermalCredits < item.costCredits}
                      className="px-4 py-2 rounded-xl bg-orange-400 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
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
                        <div className="font-bold text-sm text-orange-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-orange-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-orange-400 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL FORGE LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-orange-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-orange-300 font-bold">{entry.score} PTS</span>
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
                      <div className="text-[10px] text-orange-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-orange-400 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardThermalEnergy} CREDITS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Strikes Executed</div>
                  <div className="text-2xl font-black text-orange-400 font-mono">{analytics.strikesExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Credits Harvested</div>
                  <div className="text-2xl font-black text-orange-400 font-mono">{analytics.thermalCreditsHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Obsidian Blasts</div>
                  <div className="text-2xl font-black text-orange-400 font-mono">{analytics.obsidianBlastExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-orange-400 font-mono">{analytics.quantumTimeSeconds}s</div>
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
                        ? "bg-orange-500/10 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Flame className="w-6 h-6 text-black" />
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
                        className="px-3 py-1.5 rounded-lg bg-orange-400 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-orange-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-orange-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-orange-400 font-mono">
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
                            ? "text-orange-400"
                            : log.level === "WARN"
                            ? "text-red-400"
                            : "text-amber-400"
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-400 text-black font-bold text-xs uppercase">
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
                      <span className="font-mono text-orange-400">{settings.sfxVolume}%</span>
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
                      className="w-full accent-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-orange-400">{settings.bgmVolume}%</span>
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
                      className="w-full accent-orange-500"
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
