'use client';

import { useEffect, useRef, useState } from 'react';
import { UploadSession, createSession, updateSession, getSessions, deleteSession } from '@/lib/upload/sessionStore';
import { storage, auth, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';

type InMemoryFileRef = { file: File; sessionId: string };

export function useUploadManager() {
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const inMemoryFiles = useRef<Map<string, File>>(new Map());
  const activeTasks = useRef<Map<string, UploadTask>>(new Map());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      const persisted = await getSessions();
      setSessions(persisted);
    })();
    return () => { isMounted.current = false; };
  }, []);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      const session: UploadSession = {
        id,
        fileName: f.name,
        mimeType: f.type || 'application/octet-stream',
        size: f.size,
        bytesTransferred: 0,
        totalBytes: f.size,
        status: 'queued',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      inMemoryFiles.current.set(id, f);
      await createSession(session);
      setSessions((s) => [session, ...s]);
    }
  }

  async function startUpload(sessionId: string) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const file = inMemoryFiles.current.get(sessionId);
    if (!file) {
      // File object not available (e.g., browser restarted). Mark needs-file.
      await updateSession(sessionId, { status: 'needs-file' });
      setSessions((s) => s.map(it => it.id === sessionId ? { ...it, status: 'needs-file' } : it));
      return;
    }

    await updateSession(sessionId, { status: 'uploading' });
    setSessions((s) => s.map(it => it.id === sessionId ? { ...it, status: 'uploading' } : it));

    const path = `drive/${session.mimeType.replace('/', '-')}/${Date.now()}_${session.fileName}`;
    const ref = storageRef(storage, path);
    const task = uploadBytesResumable(ref, file, { contentType: session.mimeType });
    activeTasks.current.set(sessionId, task);

    task.on('state_changed', async (snap) => {
      const progress = snap.bytesTransferred;
      await updateSession(sessionId, { bytesTransferred: progress });
      setSessions((s) => s.map(it => it.id === sessionId ? { ...it, bytesTransferred: progress } : it));
    }, async (error) => {
      await updateSession(sessionId, { status: 'error', error: String(error) });
      setSessions((s) => s.map(it => it.id === sessionId ? { ...it, status: 'error', error: String(error) } : it));
      activeTasks.current.delete(sessionId);
    }, async () => {
      const downloadUrl = await getDownloadURL(task.snapshot.ref);
      // Create Firestore metadata record
      try {
        const user = auth.currentUser;
        const meta = {
          name: session.fileName,
          ownerId: user ? user.uid : null,
          storagePath: path,
          downloadUrl,
          mimeType: session.mimeType,
          size: session.size,
          createdAt: Date.now(),
        };
        await db.collection('driveFiles').add(meta);
      } catch (e) {
        console.error('Failed to create metadata doc', e);
      }

      await updateSession(sessionId, { status: 'done', bytesTransferred: session.totalBytes, storagePath: path });
      setSessions((s) => s.map(it => it.id === sessionId ? { ...it, status: 'done', bytesTransferred: it.totalBytes, storagePath: path } : it));
      activeTasks.current.delete(sessionId);
      inMemoryFiles.current.delete(sessionId);
    });
  }

  async function resumeAll() {
    for (const s of sessions) {
      if (s.status === 'queued' || s.status === 'paused' || s.status === 'needs-file') {
        // Attempt to start — startUpload will mark needs-file if file missing
        startUpload(s.id);
      }
    }
  }

  async function pause(sessionId: string) {
    const task = activeTasks.current.get(sessionId);
    if (task) {
      task.cancel();
      activeTasks.current.delete(sessionId);
    }
    await updateSession(sessionId, { status: 'paused' });
    setSessions((s) => s.map(it => it.id === sessionId ? { ...it, status: 'paused' } : it));
  }

  async function remove(sessionId: string) {
    const task = activeTasks.current.get(sessionId);
    if (task) {
      task.cancel();
      activeTasks.current.delete(sessionId);
    }
    inMemoryFiles.current.delete(sessionId);
    await deleteSession(sessionId);
    setSessions((s) => s.filter(it => it.id !== sessionId));
  }

  async function attachFile(sessionId: string, file: File) {
    // When a session was marked needs-file, user re-selects file to attach and resume
    inMemoryFiles.current.set(sessionId, file);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      await updateSession(sessionId, { status: 'queued', totalBytes: file.size, size: file.size });
      setSessions((s) => s.map(it => it.id === sessionId ? { ...it, status: 'queued', totalBytes: file.size, size: file.size } : it));
      startUpload(sessionId);
    }
  }

  return {
    sessions,
    addFiles,
    startUpload,
    resumeAll,
    pause,
    remove,
    attachFile,
  };
}
