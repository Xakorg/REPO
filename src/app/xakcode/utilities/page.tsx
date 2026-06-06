"use client";

import React, { useState, useEffect, useRef } from "react";
import { useXakCode } from "../context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Tv, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Copy, 
  Check, 
  FileText, 
  Braces, 
  Code, 
  Hash, 
  Sliders, 
  Eye, 
  HelpCircle,
  FileCode2,
  BookmarkCheck
} from "lucide-react";

export default function UtilitiesPage() {
  const { toast } = useToast();
  const {
    codeText,
    pomodoroTime,
    pomodoroActive,
    pomodoroSession,
    setPomodoroActive,
    resetPomodoro,
    ambientVolumes,
    setAmbientVolume
  } = useXakCode();

  // Active Sound Refs for Working Audio Player
  const lofiRef = useRef<HTMLAudioElement | null>(null);
  const rainRef = useRef<HTMLAudioElement | null>(null);
  const cafeRef = useRef<HTMLAudioElement | null>(null);
  const keyboardRef = useRef<HTMLAudioElement | null>(null);

  // Sync ambient volumes with audio elements
  useEffect(() => {
    if (lofiRef.current) {
      lofiRef.current.volume = ambientVolumes.lofi / 100;
      if (ambientVolumes.lofi > 0 && lofiRef.current.paused) {
        lofiRef.current.play().catch(() => {});
      }
    }
  }, [ambientVolumes.lofi]);

  useEffect(() => {
    if (rainRef.current) {
      rainRef.current.volume = ambientVolumes.rain / 100;
      if (ambientVolumes.rain > 0 && rainRef.current.paused) {
        rainRef.current.play().catch(() => {});
      }
    }
  }, [ambientVolumes.rain]);

  useEffect(() => {
    if (cafeRef.current) {
      cafeRef.current.volume = ambientVolumes.cafe / 100;
      if (ambientVolumes.cafe > 0 && cafeRef.current.paused) {
        cafeRef.current.play().catch(() => {});
      }
    }
  }, [ambientVolumes.cafe]);

  useEffect(() => {
    if (keyboardRef.current) {
      keyboardRef.current.volume = ambientVolumes.keyboard / 100;
      if (ambientVolumes.keyboard > 0 && keyboardRef.current.paused) {
        keyboardRef.current.play().catch(() => {});
      }
    }
  }, [ambientVolumes.keyboard]);

  // Pomodoro formatted time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Text statistics
  const stats = {
    chars: codeText.length,
    words: codeText.trim().split(/\s+/).filter(Boolean).length,
    lines: codeText.split('\n').length,
    readTime: Math.max(1, Math.round(codeText.trim().split(/\s+/).filter(Boolean).length / 200))
  };

  // 2. Base64 & URL Converter State
  const [convInput, setConvInput] = useState("");
  const [convOutput, setConvOutput] = useState("");

  const handleBase64Encode = () => {
    try {
      setConvOutput(btoa(convInput));
    } catch(e) {
      setConvOutput("Error encoding Base64. Ensure text contains only ASCII characters.");
    }
  };

  const handleBase64Decode = () => {
    try {
      setConvOutput(atob(convInput));
    } catch(e) {
      setConvOutput("Invalid Base64 sequence to decode.");
    }
  };

  const handleUrlEncode = () => setConvOutput(encodeURIComponent(convInput));
  const handleUrlDecode = () => setConvOutput(decodeURIComponent(convInput));

  // 3. JSON Formatter State
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonError, setJsonError] = useState("");

  const handleJsonFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError("");
    } catch(e: any) {
      setJsonError(e.message || "Invalid JSON syntax.");
    }
  };

  const handleJsonMinify = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError("");
    } catch(e: any) {
      setJsonError(e.message || "Invalid JSON syntax.");
    }
  };

  // 4. Gradient CSS Generator State
  const [gradColor1, setGradColor1] = useState("#38bdf8");
  const [gradColor2, setGradColor2] = useState("#ec4899");
  const [gradAngle, setGradAngle] = useState(135);
  const gradCssCode = `background: linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2});`;

  // 5. Shadow CSS Builder State
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(8);
  const [shadowBlur, setShadowBlur] = useState(24);
  const [shadowSpread, setShadowSpread] = useState(-4);
  const [shadowColor, setShadowColor] = useState("rgba(0, 0, 0, 0.4)");
  const shadowCssCode = `box-shadow: ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor};`;

  // 6. SVG Preview State
  const [svgCode, setSvgCode] = useState(`<svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>\n</svg>`);

  // 7. Regex Tester State
  const [regexPattern, setRegexPattern] = useState("\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b");
  const [regexText, setRegexText] = useState("My email is info@xakteir.com, and support is help@xakteir.app");
  const [regexResult, setRegexResult] = useState<string[]>([]);

  const handleTestRegex = () => {
    try {
      const regex = new RegExp(regexPattern, 'g');
      const matches = regexText.match(regex) || [];
      setRegexResult(matches);
    } catch (e) {
      setRegexResult(["Invalid Regular Expression Pattern."]);
    }
  };

  // 8. Hex Color Picker State
  const [colorPickerVal, setColorPickerVal] = useState("#00ffcc");

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/20">
      
      {/* Hidden Audio Players for Real White Noise loops */}
      <audio ref={lofiRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop />
      <audio ref={rainRef} src="https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav" loop />
      <audio ref={cafeRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" loop />
      <audio ref={keyboardRef} src="https://assets.mixkit.co/active_storage/sfx/1168/1168-84.wav" loop />

      <div className="max-w-5xl mx-auto space-y-6 pb-20 text-left">
        
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Productivity Dashboard</h2>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">Integrated utility panels containing workspace checkers, audio sound machines, Pomodoro timers, and code generators.</p>
        </div>

        {/* TOP ROW: Pomodoro & Ambient Sounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Pomodoro Focus Timer */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 flex flex-col justify-between h-48 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Pomodoro Focus Timer</span>
              <Badge className={cn("text-[7px] font-black border-none", pomodoroSession === 'work' ? "bg-rose-500/20 text-rose-400" : "bg-green-500/20 text-green-400")}>
                {pomodoroSession === 'work' ? "FOCUS INTERVAL" : "BREAK INTERVAL"}
              </Badge>
            </div>
            
            <div className="text-center z-10">
              <h1 className="text-5xl font-black font-mono tracking-tight text-white">{formatTime(pomodoroTime)}</h1>
            </div>

            <div className="flex gap-2 z-10">
              <Button 
                onClick={() => setPomodoroActive(!pomodoroActive)} 
                className={cn("flex-1 h-9 rounded-xl font-black text-[9px] uppercase", pomodoroActive ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-sky-600 text-white hover:bg-sky-500")}
              >
                {pomodoroActive ? <><Pause className="w-3.5 h-3.5 mr-1" /> Pause</> : <><Play className="w-3.5 h-3.5 mr-1" /> Start Focus</>}
              </Button>
              <Button onClick={resetPomodoro} variant="outline" className="h-9 rounded-xl border-white/10 text-[9px] font-black uppercase hover:bg-white/5 text-white">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
            {pomodoroActive && <span className="absolute bottom-0 left-0 h-1 bg-sky-500 animate-pulse" style={{ width: `${(pomodoroTime / (pomodoroSession === 'work' ? 25 * 60 : 5 * 60)) * 100}%` }} />}
          </Card>

          {/* Ambient Audio Machine */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 flex flex-col justify-between h-48 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">White Noise Sound Machine</span>
              <Volume2 className="w-4 h-4 text-sky-400" />
            </div>

            <div className="space-y-2 text-[8px] uppercase font-black text-white/50">
              {/* Lofi */}
              <div className="flex items-center gap-3">
                <span className="w-16">Lofi Beats</span>
                <Slider 
                  value={[ambientVolumes.lofi]} 
                  onValueChange={(val) => setAmbientVolume('lofi', val[0])}
                  className="flex-1" 
                  max={100}
                />
              </div>

              {/* Rain */}
              <div className="flex items-center gap-3">
                <span className="w-16">Heavy Rain</span>
                <Slider 
                  value={[ambientVolumes.rain]} 
                  onValueChange={(val) => setAmbientVolume('rain', val[0])}
                  className="flex-1" 
                  max={100}
                />
              </div>

              {/* Cafe */}
              <div className="flex items-center gap-3">
                <span className="w-16">Cozy Cafe</span>
                <Slider 
                  value={[ambientVolumes.cafe]} 
                  onValueChange={(val) => setAmbientVolume('cafe', val[0])}
                  className="flex-1" 
                  max={100}
                />
              </div>

              {/* Keyboard */}
              <div className="flex items-center gap-3">
                <span className="w-16">Key Clicks</span>
                <Slider 
                  value={[ambientVolumes.keyboard]} 
                  onValueChange={(val) => setAmbientVolume('keyboard', val[0])}
                  className="flex-1" 
                  max={100}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* MIDDLE ROW: Converter, JSON formatter, and stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* File statistics */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block border-b border-white/5 pb-2">Active File Statistics</span>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono leading-relaxed">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[7px] uppercase font-sans">Characters</span>
                <span className="text-white font-black">{stats.chars}</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[7px] uppercase font-sans">Word Count</span>
                <span className="text-white font-black">{stats.words}</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[7px] uppercase font-sans">Total Lines</span>
                <span className="text-white font-black">{stats.lines}</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[7px] uppercase font-sans">Read Time</span>
                <span className="text-white font-black">{stats.readTime} min</span>
              </div>
            </div>
          </Card>

          {/* Base64 & URL encoder */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-3 col-span-2 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block">Base64 / URL Encoder & Decoder</span>
            <div className="flex gap-2">
              <Input 
                value={convInput}
                onChange={(e) => setConvInput(e.target.value)}
                placeholder="Enter raw text here..." 
                className="bg-black border-white/10 h-10 text-xs font-bold text-white flex-1"
              />
              <div className="flex gap-1">
                <Button onClick={handleBase64Encode} variant="outline" className="h-10 text-[8px] font-black uppercase border-white/10 rounded-lg px-2 text-white">B64 Enc</Button>
                <Button onClick={handleBase64Decode} variant="outline" className="h-10 text-[8px] font-black uppercase border-white/10 rounded-lg px-2 text-white">B64 Dec</Button>
                <Button onClick={handleUrlEncode} variant="outline" className="h-10 text-[8px] font-black uppercase border-white/10 rounded-lg px-2 text-white">URL Enc</Button>
                <Button onClick={handleUrlDecode} variant="outline" className="h-10 text-[8px] font-black uppercase border-white/10 rounded-lg px-2 text-white">URL Dec</Button>
              </div>
            </div>
            {convOutput && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[9px] font-mono flex items-center justify-between gap-4 select-all">
                <p className="truncate text-white/80">{convOutput}</p>
                <Button onClick={() => copyToClipboard(convOutput)} size="icon" variant="ghost" className="h-6 w-6 text-white/60 hover:text-white shrink-0"><Copy className="w-3.5 h-3.5" /></Button>
              </div>
            )}
          </Card>
        </div>

        {/* JSON Validator & CSS Generators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* JSON Formatter */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">JSON Formatter & Validator</span>
              <Braces className="w-4 h-4 text-sky-400" />
            </div>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste JSON here... e.g. {"name": "Xakteir", "features": 50}'
              className="w-full h-24 bg-black/60 border border-white/10 rounded-xl outline-none p-3 font-mono text-[9.5px] leading-relaxed text-white resize-none"
            />

            <div className="flex gap-2">
              <Button onClick={handleJsonFormat} className="bg-sky-600 hover:bg-sky-500 rounded-xl font-black uppercase tracking-widest text-[9px] flex-1 text-white h-9">Format JSON</Button>
              <Button onClick={handleJsonMinify} className="bg-sky-600 hover:bg-sky-500 rounded-xl font-black uppercase tracking-widest text-[9px] flex-1 text-white h-9">Minify JSON</Button>
            </div>

            {jsonError && <p className="text-[9px] font-semibold text-rose-400 italic font-mono">{jsonError}</p>}

            {jsonOutput && (
              <div className="bg-black/60 border border-white/5 rounded-xl p-3 text-left relative font-mono text-[9px] max-h-40 overflow-y-auto whitespace-pre">
                <Button onClick={() => copyToClipboard(jsonOutput)} size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-white/40 hover:text-white bg-black/80"><Copy className="w-3.5 h-3.5" /></Button>
                <code className="text-emerald-400">{jsonOutput}</code>
              </div>
            )}
          </Card>

          {/* CSS Tools (Gradient & Shadow) */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">CSS Gradient & Box Shadow Maker</span>
            
            {/* Gradient Generator */}
            <div className="space-y-2.5">
              <span className="text-[8px] font-black uppercase text-white/50 block">Gradient Canvas</span>
              <div className="grid grid-cols-3 gap-2 items-center">
                <input 
                  type="color" 
                  value={gradColor1} 
                  onChange={(e) => setGradColor1(e.target.value)}
                  className="w-full h-8 bg-black border border-white/10 rounded cursor-pointer"
                />
                <input 
                  type="color" 
                  value={gradColor2} 
                  onChange={(e) => setGradColor2(e.target.value)}
                  className="w-full h-8 bg-black border border-white/10 rounded cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/60 font-bold">{gradAngle}°</span>
                  <Slider 
                    value={[gradAngle]}
                    onValueChange={(val) => setGradAngle(val[0])}
                    min={0}
                    max={360}
                    className="flex-1"
                  />
                </div>
              </div>
              
              {/* Visual preview */}
              <div 
                className="h-10 rounded-xl border border-white/15 flex items-center justify-end p-2" 
                style={{ background: `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})` }}
              >
                <Button onClick={() => copyToClipboard(gradCssCode)} size="icon" variant="ghost" className="h-7 w-7 bg-black/85 text-white rounded-lg"><Copy className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            {/* Shadow Builder */}
            <div className="space-y-2 pt-2 border-t border-white/5 text-[8px] uppercase font-black text-white/50">
              <span className="block mb-1">Box Shadow (Y-Offset & Blur)</span>
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <span>Y: {shadowY}px</span>
                  <Slider value={[shadowY]} onValueChange={(val) => setShadowY(val[0])} min={-20} max={40} className="flex-1" />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span>Blur: {shadowBlur}px</span>
                  <Slider value={[shadowBlur]} onValueChange={(val) => setShadowBlur(val[0])} min={0} max={60} className="flex-1" />
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-2 flex items-center justify-between text-[9px] font-mono mt-2 select-all">
                <span className="truncate text-white/70">{shadowCssCode}</span>
                <Button onClick={() => copyToClipboard(shadowCssCode)} size="icon" variant="ghost" className="h-6 w-6 text-white/40 hover:text-white"><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
          </Card>
        </div>

        {/* BOTTOM ROW: Regex & SVG Viewer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Regex Tester */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block">RegEx Pattern Tester</span>
            
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Regex Pattern</label>
              <Input 
                value={regexPattern} 
                onChange={(e) => setRegexPattern(e.target.value)}
                className="bg-black border-white/10 h-9 text-[10px] font-bold text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Test Text</label>
              <Input 
                value={regexText} 
                onChange={(e) => setRegexText(e.target.value)}
                className="bg-black border-white/10 h-9 text-[10px] font-bold text-white"
              />
            </div>

            <Button onClick={handleTestRegex} className="w-full bg-sky-600 hover:bg-sky-500 rounded-xl text-[9px] font-black uppercase h-9 text-white">Test Regex Match</Button>

            {regexResult.length > 0 && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[9px] font-mono space-y-1">
                <span className="text-[7.5px] font-black uppercase text-white/40 block font-sans">Matches Found</span>
                {regexResult.map((match, idx) => (
                  <p key={idx} className="text-emerald-400 font-bold">{match}</p>
                ))}
              </div>
            )}
          </Card>

          {/* SVG & Color Picker Sandbox */}
          <Card className="bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block">SVG Previewer & Hex Picker</span>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Color picker */}
              <div className="space-y-2 text-left">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Hex Color Picker</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={colorPickerVal} 
                    onChange={(e) => setColorPickerVal(e.target.value)}
                    className="w-10 h-10 bg-black border border-white/10 rounded cursor-pointer"
                  />
                  <div className="text-[9px] font-mono">
                    <p className="text-white font-bold cursor-pointer" onClick={() => copyToClipboard(colorPickerVal)}>{colorPickerVal}</p>
                    <p className="text-white/40" onClick={() => copyToClipboard(hexToRgb(colorPickerVal))}>{hexToRgb(colorPickerVal)}</p>
                  </div>
                </div>
              </div>

              {/* SVG visual display */}
              <div className="border border-white/10 rounded-xl bg-black/60 flex items-center justify-center h-20 p-2 relative overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: svgCode }} />
                <span className="absolute bottom-1 right-2 text-[7px] text-white/30 font-black uppercase tracking-wider font-mono">Canvas</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block">SVG Xml Script</label>
              <textarea
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                className="w-full h-16 bg-black/60 border border-white/10 rounded-xl outline-none p-2 font-mono text-[8.5px] leading-relaxed text-white resize-none"
              />
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
