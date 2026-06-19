"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";

export function FaviconController() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  // 1. Fetch unread emails count
  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !user.email) return null;
    return query(
      collection(firestore, "emails"),
      where("recipientList", "array-contains", user.email.toLowerCase()),
      where("isRead", "==", false),
      limit(100)
    );
  }, [firestore, user]);

  const { data: unreadEmails } = useCollection(emailsQuery);
  const unreadEmailsCount = unreadEmails?.length || 0;

  // 2. Fetch unread chat notifications count
  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      where("type", "==", "xakchat"),
      where("read", "==", false),
      limit(100)
    );
  }, [firestore, user]);

  const { data: unreadChats } = useCollection(chatQuery);
  const unreadChatsCount = unreadChats?.length || 0;

  // 3. Determine active app, name, and unread count
  const activeApp = useMemo(() => {
    if (pathname?.startsWith("/mail")) {
      return {
        name: "Mail",
        title: `Xakteir Mail${unreadEmailsCount > 0 ? ` (${unreadEmailsCount} unread)` : ""}`,
        icon: "mail",
        count: unreadEmailsCount,
      };
    } else if (pathname?.startsWith("/chat")) {
      return {
        name: "Chat",
        title: `XakChat${unreadChatsCount > 0 ? ` (${unreadChatsCount} unread)` : ""}`,
        icon: "chat",
        count: unreadChatsCount,
      };
    } else if (pathname?.startsWith("/games")) {
      return {
        name: "Games",
        title: "Xakteir Games",
        icon: "games",
        count: 0,
      };
    } else if (pathname?.startsWith("/suite")) {
      return {
        name: "Suite",
        title: "Xakteir Suite",
        icon: "suite",
        count: 0,
      };
    }
    return {
      name: "Xakteir",
      title: "Xakteir",
      icon: "default",
      count: 0,
    };
  }, [pathname, unreadEmailsCount, unreadChatsCount]);

  // 4. Update Document Title
  useEffect(() => {
    document.title = activeApp.title;
  }, [activeApp.title]);

  // 5. Update Favicon dynamically using canvas
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background/gradient inside shape using canvas operations
    ctx.clearRect(0, 0, 64, 64);
    
    // Scale and position the drawing context for sharp SVG path rendering
    ctx.save();
    ctx.translate(8, 8); // Padding
    ctx.scale(2, 2);     // scale 24x24 path to 48x48 viewport

    // Drawing functions
    const drawEnvelope = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      // Rounded rect representing envelope body
      c.roundRect(2, 4, 20, 16, 2);
      c.stroke();
      // Flap lines
      c.beginPath();
      c.moveTo(2, 6);
      c.lineTo(12, 13);
      c.lineTo(22, 6);
      c.stroke();
    };

    const drawChat = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(21, 15);
      c.arcTo(21, 17, 19, 17, 2);
      c.lineTo(7, 17);
      c.lineTo(3, 21);
      c.lineTo(3, 5);
      c.arcTo(3, 3, 5, 3, 2);
      c.lineTo(19, 3);
      c.arcTo(21, 3, 21, 5, 2);
      c.closePath();
      c.stroke();
    };

    const drawGamepad = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(2, 6, 20, 12, 3);
      c.stroke();
      // D-Pad plus sign
      c.beginPath(); c.moveTo(6, 12); c.lineTo(10, 12); c.stroke();
      c.beginPath(); c.moveTo(8, 10); c.lineTo(8, 14); c.stroke();
      // Action buttons
      c.beginPath(); c.arc(15, 13, 0.5, 0, 2*Math.PI); c.stroke();
      c.beginPath(); c.arc(18, 11, 0.5, 0, 2*Math.PI); c.stroke();
    };

    const drawLayers = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      // Top diamond
      c.beginPath();
      c.moveTo(12, 2); c.lineTo(22, 7); c.lineTo(12, 12); c.lineTo(2, 7); c.closePath();
      c.stroke();
      // Middle line
      c.beginPath();
      c.moveTo(2, 12); c.lineTo(12, 17); c.lineTo(22, 12);
      c.stroke();
      // Bottom line
      c.beginPath();
      c.moveTo(2, 17); c.lineTo(12, 22); c.lineTo(22, 17);
      c.stroke();
    };

    // Set styling color to pure white first so we can mask/gradient clip it
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "none";
    if (activeApp.icon === "mail") drawEnvelope(ctx);
    else if (activeApp.icon === "chat") drawChat(ctx);
    else if (activeApp.icon === "games") drawGamepad(ctx);
    else drawLayers(ctx);

    ctx.restore();

    // Composite the color changing mesh gradient into the white shape outline!
    ctx.globalCompositeOperation = "source-in";
    const gradient = ctx.createLinearGradient(0, 0, 64, 64);
    gradient.addColorStop(0, "#00e5ff");
    gradient.addColorStop(0.25, "#00ff88");
    gradient.addColorStop(0.5, "#ffcc00");
    gradient.addColorStop(0.75, "#ff3366");
    gradient.addColorStop(1, "#9900ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Reset composite to overlay notifications on top
    ctx.globalCompositeOperation = "source-over";

    // Draw notification badge circle and count
    if (activeApp.count > 0) {
      const x = 50;
      const y = 14;
      const radius = 10;

      // Draw shadow
      ctx.beginPath();
      ctx.arc(x, y, radius + 1, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fill();

      // Draw red circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff2a5f";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Draw unread text count
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(activeApp.count > 99 ? "99+" : activeApp.count.toString(), x, y + 0.5);
    }

    // Set the favicon link
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL("image/png");
  }, [activeApp.icon, activeApp.count]);

  return null;
}
