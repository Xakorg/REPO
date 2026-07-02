import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

function Titlebar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="h-10 select-none flex justify-between items-center bg-neutral-900 border-b border-neutral-800"
    >
      <div data-tauri-drag-region className="flex items-center pl-4 gap-2">
        <svg data-tauri-drag-region className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          <path d="M11 19.93c-3.95-.49-7-3.85-7-7.93 0-4.08 3.05-7.44 7-7.93v15.86zm2 0V4.07c3.95.49 7 3.85 7 7.93 0 4.08-3.05 7.44-7 7.93z" />
        </svg>
        <span data-tauri-drag-region className="text-sm font-semibold text-neutral-300 tracking-wide">
          Xakteir Drive
        </span>
      </div>
      <div className="flex h-full">
        <button
          className="w-12 h-full inline-flex justify-center items-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          onClick={() => appWindow.minimize()}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <button
          className="w-12 h-full inline-flex justify-center items-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          onClick={() => appWindow.toggleMaximize()}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4z" />
          </svg>
        </button>
        <button
          className="w-12 h-full inline-flex justify-center items-center hover:bg-red-500 text-neutral-400 hover:text-white transition-colors"
          onClick={() => appWindow.close()}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white overflow-hidden rounded-lg">
      <Titlebar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-4">
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-bold mb-4">Storage</h2>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded bg-indigo-500/10 text-indigo-400 font-medium">
              My Files
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 text-neutral-400 transition-colors">
              Shared with me
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 text-neutral-400 transition-colors">
              Recent
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 text-neutral-400 transition-colors">
              Trash
            </button>
          </div>

          <div className="mt-auto">
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-medium">X: Drive Sync</span>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <p className="text-[10px] text-neutral-500">Mapped to C:\Xakteir\Cache</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-neutral-950">
          {/* Header */}
          <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6">
            <h1 className="text-lg font-semibold text-neutral-200">My Files</h1>
            <div className="flex items-center gap-3">
              <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-sm font-medium transition-colors">
                New Folder
              </button>
              <button className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                Upload
              </button>
            </div>
          </div>

          {/* File Grid Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {/* Dummy Folders */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">Project {i}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
