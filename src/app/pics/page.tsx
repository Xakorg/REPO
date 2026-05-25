
"use client";

import { useState } from "react";
import { 
  ImageIcon, 
  Heart, 
  Share2, 
  Plus, 
  Loader2, 
  Camera,
  Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function XakPicsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const picsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "public_pics"), orderBy("timestamp", "desc"), limit(50));
  }, [firestore]);

  const { data: pics, isLoading } = useCollection(picsQuery);

  const handleUpload = () => {
    toast({ title: "Feature Standby", description: "Use the Private Vault to upload real shards." });
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 md:py-10 animate-fade-in px-4 md:px-6 space-y-8 md:space-y-12 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-10 bg-card/40 backdrop-blur-xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-2 md:border-4 border-white/10 shadow-2xl relative overflow-hidden text-foreground">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Camera className="w-40 md:w-80 h-40 md:h-80 -rotate-12 text-pink-500" /></div>
        <div className="relative z-10 flex items-center gap-4 md:gap-8">
          <div className="w-12 h-12 md:w-24 md:h-24 rounded-2xl md:rounded-[3rem] bg-pink-500/10 flex items-center justify-center border-2 md:border-4 border-pink-500/20 shadow-xl shadow-pink-900/20">
            <ImageIcon className="w-6 h-6 md:w-12 md:h-12 text-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">XakPics</h1>
            <p className="text-[8px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-2 md:gap-4 mt-2 md:mt-4 italic">
              <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_pink]" /> Public Shard Registry
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
           <Link href="/pics/private" className="w-full sm:w-auto">
             <Button variant="outline" className="w-full h-12 md:h-18 px-8 md:px-12 rounded-xl md:rounded-[2rem] border-2 border-amber-500/20 bg-amber-500/5 text-amber-500 font-black uppercase text-[9px] md:text-xs tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl">
               <Lock className="w-4 h-4 md:w-5 md:h-5 mr-3" /> Private Vault
             </Button>
           </Link>
           <Button onClick={handleUpload} className="w-full sm:w-auto bg-pink-600 hover:bg-pink-500 h-12 md:h-18 px-8 md:px-12 rounded-xl md:rounded-[2rem] font-black uppercase text-[9px] md:text-xs tracking-widest shadow-xl text-white border-b-4 md:border-b-8 border-pink-900 active:border-b-0 transition-all italic">
             <Plus className="w-4 h-4 md:w-5 md:h-5 mr-3" /> Publish Shard
           </Button>
        </div>
      </header>

      <Tabs defaultValue="public" className="space-y-8 md:space-y-12">
         <TabsList className="bg-secondary/30 p-1.5 rounded-2xl md:rounded-[2.5rem] h-14 md:h-20 border-2 md:border-4 border-white/10 w-full md:w-auto shadow-2xl overflow-x-auto no-scrollbar">
            <TabsTrigger value="public" className="flex-1 md:flex-none rounded-xl md:rounded-[1.8rem] px-8 md:px-16 h-full font-black uppercase text-[9px] md:text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Public Feed</TabsTrigger>
            <Link href="/pics/private" className="flex-1 md:flex-none"><TabsTrigger value="private" className="w-full rounded-xl md:rounded-[1.8rem] px-8 md:px-16 h-full font-black uppercase text-[9px] md:text-xs tracking-widest">Personal</TabsTrigger></Link>
         </TabsList>

         <TabsContent value="public" className="animate-in slide-in-from-bottom-8 duration-700 focus:outline-none">
            {isLoading ? (
              <div className="py-40 flex flex-col items-center justify-center space-y-6">
                 <Loader2 className="animate-spin w-12 h-12 text-pink-500 opacity-20" />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-pink-500/40">Syncing Media...</p>
              </div>
            ) : !pics || pics.length === 0 ? (
               <div className="py-32 md:py-40 text-center opacity-10 space-y-8">
                  <ImageIcon className="w-24 md:w-48 h-24 md:h-48 mx-auto animate-float" />
                  <p className="text-sm md:text-2xl font-black uppercase tracking-[1em]">Registry_Empty</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-8 px-1 md:px-0">
                {pics.map(pic => (
                  <Card key={pic.id} className="glass-card group hover:-translate-y-2 md:hover:-translate-y-4 transition-all duration-500 rounded-2xl md:rounded-[3rem] overflow-hidden border-2 md:border-4 border-white/10 hover:border-pink-500/40 shadow-2xl bg-zinc-950/40">
                    <div className="relative aspect-square overflow-hidden bg-black">
                      <Image src={pic.url} alt="Gallery Shard" fill className="object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-[2s]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <CardContent className="p-3 md:p-8 flex justify-between items-center bg-black/40">
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-500 border border-pink-500/40 shadow-lg"><Heart className="w-3.5 h-3.5 md:w-6 md:h-6 fill-current" /></div>
                        <span className="text-xs md:text-xl font-black italic tabular-nums text-white/90">{pic.likes || 0}</span>
                      </div>
                      <button className="p-2 md:p-4 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all active:scale-90">
                        <Share2 className="w-4 h-4 md:w-6 md:h-6" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
         </TabsContent>
      </Tabs>
    </div>
  );
}
