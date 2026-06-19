"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
  { name: "Smileys", emojis: ["😀","😁","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"] },
  { name: "Gestures", emojis: ["👋","🤚","🖐","✋","🖖","👌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦿","🦶","👂","🦻","👃","🧠","🦷","骨","👀","👁","👅","👄","💋","🩸"] },
  { name: "Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟"] }
];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  quickReactions?: string[];
  className?: string;
}

export function ReactionPicker({ onSelect, quickReactions = ['👍', '❤️', '🔥', '😂'], className }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {quickReactions.map(emoji => (
        <button 
          key={emoji} 
          onClick={() => onSelect(emoji)} 
          className="hover:scale-125 transition-transform text-xs p-1"
        >
          {emoji}
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="text-zinc-400 hover:text-white hover:scale-110 transition-all p-1" title="Add Reaction">
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2 bg-[#0a0a15] border-white/10 shadow-2xl" sideOffset={5}>
          <div className="h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {EMOJI_CATEGORIES.map(category => (
              <div key={category.name} className="mb-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
                  {category.name}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {category.emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
