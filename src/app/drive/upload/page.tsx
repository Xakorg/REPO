'use client';

import React, { useRef, useEffect } from 'react';
import { useUploadManager } from './useUploadManager';

export default function DriveUploadPage() {
  const {
    sessions,
    addFiles,
    startUpload,
    resumeAll,
    pause,
    remove,
    attachFile,
  } = useUploadManager();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const attachRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Register service worker (best-effort)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }
  }, []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  }

  function onAttachChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const sessionId = attachRef.current?.getAttribute('data-session-id');
    if (sessionId) {
      attachFile(sessionId, file);
    }
    if (attachRef.current) {
      attachRef.current.value = '';
      attachRef.current.removeAttribute('data-session-id');
    }
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
          <div className="text-xs text-white/60">Supports resumable uploads & offline resume</div>
        </label>

        <div className="flex flex-col gap-2">
          <input ref={inputRef} id="file-input" type="file" multiple onChange={onInputChange} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 py-3 rounded-lg bg-blue-600 text-white text-sm shadow-md hover:bg-blue-500"
          >
            Choose files
          </button>

          <button onClick={resumeAll} className="px-4 py-3 rounded-lg bg-green-600 text-white text-sm shadow-md hover:bg-green-500">
            Resume all
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {sessions.length === 0 && <div className="text-white/60">No files queued. Select files to upload.</div>}

        {sessions.map((it) => (
          <div key={it.id} className="bg-white/3 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate font-medium">{it.fileName}</div>
                <div className="text-xs text-white/60">{(it.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>

              <div className="mt-2 h-2 bg-white/10 rounded overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.round((it.bytesTransferred / Math.max(1, it.totalBytes)) * 100)}%`, transition: 'width 200ms linear' }} />
              </div>

              <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
                <div>
                  {it.status === 'uploading' && `Uploading — ${Math.round((it.bytesTransferred / Math.max(1, it.totalBytes)) * 100)}%`}
                  {it.status === 'queued' && 'Queued'}
                  {it.status === 'paused' && 'Paused'}
                  {it.status === 'done' && 'Uploaded'}
                  {it.status === 'needs-file' && 'Needs file to resume (tap attach)'}
                  {it.status === 'error' && `Error: ${it.error ?? 'unknown'}`}
                </div>

                <div className="flex gap-2">
                  {(it.status === 'queued' || it.status === 'needs-file') && (
                    <>
                      <button onClick={() => startUpload(it.id)} className="px-2 py-1 rounded bg-indigo-600 text-xs">Upload</button>
                      <button onClick={() => {
                        // open attach file dialog if needs-file, otherwise allow re-select
                        if (attachRef.current) {
                          attachRef.current.setAttribute('data-session-id', it.id);
                          attachRef.current.click();
                        }
                      }} className="px-2 py-1 rounded bg-yellow-600 text-xs">Attach</button>
                    </>
                  )}

                  {it.status === 'uploading' && (
                    <button onClick={() => pause(it.id)} className="px-2 py-1 rounded bg-orange-600 text-xs">Pause</button>
                  )}

                  <button onClick={() => remove(it.id)} className="px-2 py-1 rounded bg-red-600 text-xs">Remove</button>
                </div>
              </div>

              {it.error && <div className="mt-2 text-xs text-red-400">Error: {it.error}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden attach input used to attach file to a needs-file session */}
      <input ref={attachRef} type="file" onChange={onAttachChange} className="hidden" />

      <style jsx>{`
        /* Small mobile adjustments */
        @media (max-width: 640px) {
          label[for="file-input"] { min-height: 140px; }
        }
      `}</style>
    </div>
  );
}
