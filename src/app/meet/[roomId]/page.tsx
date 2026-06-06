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
  Monitor,
  MessageSquare,
  Send,
  X,
  CircleDot,
  MousePointer,
  Sparkles,
  Volume2,
  VolumeX,
  Edit3,
  Flame,
  CheckCircle,
  HelpCircle,
  Lock,
  Unlock,
  Radio,
  FileText,
  Pin,
  Smile,
  Subtitles,
  Tv,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  query,
  orderBy,
  limit,
  type Unsubscribe,
} from "firebase/firestore";
import { getIceServers } from "@/lib/webrtc/config";
import { IceCandidateBuffer } from "@/lib/webrtc/ice-buffer";

type ConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed";
type GridMode = "grid" | "presenter";
type RoomTheme = "obsidian" | "matrix" | "sunset";

interface Participant {
  id: string;
  name: string;
  photo: string;
  handRaised?: boolean;
  micMuted?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  photo: string;
  text: string;
  timestamp: any;
}

interface LivePoll {
  question: string;
  optA: string;
  optB: string;
  votesA: number;
  votesB: number;
  votedUserIds: string[];
}

function displayName(user: { displayName?: string | null }) {
  return user.displayName?.replace(/^@+/, "") || "Member";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const roomId = (params.roomId as string)?.toUpperCase() || "";

  const [mounted, setMounted] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestJoined, setGuestJoined] = useState(false);
  
  // Effective participant UIDs and display names
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string>("");

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("new");
  const [remoteTracksVersion, setRemoteTracksVersion] = useState(0);
  const [isHost, setIsHost] = useState(false);

  // Screen sharing & remote control states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharerId, setScreenSharerId] = useState<string | null>(null);
  const [controlledById, setControlledById] = useState<string | null>(null);
  const [controlledByName, setControlledByName] = useState<string | null>(null);
  const [remoteCursor, setRemoteCursor] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const lastCursorSend = useRef(0);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // -------------------------------------------------------------
  // UPGRADE STATES & CONTROLS
  // -------------------------------------------------------------
  const [gridMode, setGridMode] = useState<GridMode>("presenter");
  const [pinnedStreamId, setPinnedStreamId] = useState<string | null>(null);
  const [roomTheme, setRoomTheme] = useState<RoomTheme>("obsidian");
  const [videoFilter, setVideoFilter] = useState<string>("none");
  const [videoQuality, setVideoQuality] = useState<string>("720p");
  const [handRaised, setHandRaised] = useState(false);
  
  // Stopwatch visual call timer
  const [callDuration, setCallDuration] = useState(0);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [notepadText, setNotepadText] = useState("");
  const notepadDebounceRef = useRef<any>(null);

  // Floating Emoji reactions
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string }>>([]);

  // Live Polls
  const [pollData, setPollData] = useState<LivePoll | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptA, setPollOptA] = useState("");
  const [pollOptB, setPollOptB] = useState("");

  // Live Speech-to-Text Captions
  const [captionsActive, setCaptionsActive] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const captionRecognitionRef = useRef<any>(null);

  // Collaborative Whiteboard
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [brushColor, setBrushColor] = useState("#FF0055");
  const [brushSize, setBrushSize] = useState(4);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const whiteboardCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const whiteboardUnsubRef = useRef<Unsubscribe | null>(null);

  // WebRTC refs
  const pcMap = useRef<Record<string, RTCPeerConnection>>({});
  const iceBuffers = useRef<Record<string, IceCandidateBuffer>>({});
  const localStream = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteStreams = useRef<Record<string, MediaStream>>({});
  const pc = useRef<RTCPeerConnection | null>(null);
  const iceBuffer = useRef<IceCandidateBuffer | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const meetingUnsubscribers = useRef<Unsubscribe[]>([]);
  const activeMeetingId = useRef<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Web Audio Sound alert generator helper
  const playAlertSound = useCallback((type: "join" | "leave" | "message") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === "join") {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === "leave") {
        osc.frequency.setValueAtTime(700, audioCtx.currentTime);
        osc.frequency.setValueAtTime(400, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === "message") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {}
  }, []);

  // Stopwatch visual meeting counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const bindVideoElements = useCallback(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
      void localVideoRef.current.play().catch(() => {});
    }
    // Bind remote streams to their respective elements
    participants.forEach((p) => {
      if (myUserId && p.id === myUserId) return;
      const el = document.getElementById(`video-${p.id}`) as HTMLVideoElement | null;
      const s = remoteStreams.current[p.id];
      if (el && s) {
        el.srcObject = s;
        void el.play().catch(() => {});
      }
    });
    // Fallback single remote
    if (remoteVideoRef.current) {
      const keys = Object.keys(remoteStreams.current);
      const s = keys.length ? remoteStreams.current[keys[0]] : null;
      if (s) {
        remoteVideoRef.current.srcObject = s;
        void remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [participants, myUserId]);

  useEffect(() => {
    bindVideoElements();
  }, [remoteTracksVersion, bindVideoElements, participants]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  // Unread chat badges
  useEffect(() => {
    if (isChatOpen) {
      setUnreadChatCount(0);
    }
  }, [isChatOpen]);

  const clearMeetingListeners = () => {
    meetingUnsubscribers.current.forEach((unsubscribe) => unsubscribe());
    meetingUnsubscribers.current = [];
    if (whiteboardUnsubRef.current) {
      whiteboardUnsubRef.current();
    }
  };

  const cleanupMedia = () => {
    clearMeetingListeners();
    localStream.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    localStream.current = null;
    screenStreamRef.current = null;
    remoteStreams.current = {};
    pcMap.current = {};
    iceBuffers.current = {};
    activeMeetingId.current = null;
    setConnectionState("new");
    setIsScreenSharing(false);
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

  const ensurePeerFor = useCallback((id: string) => {
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
    
    // Add screen track if we are screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getVideoTracks().forEach((t) => peer.addTrack(t, screenStreamRef.current!));
    }
    
    return peer;
  }, []);

  const setupWebRTC = async () => {
    cleanupMedia();
    const peer = new RTCPeerConnection(getIceServers());
    pc.current = peer;
    iceBuffer.current = new IceCandidateBuffer(peer);
    attachConnectionHandlers(peer);

    try {
      // Quality selectors applying constraints
      const videoConstraints: any = videoQuality === "720p" ? { width: 1280, height: 720 } : videoQuality === "480p" ? { width: 854, height: 480 } : false;
      const audioConstraints = videoQuality === "audio-only" ? false : true;

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints || true,
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

  const createOfferTo = useCallback(async (meetingId: string, targetId: string, currentUserId: string) => {
    if (!firestore) return;
    const peer = ensurePeerFor(targetId);
    const callDoc = doc(firestore, "meetings", meetingId);
    const signals = collection(callDoc, "signals");

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void addDoc(signals, {
          from: currentUserId,
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
      from: currentUserId,
      to: targetId,
      type: "offer",
      sdp: offer.sdp,
      sdpType: offer.type,
      ts: Date.now(),
    });
  }, [firestore, ensurePeerFor]);

  // Collaborative Notepad real-time updates (debounced)
  const handleNotepadChange = (text: string) => {
    setNotepadText(text);
    if (!firestore || !roomId) return;
    if (notepadDebounceRef.current) clearTimeout(notepadDebounceRef.current);

    notepadDebounceRef.current = setTimeout(async () => {
      const callDoc = doc(firestore, "meetings", roomId);
      await updateDoc(callDoc, { notepadContent: text });
    }, 800);
  };

  // Collaborative Whiteboard setup
  const initWhiteboard = () => {
    if (!whiteboardCanvasRef.current) return;
    const canvas = whiteboardCanvasRef.current;
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 500;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      whiteboardCtxRef.current = ctx;
    }
  };

  const drawLocal = (x0: number, y0: number, x1: number, y1: number, color: string, size: number, emit = true) => {
    const ctx = whiteboardCtxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();

    if (emit && firestore && roomId && myUserId) {
      const drawingsCol = collection(doc(firestore, "meetings", roomId), "drawings");
      void addDoc(drawingsCol, {
        x0, y0, x1, y1, color, size, senderId: myUserId, ts: Date.now()
      });
    }
  };

  // Floating reactions dispatch
  const sendReaction = async (emoji: string) => {
    if (!firestore || !roomId || !myUserId) return;
    const reactionsCol = collection(doc(firestore, "meetings", roomId), "reactions");
    await addDoc(reactionsCol, {
      senderId: myUserId,
      emoji,
      ts: Date.now()
    });
  };

  // Live Poll options
  const createLivePoll = async () => {
    if (!firestore || !roomId || !pollQuestion.trim()) return;
    const callDoc = doc(firestore, "meetings", roomId);
    await updateDoc(callDoc, {
      poll: {
        question: pollQuestion.trim(),
        optA: pollOptA.trim() || "Yes",
        optB: pollOptB.trim() || "No",
        votesA: 0,
        votesB: 0,
        votedUserIds: []
      }
    });
    setShowPollCreator(false);
    toast({ title: "Live Poll Created!" });
  };

  const votePoll = async (option: "A" | "B") => {
    if (!firestore || !roomId || !myUserId || !pollData) return;
    if (pollData.votedUserIds.includes(myUserId)) {
      toast({ variant: "destructive", title: "Already Voted" });
      return;
    }
    const callDoc = doc(firestore, "meetings", roomId);
    const updatedVotesA = option === "A" ? pollData.votesA + 1 : pollData.votesA;
    const updatedVotesB = option === "B" ? pollData.votesB + 1 : pollData.votesB;
    await updateDoc(callDoc, {
      poll: {
        ...pollData,
        votesA: updatedVotesA,
        votesB: updatedVotesB,
        votedUserIds: [...pollData.votedUserIds, myUserId]
      }
    });
    toast({ title: "Vote Casted Successfully" });
  };

  const clearLivePoll = async () => {
    if (!firestore || !roomId) return;
    const callDoc = doc(firestore, "meetings", roomId);
    await updateDoc(callDoc, { poll: null });
  };

  // Voice Speech Recognition Live Captions
  const handleLiveCaptionsToggle = () => {
    if (captionsActive) {
      if (captionRecognitionRef.current) {
        captionRecognitionRef.current.stop();
      }
      setCaptionsActive(false);
      setCaptionText("");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Speech recognition not supported" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    captionRecognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let resultText = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        resultText += event.results[i][0].transcript;
      }
      setCaptionText(resultText);
    };

    recognition.onstart = () => {
      setCaptionsActive(true);
      toast({ title: "Live Captions Active" });
    };

    recognition.start();
  };

  // Picture in Picture toggler
  const togglePiP = async (elId: string) => {
    const el = document.getElementById(elId) as HTMLVideoElement | null;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await el.requestPictureInPicture();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "PiP Error", description: "Not supported or no video stream." });
    }
  };

  const handleJoinMeeting = async (userIdToUse: string, displayNameToUse: string) => {
    if (!firestore || !roomId) return;

    setLoading(true);
    try {
      await setupWebRTC();

      const meetingId = roomId;
      const callDoc = doc(firestore, "meetings", meetingId);
      const snap = await getDoc(callDoc);
      const callData = snap.data();

      // Check if room is locked
      if (callData && callData.locked && !isHost) {
        throw new Error("This meeting room is locked by the host.");
      }

      const newParticipant: Participant = {
        id: userIdToUse,
        name: displayNameToUse,
        photo: user?.photoURL || "",
        handRaised: false,
        micMuted: false
      };

      if (!callData) {
        // Guests cannot create rooms
        if (!user) {
          throw new Error("Meeting room not found or has ended. Guests can only join existing meetings. Please sign in to create a room.");
        }
        
        // Create the meeting if it doesn't exist (first joiner becomes host)
        await setDoc(callDoc, {
          createdAt: new Date().toISOString(),
          hostId: userIdToUse,
          hostName: displayNameToUse,
          hostPhoto: user?.photoURL || "",
          participantIds: [userIdToUse],
          participants: [newParticipant],
          screenSharerId: null,
          controlledById: null,
          controlledByName: null,
          locked: false,
          notepadContent: "",
          poll: null
        });

        setIsHost(true);
      } else {
        const participantIds: string[] = callData.participantIds || [];
        const participantsList: Participant[] = callData.participants || [];
        
        // Prevent duplicate joins with the same ID
        if (!participantIds.includes(userIdToUse)) {
          await updateDoc(callDoc, {
            participantIds: [...participantIds, userIdToUse],
            participants: [...participantsList, newParticipant],
          });
        }

        setIsHost(callData.hostId === userIdToUse);
        playAlertSound("join");
      }

      activeMeetingId.current = meetingId;

      // Subscribe to meeting changes
      meetingUnsubscribers.current.push(
        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (data) {
            setParticipants((data.participants || []) as Participant[]);
            setScreenSharerId(data.screenSharerId || null);
            setControlledById(data.controlledById || null);
            setControlledByName(data.controlledByName || null);
            setNotepadText(data.notepadContent || "");
            setPollData(data.poll || null);

            // Listen if kicked out
            if (data.kickedIds && data.kickedIds.includes(userIdToUse)) {
              cleanupMedia();
              router.push("/meet");
              toast({ variant: "destructive", title: "Kicked", description: "You have been removed from this meeting." });
            }

            // Listen if host globally requested mute all
            if (data.muteAllRequest && data.muteAllRequest > (localStream.current as any)?.muteTimestamp) {
              if (localStream.current && !isHost) {
                localStream.current.getAudioTracks().forEach(t => t.enabled = false);
                setIsMicOn(false);
                toast({ title: "Globally Muted", description: "You have been muted by the host." });
              }
            }

            // Host handles initiating offers to any newly joined participant
            if (data.hostId === userIdToUse) {
              const ids: string[] = data.participantIds || [];
              ids.forEach((pid) => {
                if (pid !== userIdToUse && !pcMap.current[pid]) {
                  void createOfferTo(meetingId, pid, userIdToUse).catch((e) => console.warn(e));
                }
              });
            }
          }
        })
      );

      // Subscribe to drawings (Whiteboard Collab)
      const drawingsCol = collection(callDoc, "drawings");
      whiteboardUnsubRef.current = onSnapshot(drawingsCol, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const drawData = change.doc.data();
            if (drawData.senderId !== userIdToUse) {
              drawLocal(drawData.x0, drawData.y0, drawData.x1, drawData.y1, drawData.color, drawData.size, false);
            }
          }
        });
      });

      // Subscribe to floating emoji reactions
      const reactionsCol = collection(callDoc, "reactions");
      meetingUnsubscribers.current.push(
        onSnapshot(reactionsCol, (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const r = change.doc.data();
              const reactionId = Date.now() + Math.random();
              setFloatingEmojis(prev => [...prev, { id: reactionId, emoji: r.emoji }]);
              setTimeout(() => {
                setFloatingEmojis(prev => prev.filter(item => item.id !== reactionId));
              }, 2000);
            }
          });
        })
      );

      // Subscribe to signaling channel
      const signals = collection(callDoc, "signals");
      meetingUnsubscribers.current.push(
        onSnapshot(signals, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            const data = change.doc.data() as any;
            if (!data || data.to !== userIdToUse) return;

            const fromId = data.from as string;
            const type = data.type as string;

            if (type === "offer") {
              (async () => {
                const peer = ensurePeerFor(fromId);
                peer.onicecandidate = (event) => {
                  if (event.candidate) {
                    void addDoc(signals, {
                      from: userIdToUse,
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
                  from: userIdToUse,
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
            } else if (type === "request-control") {
              // Only host screen sharer receives this
              toast({
                title: "Remote Control Request",
                description: `${data.senderName} is requesting remote control of your screen share.`,
                action: (
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={async () => {
                        await updateDoc(callDoc, {
                          controlledById: fromId,
                          controlledByName: data.senderName
                        });
                        await sendSignal(meetingId, {
                          from: userIdToUse,
                          to: fromId,
                          type: "grant-control",
                          ts: Date.now()
                        });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded"
                    >
                      Grant
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void sendSignal(meetingId, {
                          from: userIdToUse,
                          to: fromId,
                          type: "deny-control",
                          ts: Date.now()
                        });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest"
                    >
                      Deny
                    </Button>
                  </div>
                )
              });
            } else if (type === "grant-control") {
              toast({ title: "Control Granted", description: "You now have remote pointer control over the screen share!" });
            } else if (type === "deny-control") {
              toast({ variant: "destructive", title: "Control Denied", description: "Remote control request was rejected by host." });
            } else if (type === "control-mouse-move") {
              setRemoteCursor({ x: data.x, y: data.y, active: true });
            } else if (type === "control-mouse-click") {
              setRemoteCursor({ x: data.x, y: data.y, active: true });
              setClickRipples(prev => [...prev, { id: Date.now(), x: data.x, y: data.y }]);
              setTimeout(() => {
                setClickRipples(prev => prev.filter(r => Date.now() - r.id < 1000));
              }, 1000);
            }
          });
        })
      );

      // Subscribe to Chat subcollection
      const chatQuery = query(collection(callDoc, "chat"), orderBy("timestamp", "asc"), limit(200));
      meetingUnsubscribers.current.push(
        onSnapshot(chatQuery, (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
          });
          setChatMessages(msgs);
          
          // Increment unread count if chat is closed and new messages are added
          if (!isChatOpen && snapshot.docChanges().some(c => c.type === "added")) {
            setUnreadChatCount(prev => prev + 1);
            playAlertSound("message");
          }
        })
      );

      setConnectionState("connecting");
      toast({ title: "Joined meeting", description: `Room: ${meetingId}` });
    } catch (e) {
      cleanupMedia();
      setGuestJoined(false);
      const description = e instanceof Error ? e.message : "Could not connect to room.";
      toast({ variant: "destructive", title: "Join error", description });
    } finally {
      setLoading(false);
    }
  };

  // Host Control: Mute participant remotely
  const kickParticipant = async (pid: string) => {
    if (!firestore || !roomId || !isHost) return;
    const callDoc = doc(firestore, "meetings", roomId);
    const snap = await getDoc(callDoc);
    const data = snap.data() || {};
    const kicked = data.kickedIds || [];
    await updateDoc(callDoc, {
      kickedIds: [...kicked, pid],
      participantIds: (data.participantIds || []).filter((id: string) => id !== pid),
      participants: (data.participants || []).filter((p: any) => p.id !== pid)
    });
    toast({ title: "Participant Kicked" });
  };

  const muteParticipantLocally = async (pid: string) => {
    if (!firestore || !roomId || !isHost) return;
    const callDoc = doc(firestore, "meetings", roomId);
    const snap = await getDoc(callDoc);
    const parts = snap.data()?.participants || [];
    const updatedParts = parts.map((p: any) => {
      if (p.id === pid) return { ...p, micMuted: true };
      return p;
    });
    await updateDoc(callDoc, { participants: updatedParts });
    toast({ title: "Mute Request Sent" });
  };

  const muteAllParticipants = async () => {
    if (!firestore || !roomId || !isHost) return;
    const callDoc = doc(firestore, "meetings", roomId);
    await updateDoc(callDoc, { muteAllRequest: Date.now() });
    toast({ title: "Requested Mute All" });
  };

  const toggleRoomLock = async () => {
    if (!firestore || !roomId || !isHost) return;
    const callDoc = doc(firestore, "meetings", roomId);
    const snap = await getDoc(callDoc);
    const currentLock = snap.data()?.locked || false;
    await updateDoc(callDoc, { locked: !currentLock });
    toast({ title: !currentLock ? "Room Locked" : "Room Unlocked" });
  };

  // Hand Raise Toggle
  const toggleHandRaise = async () => {
    if (!firestore || !roomId || !myUserId) return;
    const next = !handRaised;
    setHandRaised(next);
    const callDoc = doc(firestore, "meetings", roomId);
    const snap = await getDoc(callDoc);
    const parts = snap.data()?.participants || [];
    const updatedParts = parts.map((p: any) => {
      if (p.id === myUserId) return { ...p, handRaised: next };
      return p;
    });
    await updateDoc(callDoc, { participants: updatedParts });
  };

  const handleGuestJoinSubmit = () => {
    if (!guestName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a display name to join.",
      });
      return;
    }
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    setMyUserId(guestId);
    setMyDisplayName(guestName.trim());
    setGuestJoined(true);
    void handleJoinMeeting(guestId, guestName.trim());
  };

  // Trigger auto-join for authenticated users
  useEffect(() => {
    if (mounted && user && !myUserId) {
      const uid = user.uid;
      const uName = displayName(user);
      setMyUserId(uid);
      setMyDisplayName(uName);
      void handleJoinMeeting(uid, uName);
    }
  }, [mounted, user]);

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

  const toggleScreenShare = async () => {
    if (!myUserId || !roomId) return;
    
    const callDoc = doc(firestore!, "meetings", roomId);

    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        // Replace track in peer connections
        Object.values(pcMap.current).forEach((peerConnection) => {
          const senders = peerConnection.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            void videoSender.replaceTrack(screenTrack).catch((e) => console.error(e));
          }
        });

        // Set up stop sharing listeners
        screenTrack.onended = () => {
          void toggleScreenShare();
        };

        await updateDoc(callDoc, { screenSharerId: myUserId });
        setIsScreenSharing(true);
        toast({ title: "Screen Sharing", description: "You are now sharing your screen." });
      } catch (err) {
        console.error("Screen share error:", err);
        toast({ variant: "destructive", title: "Error sharing screen", description: "Could not fetch screen stream." });
      }
    } else {
      // Stop screen sharing tracks
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      const cameraTrack = localStream.current?.getVideoTracks()[0];
      if (cameraTrack) {
        // Revert peer connections back to camera
        Object.values(pcMap.current).forEach((peerConnection) => {
          const senders = peerConnection.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            void videoSender.replaceTrack(cameraTrack).catch((e) => console.error(e));
          }
        });
      }

      await updateDoc(callDoc, { 
        screenSharerId: null,
        controlledById: null,
        controlledByName: null
      });
      setIsScreenSharing(false);
      setRemoteCursor({ x: 0, y: 0, active: false });
      toast({ title: "Screen Sharing Stopped" });
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !myUserId || !firestore || !roomId) return;

    try {
      const chatCol = collection(doc(firestore, "meetings", roomId), "chat");
      await addDoc(chatCol, {
        senderId: myUserId,
        senderName: myDisplayName,
        photo: user?.photoURL || "",
        text: chatInput.trim(),
        timestamp: Date.now(),
      });
      setChatInput("");
    } catch (e) {
      console.error("Chat send failed", e);
      toast({ variant: "destructive", title: "Error sending message" });
    }
  };

  const handleRequestControl = async () => {
    if (!myUserId || !screenSharerId || !roomId) return;
    
    // Request control
    await sendSignal(roomId, {
      from: myUserId,
      to: screenSharerId,
      type: "request-control",
      senderName: myDisplayName,
      ts: Date.now()
    });
    toast({ title: "Request Sent", description: "Waiting for screensharer to grant control permissions..." });
  };

  const handleReleaseControl = async () => {
    if (!roomId || !firestore) return;
    const callDoc = doc(firestore, "meetings", roomId);
    await updateDoc(callDoc, {
      controlledById: null,
      controlledByName: null
    });
    toast({ title: "Control Released" });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (controlledById !== myUserId || !screenSharerId || !roomId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const now = Date.now();
    if (now - lastCursorSend.current > 100) {
      lastCursorSend.current = now;
      void sendSignal(roomId, {
        from: myUserId,
        to: screenSharerId,
        type: "control-mouse-move",
        x,
        y,
        ts: now
      });
    }
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (controlledById !== myUserId || !screenSharerId || !roomId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    void sendSignal(roomId, {
      from: myUserId,
      to: screenSharerId,
      type: "control-mouse-click",
      x,
      y,
      ts: Date.now()
    });
  };

  const startMeetingRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      // Capture system audio + screen video
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      recordingStreamRef.current = stream;

      // Mix tab audio with microphone audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      let hasAudio = false;

      if (stream.getAudioTracks().length > 0) {
        const tabSource = audioCtx.createMediaStreamSource(new MediaStream([stream.getAudioTracks()[0]]));
        tabSource.connect(dest);
        hasAudio = true;
      }

      if (localStream.current && localStream.current.getAudioTracks().length > 0) {
        const micSource = audioCtx.createMediaStreamSource(new MediaStream([localStream.current.getAudioTracks()[0]]));
        micSource.connect(dest);
        hasAudio = true;
      }

      const mixedTracks = [
        stream.getVideoTracks()[0],
        ...(hasAudio ? dest.stream.getAudioTracks() : [])
      ];
      
      const mixedStream = new MediaStream(mixedTracks);
      const recorder = new MediaRecorder(mixedStream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meeting-recording-${roomId}-${Date.now()}.webm`;
        a.click();

        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        toast({ title: "Recording Saved", description: "Your meeting recording has been downloaded." });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Select the tab/screen to record." });
    } catch (err) {
      console.error("Recording error:", err);
      toast({ variant: "destructive", title: "Recording Error", description: "Could not initialize recorder." });
    }
  };

  const endMeeting = async () => {
    const meetingId = activeMeetingId.current;
    cleanupMedia();
    playAlertSound("leave");
    
    if (isHost && meetingId && firestore) {
      try {
        const callDoc = doc(firestore, "meetings", meetingId);
        const signalsSnap = await getDocs(collection(callDoc, "signals"));
        const chatSnap = await getDocs(collection(callDoc, "chat"));
        const drawingsSnap = await getDocs(collection(callDoc, "drawings"));
        
        await Promise.all([
          ...signalsSnap.docs.map((d) => deleteDoc(d.ref)),
          ...chatSnap.docs.map((d) => deleteDoc(d.ref)),
          ...drawingsSnap.docs.map((d) => deleteDoc(d.ref)),
          deleteDoc(callDoc),
        ]);
      } catch (e) {
        console.warn("Failed to delete meeting room:", e);
      }
    } else if (!isHost && meetingId && firestore && myUserId) {
      try {
        const callDoc = doc(firestore, "meetings", meetingId);
        const snap = await getDoc(callDoc);
        const data = snap.data() || {};
        const ids: string[] = data.participantIds || [];
        const parts: Participant[] = data.participants || [];
        
        const newIds = ids.filter((i) => i !== myUserId);
        const newParts = parts.filter((p) => p.id !== myUserId);
        
        await updateDoc(callDoc, { participantIds: newIds, participants: newParts });
      } catch (e) {
        console.warn("Failed to leave meeting:", e);
      }
    }

    router.push("/meet");
    toast({ title: "Meeting ended" });
  };

  const copyMeetingLink = async () => {
    const { copyToClipboard } = await import("@/lib/clipboard");
    const url = `${window.location.origin}/meet/${roomId}`;
    const ok = await copyToClipboard(url);
    if (ok) toast({ title: "Meeting link copied" });
    else toast({ variant: "destructive", title: "Copy Failed" });
  };

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

  // Canvas drawing handlers
  const handleWhiteboardMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvas.setAttribute("data-last-x", String(x));
    canvas.setAttribute("data-last-y", String(y));
  };

  const handleWhiteboardMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lastX = parseFloat(canvas.getAttribute("data-last-x") || "0");
    const lastY = parseFloat(canvas.getAttribute("data-last-y") || "0");

    drawLocal(lastX, lastY, x, y, brushColor, brushSize);

    canvas.setAttribute("data-last-x", String(x));
    canvas.setAttribute("data-last-y", String(y));
  };

  const handleWhiteboardMouseUp = () => {
    setIsDrawing(false);
  };

  const clearWhiteboardCanvas = () => {
    const canvas = whiteboardCanvasRef.current;
    const ctx = whiteboardCtxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Clean subcollection
      if (firestore && roomId) {
        const drawingsCol = collection(doc(firestore, "meetings", roomId), "drawings");
        void getDocs(drawingsCol).then((snap) => {
          snap.docs.forEach((doc) => void deleteDoc(doc.ref));
        });
      }
    }
  };

  if (!mounted || isUserLoading) return null;

  // Guest landing screen (unauthenticated name prompt)
  if (!user && !guestJoined) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center space-y-8 bg-black">
        <div className="absolute inset-0 arcade-grid opacity-15 pointer-events-none" />
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-zinc-950/60 w-full max-w-xl z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
          <div className="space-y-4">
            <VideoIcon className="w-16 h-16 text-blue-500 mx-auto animate-float" />
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Join Meeting</h2>
            <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">
              Room Code: {roomId}
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 pl-2">Your Display Name</label>
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name..."
              className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest text-white focus:border-blue-500/50 focus:ring-0 transition-all"
            />
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={handleGuestJoinSubmit}
              disabled={!guestName.trim() || loading}
              className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-blue-900 active:border-b-0 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "Join as Guest"}
            </Button>
            
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            
            <Button
              asChild
              variant="outline"
              className="w-full h-14 rounded-2xl border-white/10 font-black uppercase text-xs tracking-widest text-white hover:bg-white/5"
            >
              <Link href="/auth">Sign in for full experience</Link>
            </Button>
          </div>
          
          <Button variant="ghost" onClick={() => router.push("/meet")} className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 text-white">
            Cancel
          </Button>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MOBILE MEETING ROOM UI
  // -------------------------------------------------------------
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[500] bg-black flex flex-col text-foreground overflow-hidden animate-in fade-in duration-500">
        {/* Mobile Header */}
        <header className="h-16 bg-zinc-900/90 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <VideoIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black uppercase tracking-wider text-rose-500">
                {roomId}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={copyMeetingLink}
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            {connectionBadge()}
          </div>
        </header>

        {/* Mobile Viewport Stream Stack */}
        <div className="flex-1 relative flex flex-col p-4 gap-4 overflow-hidden">
          {screenSharerId ? (
            // Screen sharing takes priority
            <div className="flex-1 bg-zinc-950 rounded-[2rem] overflow-hidden border-2 border-white/10 relative shadow-2xl">
              {screenSharerId === myUserId ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95 p-6 text-center space-y-4">
                  <Monitor className="w-16 h-16 text-rose-500 animate-pulse" />
                  <p className="font-black uppercase tracking-widest text-sm text-white">You are sharing your screen</p>
                  {controlledById && (
                    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold uppercase py-1">
                      Controlled by {controlledByName}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <video
                    autoPlay
                    playsInline
                    id="mobile-screen-share"
                    onClick={handleMouseClick}
                    onMouseMove={handleMouseMove}
                    ref={(el) => {
                      (screenVideoRef as any).current = el;
                      if (!el) return;
                      const s = remoteStreams.current[screenSharerId];
                      if (s) {
                        el.srcObject = s;
                        void el.play().catch(() => {});
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                  {controlledById === myUserId && (
                    <div className="absolute top-4 left-4 bg-emerald-500/95 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <MousePointer className="w-3 h-3" /> Control Active
                    </div>
                  )}
                </div>
              )}
              <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-md rounded-xl border border-white/15">
                <span className="text-[9px] font-black uppercase tracking-wider text-white">
                  {screenSharerId === myUserId ? "Your Screen" : `${participants.find(p => p.id === screenSharerId)?.name}'s Screen`}
                </span>
              </div>
            </div>
          ) : (
            // Active speaker layout on mobile
            <div className="flex-1 bg-zinc-950 rounded-[2.5rem] overflow-hidden border-4 border-white/10 relative shadow-2xl">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  id="mobile-local-cam"
                  autoPlay
                  muted
                  style={{ filter: videoFilter !== "none" ? videoFilter : undefined }}
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <Avatar className="w-32 h-32 border-4 border-white/10 shadow-2xl">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="text-3xl font-black bg-rose-600 text-white">
                      {myDisplayName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-md rounded-xl border border-white/15 flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isMicOn ? "bg-green-500 animate-pulse" : "bg-rose-500")} />
                <span className="text-[9px] font-black uppercase tracking-wider text-white font-sans">You</span>
                {handRaised && <span className="ml-1 text-xs">✋</span>}
              </div>
            </div>
          )}

          {/* Horizontal Scrolling Participants List (Bottom) */}
          <div className="h-28 flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none">
            {participants
              .filter((p) => p.id !== myUserId)
              .map((p) => (
                <div key={p.id} className="w-24 h-24 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden relative flex-shrink-0 shadow-lg">
                  <video
                    id={`video-${p.id}`}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover bg-zinc-900"
                  />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase text-white truncate max-w-full">{p.name}</span>
                    {p.handRaised && <span className="text-[10px]">✋</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Mobile Control Panel */}
        <footer className="h-20 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between gap-4">
          <Button
            onClick={toggleMic}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl transition-all",
              isMicOn ? "bg-white/5 text-white" : "bg-rose-600 text-white"
            )}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={toggleVideo}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl transition-all",
              isVideoOn ? "bg-white/5 text-white" : "bg-rose-600 text-white"
            )}
          >
            {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={toggleScreenShare}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl transition-all",
              isScreenSharing ? "bg-rose-600 text-white" : "bg-white/5 text-white"
            )}
          >
            <Monitor className="w-5 h-5" />
          </Button>

          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl relative transition-all",
              isChatOpen ? "bg-blue-600 text-white" : "bg-white/5 text-white"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black text-white">
                {unreadChatCount}
              </span>
            )}
          </Button>

          <Button
            onClick={endMeeting}
            className="h-12 w-16 bg-rose-600 hover:bg-rose-500 rounded-xl text-white flex items-center justify-center"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DESKTOP MEETING ROOM UI
  // -------------------------------------------------------------
  return (
    <div className={cn(
      "fixed inset-0 z-[500] flex flex-col text-foreground animate-in fade-in duration-500",
      roomTheme === "matrix" ? "bg-black" : roomTheme === "sunset" ? "bg-zinc-950" : "bg-black"
    )}>
      {/* Dynamic Theme Glow overlays */}
      {roomTheme === "sunset" && (
        <>
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />
        </>
      )}

      {/* Desktop Header */}
      <header className="h-20 bg-zinc-900/90 backdrop-blur-xl border-b border-white/10 px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg">
            <VideoIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">
                Live Call
              </span>
              <Badge variant="outline" className="border-zinc-800 bg-zinc-900/60 font-mono text-zinc-300 font-bold px-2 py-0.5 rounded text-[10px] h-5">
                {formatDuration(callDuration)}
              </Badge>
            </div>
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] mt-1">
              Room: {roomId}
            </span>
          </div>
        </div>

        {/* Live Caption overlay panel (at top) */}
        {captionText && (
          <div className="bg-black/80 px-6 py-2 rounded-full border border-white/15 text-xs text-white max-w-lg truncate font-medium animate-pulse">
            Live Caption: "{captionText}"
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            onClick={copyMeetingLink}
            variant="ghost"
            className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            <Copy className="w-3 h-3 mr-2" /> Copy Link
          </Button>
          {connectionBadge()}
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 flex p-6 gap-6 overflow-hidden relative">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />

        {/* Sync whiteboard rendering */}
        <div className="flex-1 flex gap-6 relative z-10 overflow-hidden">
          
          {/* Main Viewport: Video, Whiteboard or Notepad */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950 rounded-[3rem] border-4 border-white/5 shadow-2xl">
            
            {/* 1. Collaborative Whiteboard layer */}
            {isWhiteboardOpen ? (
              <div className="w-full h-full relative bg-zinc-950 flex flex-col">
                <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-zinc-900/40">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Sync Whiteboard Drawing</span>
                  <div className="flex items-center gap-4">
                    {/* Brush colors */}
                    <div className="flex items-center gap-1.5">
                      {["#FF0055", "#00FFCC", "#3388FF", "#FFCC00", "#FFFFFF"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setBrushColor(c)}
                          className={cn("w-5 h-5 rounded-full border", brushColor === c ? "border-white scale-110" : "border-transparent")}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    {/* Brush size input */}
                    <input 
                      type="range" min="1" max="15" value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-16 accent-rose-500"
                    />
                    <Button onClick={clearWhiteboardCanvas} variant="destructive" size="sm" className="h-8 text-[9px] font-black uppercase tracking-wider rounded-lg">
                      Clear
                    </Button>
                    <Button onClick={() => setIsWhiteboardOpen(false)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white rounded-lg">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative bg-zinc-950 cursor-crosshair">
                  <canvas
                    ref={whiteboardCanvasRef}
                    onMouseDown={handleWhiteboardMouseDown}
                    onMouseMove={handleWhiteboardMouseMove}
                    onMouseUp={handleWhiteboardMouseUp}
                    onMouseLeave={handleWhiteboardMouseUp}
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            ) : screenSharerId ? (
              // 2. Screen Share viewport
              <div className="w-full h-full relative bg-black flex items-center justify-center">
                {screenSharerId === myUserId ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95 space-y-6 text-center">
                    <Monitor className="w-24 h-24 text-rose-500 animate-pulse" />
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">You are sharing your screen</h3>
                    {controlledById && (
                      <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold uppercase px-6 py-2 rounded-full text-xs">
                        Remote cursor active: {controlledByName}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <video
                      autoPlay
                      playsInline
                      onClick={handleMouseClick}
                      onMouseMove={handleMouseMove}
                      ref={(el) => {
                        (screenVideoRef as any).current = el;
                        if (!el) return;
                        const s = remoteStreams.current[screenSharerId];
                        if (s) {
                          el.srcObject = s;
                          void el.play().catch(() => {});
                        }
                      }}
                      className="w-full h-full object-contain cursor-crosshair"
                    />
                    {controlledById === myUserId && (
                      <div className="absolute top-6 left-6 bg-emerald-500/95 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
                        <MousePointer className="w-4 h-4" /> Remote Control Active
                      </div>
                    )}
                  </div>
                )}
                
                {/* Visual remote pointer simulation overlays */}
                {screenSharerId === myUserId && remoteCursor.active && (
                  <div 
                    className="absolute pointer-events-none transition-all duration-75 ease-out z-[999] flex flex-col items-start animate-fade-in"
                    style={{ top: `${remoteCursor.y}%`, left: `${remoteCursor.x}%` }}
                  >
                    <div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-lg animate-ping absolute" />
                    <MousePointer className="w-5 h-5 text-rose-500 drop-shadow-md" />
                    <span className="bg-black/80 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest mt-1 whitespace-nowrap border border-white/10">
                      {controlledByName || "Guest"} Control
                    </span>
                  </div>
                )}

                <div className="absolute bottom-6 left-6 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center gap-3 shadow-2xl">
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-white">
                    {screenSharerId === myUserId ? "Your Screen Share" : `${participants.find(p => p.id === screenSharerId)?.name}'s Screen`}
                  </span>
                </div>
                
                {/* Remote Control actions overlay */}
                {screenSharerId !== myUserId && (
                  <div className="absolute bottom-6 right-6">
                    {controlledById === myUserId ? (
                      <Button
                        onClick={handleReleaseControl}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-6 h-12 rounded-2xl shadow-xl"
                      >
                        Release Control
                      </Button>
                    ) : (
                      !controlledById && (
                        <Button
                          onClick={handleRequestControl}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-6 h-12 rounded-2xl shadow-xl"
                        >
                          Request Control
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              // 3. Default Video Feed layout based on Grid mode
              <div className="w-full h-full relative">
                {gridMode === "presenter" ? (
                  // Speaker Focused layout (primary presenter stream)
                  <div className="w-full h-full relative">
                    {pinnedStreamId ? (
                      // Pinned participant stream takes center
                      <div className="w-full h-full relative">
                        <video
                          autoPlay
                          playsInline
                          style={{ filter: pinnedStreamId === myUserId && videoFilter !== "none" ? videoFilter : undefined }}
                          ref={(el) => {
                            if (!el) return;
                            if (pinnedStreamId === myUserId && localStream.current) {
                              el.srcObject = localStream.current;
                            } else {
                              const s = remoteStreams.current[pinnedStreamId];
                              if (s) el.srcObject = s;
                            }
                            void el.play().catch(() => {});
                          }}
                          className={cn("w-full h-full object-cover", pinnedStreamId === myUserId && "scale-x-[-1]")}
                        />
                        <div className="absolute bottom-6 left-6 bg-black/60 px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider">
                          Pinned: {participants.find(p => p.id === pinnedStreamId)?.name || "You"}
                        </div>
                      </div>
                    ) : (
                      // Local preview main
                      <div className="w-full h-full relative">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          style={{ filter: videoFilter !== "none" ? videoFilter : undefined }}
                          playsInline
                          className={cn("w-full h-full object-cover scale-x-[-1]", !isVideoOn && "hidden")}
                        />
                        {!isVideoOn && (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                            <Avatar className="w-40 h-40 border-8 border-white/5 shadow-2xl">
                              <AvatarImage src={user?.photoURL || ""} />
                              <AvatarFallback className="text-4xl font-black bg-rose-600 text-white">
                                {myDisplayName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div className="absolute bottom-6 left-6 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center gap-3 shadow-2xl">
                          <div className={cn("w-2 h-2 rounded-full", isMicOn ? "bg-green-500 animate-pulse" : "bg-rose-500")} />
                          <span className="text-[10px] font-black uppercase italic tracking-widest text-white">
                            {myDisplayName}
                          </span>
                          {handRaised && <span className="text-xs">✋</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Equal Grid Layout (all participant cards share space)
                  <div className="grid grid-cols-2 gap-4 p-6 w-full h-full bg-zinc-950 overflow-y-auto">
                    {/* Local Feed */}
                    <div className="relative rounded-2xl overflow-hidden border-2 border-white/5 bg-zinc-900 aspect-video flex items-center justify-center">
                      {isVideoOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          style={{ filter: videoFilter !== "none" ? videoFilter : undefined }}
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={user?.photoURL || ""} />
                          <AvatarFallback className="bg-rose-600 text-white">{myDisplayName?.[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", isMicOn ? "bg-green-500 animate-pulse" : "bg-rose-500")} />
                        You {handRaised && "✋"}
                      </div>
                    </div>

                    {/* Remote Feeds */}
                    {participants.filter(p => p.id !== myUserId).map((p) => (
                      <div key={p.id} className="relative rounded-2xl overflow-hidden border-2 border-white/5 bg-zinc-900 aspect-video flex items-center justify-center group">
                        <video
                          id={`video-${p.id}`}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-2">
                          {p.name} {p.handRaised && "✋"}
                        </div>
                        {isHost && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                            <Button size="icon" variant="destructive" onClick={() => kickParticipant(p.id)} className="h-8 w-8 rounded-lg">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Floating Emojis Reaction Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {floatingEmojis.map((item) => (
                    <div
                      key={item.id}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 text-5xl animate-float-up pointer-events-none"
                      style={{
                        animation: "floatUp 2.5s forwards ease-out",
                        left: `${45 + Math.random() * 10}%`
                      }}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>

                {/* Poll visual overlay cards */}
                {pollData && (
                  <Card className="absolute top-6 left-6 p-4 bg-black/85 backdrop-blur-md border border-white/15 rounded-2xl w-72 shadow-2xl z-30 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Live Meeting Poll</span>
                      {isHost && (
                        <button onClick={clearLivePoll} className="text-zinc-500 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="font-bold text-xs text-white mb-3">{pollData.question}</div>
                    
                    {pollData.votedUserIds.includes(myUserId || "") ? (
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{pollData.optA}</span>
                            <span>{Math.round((pollData.votesA / (pollData.votesA + pollData.votesB || 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${(pollData.votesA / (pollData.votesA + pollData.votesB || 1)) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{pollData.optB}</span>
                            <span>{Math.round((pollData.votesB / (pollData.votesA + pollData.votesB || 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(pollData.votesB / (pollData.votesA + pollData.votesB || 1)) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => votePoll("A")} className="flex-1 h-9 bg-rose-600 hover:bg-rose-500 text-[10px] uppercase font-black tracking-wider rounded-lg">
                          {pollData.optA}
                        </Button>
                        <Button onClick={() => votePoll("B")} className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 text-[10px] uppercase font-black tracking-wider rounded-lg">
                          {pollData.optB}
                        </Button>
                      </div>
                    )}
                  </Card>
                )}

              </div>
            )}
          </div>

          {/* Right Column: Other Participants or side features */}
          <div className="w-80 flex flex-col gap-6 overflow-y-auto">
            
            {/* Host settings actions */}
            {isHost && (
              <Card className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Host Control Board</span>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={muteAllParticipants} 
                    className="h-10 text-[9px] font-black uppercase tracking-wider rounded-xl bg-zinc-800 hover:bg-zinc-750"
                  >
                    Mute All Feeds
                  </Button>
                  <Button 
                    onClick={toggleRoomLock} 
                    className="h-10 text-[9px] font-black uppercase tracking-wider rounded-xl bg-zinc-850 hover:bg-zinc-800"
                  >
                    Lock Room Mode
                  </Button>
                </div>
              </Card>
            )}

            {participants
              .filter((p) => p.id !== myUserId)
              .map((p) => (
                <div key={p.id} className="rounded-[2rem] border-4 border-white/5 bg-zinc-950 overflow-hidden relative shadow-2xl flex-shrink-0 group">
                  <video
                    id={`video-${p.id}`}
                    autoPlay
                    playsInline
                    className="w-full h-44 object-cover bg-zinc-900"
                  />
                  <div className="absolute bottom-3 left-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-[1rem] border border-white/10 flex items-center gap-2 shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-white">{p.name}</span>
                    {p.handRaised && <span className="ml-1 text-xs">✋</span>}
                  </div>

                  {/* Pin participant button */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                    <button
                      onClick={() => setPinnedStreamId(pinnedStreamId === p.id ? null : p.id)}
                      className="p-1.5 bg-black/60 hover:bg-black rounded-lg text-white"
                    >
                      <Pin className={cn("w-3.5 h-3.5", pinnedStreamId === p.id && "text-rose-500 fill-current")} />
                    </button>
                    {isHost && (
                      <button
                        onClick={() => kickParticipant(p.id)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
            {/* Fallback Single remote placeholder if empty */}
            {participants.filter((p) => p.id !== myUserId).length === 0 && (
              <div className="rounded-[2rem] border-4 border-white/5 bg-zinc-950/40 overflow-hidden relative shadow-2xl h-44 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-rose-500/20 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Sliding Chat Panel (Right Sidebar) */}
        {isChatOpen && (
          <aside className="w-96 glass-card border-l-4 border-white/10 bg-zinc-950/90 backdrop-blur-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white">Meeting Chat</span>
              <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.senderId === myUserId ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-black uppercase text-zinc-500">{msg.senderName}</span>
                  </div>
                  <div className={cn("px-4 py-3 rounded-2xl text-xs font-bold leading-relaxed shadow-lg", msg.senderId === myUserId ? "bg-rose-600 text-white rounded-tr-none" : "bg-zinc-900 text-white rounded-tl-none border border-white/5")}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-white/10 bg-black/40 flex gap-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                placeholder="Send message..."
                className="h-12 bg-black border-white/10 rounded-2xl text-white font-bold"
              />
              <Button onClick={handleSendChatMessage} size="icon" className="h-12 w-12 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white shrink-0 shadow-lg transition-all">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </aside>
        )}

        {/* Sliding Notepad Content Drawer */}
        {isNotepadOpen && (
          <aside className="w-96 glass-card border-l-4 border-white/10 bg-zinc-950/90 backdrop-blur-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" /> Collaborative Notepad
              </span>
              <Button variant="ghost" size="icon" onClick={() => setIsNotepadOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </header>
            
            <div className="flex-1 p-6 flex flex-col gap-4">
              <textarea
                value={notepadText}
                onChange={(e) => handleNotepadChange(e.target.value)}
                placeholder="Type collaborative notes here..."
                className="flex-1 w-full bg-zinc-900 border border-white/5 p-4 rounded-2xl text-xs font-bold text-white outline-none resize-none focus:border-rose-500/35"
              />
              <Button
                onClick={() => {
                  const blob = new Blob([notepadText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `meeting-notes-${roomId}.txt`;
                  a.click();
                }}
                className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-widest rounded-xl"
              >
                Download Notes
              </Button>
            </div>
          </aside>
        )}

        {/* Right Rail Icon Sidebar (Participants Avatars) */}
        <aside className="w-24 flex flex-col gap-6 py-4 z-50 select-none">
          {participants.map((p) => (
            <div key={p.id} className="relative p-1 rounded-2xl transition-all hover:bg-white/5 flex flex-col items-center gap-2 group">
              <Avatar className="w-16 h-16 border-4 border-white/10 rounded-2xl shadow-xl">
                <AvatarImage src={p.photo} />
                <AvatarFallback className="bg-rose-600 text-white font-black">{p.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[8px] font-black uppercase text-white/40 truncate w-20 text-center group-hover:text-white">
                {p.name}
              </span>
              <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
            </div>
          ))}
        </aside>

        {/* Floating Meeting Controls (Desktop Bottom) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
          <Card className="p-3 rounded-[2.5rem] bg-black/70 backdrop-blur-2xl border-4 border-white/10 shadow-2xl flex items-center gap-4 px-8">
            
            <Button
              onClick={toggleMic}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                isMicOn ? "bg-white/5 text-white hover:bg-white/10" : "bg-rose-600 text-white shadow-xl hover:bg-rose-500"
              )}
            >
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={toggleVideo}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                isVideoOn ? "bg-white/5 text-white hover:bg-white/10" : "bg-rose-600 text-white shadow-xl hover:bg-rose-500"
              )}
            >
              {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={toggleScreenShare}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                isScreenSharing ? "bg-rose-600 text-white hover:bg-rose-500 shadow-xl" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <Monitor className="w-6 h-6" />
            </Button>

            <Button
              onClick={startMeetingRecording}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                isRecording ? "bg-rose-600 text-white hover:bg-rose-500 shadow-xl animate-pulse" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <CircleDot className="w-6 h-6" />
            </Button>

            {/* Whiteboard trigger */}
            <Button
              onClick={() => {
                setIsWhiteboardOpen(!isWhiteboardOpen);
                setTimeout(initWhiteboard, 200);
              }}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                isWhiteboardOpen ? "bg-rose-600 text-white" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <Edit3 className="w-6 h-6" />
            </Button>

            {/* Collaborative Notepad Trigger */}
            <Button
              onClick={() => setIsNotepadOpen(!isNotepadOpen)}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                isNotepadOpen ? "bg-rose-600 text-white" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <FileText className="w-6 h-6" />
            </Button>

            {/* Hand Raise Trigger */}
            <Button
              onClick={toggleHandRaise}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                handRaised ? "bg-amber-600 text-white shadow-xl animate-bounce" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <span className="text-xl">✋</span>
            </Button>

            {/* Chat Trigger */}
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all relative",
                isChatOpen ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <MessageSquare className="w-6 h-6" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center text-[9px] font-black text-white">
                  {unreadChatCount}
                </span>
              )}
            </Button>

            {/* Quality Select Dialog Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-white/10">
                  <Radio className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-zinc-800 rounded-[2.5rem] max-w-sm bg-zinc-950 text-white p-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Quality & Layout</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4 text-xs font-bold">
                  {/* Quality Settings */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Video Quality</label>
                    <select
                      value={videoQuality}
                      onChange={(e) => {
                        setVideoQuality(e.target.value);
                        void setupWebRTC();
                      }}
                      className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 outline-none text-white font-bold text-xs"
                    >
                      <option value="720p">High Definition (720p)</option>
                      <option value="480p">Standard Definition (480p)</option>
                      <option value="audio-only">Low Bandwidth (Audio-Only)</option>
                    </select>
                  </div>

                  {/* Grid Layout settings */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Layout Grid</label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setGridMode("grid")}
                        className={cn("flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider", gridMode === "grid" ? "bg-rose-600" : "bg-zinc-900 border border-zinc-800")}
                      >
                        Equal Grid
                      </Button>
                      <Button
                        onClick={() => setGridMode("presenter")}
                        className={cn("flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider", gridMode === "presenter" ? "bg-rose-600" : "bg-zinc-900 border border-zinc-800")}
                      >
                        Presenter
                      </Button>
                    </div>
                  </div>

                  {/* Room Themes Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Virtual Room Accent Theme</label>
                    <div className="flex gap-2">
                      {["obsidian", "matrix", "sunset"].map((th) => (
                        <Button
                          key={th}
                          onClick={() => setRoomTheme(th as any)}
                          className={cn(
                            "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-wider",
                            roomTheme === th ? "bg-rose-600" : "bg-zinc-900 border border-zinc-800"
                          )}
                        >
                          {th}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* CSS Video filter selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Local Camera Video Filter</label>
                    <select
                      value={videoFilter}
                      onChange={(e) => setVideoFilter(e.target.value)}
                      className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 outline-none text-white font-bold text-xs"
                    >
                      <option value="none">Normal (No Filter)</option>
                      <option value="grayscale(1)">Classic Noir (Grayscale)</option>
                      <option value="sepia(1)">Vintage Sepia</option>
                      <option value="hue-rotate(270deg) saturate(1.8) contrast(1.2)">Cyberpunk Neon</option>
                      <option value="invert(1)">Neon X-Ray (Invert)</option>
                      <option value="blur(4px)">Privacy Blur</option>
                    </select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Emojis floating reaction button panel */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-white/10">
                  <Smile className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-zinc-800 rounded-[2.5rem] max-w-sm bg-zinc-950 text-white p-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Send Reaction</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-5 gap-3 pt-4 justify-items-center">
                  {["❤️", "👍", "👏", "😂", "🔥", "🎉", "😮", "🤔", "💡", "✋"].map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        void sendReaction(em);
                        toast({ title: `Reaction sent: ${em}` });
                      }}
                      className="text-3xl hover:scale-125 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Live Polls creator panel */}
            <Dialog open={showPollCreator} onOpenChange={setShowPollCreator}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-white/10">
                  <HelpCircle className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-zinc-800 rounded-[2.5rem] max-w-md bg-zinc-950 text-white p-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Create Live Poll</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4 text-xs font-bold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Poll Question</label>
                    <Input 
                      placeholder="e.g. Do you approve the new design?" 
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Option A</label>
                    <Input 
                      placeholder="Yes" 
                      value={pollOptA}
                      onChange={(e) => setPollOptA(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Option B</label>
                    <Input 
                      placeholder="No" 
                      value={pollOptB}
                      onChange={(e) => setPollOptB(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 rounded-xl"
                    />
                  </div>
                  <Button onClick={createLivePoll} className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider rounded-xl mt-2">
                    Launch Poll
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Live Captions speech trigger */}
            <Button
              onClick={handleLiveCaptionsToggle}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-2xl transition-all",
                captionsActive ? "bg-rose-600 text-white" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <Subtitles className="w-6 h-6" />
            </Button>

            {/* PiP Trigger */}
            <Button
              onClick={() => togglePiP("mobile-local-cam")}
              variant="ghost"
              className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-white/10"
            >
              <Tv className="w-6 h-6" />
            </Button>

            <div className="w-px h-10 bg-white/10 mx-2" />

            <Button
              onClick={endMeeting}
              className="h-14 px-8 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl flex items-center gap-3 border-b-4 border-rose-900 active:border-b-0"
            >
              <PhoneOff className="w-5 h-5" /> End Call
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}