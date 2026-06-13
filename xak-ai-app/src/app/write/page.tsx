"use client";

import React from 'react';
import { useSuiteStore } from '@/lib/store';
import { Settings, Share, MessageSquare, History, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { XakteirEditor } from '@/components/editor/XakteirEditor';

export default function XakteirWrite() {
  const { isFocusMode, toggleFocusMode } = useSuiteStore();

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white pt-24">
      {/* Document Toolbar */}
      <div className={`fixed top-20 left-0 right-0 h-14 bg-black/40 backdrop-blur-xl border-b-2 border-white/5 flex items-center px-10 transition-transform duration-500 z-40 ${isFocusMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">File</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Edit</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Insert</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Format</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Tools</Button>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white gap-2"><Share className="w-3 h-3" /> Share</Button>
           <Button variant="default" size="sm" className="bg-primary text-black font-black uppercase tracking-widest text-[10px]"><Wand2 className="w-3 h-3 mr-2" /> Xak AI</Button>
        </div>
      </div>

      <div className="flex-1 flex justify-center p-8 mt-10">
         <div className="w-full max-w-[850px] min-h-[1100px] bg-white text-black p-24 shadow-2xl rounded-sm">
            {/* The Live Editor Canvas */}
            <XakteirEditor />
         </div>
      </div>

      {/* Floating Action Menu (Always visible unless fully Zen) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
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
