"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
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

type ConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed";

interface Participant {
  id: string;
  name: string;
  photo: string;
}

function displayName(user: { displayName?: string | null }) {
  return user.displayName?.replace(/^@+/, "") || "Member";
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const roomId = params.roomId as string;

  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState(roomId?.toUpperCase() || "");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("new");
  const [remoteTracksVersion, setRemoteTracksVersion] = useState(0);
  const [isHost, setIsHost] = useState(false);

  const pcMap = useRef<Record<string, RTCPeerConnection>>({});
  const iceBuffers = useRef<Record<string, IceCandidateBuffer>>({});
  const localStream = useRef<MediaStream | null>(null);
  const remoteStreams = useRef<Record<string, MediaStream>>({});
  const pc = useRef<RTCPeerConnection | null>(null);
  const iceBuffer = useRef<IceCandidateBuffer | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const meetingUnsubscribers = useRef<Unsubscribe[]>([]);
  const activeMeetingId = useRef<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    if (roomId) {
      setRoomCode(roomId.toUpperCase());
    }
  }, [roomId]);

  const bindVideoElements = useCallback(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
      void localVideoRef.current.play().catch(() => {});
    }
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
  }, [remoteTracksVersion, bindVideoElements]);

  const clearMeetingListeners = () => {
    meetingUnsubscribers.current.forEach((unsubscribe) => unsubscribe());
    meetingUnsubscribers.current = [];
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
          description: "Network could not establish a peer link.",
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
    remoteStreams.current[id] = new MediaStream();

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        const exists = remoteStreams.current[id].getTracks().some((t) => t.id === track.id);
        if (!exists) remoteStreams.current[id].addTrack(track);
      });
      setRemoteTracksVersion((v) => v + 1);
    };

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

  const handleJoinMeeting = async () => {
    if (!user || !firestore || !roomCode.trim()) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to join the meeting.",
      });
      return;
    }

    setLoading(true);
    try {
      await setupWebRTC();

      const meetingId = roomCode.trim().toUpperCase();
      const callDoc = doc(firestore, "meetings", meetingId);
      const snap = await getDoc(callDoc);
      const callData = snap.data();

      if (!callData) {
        // Create the meeting if it doesn't exist (first joiner becomes host)
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

        setIsHost(true);
      } else {
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

        setIsHost(false);
      }

      activeMeetingId.current = meetingId;
      setRoomCode(meetingId);
      
      // Get updated participants
      const updatedSnap = await getDoc(callDoc);
      const updatedData = updatedSnap.data();
      setParticipants(updatedData?.participants || []);

      // Listen for changes
      meetingUnsubscribers.current.push(
        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (data?.participants) setParticipants(data.participants as Participant[]);
        })
      );

      // Listen for signals
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

      setConnectionState("connecting");
      toast({ title: "Joined meeting", description: `Room: ${meetingId}` });
    } catch (e) {
      cleanupMedia();
      const description = e instanceof Error ? e.message : "Could not connect to room.";
      toast({ variant: "destructive", title: "Join error", description });
    } finally {
      setLoading(false);
    }
  };

  const endMeeting = async () => {
    const meetingId = activeMeetingId.current;
    const host = isHost;
    cleanupMedia();
    
    if (host && meetingId && firestore) {
      try {
        const callDoc = doc(firestore, "meetings", meetingId);
        const signalsSnap = await getDocs(collection(callDoc, "signals"));
        await Promise.all([
          ...signalsSnap.docs.map((d) => deleteDoc(d.ref)),
          deleteDoc(callDoc),
        ]);
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

    router.push("/meet");
    toast({ title: "Meeting ended" });
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

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, []);

  // Auto-join on mount
  useEffect(() => {
    if (mounted && roomId && !activeMeetingId.current && connectionState === "new") {
      handleJoinMeeting();
    }
  }, [mounted, roomId]);

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

  return (
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
              const url = `${window.location.origin}/meet/${roomCode}`;
              const ok = await copyToClipboard(url);
              if (ok) toast({ title: "Meeting link copied" });
              else toast({ variant: 'destructive', title: 'Copy Failed' });
            }}
            variant="ghost"
            className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white"
          >
            <Copy className="w-3 h-3 mr-2" /> Copy Link
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
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="text-4xl font-black bg-rose-600 text-white">
                    {user?.displayName?.[0] || "U"}
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
              .filter((p) => user && p.id !== user.uid)
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
            {participants.filter((p) => user && p.id !== user.uid).length === 0 && connectionState !== "connected" && (
              <div className="rounded-[3rem] border-8 border-white/5 bg-zinc-950 overflow-hidden relative shadow-2xl">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-zinc-900" />
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
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
  );
}