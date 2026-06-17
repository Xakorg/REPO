import React from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface MediaGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
}

export function MediaGallery({ isOpen, onClose, messages }: MediaGalleryProps) {
  const mediaMessages = messages.filter(
    (m) => m.content && m.content.startsWith("data:image")
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border border-white/10 p-0 overflow-hidden sm:max-w-3xl">
        <DialogTitle className="sr-only">Media Gallery</DialogTitle>
        <div className="flex flex-col h-[70vh]">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
            <h2 className="text-sm font-black uppercase italic tracking-widest text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> Media Gallery
            </h2>
          </div>
          <ScrollArea className="flex-1 p-6">
            {mediaMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 mt-20">
                <ImageIcon className="w-12 h-12 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No media shared yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaMessages.map((msg) => (
                  <div key={msg.id} className="relative group aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/5 cursor-pointer">
                    <img 
                      src={msg.content} 
                      alt="Shared Media" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onClick={() => {
                        const win = window.open();
                        if (win) { win.document.write(`<img src="${msg.content}" style="max-width:100%;" />`); }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">View</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
