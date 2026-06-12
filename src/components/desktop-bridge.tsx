"use client";

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';

export function DesktopBridge() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore) return;
    if (typeof window === 'undefined' || !(window as any).electron) return; // Only run on Desktop!

    const q = query(
      collection(firestore, "users", user.uid, "desktop_commands"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const data = change.doc.data();
          const docRef = doc(firestore, "users", user.uid, "desktop_commands", change.doc.id);
          
          await updateDoc(docRef, { status: "running" });

          try {
            let result;
            if (data.type === "terminal") {
              const res = await (window as any).electron.fs.runTerminalCommand(data.command, data.cwd);
              result = res.success ? (res.data || "Command executed successfully.") : res.error;
            } else if (data.type === "file") {
              if (data.action === "read") {
                const res = await (window as any).electron.fs.readFile(data.filePath);
                result = res.success ? res.data : res.error;
              } else if (data.action === "write") {
                const res = await (window as any).electron.fs.writeFile(data.filePath, data.content);
                result = res.success ? "Write successful." : res.error;
              } else if (data.action === "delete") {
                const res = await (window as any).electron.fs.deleteFile(data.filePath);
                result = res.success ? "Delete successful." : res.error;
              }
            }
            await updateDoc(docRef, { status: "success", result });
          } catch (error: any) {
            await updateDoc(docRef, { status: "error", result: error.message });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}
