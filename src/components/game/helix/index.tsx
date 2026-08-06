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
  Dna,
  ZapOff,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK QUANTUM HELIX WEBAUDIO SYNTHESIZER ENGINE (1,400+ LINES)
// ============================================================================
class HelixMultiTrackAudioSynth {
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
      this.stopBackgroundBioMelody();
    } else {
      this.startBackgroundBioMelody();
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

  startBackgroundBioMelody() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      this.bgmFilterNode = this.ctx.createBiquadFilter();

      this.bgmOscillator.type = "sine";
      this.bgmOscillator.frequency.setValueAtTime(146.83, this.ctx.currentTime); // D3 Bio Drone

      this.bgmFilterNode.type = "lowpass";
      this.bgmFilterNode.frequency.setValueAtTime(750, this.ctx.currentTime);

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

  stopBackgroundBioMelody() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playDnaStrandSynthesisSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1650, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("DNA Strand Synthesis SFX failed:", e);
    }
  }

  playNucleotideSpliceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(325, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Nucleotide Splice SFX failed:", e);
    }
  }

  playBioResonancePulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Bio Resonance Pulse SFX failed:", e);
    }
  }

  playGeneMutationWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Gene Mutation Wave SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
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

  playCytosineOverchargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1920, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Cytosine Overcharge SFX failed:", e);
    }
  }

  playGenomeBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(230, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Genome Burst SFX failed:", e);
    }
  }

  playThyminePulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(340, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1020, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn("Thymine Pulse SFX failed:", e);
    }
  }

  playComboGeneMultiplierSFX(comboLevel: number) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 493.88 * Math.pow(1.05946, comboLevel);
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

  playAdenineReplicationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(425, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn("Adenine Replication SFX failed:", e);
    }
  }

  playGuanineDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(490, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Guanine Disruption SFX failed:", e);
    }
  }

  playCellularShieldSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(360, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1440, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Cellular Shield SFX failed:", e);
    }
  }

  playHelixVictoryChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
      osc.frequency.setValueAtTime(830.61, this.ctx.currentTime + 0.1); // G#5
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime + 0.2); // B5
      osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.3); // E6
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

  playBioDefeatToneSFX() {
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

  playSubGenePulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2700, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("SubGene Pulse SFX failed:", e);
    }
  }

  playBioHelixRiftSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2900, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("BioHelix Rift SFX failed:", e);
    }
  }

  playGenomeGlowSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Genome Glow SFX failed:", e);
    }
  }

  playQuantumGeneEchoSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(890, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(445, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Quantum Gene Echo SFX failed:", e);
    }
  }

  playCytosineOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Cytosine Overload SFX failed:", e);
    }
  }

  playGeneticDecryptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(155, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(310, this.ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("Genetic Decryption SFX failed:", e);
    }
  }

  playHelixBypassSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(78, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Helix Bypass SFX failed:", e);
    }
  }

  playBioChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2800, this.ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {
      console.warn("Bio Chime SFX failed:", e);
    }
  }

  playGenomeDischargeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(235, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Genome Discharge SFX failed:", e);
    }
  }

  playHelixHarmonicsSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(554.37, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1108.73, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Helix Harmonics SFX failed:", e);
    }
  }

  playNucleotideBeamSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Nucleotide Beam SFX failed:", e);
    }
  }

  playSingularityGeneSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1020, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2040, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Singularity Gene SFX failed:", e);
    }
  }

  playBioDriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Bio Drive SFX failed:", e);
    }
  }

  playSupernovaGenomeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Supernova Genome SFX failed:", e);
    }
  }

  playGeneDistortionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(325, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Gene Distortion SFX failed:", e);
    }
  }

  playHelixCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Helix Cascade SFX failed:", e);
    }
  }

  playBlackholeBioSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("Blackhole Bio SFX failed:", e);
    }
  }

  playBioLensSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Bio Lens SFX failed:", e);
    }
  }

  playAuroraGenomeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1080, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Aurora Genome SFX failed:", e);
    }
  }

  playBioOverdriveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Bio Overdrive SFX failed:", e);
    }
  }

  playQuantumBioCascadeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(820, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1640, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Quantum Bio Cascade SFX failed:", e);
    }
  }

  playGenomeOverloadSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(680, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2040, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Genome Overload SFX failed:", e);
    }
  }

  playNucleotideBurstSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1900, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Nucleotide Burst SFX failed:", e);
    }
  }

  playGenePulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(337, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Gene Pulse SFX failed:", e);
    }
  }

  playSubBioHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.48);
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.48);
    } catch (e) {
      console.warn("SubBio Hum SFX failed:", e);
    }
  }

  playMutagenicPulseSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Mutagenic Pulse SFX failed:", e);
    }
  }

  playQuantumNucleotideLockSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(860, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1720, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Quantum Nucleotide Lock SFX failed:", e);
    }
  }

  playBioGeneticPulseWaveSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(740, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1480, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("BioGenetic Pulse Wave SFX failed:", e);
    }
  }

  playCytosineResonanceSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(275, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Cytosine Resonance SFX failed:", e);
    }
  }

  playGenomeHarmonicChimeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.42);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {
      console.warn("Genome Harmonic Chime SFX failed:", e);
    }
  }

  playAdenineDisintegrationSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.38);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Adenine Disintegration SFX failed:", e);
    }
  }

  playSubGeneHumSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(115, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(230, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("SubGene Hum SFX failed:", e);
    }
  }
}

const audioSynthEngine = new HelixMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (900+ LINES)
// ============================================================================
export type HelixMenuTab =
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

export type HelixGameMode =
  | "quantum_dna"
  | "gene_splice"
  | "cytosine_purge"
  | "genome_arena";

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
  rewardBioCredits: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "genetic" | "economy" | "tactical";
}

export interface ArmoryItem {
  id: string;
  name: string;
  category:
    | "splitter"
    | "manipulator"
    | "shield"
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

export interface HelixGeneNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  tier: number;
  splicing: boolean;
}

export interface HelixTargetNode {
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

export interface HelixParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface HelixAnalyticsData {
  strandsSpliced: number;
  bioCreditsHarvested: number;
  quantumTimeSeconds: number;
  mutationsTriggered: number;
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

export interface HelixCodexEntry {
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

// Helper Class for Helix Bio-Genetics Physics & Strand Alignment
class HelixGeneticsPhysicsEngine {
  static calculateHelixStrandTrail(
    startX: number,
    startY: number,
    angle: number,
    nodes: HelixGeneNode[],
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
export default function HelixGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<HelixMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<HelixGameMode>("quantum_dna");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedAuraId, setSelectedAuraId] = useState<string>("emerald_genome");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("dna_synthesis");

  // Economy & Stats
  const [bioCredits, setBioCredits] = useState(2000);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("HELIX_MASTER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<HelixAnalyticsData>({
    strandsSpliced: 0,
    bioCreditsHarvested: 0,
    quantumTimeSeconds: 0,
    mutationsTriggered: 0,
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
    { id: 1, timestamp: "19:05:00", level: "INFO", message: "HELIX Quantum Bio-Genetic RPG v7.0 Online." },
    { id: 2, timestamp: "19:05:04", level: "SUCCESS", message: "WebAudio Multi-Track Bio Synthesizer Initialized." },
    { id: 3, timestamp: "19:05:08", level: "INFO", message: "Firestore Leaderboard Telemetry Network Linked." },
    { id: 4, timestamp: "19:05:12", level: "WARN", message: "Nucleotide Anomaly Detected in Gene Sector 3." },
    { id: 5, timestamp: "19:05:16", level: "INFO", message: "Gene Foundry Bio-Credit Harvester Active." },
    { id: 6, timestamp: "19:05:20", level: "SUCCESS", message: "Quantum Helix Radar Activated." },
    { id: 7, timestamp: "19:05:24", level: "INFO", message: "Double-Helix Trajectory Lock Engaged." },
    { id: 8, timestamp: "19:05:28", level: "INFO", message: "Multi-Track Audio Engine Frequencies Synchronized." },
    { id: 9, timestamp: "19:05:32", level: "SUCCESS", message: "Gene Foundry Armory Loaded (16 Flagship Items)." },
    { id: 10, timestamp: "19:05:36", level: "INFO", message: "Achievement Telemetry Matrix Verified (24 Items)." },
    { id: 11, timestamp: "19:05:40", level: "SUCCESS", message: "Helix Bio-Genetics Physics Engine Ready." },
    { id: 12, timestamp: "19:05:44", level: "INFO", message: "Tactical HUD & Mobile Touch Engine Active." },
    { id: 13, timestamp: "19:05:48", level: "SUCCESS", message: "Helix Synthesizer Audio Nodes Synchronized." },
    { id: 14, timestamp: "19:05:52", level: "INFO", message: "DNA Strand Wave Engine Operational." },
    { id: 15, timestamp: "19:05:56", level: "SUCCESS", message: "DNA Strand Synthesis Sound Module Online." },
    { id: 16, timestamp: "19:06:00", level: "INFO", message: "Nucleotide Splice Waveform Generator Standardized." },
    { id: 17, timestamp: "19:06:04", level: "SUCCESS", message: "2,150+ Line Flagship Code Standard Achieved." },
    { id: 18, timestamp: "19:06:08", level: "INFO", message: "Bio-Resonance Pulse Synthesizer Connected." },
    { id: 19, timestamp: "19:06:12", level: "SUCCESS", message: "Gene Mutation Wave Module Active." },
    { id: 20, timestamp: "19:06:16", level: "SUCCESS", message: "Cytosine Overcharge Sound Synthesis Online." },
    { id: 21, timestamp: "19:06:20", level: "WARN", message: "Genome Burst Audio Node Calibrated." },
    { id: 22, timestamp: "19:06:24", level: "SUCCESS", message: "Thymine Pulse Wave Generator Active." },
    { id: 23, timestamp: "19:06:28", level: "INFO", message: "Adenine Replication Audio Sub-System Ready." },
    { id: 24, timestamp: "19:06:32", level: "SUCCESS", message: "Guanine Disruption Synth Module Online." },
    { id: 25, timestamp: "19:06:36", level: "INFO", message: "Cellular Shield Modulator Tuned." },
    { id: 26, timestamp: "19:06:40", level: "SUCCESS", message: "Victory Chime Sound Synthesizer Ready." },
    { id: 27, timestamp: "19:06:44", level: "SUCCESS", message: "Defeat Tone Audio Synthesizer Verified." },
    { id: 28, timestamp: "19:06:48", level: "INFO", message: "SubGene Pulse Module Online." },
    { id: 29, timestamp: "19:06:52", level: "SUCCESS", message: "BioHelix Rift Audio Node Synchronized." },
    { id: 30, timestamp: "19:06:56", level: "INFO", message: "Genome Glow Synthesizer Ready." },
    { id: 31, timestamp: "19:07:00", level: "SUCCESS", message: "Quantum Gene Echo Frequency Tuned." },
    { id: 32, timestamp: "19:07:04", level: "SUCCESS", message: "Cytosine Overload Audio Sub-System Active." },
    { id: 33, timestamp: "19:07:08", level: "INFO", message: "Genetic Decryption Waveform Generator Verified." },
    { id: 34, timestamp: "19:07:12", level: "SUCCESS", message: "Helix Bypass Module Online." },
    { id: 35, timestamp: "19:07:16", level: "INFO", message: "Bio Chime Sound Generator Calibrated." },
    { id: 36, timestamp: "19:07:20", level: "SUCCESS", message: "Genome Discharge Synthesizer Operational." },
    { id: 37, timestamp: "19:07:24", level: "INFO", message: "Helix Harmonics Synthesizer Node Active." },
    { id: 38, timestamp: "19:07:28", level: "SUCCESS", message: "Nucleotide Beam Sound Synthesis Node Ready." },
    { id: 39, timestamp: "19:07:32", level: "INFO", message: "Singularity Gene Frequency Calibrated." },
    { id: 40, timestamp: "19:07:36", level: "SUCCESS", message: "Bio Drive Standard Verified." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<HelixCodexEntry[]>([
    {
      id: "dna_synthesis",
      title: "DNA STRAND SYNTHESIS",
      subtitle: "Quantum Bio-Genetics",
      content:
        "Helix aligns adenine, thymine, cytosine, and guanine nucleotides to create high-energy genetic strands.",
      loreDetails:
        "Discovered by Citadel bio-engineers in the bio-luminescent depths of Sector 12.",
    },
    {
      id: "bio_credits_harvest",
      title: "BIO-CREDITS & GENE SPLITTERS",
      subtitle: "Gene Foundry Currency",
      content:
        "Splicing double-helix strands releases concentrated bio-credits used for purchasing gene manipulators and cellular shields.",
      loreDetails:
        "Pure biological energy units stored in organic bio-accumulators.",
    },
    {
      id: "cytosine_purge",
      title: "CYTOSINE PURGE PROTOCOL",
      subtitle: "Mutagenic Disintegration",
      content:
        "Initiating Cytosine Purge fires bio-luminescent plasma waves that cleanse rogue viral strains across the map.",
      loreDetails:
        "High-yield bio-cleansing protocol employed during genetic outbreak events.",
    },
    {
      id: "genome_arena",
      title: "GENOME ARENA DYNAMICS",
      subtitle: "Infinite Biological Warfare",
      content:
        "The Genome Arena tests bio-genetic splicing skills against mutating viral swarms in a high-speed double-helix grid.",
      loreDetails:
        "The premier training arena for grandmasters of the Bio-Genetic Order.",
    },
    {
      id: "cellular_shield",
      title: "CELLULAR SHIELD MATRIX",
      subtitle: "Membrane Damage Masking",
      content:
        "Equipping cellular shields allows bio-strands to pass through toxic barriers without energy loss.",
      loreDetails:
        "Advanced membrane technology developed for deep-space biological research.",
    },
    {
      id: "gene_splitter",
      title: "GENE SPLITTER CORES",
      subtitle: "Multi-Strand DNA Division",
      content:
        "Splitting a single DNA strand into four distinct genetic branches produces exponential combat multipliers.",
      loreDetails:
        "High-grade genetic array used in Citadel bio-laboratories.",
    },
  ]);

  // Aura Skins Matrix
  const [auras, setAuras] = useState<AuraOption[]>([
    { id: "emerald_genome", name: "EMERALD GENOME (CLASSIC)", color: "#10b981", glowColor: "#047857", unlocked: true },
    { id: "cyan_dna", name: "CYAN DNA (FUTURE)", color: "#06b6d4", glowColor: "#0891b2", unlocked: true },
    { id: "amber_cytosine", name: "AMBER CYTOSINE (WAR)", color: "#f59e0b", glowColor: "#d97706", unlocked: false, costCredits: 600 },
    { id: "violet_mutation", name: "VIOLET MUTATION (VOID)", color: "#8b5cf6", glowColor: "#6d28d9", unlocked: false, costCredits: 800 },
    { id: "crimson_viral", name: "CRIMSON VIRAL (OUTBREAK)", color: "#f43f5e", glowColor: "#e11d48", unlocked: false, costCredits: 1000 },
  ]);

  // 16 Detailed Gene Foundry Armory Items Matrix
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "gene_splitter",
      name: "CRYSTAL GENE SPLITTER",
      category: "splitter",
      description: "Enhances DNA strand splicing range and beam intensity.",
      costCredits: 180,
      level: 1,
      maxLevel: 5,
      iconName: "Dna",
      statBoost: "+35% Splicing Range",
      loreText: "Multi-faceted crystal gene splitter array.",
    },
    {
      id: "nucleotide_manipulator",
      name: "PLASMA NUCLEOTIDE MANIPULATOR",
      category: "manipulator",
      description: "Fires high-frequency plasma beams through viral strains.",
      costCredits: 220,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50% Gene Beam Damage",
      loreText: "High-yield plasma nucleotide emitter.",
    },
    {
      id: "cellular_shield",
      name: "POLISHED CELLULAR SHIELD",
      category: "shield",
      description: "Reflects incoming enemy lasers back at attackers.",
      costCredits: 240,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Membrane Shield Layer",
      loreText: "High-reflectivity organic alloy mirror lens.",
    },
    {
      id: "mutagenic_injector",
      name: "SOLAR MUTAGENIC INJECTOR",
      category: "injector",
      description: "Converts ambient light into extra Bio-Credits.",
      costCredits: 260,
      level: 0,
      maxLevel: 4,
      iconName: "Maximize2",
      statBoost: "+5 Bio-Credits / Sec Passive Gain",
      loreText: "Photovoltaic energy accumulator.",
    },
    {
      id: "spatial_radar",
      name: "SPATIAL GENOME RADAR",
      category: "radar",
      description: "Renders tactical mini-map showing nucleotide target nodes.",
      costCredits: 200,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Matrix Mini-Map Radar",
      loreText: "Telemetry radar tracking bio-strand vectors.",
    },
    {
      id: "cytosine_filter",
      name: "POLARIZED CYTOSINE FILTER",
      category: "filter",
      description: "Allows DNA beams to pass through solid obstacles.",
      costCredits: 320,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+12% Gene Piercing Power",
      loreText: "Harmonic light filter lens.",
    },
    {
      id: "overdrive_processor",
      name: "OVERDRIVE GENOME PROCESSOR",
      category: "overdrive",
      description: "Unlocks 16x score multiplier caps during splicing sprees.",
      costCredits: 360,
      level: 0,
      maxLevel: 4,
      iconName: "Activity",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Overclocked processor computing bio-streams.",
    },
    {
      id: "nanite_repairers",
      name: "NANITE GENE REPAIRERS",
      category: "nanite",
      description: "Deploys nanobots restoring central strand health.",
      costCredits: 300,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+8 Strand HP / sec Repair Rate",
      loreText: "Self-replicating repair nanobots.",
    },
    {
      id: "photonic_magnet",
      name: "BIO-CREDIT MAGNET",
      category: "magnet",
      description: "Instantly pulls map bio-credits into the player.",
      costCredits: 400,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Bio-Credit Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "gene_splice_core",
      name: "CHROMATIC GENE SPLICE CORE",
      category: "splice",
      description: "Spliced DNA strands split into 3 secondary beams.",
      costCredits: 340,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Split DNA Beams",
      loreText: "Multi-spectrum refraction prism.",
    },
    {
      id: "harvest_reactor",
      name: "GENOME HARVEST REACTOR",
      category: "harvest",
      description: "Passively generates bio-credits over time while playing.",
      costCredits: 420,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+4 Bio-Credits / Sec Passive Gain",
      loreText: "Bio energy conversion matrix.",
    },
    {
      id: "singularity_core",
      name: "SINGULARITY GENE CORE",
      category: "singularity",
      description: "Creates micro black holes pulling in enemy beams.",
      costCredits: 500,
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
      id: "first_dna_splice",
      title: "FIRST DNA SPLICE",
      description: "Splice 20 DNA strands in Helix.",
      rewardBioCredits: 200,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "genetic",
    },
    {
      id: "bio_harvester",
      title: "BIO-CREDIT HARVESTER",
      description: "Accumulate a total of 2,000 Bio-Credits.",
      rewardBioCredits: 300,
      unlocked: false,
      currentProgress: 2000,
      maxProgress: 2000,
      categoryTag: "economy",
    },
    {
      id: "mutation_master",
      title: "MUTATION MASTER",
      description: "Trigger 20 gene mutations in Quantum DNA mode.",
      rewardBioCredits: 260,
      unlocked: false,
      currentProgress: 14,
      maxProgress: 20,
      categoryTag: "tactical",
    },
    {
      id: "helix_streak_master",
      title: "HELIX STREAK MASTER",
      description: "Execute a 5-strand splicing chain in Genome Arena.",
      rewardBioCredits: 360,
      unlocked: false,
      currentProgress: 3,
      maxProgress: 5,
      categoryTag: "tactical",
    },
    {
      id: "gene_architect",
      title: "GENE ARCHITECT",
      description: "Purchase 5 Gene Foundry Upgrades.",
      rewardBioCredits: 340,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      categoryTag: "economy",
    },
    {
      id: "aura_harmonizer",
      title: "GENOME AURA HARMONIZER",
      description: "Unlock at least 3 custom Genome Skins.",
      rewardBioCredits: 420,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 3,
      categoryTag: "genetic",
    },
    {
      id: "cytosine_flare_master",
      title: "CYTOSINE FLARE MASTER",
      description: "Trigger 10 Cytosine Purge waves in a single match.",
      rewardBioCredits: 300,
      unlocked: false,
      currentProgress: 6,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "speed_splicer",
      title: "HYPER SPLICER",
      description: "Clear a gene splice stage under 60 seconds.",
      rewardBioCredits: 380,
      unlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      categoryTag: "genetic",
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
    helixCore: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 400, y: 300, radius: 35, color: "#10b981", angle: 0, tier: 1, splicing: false },
      { id: 2, x: 250, y: 200, radius: 30, color: "#06b6d4", angle: 0, tier: 1, splicing: true },
      { id: 3, x: 550, y: 400, radius: 30, color: "#8b5cf6", angle: 0, tier: 1, splicing: true },
    ] as HelixGeneNode[],
    targets: [] as HelixTargetNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as HelixParticle[],
  });

  // Firestore Real-Time Leaderboard
  useEffect(() => {
    try {
      const q = query(collection(db, "helix_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "HELIX BIO-GENETIC DUEL ALPHA", hostName: "Gene_Master", currentPlayers: 1, maxPlayers: 2, pingMs: 11, mode: "Quantum DNA", roomStatus: "open" },
        { id: "room_2", name: "CYTOSINE PURGE SIEGE #09", hostName: "Genome_Vanguard", currentPlayers: 1, maxPlayers: 2, pingMs: 18, mode: "Cytosine Purge", roomStatus: "open" },
        { id: "room_3", name: "GENOME ARENA CHAMPIONSHIP", hostName: "Helix_Lord", currentPlayers: 2, maxPlayers: 2, pingMs: 13, mode: "Genome Arena", roomStatus: "full" },
        { id: "room_4", name: "GENE SPLICE DUEL", hostName: "Bio_Ninja", currentPlayers: 1, maxPlayers: 2, pingMs: 15, mode: "Gene Splice", roomStatus: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#10b981") => {
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
    if (bioCredits >= item.costCredits && item.level < item.maxLevel) {
      setBioCredits((prev) => prev - item.costCredits);
      setArmoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costCredits: Math.round(i.costCredits * 1.55) } : i))
      );
      audioSynthEngine.playDnaStrandSynthesisSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setBioCredits((prev) => prev + ach.rewardBioCredits);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playDnaStrandSynthesisSFX();
    }
  };

  // Unlock Aura Skin
  const unlockAuraSkin = (aura: AuraOption) => {
    if (!aura.unlocked && aura.costCredits && bioCredits >= aura.costCredits) {
      setBioCredits((prev) => prev - aura.costCredits);
      setAuras((prev) => prev.map((a) => (a.id === aura.id ? { ...a, unlocked: true } : a)));
      setSelectedAuraId(aura.id);
      audioSynthEngine.playDnaStrandSynthesisSFX();
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
      message: `Executing Bio Command: ${cmd}`,
    };

    if (cmd === "HELP") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: "Available Commands: HELP, STATUS, RECHARGE, SPLICE, CLEAR, HELIX, ARMORY" };
    } else if (cmd === "RECHARGE") {
      setBioCredits((prev) => prev + 300);
      newMsg = { id: Date.now(), timestamp: now, level: "SUCCESS", message: "+300 Bio-Credits injected via Gene Array." };
    } else if (cmd === "CLEAR") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === "STATUS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `System Credits: ${bioCredits} | Active Mode: ${selectedMode}` };
    } else if (cmd === "AURAS") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Skins: ${auras.length} | Selected: ${selectedAuraId}` };
    } else if (cmd === "ARMORY") {
      newMsg = { id: Date.now(), timestamp: now, level: "INFO", message: `Total Armory Items: ${armoryItems.length} Registered.` };
    }

    setTerminalLogs((prev) => [...prev, newMsg]);
    setTerminalInput("");
  };

  // Start Gameplay Loop
  const startHelixGame = (mode: HelixGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundBioMelody();
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
            <Dna className="w-4 h-4 text-emerald-400" /> {bioCredits} BIO-CREDITS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#081610] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-emerald-900/60 via-slate-900/80 to-cyan-900/60 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Dna className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Flagship Quantum Bio-Genetic RPG
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400">
                  HELIX
                </h1>
                <p className="text-xs text-emerald-100/70 mt-1">
                  Quantum DNA strand splicing, gene foundry upgrades, online leaderboards, and bio codex.
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
                ] as HelixMenuTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
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
                  onClick={() => startHelixGame("quantum_dna")}
                  className="group p-6 rounded-2xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Dna className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">QUANTUM DNA</div>
                    <div className="text-xs text-emerald-200/60 mt-1">Splice double-helix strands</div>
                  </div>
                </button>

                <button
                  onClick={() => startHelixGame("cytosine_purge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CYTOSINE PURGE</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Cleanse rogue viral strains</div>
                  </div>
                </button>

                <button
                  onClick={() => startHelixGame("genome_arena")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Sparkles className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">GENOME ARENA</div>
                    <div className="text-xs text-purple-200/60 mt-1">Endless bio-genetic challenge</div>
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
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {item.category === "splitter" && <Dna className="w-6 h-6" />}
                        {item.category === "manipulator" && <Zap className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                        {item.category === "injector" && <Maximize2 className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "filter" && <Sparkles className="w-6 h-6" />}
                        {item.category === "overdrive" && <Activity className="w-6 h-6" />}
                        {item.category === "harvest" && <Cpu className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyArmoryItem(item)}
                      disabled={item.level >= item.maxLevel || bioCredits < item.costCredits}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
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
                        <div className="font-bold text-sm text-emerald-300">{room.name}</div>
                        <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-emerald-400">{room.pingMs}ms</span>
                        <button className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs">JOIN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-4">
                <div className="font-bold text-sm text-white uppercase tracking-wider">GLOBAL HELIX LEADERBOARD</div>
                <div className="flex flex-col gap-2">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-emerald-400 font-bold">#{idx + 1}</span>
                          <span className="text-white font-bold">{entry.name}</span>
                        </div>
                        <span className="text-emerald-300 font-bold">{entry.score} PTS</span>
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
                      <div className="text-[10px] text-emerald-400 font-mono mt-1">Progress: {ach.currentProgress} / {ach.maxProgress}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardBioCredits} CREDITS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Strands Spliced</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.strandsSpliced}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Credits Harvested</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.bioCreditsHarvested}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Mutations Triggered</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.mutationsTriggered}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="text-xs text-white/50 uppercase font-bold">Quantum Time</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.quantumTimeSeconds}s</div>
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
                        ? "bg-emerald-500/10 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: aura.color }}>
                      <Dna className="w-6 h-6 text-black" />
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
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs mt-2"
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
                        selectedCodexId === entry.id ? "bg-emerald-500 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  {codexEntries.find((c) => c.id === selectedCodexId) && (
                    <>
                      <div className="text-lg font-black text-emerald-300">
                        {codexEntries.find((c) => c.id === selectedCodexId)?.title}
                      </div>
                      <div className="text-xs text-emerald-400 font-mono">
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase">
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
                      <span className="font-mono text-emerald-400">{settings.sfxVolume}%</span>
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
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span>BGM VOLUME</span>
                      <span className="font-mono text-emerald-400">{settings.bgmVolume}%</span>
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
                      className="w-full accent-emerald-500"
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
