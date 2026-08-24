'use client';

import React, { useState, useRef } from 'react';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled';
  error?: string;
};

export default function DriveUploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      progress: 0,
      status: 'queued',
    }));
    setItems((s) => [...newItems, ...s]);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    // reset input so same file can be picked again
    if (inputRef.current) inputRef.current.value = '';
  }

  async function startUpload(item: UploadItem) {
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' } : p)));

    try {
      const path = `drive/${item.file.type.replace('/', '-')}/${Date.now()}_${item.file.name}`;
      const ref = storageRef(storage, path);

      // Use Firebase's resumable upload with progress events
      const task = uploadBytesResumable(ref, item.file, { contentType: item.file.type });

      task.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, progress } : p)));
        },
        (error) => {
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'error', error: String(error) } : p)));
        },
        async () => {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          // TODO: create metadata record via server API (optional)
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'done', progress: 100 } : p)));
          console.log('Uploaded', item.file.name, downloadUrl);
        }
      );
    } catch (err) {
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'error', error: String(err) } : p)));
    }
  }

  function startAll() {
    items.forEach((it) => {
      if (it.status === 'queued') startUpload(it);
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="p-4 max-w-3xl m-auto">
      <h1 className="text-2xl font-bold mb-4">Upload to XakDrive</h1>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <label className="flex-1 cursor-pointer bg-white/5 rounded-lg p-4 border border-white/6 flex items-center justify-center flex-col gap-2 min-h-[120px]" htmlFor="file-input">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16v-6a4 4 0 014-4h0a4 4 0 014 4v6M12 3v9" />
          </svg>
          <div className="text-sm text-white/80">Tap to select files</div>
          <div className="text-xs text-white/60">Supports large files via resumable uploads</div>
        </label>

        <div className="flex flex-col gap-2">
          <input ref={inputRef} id="file-input" type="file" multiple onChange={onInputChange} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 py-3 rounded-lg bg-blue-600 text-white text-sm shadow-md hover:bg-blue-500"
          >
            Choose files
          </button>

          <button onClick={startAll} className="px-4 py-3 rounded-lg bg-green-600 text-white text-sm shadow-md hover:bg-green-500">
            Start all uploads
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 && <div className="text-white/60">No files queued. Select files to upload.</div>}

        {items.map((it) => (
          <div key={it.id} className="bg-white/3 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate font-medium">{it.file.name}</div>
                <div className="text-xs text-white/60">{(it.file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>

              <div className="mt-2 h-2 bg-white/10 rounded overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${it.progress}%`, transition: 'width 200ms linear' }} />
              </div>

              <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
                <div>{it.status === 'uploading' ? `Uploading — ${it.progress}%` : it.status}</div>
                <div className="flex gap-2">
                  {it.status === 'queued' && (
                    <button onClick={() => startUpload(it)} className="px-2 py-1 rounded bg-indigo-600 text-xs">Upload</button>
                  )}
                  <button onClick={() => removeItem(it.id)} className="px-2 py-1 rounded bg-red-600 text-xs">Remove</button>
                </div>
              </div>

              {it.error && <div className="mt-2 text-xs text-red-400">Error: {it.error}</div>}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        /* Small mobile adjustments */
        @media (max-width: 640px) {
          label[for="file-input"] { min-height: 140px; }
        }
      `}</style>
    </div>
  );
}
