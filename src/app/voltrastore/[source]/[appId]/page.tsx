"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Download, Star, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React from "react";

const SafeHTML = React.memo(({ html }: { html: string }) => (
  <div 
    className="prose prose-invert prose-purple max-w-none text-zinc-300 font-medium leading-relaxed
               prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
               prose-a:text-purple-400 prose-img:rounded-2xl"
    dangerouslySetInnerHTML={{ __html: html }}
  />
));
SafeHTML.displayName = "SafeHTML";

function getDeviceIcon(device: string) {
  switch (device) {
    case "VoltraMax":
      return <span className="text-[10px]">🖥️</span>;
    case "VoltraPlay":
      return <span className="text-[10px]">🎮</span>;
    case "VoltraTab":
      return <span className="text-[10px]">📱</span>;
    default:
      return null;
  }
}

export default function VoltraStoreAppPage() {
  const { source, appId } = useParams() as { source: string; appId: string };
  const router = useRouter();
  const firestore = useFirestore();

  const isNative = source.toLowerCase() === "voltra";
  
  const [appDetails, setAppDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source || !appId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isNative) {
          if (!firestore) {
            // Don't hang infinitely if firestore is missing
            throw new Error("Database not connected yet.");
          }
          const docRef = doc(firestore, "voltra_app_store", appId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setAppDetails({ id: docSnap.id, ...docSnap.data() });
          } else {
            setError("Native application not found.");
          }
        } else {
          // Fetch Flathub AppStream data with an AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          const res = await fetch(`/api/flathub/${appId}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!res.ok) throw new Error("Flathub app not found.");
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setAppDetails(data);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load application details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isNative && !firestore) return; // Wait for firestore to initialize
    fetchDetails();
  }, [source, appId, isNative, firestore]);

  const handleInstall = () => {
    alert("Voltra OS required for installation. Please wait for device release.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-zinc-500 animate-pulse">Loading App Data...</p>
      </div>
    );
  }

  if (error || !appDetails) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
        <div className="text-red-500 text-6xl font-black">404</div>
        <p className="text-xl font-bold text-zinc-400">{error || "Application not found."}</p>
        <button onClick={() => router.push("/")} onMouseEnter={() => router.prefetch("/")} className="mt-8 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-colors">
          Return to Store
        </button>
      </div>
    );
  }

  // Derive common fields to unify the template
  const name = isNative ? appDetails.appName : appDetails.name;
  const developer = isNative ? appDetails.developerName : (appDetails.developer_name || appDetails.dev);
  const icon = isNative ? null : (appDetails.icon || `https://ui-avatars.com/api/?name=${name}&background=random`);
  const descriptionHtml = isNative ? appDetails.description : (appDetails.description || appDetails.summary);
  const license = !isNative ? appDetails.project_license : null;
  const homepage = !isNative && appDetails.urls ? appDetails.urls.homepage : null;
  const bundle = !isNative ? (appDetails.bundle || appId) : null;

  return (
    <div className="pb-32 bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-3xl border-b border-white/5 h-20 flex items-center px-8">
        <button onClick={() => router.push("/")} onMouseEnter={() => router.prefetch("/")} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-wider text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </button>
      </nav>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto px-8 py-16 relative"
      >
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* App Icon */}
          <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-purple-500/10 to-black border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden p-6 shadow-2xl">
            {isNative ? (
              <span className="text-7xl font-black text-purple-400">{name?.charAt(0) || "V"}</span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={icon} 
                alt={name} 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=random` }}
              />
            )}
          </div>
          
          {/* App Info Header */}
          <div className="flex-1 space-y-6 pt-4">
            <div className="space-y-2">
              <h1 className="text-6xl font-black tracking-tighter leading-none">{name}</h1>
              <div className="flex items-center gap-3 text-lg font-bold text-zinc-400">
                <span>{developer}</span>
                {!isNative && (
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={handleInstall} className="bg-white text-black font-black uppercase tracking-widest px-10 py-4 rounded-full hover:bg-zinc-200 transition-colors text-sm flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]">
                <Download className="w-5 h-5" /> Install
              </button>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <span className="font-bold text-xl">4.8</span>
              </div>
              {isNative && appDetails.compatibility && (
                <div className="flex gap-2">
                  {appDetails.compatibility.map((device: string) => (
                    <span key={device} className="text-xs font-bold uppercase tracking-wider text-zinc-300 bg-white/5 px-3 py-2 rounded-lg flex items-center gap-2">
                      {getDeviceIcon(device)} {device}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Screenshots Section */}
        {!isNative && appDetails.screenshots && appDetails.screenshots.length > 0 && (
          <div className="mt-16 space-y-4">
            <h3 className="text-2xl font-black uppercase tracking-tight">Screenshots</h3>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
              {appDetails.screenshots.map((shot: any, i: number) => {
                const size = shot.sizes && shot.sizes.length > 0 ? shot.sizes[0] : null;
                if (!size) return null;
                return (
                  <div key={i} className="flex-shrink-0 w-[600px] h-[350px] bg-white/5 rounded-3xl overflow-hidden snap-center border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={size.src} alt="Screenshot" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description & Sidebar */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tight">About this Application</h3>
            <SafeHTML html={descriptionHtml || ""} />
          </div>
          
          <div className="space-y-8 border-l border-white/5 pl-8">
            {!isNative && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">License</p>
                  <p className="font-bold">{license || "Unknown"}</p>
                </div>
                {homepage && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Website</p>
                    <a href={homepage} target="_blank" rel="noreferrer" className="font-bold text-purple-400 hover:underline break-all">
                      {homepage.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Bundle</p>
                  <p className="font-bold font-mono text-xs text-zinc-400 break-all">{bundle}</p>
                </div>
              </>
            )}
            
            {/* Common Details */}
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Source</p>
              <div className="flex items-center gap-2 font-bold bg-white/5 w-max px-3 py-1 rounded-md border border-white/10">
                {isNative ? (
                  <><span className="w-2 h-2 rounded-full bg-purple-500"></span> Voltra Store</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-blue-500"></span> Flathub Registry</>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
