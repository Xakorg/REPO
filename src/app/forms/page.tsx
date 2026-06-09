"use client";

import React from 'react';
import { useSuiteStore } from '@/lib/store';
import { Settings, Share, MessageSquare, History, Wand2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function XakteirForms() {
  const { isFocusMode, toggleFocusMode } = useSuiteStore();

  return (
    <div className="h-screen flex flex-col bg-transparent text-white pt-24 overflow-hidden">
      {/* Forms Toolbar */}
      <div className={`fixed top-20 left-0 right-0 h-14 bg-black/40 backdrop-blur-xl border-b-2 border-white/5 flex items-center px-10 transition-transform duration-500 z-40 ${isFocusMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Questions</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Responses</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black">Settings</Button>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white gap-2"><Eye className="w-3 h-3" /> Preview</Button>
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white gap-2"><Share className="w-3 h-3" /> Send</Button>
           <Button variant="default" size="sm" className="bg-primary text-black font-black uppercase tracking-widest text-[10px]"><Wand2 className="w-3 h-3 mr-2" /> Xak AI</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-10 p-8 flex justify-center">
         <div className="w-full max-w-[750px] space-y-6 pb-32">
            {/* Form Header */}
            <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>
               <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">Untitled Form</h1>
               <p className="text-white/60">Form description</p>
            </div>

            {/* Question Card */}
            <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-6">
                  <input type="text" className="flex-1 bg-transparent border-b border-white/20 pb-2 text-xl font-medium focus:outline-none focus:border-primary transition-colors" placeholder="Untitled Question" />
                  <select className="bg-black/40 border border-white/10 rounded-lg p-2 text-white/80 focus:outline-none">
                     <option>Multiple Choice</option>
                     <option>Short Answer</option>
                     <option>Paragraph</option>
                  </select>
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/60">
                     <div className="w-4 h-4 rounded-full border border-white/40"></div>
                     <input type="text" className="bg-transparent border-none focus:outline-none" placeholder="Option 1" />
                  </div>
                  <div className="flex items-center gap-3 text-white/40">
                     <div className="w-4 h-4 rounded-full border border-white/20"></div>
                     <button className="hover:text-white transition-colors">Add option</button>
                  </div>
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
