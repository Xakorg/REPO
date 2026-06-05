"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Music, 
  Play, 
  Square as SquareIcon, 
  Trash2, 
  Save, 
  Disc, 
  Volume2, 
  Radio, 
  CloudRain, 
  Flame, 
  ChevronRight, 
  Loader2, 
  Zap, 
  Bot,
  Activity,
  Sparkles
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Synth frequencies mapping (C4 to C5)
const PIANO_KEYS = [
  { note: "C4", freq: 261.63, isBlack: false },
  { note: "C#4", freq: 277.18, isBlack: true },
  { note: "D4", freq: 293.66, isBlack: false },
  { note: "D#4", freq: 311.13, isBlack: true },
  { note: "E4", freq: 329.63, isBlack: false },
  { note: "F4", freq: 349.23, isBlack: false },
  { note: "F#4", freq: 369.99, isBlack: true },
  { note: "G4", freq: 392.00, isBlack: false },
  { note: "G#4", freq: 415.30, isBlack: true },
  { note: "A4", freq: 440.00, isBlack: false },
  { note: "A#4", freq: 466.16, isBlack: true },
  { note: "B4", freq: 493.88, isBlack: false },
  { note: "C5", freq: 523.25, isBlack: false },
];

const PRESETS = [
  {
    name: "Lofi Kickback",
    bpm: 90,
    grid: {
      kick:  [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      synth: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
    }
  },
  {
    name: "Cyber Trap Grid",
    bpm: 140,
    grid: {
      kick:  [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      synth: [false, false, true, false, false, false, true, false, false, true, false, false, true, false, false, true],
    }
  },
  {
    name: "House Pulse",
    bpm: 120,
    grid: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      synth: [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true],
    }
  }
];

export default function XakSoundPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeStep, setActiveStep] = useState(0);
  const [synthType, setSynthType] = useState<OscillatorType>("triangle");
  
  // Audio Nodes Configuration States
  const [delayFeedback, setDelayFeedback] = useState(0.4);
  const [filterFreq, setFilterFreq] = useState(2000);
  const [volume, setVolume] = useState(0.5);

  // Focus soundscape modes
  const [focusMode, setFocusMode] = useState<"none" | "rain" | "lofi" | "cyber">("none");

  // Track name input for saving
  const [trackName, setTrackName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sequencer Grid State (4 channels x 16 steps)
  const [grid, setGrid] = useState<Record<string, boolean[]>>({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hat: Array(16).fill(false),
    synth: Array(16).fill(false),
  });

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  // Ambient focus nodes refs
  const rainSourceRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      stopSequencer();
      stopFocusSoundscape();
    };
  }, []);

  // Fetch saved tracks from DB (User Specific collection matching security rules)
  const tracksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "sound_tracks"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore, user]);

  const { data: savedTracks, isLoading: loadingTracks } = useCollection(tracksQuery);

  // Initialize Audio Context on demand
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // Play a Keyboard Note with Echo Delay and Filter
  const playKeyboardNote = (freq: number) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Echo Delay Nodes
    const delay = ctx.createDelay(1.0);
    const feedback = ctx.createGain();

    osc.type = synthType;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, time);

    gain.gain.setValueAtTime(volume * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    // Setup Echo Delay Feedback loop
    delay.delayTime.setValueAtTime(0.3, time);
    feedback.gain.setValueAtTime(delayFeedback, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Feed gain into delay line
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.6);
  };

  // Drum Synth Functions
  const playKick = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    gain.gain.setValueAtTime(volume * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.12);
  };

  const playSnare = (ctx: AudioContext, time: number) => {
    // Generate white noise buffer
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Snare snap pop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);
    oscGain.gain.setValueAtTime(volume * 0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.16);
    osc.start(time);
    osc.stop(time + 0.09);
  };

  const playHiHat = (ctx: AudioContext, time: number) => {
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(8000, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  };

  const playSequencerSynthNote = (ctx: AudioContext, time: number, stepIndex: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = synthType;
    
    // Choose simple melody freq based on stepIndex
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // Pentatonic scale
    const freq = scale[stepIndex % scale.length];
    
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, time);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.28);
  };

  // Step Sequencer Clock scheduler
  const scheduleNextNote = () => {
    const ctx = audioCtxRef.current!;
    const secondsPerBeat = 60.0 / bpm;
    const stepDuration = secondsPerBeat / 4; // 16th notes loop

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const time = nextNoteTimeRef.current;
      const currentStep = stepRef.current;

      // Play matching steps
      if (grid.kick[currentStep]) playKick(ctx, time);
      if (grid.snare[currentStep]) playSnare(ctx, time);
      if (grid.hat[currentStep]) playHiHat(ctx, time);
      if (grid.synth[currentStep]) playSequencerSynthNote(ctx, time, currentStep);

      // Trigger UI step highlighting
      const uiStep = currentStep;
      setTimeout(() => {
        setActiveStep(uiStep);
      }, (time - ctx.currentTime) * 1000);

      // Advance time clock
      nextNoteTimeRef.current += stepDuration;
      stepRef.current = (stepRef.current + 1) % 16;
    }

    timerIdRef.current = window.setTimeout(scheduleNextNote, 25);
  };

  const startSequencer = () => {
    initAudio();
    setIsPlaying(true);
    stepRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current!.currentTime;
    scheduleNextNote();
  };

  const stopSequencer = () => {
    setIsPlaying(false);
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  // Focus soundscape: Rain synthesis
  const startRainSoundscape = () => {
    initAudio();
    const ctx = audioCtxRef.current!;
    
    // Create white noise source buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter white noise to make it sound like rain (low pass filter)
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(0);

    rainSourceRef.current = source as any;
    rainGainRef.current = gain;
  };

  const stopFocusSoundscape = () => {
    if (rainSourceRef.current) {
      try {
        (rainSourceRef.current as any).stop();
      } catch (e) {}
      rainSourceRef.current = null;
    }
    rainGainRef.current = null;
  };

  const toggleFocusMode = (mode: "none" | "rain" | "lofi" | "cyber") => {
    stopFocusSoundscape();
    
    if (mode === focusMode || mode === "none") {
      setFocusMode("none");
      toast({ title: "Soundscape Deactivated" });
      return;
    }

    setFocusMode(mode);
    toast({ title: `Soundscape Activated: ${mode.toUpperCase()}` });
    
    if (mode === "rain") {
      startRainSoundscape();
    }
  };

  // Preset Beat Loader
  const loadPreset = (preset: typeof PRESETS[0]) => {
    stopSequencer();
    setBpm(preset.bpm);
    setGrid(preset.grid);
    toast({ title: `Preset Loaded: ${preset.name}` });
  };

  // Clear Grid composition
  const clearGrid = () => {
    setGrid({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hat: Array(16).fill(false),
      synth: Array(16).fill(false),
    });
    toast({ title: "Workspace Cleared" });
  };

  // Save Track composition to DB
  const handleSaveTrack = async () => {
    if (!user || !firestore || !trackName.trim()) return;
    setIsSaving(true);
    try {
      const tracksRef = collection(firestore, "users", user.uid, "sound_tracks");
      await addDocumentNonBlocking(tracksRef, {
        name: trackName.trim(),
        bpm: bpm,
        grid: grid,
        synthType: synthType,
        timestamp: new Date()
      });
      toast({ title: "Track Node Saved!", description: `"${trackName}" is archived in your sound vault.` });
      setTrackName("");
    } catch (e) {
      toast({ variant: "destructive", title: "Write Error", description: "Failed to save composition." });
    } finally {
      setIsSaving(false);
    }
  };

  // Load Saved Track from DB
  const loadSavedTrack = (track: any) => {
    stopSequencer();
    setBpm(track.bpm);
    setGrid(track.grid);
    if (track.synthType) setSynthType(track.synthType);
    toast({ title: `Loaded track composition: ${track.name}` });
  };

  // Delete Track composition from DB
  const handleDeleteTrack = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    try {
      const docRef = doc(firestore, "users", user.uid, "sound_tracks", trackId);
      await deleteDocumentNonBlocking(docRef);
      toast({ title: "Track Deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting track" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto py-10 space-y-12 animate-fade-in px-6 text-foreground pb-20">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-10 opacity-5"><Music className="w-64 h-64 -rotate-12 text-indigo-500" /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-xl shadow-indigo-900/10">
            <Music className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">XakSound</h1>
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Neural Soundscapes & Synthesizer Station
            </p>
          </div>
        </div>

        <div className="flex gap-4 relative z-10 w-full md:w-auto items-center">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest hidden sm:inline">Engine status: online</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_green]" />
        </div>
      </header>

      {/* Main Studio layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left column: Step Sequencer matrix */}
        <div className="lg:col-span-8 space-y-10">
          <Card className="glass-card rounded-[3rem] border-4 border-white/10 bg-black/40 p-8 md:p-10 space-y-8 shadow-3xl">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Grid Composer</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Program looping drum beats and melodies</p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Play controls */}
                <div className="flex gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
                  {isPlaying ? (
                    <Button onClick={stopSequencer} size="icon" className="h-10 w-10 bg-rose-600 hover:bg-rose-500 text-white rounded-lg border-none shadow-md">
                      <SquareIcon className="w-4 h-4 fill-white" />
                    </Button>
                  ) : (
                    <Button onClick={startSequencer} size="icon" className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg border-none shadow-md animate-pulse">
                      <Play className="w-4 h-4 fill-white" />
                    </Button>
                  )}
                  <Button onClick={clearGrid} variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white">
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>

                {/* BPM control */}
                <div className="flex items-center gap-3 bg-black/40 border border-white/5 h-12 px-4 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">BPM</span>
                  <span className="text-sm font-black text-indigo-400 italic tabular-nums w-8">{bpm}</span>
                  <Slider 
                    value={[bpm]}
                    onValueChange={(val) => setBpm(val[0])}
                    min={60}
                    max={180}
                    step={1}
                    className="w-24 text-indigo-600"
                  />
                </div>
              </div>
            </header>

            {/* Matrix step grid */}
            <div className="space-y-6">
              {Object.keys(grid).map((channel) => (
                <div key={channel} className="flex items-center gap-4">
                  {/* Channel label */}
                  <span className="w-16 text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right select-none">{channel}</span>
                  
                  {/* Step buttons */}
                  <div className="flex-1 grid grid-cols-16 gap-2">
                    {grid[channel].map((isActive, stepIdx) => {
                      const isPlayhead = activeStep === stepIdx && isPlaying;
                      return (
                        <button
                          key={stepIdx}
                          onClick={() => {
                            initAudio();
                            const newGrid = { ...grid };
                            newGrid[channel][stepIdx] = !newGrid[channel][stepIdx];
                            setGrid(newGrid);
                          }}
                          className={cn(
                            "h-12 rounded-lg border-2 transition-all shadow-md relative overflow-hidden",
                            isActive 
                              ? channel === 'kick' ? "bg-rose-600 border-rose-500/50"
                                : channel === 'snare' ? "bg-sky-600 border-sky-500/50"
                                : channel === 'hat' ? "bg-amber-600 border-amber-500/50"
                                : "bg-purple-600 border-purple-500/50"
                              : "bg-white/5 border-white/5 hover:border-white/10",
                            isPlayhead && "ring-2 ring-white scale-105 z-10"
                          )}
                        >
                          {/* Beat bar indicators (vertical line every 4 beats) */}
                          {stepIdx % 4 === 0 && (
                            <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/10" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sequencer Playhead marker line */}
            <div className="flex gap-4 items-center">
              <span className="w-16" />
              <div className="flex-1 grid grid-cols-16 gap-2">
                {Array(16).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-center select-none">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      activeStep === i && isPlaying ? "bg-indigo-400 scale-150" : "bg-zinc-800"
                    )} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Synth Keyboard controller */}
          <Card className="glass-card rounded-[3rem] border-4 border-white/10 bg-black/40 p-8 md:p-10 space-y-8 shadow-3xl">
            <header className="flex justify-between items-center border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Synthesizer Panel</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Play notes and shape waveform parameters</p>
              </div>

              {/* Waveform selection */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                {(["sine", "square", "sawtooth", "triangle"] as OscillatorType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSynthType(type)}
                    className={cn(
                      "px-4 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      synthType === type ? "bg-indigo-600 text-white" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </header>

            {/* Parameter sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feedback Delay */}
              <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  <span>Echo Delay</span>
                  <span className="text-indigo-400">{Math.round(delayFeedback * 100)}%</span>
                </div>
                <Slider 
                  value={[delayFeedback]}
                  onValueChange={(val) => setDelayFeedback(val[0])}
                  min={0.0}
                  max={0.8}
                  step={0.05}
                />
              </div>

              {/* Filter Frequency */}
              <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  <span>LP Cutoff Filter</span>
                  <span className="text-indigo-400">{filterFreq}Hz</span>
                </div>
                <Slider 
                  value={[filterFreq]}
                  onValueChange={(val) => setFilterFreq(val[0])}
                  min={200}
                  max={8000}
                  step={100}
                />
              </div>

              {/* Volume gain */}
              <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  <span>Volume Gain</span>
                  <span className="text-indigo-400">{Math.round(volume * 100)}%</span>
                </div>
                <Slider 
                  value={[volume]}
                  onValueChange={(val) => setVolume(val[0])}
                  min={0.0}
                  max={1.0}
                  step={0.05}
                />
              </div>
            </div>

            {/* Synthesizer keys */}
            <div className="relative h-64 border-4 border-white/5 bg-zinc-950/60 rounded-[2rem] p-6 flex justify-center select-none overflow-x-auto">
              <div className="flex relative w-[600px] h-full">
                {PIANO_KEYS.map((key) => {
                  return (
                    <button
                      key={key.note}
                      onClick={() => playKeyboardNote(key.freq)}
                      className={cn(
                        "transition-all flex flex-col justify-end pb-4 border-b-4 uppercase font-black text-[9px] tracking-tight",
                        key.isBlack 
                          ? "w-8 h-32 bg-zinc-900 border-zinc-800 text-white rounded-b-lg hover:bg-zinc-800 absolute z-20 shadow-md"
                          : "w-12 h-full bg-white border-r border-zinc-200 border-b-white text-zinc-800 rounded-b-xl hover:bg-zinc-100 flex-1"
                      )}
                      style={key.isBlack ? {
                        // Offset calculations for black keys
                        left: key.note === "C#4" ? "32px"
                            : key.note === "D#4" ? "80px"
                            : key.note === "F#4" ? "176px"
                            : key.note === "G#4" ? "224px"
                            : "272px"
                      } : undefined}
                    >
                      <span className="w-full text-center">{key.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: presets and focus sounds */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Preset Beat selectors */}
          <Card className="glass-card rounded-[3rem] p-8 border-4 border-white/10 bg-zinc-950/40 space-y-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <Disc className="w-6 h-6 text-indigo-400" /> Sound Presets
            </h3>
            
            <div className="space-y-4">
              {PRESETS.map((preset) => (
                <div 
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  className="p-4 bg-black/45 border border-white/5 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-indigo-500/35 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic group-hover:text-indigo-400 transition-colors">{preset.name}</h4>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mt-1">{preset.bpm} BPM // Sequencer Node</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1.5 transition-transform" />
                </div>
              ))}
            </div>
          </Card>

          {/* Focus Soundscapes */}
          <Card className="glass-card rounded-[3rem] p-8 border-4 border-white/10 bg-zinc-950/40 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <Radio className="w-6 h-6 text-indigo-400" /> Focus Loops
            </h3>
            <p className="text-xs text-zinc-400 font-bold leading-relaxed italic">Activate ambient sound blocks designed for long coding loops.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "rain", label: "Deep Rain", icon: CloudRain },
                { id: "cyber", label: "Cyber Cafe", icon: Bot },
                { id: "lofi", label: "Lofi Hum", icon: Sparkles }
              ].map((scape) => {
                const isActive = focusMode === scape.id;
                return (
                  <Button
                    key={scape.id}
                    onClick={() => toggleFocusMode(scape.id as any)}
                    className={cn(
                      "h-16 rounded-2xl border-2 font-black uppercase text-[10px] tracking-wider transition-all flex flex-col justify-center gap-1",
                      isActive 
                        ? "bg-indigo-600 border-indigo-500 text-white" 
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                    )}
                  >
                    <scape.icon className="w-5 h-5" />
                    <span>{scape.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* User sound library */}
          <Card className="glass-card rounded-[3rem] p-8 border-4 border-white/10 bg-zinc-950/40 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <Save className="w-6 h-6 text-indigo-400" /> Compositions
            </h3>
            
            {/* Save Form */}
            {user ? (
              <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Save Current Matrix</div>
                <div className="flex gap-2">
                  <Input
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    placeholder="Track Title..."
                    className="bg-zinc-900 border-white/5 h-10 rounded-xl text-xs font-bold text-white"
                  />
                  <Button 
                    onClick={handleSaveTrack} 
                    disabled={isSaving || !trackName.trim()}
                    className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase border-none shrink-0"
                  >
                    {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4.5 h-4.5" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic font-black uppercase text-center p-4 bg-black/20 rounded-xl border border-white/5">
                Sign in to save templates
              </div>
            )}

            {/* List Saved */}
            <div className="h-60 overflow-y-auto space-y-3 pr-2">
              {loadingTracks ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>
              ) : savedTracks && savedTracks.length > 0 ? (
                savedTracks.map((track: any) => (
                  <div
                    key={track.id}
                    onClick={() => loadSavedTrack(track)}
                    className="p-3 bg-white/5 border border-white/5 hover:border-indigo-500/20 rounded-xl flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-black text-white uppercase italic truncate pr-4">{track.name}</h4>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">{track.bpm} BPM // synth: {track.synthType || 'sine'}</p>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteTrack(track.id, e)}
                      className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center opacity-20 space-y-3">
                  <Music className="w-10 h-10 mx-auto text-zinc-500 animate-float" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">No saved templates</p>
                </div>
              )}
            </div>
          </Card>
        </aside>

      </div>
    </div>
  );
}
