"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Plus,
  Loader2,
  Users,
  ShieldCheck,
  Video as VideoIcon,
  Copy,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  type Unsubscribe,
} from "firebase/firestore";
import { getIceServers } from "@/lib/webrtc/config";
import { IceCandidateBuffer } from "@/lib/webrtc/ice-buffer";

type MeetMode = "lobby" | "create" | "join" | "meeting";
type ConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed";

interface Participant {
  id: string;
  name: string;
  photo: string;
}

function displayName(user: { displayName?: string | null }) {
  return user.displayName?.replace(/^@+/, "") || "Member";
}

export default function XakMeetPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<MeetMode>("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [customRoomId, setCustomRoomId] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("new");
  const [remoteTracksVersion, setRemoteTracksVersion] = useState(0);

  const pcMap = useRef<Record<string, RTCPeerConnection>>({});
  const iceBuffers = useRef<Record<string, IceCandidateBuffer>>({});
  const localStream = useRef<MediaStream | null>(null);
  const remoteStreams = useRef<Record<string, MediaStream>>({});
  // Single-peer helpers (legacy/fallback)
  const pc = useRef<RTCPeerConnection | null>(null);
  const iceBuffer = useRef<IceCandidateBuffer | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const meetingUnsubscribers = useRef<Unsubscribe[]>([]);
  const activeMeetingId = useRef<string | null>(null);
  const isHost = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // fallback single remote for legacy display

  useEffect(() => {
    setMounted(true);
  }, []);

  const bindVideoElements = useCallback(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
      void localVideoRef.current.play().catch(() => {});
    }
    // bind fallback remote video to the first remote stream (if any)
    if (remoteVideoRef.current) {
      const keys = Object.keys(remoteStreams.current);
      const s = keys.length ? remoteStreams.current[keys[0]] : null;
      if (s) {
        remoteVideoRef.current.srcObject = s;
        void remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    bindVideoElements();
  }, [mode, remoteTracksVersion, bindVideoElements]);

  const clearMeetingListeners = () => {
    meetingUnsubscribers.current.forEach((unsubscribe) => unsubscribe());
    meetingUnsubscribers.current = [];
  };

  const sendSignal = async (meetingId: string, payload: any) => {
    if (!firestore) return;
    const callDoc = doc(firestore, "meetings", meetingId);
    const signals = collection(callDoc, "signals");
    try {
      await addDoc(signals, payload);
    } catch (e) {
      console.warn("Failed to send signal", e);
    }
  };

  const createOfferTo = async (meetingId: string, targetId: string) => {
    if (!user || !firestore) return;
    const peer = ensurePeerFor(targetId);
    const callDoc = doc(firestore, "meetings", meetingId);
    const signals = collection(callDoc, "signals");

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void addDoc(signals, {
          from: user.uid,
          to: targetId,
          type: "ice",
          candidate: event.candidate.toJSON(),
          ts: Date.now(),
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    await addDoc(signals, {
      from: user.uid,
      to: targetId,
      type: "offer",
      sdp: offer.sdp,
      sdpType: offer.type,
      ts: Date.now(),
    });
  };

  const cleanupMedia = () => {
    clearMeetingListeners();
    localStream.current?.getTracks().forEach((track) => track.stop());
    Object.values(remoteStreams.current).forEach((ms) => ms.getTracks().forEach((t) => t.stop()));
    Object.values(pcMap.current).forEach((p) => p.close());
    Object.values(iceBuffers.current).forEach((b) => b.reset());
    if (pc.current) {
      try { pc.current.close(); } catch (e) {}
      pc.current = null;
    }
    if (iceBuffer.current) {
      try { iceBuffer.current.reset(); } catch (e) {}
      iceBuffer.current = null;
    }
    if (remoteStream.current) {
      try { remoteStream.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
      remoteStream.current = null;
    }
    localStream.current = null;
    remoteStreams.current = {};
    pcMap.current = {};
    iceBuffers.current = {};
    activeMeetingId.current = null;
    isHost.current = false;
    setConnectionState("new");
  };

  const attachConnectionHandlers = (peer: RTCPeerConnection) => {
    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") setConnectionState("connected");
      else if (state === "connecting" || state === "new") setConnectionState("connecting");
      else if (state === "failed") setConnectionState("failed");
      else if (state === "disconnected" || state === "closed") setConnectionState("disconnected");
    };
    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === "failed") {
        setConnectionState("failed");
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: "Network could not establish a peer link. Try again or use a different network.",
        });
      }
    };
  };

  const ensurePeerFor = (id: string) => {
    if (pcMap.current[id]) return pcMap.current[id];
    const peer = new RTCPeerConnection(getIceServers());
    pcMap.current[id] = peer;
    iceBuffers.current[id] = new IceCandidateBuffer(peer);
    attachConnectionHandlers(peer);

    // create a remote stream slot
    remoteStreams.current[id] = new MediaStream();

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        const exists = remoteStreams.current[id].getTracks().some((t) => t.id === track.id);
        if (!exists) remoteStreams.current[id].addTrack(track);
      });
      setRemoteTracksVersion((v) => v + 1);
    };

    // add local tracks
    localStream.current?.getTracks().forEach((t) => peer.addTrack(t, localStream.current!));

    return peer;
  };

  const setupWebRTC = async () => {
    cleanupMedia();
    const peer = new RTCPeerConnection(getIceServers());
    pc.current = peer;
    iceBuffer.current = new IceCandidateBuffer(peer);
    attachConnectionHandlers(peer);

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera and microphone permission denied."
          : "Could not access camera or microphone.";
      throw new Error(message);
    }

    remoteStream.current = new MediaStream();
    localStream.current.getTracks().forEach((track) => {
      peer.addTrack(track, localStream.current!);
    });

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        const exists = remoteStream.current?.getTracks().some((t) => t.id === track.id);
        if (!exists) remoteStream.current?.addTrack(track);
      });
      setRemoteTracksVersion((v) => v + 1);
    };

    bindVideoElements();
  };

  const deleteMeetingRoom = async (meetingId: string) => {
    if (!firestore) return;
    const callDoc = doc(firestore, "meetings", meetingId);
    const signalsSnap = await getDocs(collection(callDoc, "signals"));
    await Promise.all([...
      signalsSnap.docs.map((d) => deleteDoc(d.ref)),
      deleteDoc(callDoc),
    ]);
  };

  const requireAuth = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Sign in to create or join a XakMeet call.",
      });
      return false;
    }
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Unavailable",
        description: "Firebase is not ready. Refresh and try again.",
      });
      return false;
    }
    return true;
  };

  const handleCreateMeeting = async () => {
    if (!requireAuth() || !user || !firestore) return;
    setLoading(true);
    try {
      await setupWebRTC();

      const meetingId =
        customRoomId.trim().toUpperCase() ||
        Math.random().toString(36).substring(2, 8).toUpperCase();
      const callDoc = doc(firestore, "meetings", meetingId);
      const existing = await getDoc(callDoc);
      if (existing.exists()) {
        throw new Error("Room ID already in use. Pick another code.");
      }

      const hostParticipant: Participant = {
        id: user.uid,
        name: displayName(user),
        photo: user.photoURL || "",
      };

      await setDoc(callDoc, {
        createdAt: new Date().toISOString(),
        hostId: user.uid,
        hostName: hostParticipant.name,
        hostPhoto: hostParticipant.photo,
        participantIds: [user.uid],
        participants: [hostParticipant],
      });

      setRoomCode(meetingId);
      activeMeetingId.current = meetingId;
      isHost.current = true;
      setParticipants([hostParticipant]);

      // Watch for participants and signals
      meetingUnsubscribers.current.push(
        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (data?.participants) setParticipants(data.participants as Participant[]);

          // create offers to any newly seen participants
          const ids: string[] = data?.participantIds || [];
          ids.forEach((pid) => {
            if (pid === user.uid) return;
            if (!pcMap.current[pid]) {
              void createOfferTo(meetingId, pid).catch((e) => console.warn(e));
            }
          });
        })
      );

      const signals = collection(callDoc, "signals");
      meetingUnsubscribers.current.push(
        onSnapshot(signals, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            const data = change.doc.data() as any;
            if (!data || data.to !== user.uid) return;

            const fromId = data.from as string;
            const type = data.type as string;

            if (type === "offer") {
              // received an offer targeted to me
              (async () => {
                const peer = ensurePeerFor(fromId);
                peer.onicecandidate = (event) => {
                  if (event.candidate) {
                    void addDoc(signals, {
                      from: user.uid,
                      to: fromId,
                      type: "ice",
                      candidate: event.candidate.toJSON(),
                      ts: Date.now(),
                    });
                  }
                };

                await peer.setRemoteDescription(new RTCSessionDescription({ type: data.sdpType, sdp: data.sdp }));
                iceBuffers.current[fromId].markReady();
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                await addDoc(signals, {
                  from: user.uid,
                  to: fromId,
                  type: "answer",
                  sdp: answer.sdp,
                  sdpType: answer.type,
                  ts: Date.now(),
                });
              })();
            } else if (type === "answer") {
              const peer = pcMap.current[fromId];
              if (peer) {
                void peer.setRemoteDescription(new RTCSessionDescription({ type: data.sdpType, sdp: data.sdp }));
                iceBuffers.current[fromId].markReady();
              }
            } else if (type === "ice") {
              const buf = iceBuffers.current[fromId];
              if (buf) void buf.add(data.candidate as RTCIceCandidateInit);
            }
          });
        })
      );

      setMode("meeting");
      setConnectionState("connecting");
      toast({ title: "Meeting active", description: `Room ID: ${meetingId}` });
    } catch (e) {
      cleanupMedia();
      const description = e instanceof Error ? e.message : "Failed to initialize video.";
      toast({ variant: "destructive", title: "Setup error", description });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!requireAuth() || !user || !firestore || !roomCode.trim()) return;
    setLoading(true);
    try {
      await setupWebRTC();

      const meetingId = roomCode.trim().toUpperCase();
      const callDoc = doc(firestore, "meetings", meetingId);
      const snap = await getDoc(callDoc);
      const callData = snap.data();
      if (!callData) throw new Error("Room not found or meeting has ended.");

      const participantIds: string[] = callData.participantIds || [];
      if (participantIds.includes(user.uid)) {
        throw new Error("You are already in this room from another tab.");
      }

      const newParticipant: Participant = {
        id: user.uid,
        name: displayName(user),
        photo: user.photoURL || "",
      };

      await updateDoc(callDoc, {
        participantIds: [...participantIds, user.uid],
        participants: [...(callData.participants || []), newParticipant],
      });

      activeMeetingId.current = meetingId;
      isHost.current = false;
      setRoomCode(meetingId);
      setParticipants([...(callData.participants || []), newParticipant]);

      // Listen for changes and signals
      meetingUnsubscribers.current.push(
        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (data?.participants) setParticipants(data.participants as Participant[]);
          // if new participants appear, wait for offers via signals
        })
      );

      const signals = collection(callDoc, "signals");
      meetingUnsubscribers.current.push(
        onSnapshot(signals, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            const data = change.doc.data() as any;
            if (!data || data.to !== user.uid) return;

            const fromId = data.from as string;
            const type = data.type as string;

            if (type === "offer") {
              (async () => {
                const peer = ensurePeerFor(fromId);
                peer.onicecandidate = (event) => {
                  if (event.candidate) {
                    void addDoc(signals, {
                      from: user.uid,
                      to: fromId,
                      type: "ice",
                      candidate: event.candidate.toJSON(),
                      ts: Date.now(),
                    });
                  }
                };

                await peer.setRemoteDescription(new RTCSessionDescription({ type: data.sdpType, sdp: data.sdp }));
                iceBuffers.current[fromId].markReady();
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                await addDoc(signals, {
                  from: user.uid,
                  to: fromId,
                  type: "answer",
                  sdp: answer.sdp,
                  sdpType: answer.type,
                  ts: Date.now(),
                });
              })();
            } else if (type === "answer") {
              const peer = pcMap.current[fromId];
              if (peer) {
                void peer.setRemoteDescription(new RTCSessionDescription({ type: data.sdpType, sdp: data.sdp }));
                iceBuffers.current[fromId].markReady();
              }
            } else if (type === "ice") {
              const buf = iceBuffers.current[fromId];
              if (buf) void buf.add(data.candidate as RTCIceCandidateInit);
            }
          });
        })
      );

      setMode("meeting");
      setConnectionState("connecting");
      toast({ title: "Joined meeting", description: "Waiting for media links…" });
    } catch (e) {
      cleanupMedia();
      const description = e instanceof Error ? e.message : "Could not connect to room.";
      toast({ variant: "destructive", title: "Join error", description });
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    localStream.current?.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setIsMicOn(next);
  };

  const toggleVideo = () => {
    const next = !isVideoOn;
    localStream.current?.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setIsVideoOn(next);
  };

  const endMeeting = async () => {
    const meetingId = activeMeetingId.current;
    const host = isHost.current;
    cleanupMedia();
    if (host && meetingId && firestore) {
      try {
        await deleteMeetingRoom(meetingId);
      } catch (e) {
        console.warn("Failed to delete meeting room:", e);
      }
    } else if (!host && meetingId && firestore && user) {
      try {
        const callDoc = doc(firestore, "meetings", meetingId);
        const snap = await getDoc(callDoc);
        const data = snap.data() || {};
        const ids: string[] = data.participantIds || [];
        const parts: Participant[] = data.participants || [];
        const newIds = ids.filter((i) => i !== user.uid);
        const newParts = parts.filter((p) => p.id !== user.uid);
        await updateDoc(callDoc, { participantIds: newIds, participants: newParts });
      } catch (e) {
        console.warn("Failed to leave meeting:", e);
      }
    }
    setMode("lobby");
    setRoomCode("");
    setCustomRoomId("");
    setParticipants([]);
    toast({ title: "Meeting ended" });
  };

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, []);

  const connectionBadge = () => {
    if (connectionState === "connected") {
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 px-6 py-2 rounded-full font-black uppercase text-[9px] text-emerald-400">
          <ShieldCheck className="w-3 h-3 mr-2" /> Connected
        </Badge>
      );
    }
    if (connectionState === "failed" || connectionState === "disconnected") {
      return (
        <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 px-6 py-2 rounded-full font-black uppercase text-[9px] text-rose-400">
          <WifiOff className="w-3 h-3 mr-2" /> {connectionState}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-white/10 bg-white/5 px-6 py-2 rounded-full font-black uppercase text-[9px] text-amber-400">
        <Wifi className="w-3 h-3 mr-2 animate-pulse" /> Connecting…
      </Badge>
    );
  };

  if (!mounted || isUserLoading) return null;

  if (!user) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <VideoIcon className="w-20 h-20 text-rose-500 mx-auto" />
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">XakMeet</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs max-w-md">
          Sign in to start or join encrypted 1:1 video calls.
        </p>
        <Button asChild className="h-14 px-10 bg-rose-600 rounded-2xl font-black uppercase">
          <Link href="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-fade-in text-foreground relative overflow-hidden">
      <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />

      {mode === "lobby" && (
        <div className="space-y-12 z-10 max-w-4xl w-full">
          <div className="space-y-4">
            <div className="w-32 h-32 rounded-[3.5rem] bg-rose-500/10 border-4 border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
              <VideoIcon className="w-16 h-16 text-rose-500" />
            </div>
            <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white leading-none">XakMeet</h1>
            <p className="text-muted-foreground font-black uppercase tracking-[0.6em] text-[10px]">
              WebRTC Video Calls
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              className="glass-card p-12 rounded-[4rem] border-white/10 space-y-8 bg-black/40 group hover:border-rose-500/40 transition-all cursor-pointer"
              onClick={() => setMode("create")}
            >
              <Plus className="w-16 h-16 text-rose-500 mx-auto transition-transform group-hover:scale-110" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Create Meeting</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                Start a new room and share the room ID.
              </p>
              <Button className="w-full h-14 bg-rose-600 rounded-2xl font-black uppercase text-xs">Initialize</Button>
            </Card>

            <Card
              className="glass-card p-12 rounded-[4rem] border-white/10 space-y-8 bg-black/40 group hover:border-blue-500/40 transition-all cursor-pointer"
              onClick={() => setMode("join")}
            >
              <Users className="w-16 h-16 text-blue-500 mx-auto transition-transform group-hover:scale-110" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Join Meeting</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                Connect with a room ID from the host.
              </p>
              <Button className="w-full h-14 bg-blue-600 rounded-2xl font-black uppercase text-xs">Connect</Button>
            </Card>
          </div>
        </div>
      )}

      {mode === "create" && (
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-black/60 w-full max-xl z-10 animate-in zoom-in-95">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter">New Room</h2>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">
              Custom Room ID (optional)
            </label>
            <Input
              value={customRoomId}
              onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
              placeholder="E.G. MY-ROOM"
              className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest"
            />
          </div>
          <Button
            onClick={handleCreateMeeting}
            disabled={loading}
            className="w-full h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-rose-900 active:border-b-0"
          >
            {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "Start call"}
          </Button>
          <Button variant="ghost" onClick={() => setMode("lobby")} className="text-xs font-black uppercase tracking-widest opacity-40">
            Cancel
          </Button>
        </Card>
      )}

      {mode === "join" && (
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-black/60 w-full max-xl z-10 animate-in zoom-in-95">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter">Connect</h2>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Enter Room ID</label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter ID..."
              className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest"
            />
          </div>
          <Button
            onClick={handleJoinMeeting}
            disabled={!roomCode || loading}
            className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-blue-900 active:border-b-0"
          >
            {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "Join call"}
          </Button>
          <Button variant="ghost" onClick={() => setMode("lobby")} className="text-xs font-black uppercase tracking-widest opacity-40">
            Cancel
          </Button>
        </Card>
      )}

      {mode === "meeting" && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col text-foreground animate-in fade-in duration-500">
          <header className="h-20 bg-zinc-900/90 backdrop-blur-xl border-b-4 border-white/10 px-10 flex items-center justify-between z-50">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg">
                <VideoIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">
                  Live call
                </span>
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] mt-1">
                  Room: {roomCode}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={async () => {
                  const { copyToClipboard } = await import('@/lib/clipboard');
                  const ok = await copyToClipboard(roomCode);
                  if (ok) toast({ title: "Room ID copied" });
                  else toast({ variant: 'destructive', title: 'Copy Failed' });
                }}
                variant="ghost"
                className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white"
              >
                <Copy className="w-3 h-3 mr-2" /> Copy ID
              </Button>
              {connectionBadge()}
            </div>
          </header>

          <div className="flex-1 flex p-6 gap-6 overflow-hidden relative">
            <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="rounded-[3rem] border-8 border-white/5 bg-zinc-950 overflow-hidden relative shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn("w-full h-full object-cover scale-x-[-1]", !isVideoOn && "hidden")}
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <Avatar className="w-40 h-40 border-8 border-white/5 shadow-2xl">
                      <AvatarImage src={user.photoURL || ""} />
                      <AvatarFallback className="text-4xl font-black bg-rose-600 text-white">
                        {user.displayName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center gap-3 shadow-2xl">
                  <div className={cn("w-2 h-2 rounded-full", isMicOn ? "bg-green-500 animate-pulse" : "bg-rose-500")} />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-white">You</span>
                </div>
              </div>

              <div className="space-y-4">
                {participants
                  .filter((p) => p.id !== user.uid)
                  .map((p) => (
                    <div key={p.id} className="rounded-[1.2rem] border-4 border-white/5 bg-zinc-950 overflow-hidden relative shadow-2xl">
                      <video
                        autoPlay
                        playsInline
                        muted={false}
                        ref={(el) => {
                          if (!el) return;
                          const s = remoteStreams.current[p.id];
                          if (s) {
                            el.srcObject = s;
                            void el.play().catch(() => {});
                          }
                        }}
                        className="w-full h-44 object-cover bg-zinc-900"
                      />
                      <div className="absolute bottom-3 left-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-[1rem] border border-white/10 flex items-center gap-2 shadow-2xl">
                        <div className={cn("w-2 h-2 rounded-full", connectionState === "connected" ? "bg-blue-500" : "bg-amber-500")} />
                        <span className="text-[10px] font-black uppercase italic tracking-widest text-white">{p.name}</span>
                      </div>
                    </div>
                  ))}
                {/* fallback single remote */}
                {participants.filter((p) => p.id !== user.uid).length === 0 && (
                  <div className="rounded-[3rem] border-8 border-white/5 bg-zinc-950 overflow-hidden relative shadow-2xl">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-zinc-900" />
                    {connectionState !== "connected" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <aside className="w-24 flex flex-col gap-6 py-4 z-50">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="relative p-1 rounded-2xl transition-all hover:bg-white/5 flex flex-col items-center gap-2"
                >
                  <Avatar className="w-16 h-16 border-4 border-white/10 rounded-2xl shadow-xl">
                    <AvatarImage src={p.photo} />
                    <AvatarFallback className="bg-primary text-white font-black">{p.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[8px] font-black uppercase text-white/40 truncate w-20 text-center">
                    {p.name}
                  </span>
                  <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                </div>
              ))}
            </aside>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
              <Card className="p-3 rounded-[2.5rem] bg-black/60 backdrop-blur-2xl border-4 border-white/10 shadow-2xl flex items-center gap-4 px-8">
                <Button
                  onClick={toggleMic}
                  variant="ghost"
                  className={cn(
                    "h-14 w-14 rounded-2xl transition-all",
                    isMicOn ? "bg-white/5 text-white" : "bg-rose-600 text-white shadow-xl"
                  )}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </Button>

                <Button
                  onClick={toggleVideo}
                  variant="ghost"
                  className={cn(
                    "h-14 w-14 rounded-2xl transition-all",
                    isVideoOn ? "bg-white/5 text-white" : "bg-rose-600 text-white shadow-xl"
                  )}
                >
                  {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>

                <div className="w-px h-10 bg-white/10 mx-2" />

                <Button
                  onClick={() => void endMeeting()}
                  className="h-14 px-8 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl flex items-center gap-3 border-b-4 border-rose-900 active:border-b-0"
                >
                  <PhoneOff className="w-5 h-5" /> End call
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
