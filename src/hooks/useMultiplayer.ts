"use client";

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

export interface PlayerNetworkState {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number;
  weapon: string;
  isFiring: boolean;
  gameMode: string;
  colorOffset?: number;
}

export function useMultiplayer(roomName: string, active: boolean = true) {
  const [peers, setPeers] = useState<Map<string, PlayerNetworkState>>(new Map());
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const playersMapRef = useRef<Y.Map<PlayerNetworkState> | null>(null);
  const myIdRef = useRef(`player-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (!active) return;

    // 1. Initialize Yjs Document
    const doc = new Y.Doc();
    docRef.current = doc;

    // 2. Connect to WebRTC Signaling Server
    // We use the default public signaling servers for zero-config P2P!
    const provider = new WebrtcProvider(roomName, doc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    });
    providerRef.current = provider;

    // 3. Get the Shared Map
    const playersMap = doc.getMap<PlayerNetworkState>('players');
    playersMapRef.current = playersMap;

    // 4. Listen for Remote Updates
    const observePlayers = () => {
      const currentPeers = new Map<string, PlayerNetworkState>();
      playersMap.forEach((state, id) => {
        if (id !== myIdRef.current) {
          currentPeers.set(id, state);
        }
      });
      setPeers(currentPeers);
    };

    playersMap.observe(observePlayers);

    return () => {
      // Cleanup on unmount
      if (playersMapRef.current) {
        playersMapRef.current.delete(myIdRef.current);
      }
      provider.destroy();
      doc.destroy();
    };
  }, [roomName, active]);

  // Expose a function to update local state to the network
  const updateLocalState = (newState: Partial<PlayerNetworkState>) => {
    if (!playersMapRef.current || !active) return;
    
    const existing = playersMapRef.current.get(myIdRef.current) || {
      id: myIdRef.current,
      x: 0, y: 0, z: 0, yaw: 0, pitch: 0, health: 100, weapon: 'gun', isFiring: false, gameMode: roomName
    };
    
    playersMapRef.current.set(myIdRef.current, { ...existing, ...newState });
  };

  return { peers, updateLocalState, myId: myIdRef.current };
}
