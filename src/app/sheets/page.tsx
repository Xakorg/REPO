"use client";

import React from 'react';
import { useSuiteStore } from '@/lib/store';
import { Settings, Share, MessageSquare, History, Wand2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function XakteirSheets() {
  const { isFocusMode, toggleFocusMode } = useSuiteStore();

  return (
    <div className="h-screen flex flex-col bg-transparent text-white pt-24 overflow-hidden">
      {/* Sheets Toolbar */}
      <div className={`fixed top-20 left-0 right-0 h-14 bg-black/40 backdrop-blur-xl border-b-2 border-white/5 flex items-center px-10 transition-transform duration-500 z-40 ${isFocusMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">File</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Edit</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Insert</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Format</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Data</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Tools</Button>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white gap-2"><Share className="w-3 h-3" /> Share</Button>
           <Button variant="default" size="sm" className="bg-primary text-black font-black uppercase tracking-widest text-[10px]"><Wand2 className="w-3 h-3 mr-2" /> Xak AI</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full h-full mt-10">
         {/* Formula Bar */}
         <div className={`flex items-center px-4 py-2 bg-black/20 border-b border-white/5 transition-opacity duration-300 ${isFocusMode ? 'opacity-0 h-0 p-0 border-0' : 'opacity-100'}`}>
            <span className="text-white/40 font-mono text-sm w-12 text-center bg-white/5 py-1 rounded">fx</span>
            <input type="text" className="flex-1 bg-transparent border-none text-white font-mono px-4 focus:outline-none" placeholder="Enter formula or value..." />
         </div>

         {/* Grid Area */}
         <div className="flex-1 bg-white text-black overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center opacity-40">
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Xakteir Sheets</h2>
                  <p className="mt-2 text-xl font-medium">Infinite Grid Engine Loading...</p>
               </div>
            </div>
            
            {/* Grid Lines Mockup */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:100px_30px]" />
         </div>
      </div>

      {/* Floating Action Menu */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <Button onClick={toggleFocusMode} variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60 hover:text-white" title="Toggle Focus Mode (F)">
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60 hover:text-white">
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60 hover:text-white">
          <History className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
