# XakChat 3D Rooms Implementation Plan

This plan outlines the architecture for bringing a fully interactive 3D spatial room to XakChat servers, enabling proximity voice chat, interactive mini-games, watch parties, and more.

## Goal Description
Build a lightweight, web-based 3D spatial hub for XakChat servers using Three.js (`@react-three/fiber`). Users can enter the 3D room instead of the traditional channel list, walk around with an avatar, use spatial proximity voice chat, and interact with objects like arcade machines, couches, and screens.

## User Review Required

> [!IMPORTANT]
> **Performance vs Scale:** Real-time 3D multiplayer requires rapid state syncing. Because Xakteir uses Firebase Firestore, writing player movement data (X, Y, Z coordinates) at 60 FPS to the database would overwhelm it and incur massive costs. 
> **Proposed Solution:** We will implement a peer-to-peer WebRTC mesh network (using `simple-peer`) for player movement and voice data. Firestore will only be used for the initial handshake (signaling). This ensures high performance and zero database costs for movement, but it limits rooms to ~30-50 users before network strain occurs on the client.

## Open Questions

> [!WARNING]
> 1. **Avatar System:** Should we start with 2D profile pictures floating in the 3D space (like a billboard), or generic 3D human models with solid colors? The 2D billboard approach is much lighter and easier to implement initially.
> 2. **Navigation:** Do you want the 3D Room to be the *default* view when entering a server, or a toggleable tab (e.g., "Text View" vs "3D Room")?

## Proposed Changes

### 1. Dependencies
- Install `@react-three/fiber`, `@react-three/drei`, and `three` for the 3D rendering.
- Install `simple-peer` for WebRTC peer-to-peer networking (movement and voice).
- Install `nipplejs` or use `@react-three/drei`'s `Joystick` for mobile touch controls.

---

### 2. XakChat Server 3D Components

#### [NEW] `src/components/chat/room/RoomCanvas.tsx`
The main `<Canvas>` wrapper. Handles the 3D scene setup, lighting, camera, and physics boundaries.
- **Environment:** Loads a predefined theme (e.g., Modern Office or Cyberpunk City) using basic primitive shapes or GLTF models.
- **Player Controller:** A first-person or third-person camera controller handling WASD/Arrow keys and joystick inputs.

#### [NEW] `src/components/chat/room/PlayerAvatar.tsx`
Renders other players in the room.
- Receives X, Y, Z coordinates and rotation from the WebRTC data channel.
- Smoothly interpolates (lerps) movement between network updates to prevent stuttering.

#### [NEW] `src/components/chat/room/InteractiveObjects.tsx`
Defines the functional zones in the room:
- `GamingCouch`: Proximity trigger that opens a specific game iframe.
- `VoiceTable`: A zone where audio attenuation drops off less sharply.
- `AnnouncementBoard`: Raycast click handler that opens the latest server announcements modal.
- `WatchScreen`: A 3D plane that renders an HTML `<video>` texture (using Drei's `<Html>` or `<VideoTexture>`).

---

### 3. Networking & Voice Logic

#### [NEW] `src/hooks/useSpatialNetwork.ts`
Manages the WebRTC mesh network.
- **Signaling:** Connects to a Firestore subcollection `servers/{serverId}/signals` to exchange WebRTC offers/answers when a user joins the room.
- **Data Channels:** Sends a compact byte array or JSON containing `[x, y, z, rotation]` every 50ms to all connected peers.
- **Voice Streams:** Captures the user's microphone (`getUserMedia`), sends the track to peers.

#### [NEW] `src/hooks/useSpatialAudio.ts`
Manages 3D positional audio.
- Takes incoming WebRTC audio streams from peers.
- Attaches each stream to a Web Audio API `PannerNode`.
- Updates the `PannerNode` position based on the peer's 3D coordinates relative to the local player's camera position.

---

### 4. Integration

#### [MODIFY] `src/app/chat/s/[serverName]/page.tsx`
- Add a toggle button in the header: "Enter 3D Hub".
- When toggled, unmounts the standard channel list and mounts the `RoomCanvas` full-screen.
- Overlays traditional UI elements (like the chat input box or escape menu) using standard HTML overlaid on top of the canvas.

## Verification Plan

### Automated Tests
- N/A for 3D rendering and WebRTC.

### Manual Verification
1. Open the server page in two different browser windows with two different accounts.
2. Toggle "Enter 3D Hub" on both.
3. Verify both avatars appear in the scene.
4. Move one avatar using WASD; verify the movement reflects smoothly in the other window.
5. Enable microphones; verify that moving further away reduces the audio volume (spatial attenuation).
6. Walk up to the Announcement Board and click it; verify the UI modal opens.
