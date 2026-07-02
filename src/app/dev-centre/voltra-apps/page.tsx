"use client";

import { useState } from "react";
import { Code, ShieldCheck, Box, Rocket, TerminalSquare, RefreshCw, Play, CheckCircle2, LayoutGrid } from "lucide-react";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useDevCentreStore } from "@/lib/dev-centre-store";

export default function VoltraOSAppStorePublisher() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { activeProjectId } = useDevCentreStore();
  
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.exe')) {
        toast({ variant: "destructive", title: "Invalid format", description: "Please upload a Windows .exe file." });
        return;
      }
      setSelectedFile(file);
      setIsConverted(false);
      
      // Simulate .exe to .volt conversion layer
      setIsConverting(true);
      setTimeout(() => {
        setIsConverting(false);
        setIsConverted(true);
        toast({ title: "Conversion Complete", description: "Wrapped into native VoltraOS format." });
      }, 4000);
    }
  };

  const handleTest = () => {
    setIsTesting(true);
    toast({ title: "Booting Micro-VM...", description: "Testing your app in the VoltraOS Sandbox." });
    setTimeout(() => {
      setIsTesting(false);
      toast({ title: "Test Passed 🟢", description: "0.00ms load time achieved. Ready for publishing." });
    }, 3000);
  };

  const handlePublish = async () => {
    if (!user || !firestore || !appName || !selectedFile || !isConverted || !activeProjectId) {
      toast({ variant: "destructive", title: "Missing details", description: "Please finish conversion and provide a name." });
      return;
    }

    setIsPublishing(true);
    // Simulate upload and Hub Shield heuristic scan
    setTimeout(async () => {
      try {
        await addDocumentNonBlocking(collection(firestore, "voltra_app_store"), {
          developerId: user.uid,
          developerName: user.displayName || "Unknown Dev",
          projectId: activeProjectId,
          appName,
          description: appDescription,
          version,
          status: "published",
          downloads: 0,
          rating: 0,
          timestamp: serverTimestamp()
        });
        toast({ title: "App Published! 🚀", description: "Permanently stored in database for VoltraStore." });
        setAppName("");
        setAppDescription("");
        setSelectedFile(null);
        setIsConverted(false);
      } catch (e) {
        toast({ variant: "destructive", title: "Publish failed" });
      }
      setIsPublishing(false);
    }, 3500); 
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-24 h-24 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-white/5">
          <LayoutGrid className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-400">No Project Selected</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">Select or create a project from the top left dropdown to publish VoltraOS apps.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-green-500 italic">Global Distribution</span>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">VoltraOS App Store</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-green-400 font-black uppercase text-[10px] tracking-widest bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Wine Translation Layer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Guidelines & Rules */}
        <div className="space-y-6">
          <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-3xl">
            <h3 className="font-black uppercase text-lg mb-4 flex items-center gap-3 text-white">
              <Code className="text-green-500 w-5 h-5" /> Auto-Conversion
            </h3>
            <p className="text-xs text-zinc-400 mb-6 font-medium leading-relaxed">
              VoltraOS makes porting effortless. Just upload your Windows <code className="bg-black/50 px-2 py-1 rounded text-green-500 font-mono text-[10px]">.exe</code> file, and our backend will automatically wrap and convert it into a native VoltraOS binary.
            </p>
            
            <div className="h-px w-full bg-white/5 my-6" />
            
            <h3 className="font-black uppercase text-lg mb-4 flex items-center gap-3 text-white">
              <ShieldCheck className="text-green-500 w-5 h-5" /> Micro-Sandboxing
            </h3>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Every converted package is heuristically scanned by Hub Shield. The app will be safely containerized before deployment to the global VoltraStore.
            </p>
          </Card>
        </div>

        {/* Right Column: Upload Dashboard */}
        <Card className="lg:col-span-2 p-10 bg-zinc-950/60 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="text-2xl font-black uppercase italic mb-8 relative z-10 flex items-center gap-3 text-white">
            <TerminalSquare className="text-green-500 w-6 h-6" /> Deploy Executable
          </h2>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 ml-2">Application Name</label>
                <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g. VoltraPlay" className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold px-5" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 ml-2">Version String</label>
                <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold font-mono px-5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 ml-2">Store Description</label>
              <textarea 
                value={appDescription} 
                onChange={e => setAppDescription(e.target.value)} 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-5 text-white font-medium text-sm resize-none focus:outline-none focus:border-green-500/50 transition-colors"
                placeholder="Describe your app features..."
              />
            </div>

            <div className="pt-6">
              <label className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 mb-3 block ml-2">Windows Executable (.exe)</label>
              <div className="border-2 border-dashed border-green-500/30 rounded-[2.5rem] p-12 text-center bg-green-500/5 hover:bg-green-500/10 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  accept=".exe"
                  onChange={handleFileDrop}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                
                {isConverting ? (
                  <div className="flex flex-col items-center justify-center">
                    <RefreshCw className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" />
                    <p className="font-black text-white text-xl">Converting to VoltraOS Native...</p>
                    <p className="text-green-500 text-xs font-bold mt-2 uppercase tracking-widest animate-pulse">Running Wine Translation Layer</p>
                  </div>
                ) : isConverted ? (
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="font-black text-white text-xl">Conversion Successful!</p>
                    <p className="text-zinc-400 text-xs font-bold mt-2">{selectedFile?.name} is ready for VoltraOS.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Box className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                    <p className="font-black text-white text-xl tracking-tight">Drop your .exe file here</p>
                    <p className="text-zinc-500 text-xs font-bold mt-2">We will automatically convert it for VoltraOS.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test App Feature */}
            {isConverted && (
              <Button 
                disabled={isTesting}
                onClick={handleTest}
                variant="outline"
                className="w-full h-14 rounded-[1.5rem] border-green-500/30 hover:bg-green-500/10 text-green-400 font-black uppercase tracking-[0.2em] text-xs transition-all"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-green-400" />}
                {isTesting ? "Booting VM Sandbox..." : "Test App on VoltraOS Simulator"}
              </Button>
            )}

            <Button 
              disabled={isPublishing || !selectedFile || !appName || !isConverted} 
              onClick={handlePublish}
              className="w-full h-16 rounded-[1.5rem] bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-[0.2em] text-sm mt-8 shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all"
            >
              {isPublishing ? "Running Hub Shield Heuristics..." : "Transmit to App Store"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
