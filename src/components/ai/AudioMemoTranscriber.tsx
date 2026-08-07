"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Sparkles, FileAudio, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AudioMemoTranscriber() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast({ title: "Recording voice memo..." });
      setTimeout(() => {
        setIsRecording(false);
        setTranscript("Hey Xak AI, please summarize my project schedule for next week and create tasks.");
        toast({ title: "Voice memo transcribed & summarized!" });
      }, 4000);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-rose-500/30 bg-[#16060c]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-rose-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <FileAudio className="h-4 w-4 text-rose-400" />
          <span className="font-semibold text-rose-200">Audio Memo Transcriber & Summarizer</span>
        </div>
        <Button
          size="xs"
          onClick={toggleRecording}
          className={isRecording ? "bg-red-600 animate-pulse text-white" : "bg-rose-600 hover:bg-rose-500 text-white"}
        >
          {isRecording ? <Square className="h-3.5 w-3.5 mr-1" /> : <Mic className="h-3.5 w-3.5 mr-1" />}
          {isRecording ? "Stop Recording" : "Record Memo"}
        </Button>
      </div>

      {isRecording && (
        <div className="flex items-center justify-center space-x-1 py-4">
          <div className="w-1.5 h-6 bg-rose-500 animate-bounce" />
          <div className="w-1.5 h-10 bg-rose-400 animate-bounce delay-75" />
          <div className="w-1.5 h-8 bg-rose-500 animate-bounce delay-150" />
          <div className="w-1.5 h-12 bg-rose-300 animate-bounce delay-200" />
          <span className="ml-3 font-mono text-rose-300">Listening to voice...</span>
        </div>
      )}

      {transcript && (
        <div className="bg-black/40 rounded-lg p-3 border border-rose-500/20 space-y-2 mt-2">
          <div className="flex items-center space-x-2 text-rose-300 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-rose-400" />
            <span>AI Voice Transcription:</span>
          </div>
          <p className="text-gray-200 italic font-mono text-[11px] bg-rose-950/30 p-2 rounded border border-rose-500/10">
            "{transcript}"
          </p>
        </div>
      )}
    </div>
  );
}
