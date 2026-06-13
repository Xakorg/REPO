"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

/**
 * NotificationManager
 * Listens for new unread notifications and triggers a sound + 3-second toast.
 */
export function NotificationManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast, dismiss } = useToast();
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const unreadQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      where("read", "==", false),
      orderBy("timestamp", "desc"),
      limit(1)
    );
  }, [firestore, user]);

  const { data: latestNotifs } = useCollection(unreadQuery);

  // Play high-fidelity synth chime
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio sync blocked by browser policy.");
    }
  };

  useEffect(() => {
    if (!latestNotifs || latestNotifs.length === 0) {
      isFirstLoad.current = false;
      return;
    }

    const latest = latestNotifs[0];

    // Skip if it's the initial load or the same notification we just saw
    if (isFirstLoad.current) {
      setLastNotifId(latest.id);
      isFirstLoad.current = false;
      return;
    }

    if (latest.id !== lastNotifId) {
      setLastNotifId(latest.id);
      
      // Play Sound
      playNotificationSound();

      // Show Toast
      const { id } = toast({
        title: latest.title || "New Transmission",
        description: latest.message,
      });

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        dismiss(id);
      }, 3000);
    }
  }, [latestNotifs, toast, dismiss, lastNotifId]);

  return null;
}
