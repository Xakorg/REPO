"use client";

import React from 'react';
import { useSuiteStore } from '@/lib/store';
import { Settings, Share, MessageSquare, History, Wand2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function XakteirSlides() {
  const { isFocusMode, toggleFocusMode } = useSuiteStore();

  return (
    <div className="h-screen flex flex-col bg-transparent text-white pt-24 overflow-hidden">
      {/* Slides Toolbar */}
      <div className={`fixed top-20 left-0 right-0 h-14 bg-black/40 backdrop-blur-xl border-b-2 border-white/5 flex items-center px-10 transition-transform duration-500 z-40 ${isFocusMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">File</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Edit</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Insert</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Format</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Slide</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Arrange</Button>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white gap-2"><Play className="w-3 h-3" /> Present</Button>
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white gap-2"><Share className="w-3 h-3" /> Share</Button>
           <Button variant="default" size="sm" className="bg-primary text-black font-black uppercase tracking-widest text-[10px]"><Wand2 className="w-3 h-3 mr-2" /> Xak AI</Button>
        </div>
      </div>

      <div className="flex-1 flex mt-10">
         {/* Left Sidebar: Thumbnails */}
         <div className={`w-64 bg-black/40 border-r border-white/5 p-4 space-y-4 transition-transform duration-500 ${isFocusMode ? '-translate-x-full absolute h-full' : 'translate-x-0'}`}>
            {[1, 2, 3].map((slideNum) => (
               <div key={slideNum} className="aspect-video bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <span className="text-white/40 font-black text-2xl">{slideNum}</span>
               </div>
            ))}
         </div>

         {/* Main Canvas */}
         <div className="flex-1 bg-[#1a1a24] flex items-center justify-center p-12">
            <div className="w-full max-w-[1200px] aspect-video bg-white text-black shadow-2xl rounded-sm flex items-center justify-center p-20 relative">
               <div className="w-full">
                  <h1 className="text-6xl font-black tracking-tighter mb-8 text-center text-black/20">Click to add title</h1>
                  <h2 className="text-3xl font-medium text-center text-black/20">Click to add subtitle</h2>
               </div>
            </div>
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
