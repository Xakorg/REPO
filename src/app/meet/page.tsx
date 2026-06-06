"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Users,
  Video as VideoIcon,
  ArrowRight,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Volume2,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function XakMeetLobbyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [customRoomId, setCustomRoomId] = useState("");
  const [activeTab, setActiveTab] = useState<"lobby" | "create" | "join">("lobby");

  // Pre-join lobby stream states
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [isLobbyMicOn, setIsLobbyMicOn] = useState(true);
  const [isLobbyVideoOn, setIsLobbyVideoOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // Request permission on mount for preview
    void initLobbyMedia();
    return () => {
      stopLobbyMedia();
    };
  }, []);

  const initLobbyMedia = async (camId?: string, micId?: string) => {
    try {
      // Clean up previous stream
      stopLobbyMedia();

      const constraints = {
        video: isLobbyVideoOn ? (camId ? { deviceId: { exact: camId } } : true) : false,
        audio: isLobbyMicOn ? (micId ? { deviceId: { exact: micId } } : true) : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLobbyStream(stream);

      if (lobbyVideoRef.current && stream.getVideoTracks().length > 0) {
        lobbyVideoRef.current.srcObject = stream;
        void lobbyVideoRef.current.play().catch(() => {});
      }

      // Audio Level Visualizer
      if (stream.getAudioTracks().length > 0 && isLobbyMicOn) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }

      // List available devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);

      const videoDevice = allDevices.find(d => d.kind === "videoinput");
      const audioDevice = allDevices.find(d => d.kind === "audioinput");
      if (videoDevice && !selectedCam) setSelectedCam(videoDevice.deviceId);
      if (audioDevice && !selectedMic) setSelectedMic(audioDevice.deviceId);

    } catch (err) {
      console.warn("Lobby media initialization failed:", err);
    }
  };

  const stopLobbyMedia = () => {
    if (lobbyStream) {
      lobbyStream.getTracks().forEach(t => t.stop());
      setLobbyStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const toggleLobbyMic = () => {
    const next = !isLobbyMicOn;
    setIsLobbyMicOn(next);
    // Re-initialize media with new states
    void initLobbyMedia(selectedCam, next ? selectedMic : undefined);
  };

  const toggleLobbyVideo = () => {
    const next = !isLobbyVideoOn;
    setIsLobbyVideoOn(next);
    // Re-initialize media
    void initLobbyMedia(next ? selectedCam : undefined, selectedMic);
  };

  const handleCreateMeeting = () => {
    const meetingId =
      customRoomId.trim().toUpperCase() ||
      Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/meet/${meetingId}`);
  };

  const handleJoinMeeting = () => {
    if (!roomCode.trim()) return;
    router.push(`/meet/${roomCode.trim().toUpperCase()}`);
  };

  if (!mounted || isUserLoading) return null;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in text-white relative overflow-hidden bg-black">
      <div className="absolute inset-0 arcade-grid opacity-15 pointer-events-none" />
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {activeTab === "lobby" && (
        <div className="space-y-6 z-10 max-w-6xl w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
              <VideoIcon className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
              XakMeet
            </h1>
            <p className="text-zinc-500 font-black uppercase tracking-[0.6em] text-[8px]">
              Instant WebRTC Video Calls
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Device Preview Lobby */}
            <Card className="glass-card p-6 border-white/10 rounded-[2.5rem] bg-zinc-950/60 space-y-4 shadow-2xl flex flex-col text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Device Hardware Test</span>
                <Settings className="w-4 h-4 text-zinc-500" />
              </div>

              {/* Video preview container */}
              <div className="relative aspect-video bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                {isLobbyVideoOn ? (
                  <video 
                    ref={lobbyVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <VideoOff className="w-10 h-10 text-zinc-700 animate-pulse" />
                )}

                {/* Mic audio meter overlay */}
                {isLobbyMicOn && (
                  <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/10">
                    <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 transition-all duration-75"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={toggleLobbyMic}
                  variant="outline"
                  className={`flex-1 h-12 rounded-xl border-white/10 font-bold uppercase text-[10px] tracking-wider ${isLobbyMicOn ? "bg-white/5 text-white" : "bg-rose-500 text-white border-none"}`}
                >
                  {isLobbyMicOn ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                  {isLobbyMicOn ? "Mic On" : "Mic Muted"}
                </Button>
                <Button
                  onClick={toggleLobbyVideo}
                  variant="outline"
                  className={`flex-1 h-12 rounded-xl border-white/10 font-bold uppercase text-[10px] tracking-wider ${isLobbyVideoOn ? "bg-white/5 text-white" : "bg-rose-500 text-white border-none"}`}
                >
                  {isLobbyVideoOn ? <Camera className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                  {isLobbyVideoOn ? "Camera On" : "Camera Off"}
                </Button>
              </div>

              {/* Selectors */}
              <div className="space-y-3 pt-2 text-xs font-bold text-zinc-400">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500">Camera Source</label>
                  <select
                    value={selectedCam}
                    onChange={(e) => {
                      setSelectedCam(e.target.value);
                      void initLobbyMedia(e.target.value, selectedMic);
                    }}
                    className="w-full h-10 bg-zinc-900 border border-white/5 rounded-xl px-3 text-white text-[11px] outline-none"
                  >
                    {devices.filter(d => d.kind === "videoinput").map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500">Audio input Source</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => {
                      setSelectedMic(e.target.value);
                      void initLobbyMedia(selectedCam, e.target.value);
                    }}
                    className="w-full h-10 bg-zinc-900 border border-white/5 rounded-xl px-3 text-white text-[11px] outline-none"
                  >
                    {devices.filter(d => d.kind === "audioinput").map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Right Side: Create Meeting Card */}
            <Card
              className="glass-card p-8 rounded-[2.5rem] border-white/10 space-y-6 bg-zinc-950/40 group hover:border-rose-500/40 transition-all cursor-pointer shadow-2xl flex flex-col justify-between h-full"
              onClick={() => setActiveTab("create")}
            >
              <Plus className="w-12 h-12 text-rose-500 mx-auto transition-transform group-hover:scale-110" />
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Create Meeting</h3>
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed mt-2">
                  Start a new call room.
                </p>
              </div>
              <Button className="w-full h-12 bg-rose-600 hover:bg-rose-500 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all duration-300">
                Initialize Room
              </Button>
            </Card>

            {/* Join Meeting Card */}
            <Card
              className="glass-card p-8 rounded-[2.5rem] border-white/10 space-y-6 bg-zinc-950/40 group hover:border-blue-500/40 transition-all cursor-pointer shadow-2xl flex flex-col justify-between h-full"
              onClick={() => setActiveTab("join")}
            >
              <Users className="w-12 h-12 text-blue-500 mx-auto transition-transform group-hover:scale-110" />
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Join Meeting</h3>
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed mt-2">
                  Connect with a room code.
                </p>
              </div>
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all duration-300">
                Connect ID
              </Button>
            </Card>

          </div>
        </div>
      )}

      {activeTab === "create" && (
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-zinc-950/60 w-full max-w-xl z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">New Room</h2>
          {!user ? (
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                Sign in is required to create a new meeting room. Unauthenticated users can only join existing meetings.
              </p>
              <Button asChild className="w-full h-16 bg-rose-600 rounded-2xl font-black uppercase text-xs">
                <Link href="/auth">Sign In to Create</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 pl-2">
                  Custom Room ID (optional)
                </label>
                <Input
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                  placeholder="E.G. CHAT-ROOM"
                  className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest text-white focus:border-rose-500/50 focus:ring-0 transition-all"
                />
              </div>
              <Button
                onClick={handleCreateMeeting}
                className="w-full h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-rose-900 active:border-b-0 flex items-center justify-center gap-3"
              >
                Start call <ArrowRight className="w-6 h-6" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => setActiveTab("lobby")}
            className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-transparent text-white"
          >
            Cancel
          </Button>
        </Card>
      )}

      {activeTab === "join" && (
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-zinc-950/60 w-full max-w-xl z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Connect</h2>
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 pl-2">
              Enter Room ID
            </label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="E.G. ROOM-ID"
              className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest text-white focus:border-blue-500/50 focus:ring-0 transition-all"
            />
          </div>
          <Button
            onClick={handleJoinMeeting}
            disabled={!roomCode.trim()}
            className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-blue-900 active:border-b-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            Join call <ArrowRight className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("lobby")}
            className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-transparent text-white"
          >
            Cancel
          </Button>
        </Card>
      )}
    </div>
  );
}
