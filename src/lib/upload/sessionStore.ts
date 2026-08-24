import Dexie from 'dexie';

export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'done' | 'error' | 'needs-file' | 'cancelled';

export interface UploadSession {
  id: string; // session id
  fileName: string;
  mimeType: string;
  size: number;
  bytesTransferred: number;
  totalBytes: number;
  storagePath?: string;
  status: UploadStatus;
  error?: string | null;
  createdAt: number;
  updatedAt: number;
}

class UploadDB extends Dexie {
  uploadSessions!: Dexie.Table<UploadSession, string>;

  constructor() {
    super('xakdrive_upload_db');
    this.version(1).stores({
      uploadSessions: 'id, fileName, status, createdAt'
    });
  }
}

const db = new UploadDB();

export async function createSession(session: UploadSession) {
  session.createdAt = Date.now();
  session.updatedAt = Date.now();
  await db.uploadSessions.add(session);
}

export async function updateSession(id: string, patch: Partial<UploadSession>) {
  patch.updatedAt = Date.now();
  await db.uploadSessions.update(id, patch);
}

export async function getSessions(): Promise<UploadSession[]> {
  return db.uploadSessions.toArray();
}

export async function deleteSession(id: string) {
  await db.uploadSessions.delete(id);
}

export async function clearSessions() {
  await db.uploadSessions.clear();
}

export default db;
