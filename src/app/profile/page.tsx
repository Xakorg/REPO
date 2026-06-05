"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Sparkles,
  Settings,
  Zap,
  Heart,
  Trophy,
  Lock,
  Loader2,
  Camera,
  RefreshCw,
  Gamepad2,
  Activity,
  ShieldCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, useStorage, useAuth, updateDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RenderHat } from "@/components/RenderHat";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

const MOOD_EMOJIS = ["😀", "😎", "🎮", "🚀", "✨", "🔥", "🎨", "🌈", "👾", "🤖", "⭐", "🎉", "👑", "🦄", "🍦", "🍕", "🎈"];

const AURAS = [
  { id: 'none', label: 'NONE', class: '' },
  { id: 'neon', label: 'NEON PULSE', class: 'aura-neon' },
  { id: 'glitch', label: 'GLITCH', class: 'aura-glitch' },
  { id: 'gold', label: 'GOLD', class: 'aura-gold' },
];

const NAMEPLATES = [
  { id: 'default', label: 'STANDARD', class: '' },
  { id: 'nameplate-blue', label: 'BLUE', class: 'nameplate-blue' },
  { id: 'nameplate-gold', label: 'GOLD', class: 'nameplate-gold' },
  { id: 'nameplate-pro', label: 'PRO', class: 'nameplate-pro' },
];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(user?.displayName || null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc(adminRoleRef);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");
  const hasAdminAccess = isSuperAdmin || !!adminRole;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (userData) {
      setDescription(userData.description || "");
      setAvatarUrl(userData.photoURL || user?.photoURL || "");
      setDisplayName(userData.displayName || user?.displayName || null);
    }
  }, [userData, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage || !auth?.currentUser) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      updateDocumentNonBlocking(doc(firestore!, "users", user.uid), {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });
      setAvatarUrl(downloadURL);
      toast({ title: "Profile Image Updated" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsUploading(false);
    }
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString();
    const newUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setAvatarUrl(newUrl);
    updateProperty('photoURL', newUrl);
  };

  const handleUpdate = () => {
    if (!firestore || !user) return;
    setIsUpdating(true);
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
      description,
      updatedAt: serverTimestamp()
    });
    if (displayName && displayName !== user.displayName) {
      try {
        updateProfile(auth.currentUser!, { displayName });
        updateDocumentNonBlocking(doc(firestore, "users", user.uid), { displayName });
      } catch (e) {
        // ignore updateProfile errors here; non-blocking update already queued
      }
    }
    toast({ title: "Settings Saved" });
    setIsUpdating(false);
  };

  const updateProperty = (key: string, value: any) => {
    if (!firestore || !user) return;
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), { [key]: value });
    if (key === 'photoURL' && auth?.currentUser) {
      updateProfile(auth.currentUser, { photoURL: value });
    }
    toast({ title: "Updated", description: `${key} modified.` });
  };

  if (!mounted) return null;
  if (isUserLoading || isDataLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>;
  if (!user) return <div className="p-32 text-center text-4xl font-black uppercase italic text-foreground">Sign in to view your profile.</div>;

  const cleanDisplayName = user.displayName?.replace(/^@+/, "") || "User";

  return (
    <div className="max-w-[1400px] mx-auto py-12 space-y-12 animate-fade-in px-8 pb-40 text-foreground">
      <header className="relative h-[300px] rounded-[3.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-zinc-950">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <img src="https://picsum.photos/seed/profile-banner/1200/400" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale" alt="Banner" />
        
        <div className="absolute bottom-10 left-12 flex items-center gap-10 z-20">
          <div className={cn(
            "relative p-1 rounded-[2.5rem] transition-all duration-700 shadow-2xl bg-zinc-900",
            userData?.aura && userData.aura !== 'none' ? `aura-${userData.aura}` : ""
          )}>
            <RenderHat hatKey={userData?.hat} />
            <div className="w-36 h-36 border-4 border-black/40 rounded-[2.2rem] overflow-hidden relative shadow-2xl">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-zinc-800 text-white text-5xl font-black">{cleanDisplayName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-black rounded-full border-4 border-white/20 flex items-center justify-center text-2xl shadow-2xl">
               {userData?.mood || "😀"}
            </div>
          </div>

          <div className="space-y-2 pb-2">
            <div className="flex items-center gap-4">
              <h1 className={cn(
                "text-6xl font-black tracking-tighter uppercase italic leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]",
                userData?.nameplate && userData.nameplate !== 'default' ? userData.nameplate : "text-white"
              )}>
                {cleanDisplayName}
              </h1>
              <Badge className={cn(
                "backdrop-blur-xl border border-white/20 text-white font-black uppercase text-[8px] px-6 py-1.5 rounded-full",
                hasAdminAccess ? "bg-primary/40" : "bg-white/10"
              )}>
                {hasAdminAccess ? "ADMIN" : "VERIFIED"}
              </Badge>
            </div>
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="w-3 h-3" /> {user.email}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="glass-card rounded-[3.5rem] border-white/5 bg-zinc-950/40 p-12 space-y-12">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Settings</h3>
              <Settings className="w-6 h-6 text-white/10" />
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Bio</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="About you..."
                  className="rounded-3xl bg-zinc-900/50 border-white/5 min-h-[160px] p-8 text-lg font-medium italic text-white"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Display Name</label>
                <div className="flex gap-4">
                  <Input
                    value={displayName || ''}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="h-14 rounded-2xl bg-zinc-900/50 border-white/5 pl-4 text-sm font-bold text-white/80"
                  />
                  <Button onClick={() => {
                    if (!displayName) return;
                    updateProperty('displayName', displayName);
                    try { updateProfile(auth.currentUser!, { displayName }); } catch(e) {}
                    toast({ title: 'Display name updated' });
                  }} className="h-14 px-6 rounded-2xl bg-primary font-black uppercase text-xs">Change</Button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Avatar URL</label>
                <div className="flex gap-4">
                  <Input 
                    value={avatarUrl}
                    onChange={(e) => { setAvatarUrl(e.target.value); updateProperty('photoURL', e.target.value); }}
                    className="h-16 rounded-2xl bg-zinc-900/50 border-white/5 pl-8 text-sm font-bold text-white/80"
                  />
                  <Button onClick={generateRandomAvatar} className="h-16 px-8 rounded-2xl bg-zinc-900 border border-white/10 font-black text-xs uppercase">GEN</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Nameplate</label>
                  <div className="grid grid-cols-2 gap-3">
                    {NAMEPLATES.map(style => (
                      <button 
                        key={style.id}
                        onClick={() => updateProperty('nameplate', style.id)}
                        className={cn(
                          "h-14 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest",
                          userData?.nameplate === style.id ? "bg-primary/20 border-primary text-white" : "bg-zinc-900/50 border-white/5 text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Aura</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AURAS.map(aura => (
                      <button 
                        key={aura.id}
                        onClick={() => updateProperty('aura', aura.id)}
                        className={cn(
                          "h-14 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest",
                          userData?.aura === aura.id ? "bg-primary/20 border-primary text-white" : "bg-zinc-900/50 border-white/5 text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        {aura.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleUpdate} 
                disabled={isUpdating}
                className="w-full h-20 bg-primary hover:bg-primary/90 rounded-3xl font-black uppercase text-xl italic tracking-widest shadow-xl transition-all active:scale-95 border-b-8 border-primary/20 active:border-b-0"
              >
                {isUpdating ? <Loader2 className="w-8 h-8 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card rounded-[3.5rem] border-white/5 bg-zinc-950/40 p-10 space-y-10 shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Status</h3>
            
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  { label: "Credits", val: userData?.currencyBalance || 0, icon: Zap, color: "text-amber-500" },
                  { label: "Followers", val: userData?.followerCount || 0, icon: Heart, color: "text-rose-500" },
                  { label: "XP", val: userData?.xp || 0, icon: Trophy, color: "text-purple-400" },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center group px-2">
                    <div className="flex items-center gap-4 text-white/40">
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                      <span className="text-[9px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-black italic tabular-nums">{stat.val}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-2 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-white/40">
                   <Activity className="w-4 h-4 text-emerald-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Status</span>
                </div>
                <span className="text-lg font-black italic text-white animate-pulse">Online</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}