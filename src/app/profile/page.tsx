"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {  
  Settings,
  Zap,
  Heart,
  Trophy,
  Loader2,
  RefreshCw,
  Activity,
  User as UserIcon,
  ShieldCheck,
  Globe,
  Lock,
  Upload,
  Sparkles,
  Edit3,
  Link2,
  Mail,
  Github
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, useStorage, useAuth, updateDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, linkWithPopup, unlink, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RenderHat, RenderBanner } from "@/components/RenderHat";
import confetti from "canvas-confetti";
import { ALL_SHOP_ITEMS } from "@/lib/shopItems";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4f46e5', '#ec4899', '#f59e0b']
  });
};

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [inventoryTab, setInventoryTab] = useState("All");

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

  const [providerData, setProviderData] = useState<any[]>([]);

  useEffect(() => {
    if (userData) {
      setDescription(userData.aboutMe || userData.description || "");
      setAvatarUrl(userData.photoURL || user?.photoURL || "");
      setDisplayName(userData.displayName || user?.displayName || null);
    }
  }, [userData, user]);

  useEffect(() => {
    if (auth.currentUser) {
      setProviderData([...auth.currentUser.providerData]);
    }
  }, [auth.currentUser]);

  const handleLinkProvider = async (providerName: string) => {
    if (!auth.currentUser) return;
    try {
      let provider;
      if (providerName === 'google') provider = new GoogleAuthProvider();
      else if (providerName === 'github') provider = new GithubAuthProvider();
      else if (providerName === 'apple') provider = new OAuthProvider('apple.com');
      
      if (provider) {
        await linkWithPopup(auth.currentUser, provider);
        setProviderData([...auth.currentUser.providerData]);
        toast({ title: "Account Linked", description: `Successfully connected your ${providerName} account.` });
      }
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Linking Failed", description: e.message });
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    if (!auth.currentUser) return;
    // Prevent unlinking if it's the last provider
    if (providerData.length === 1) {
      toast({ variant: "destructive", title: "Cannot Unlink", description: "You must have at least one sign-in method connected." });
      return;
    }
    try {
      await unlink(auth.currentUser, providerId);
      setProviderData([...auth.currentUser.providerData]);
      toast({ title: "Account Unlinked", description: `Successfully disconnected the account.` });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Unlink Failed", description: e.message });
    }
  };

  const handleUpdate = () => {
    if (!firestore || !user) return;
    setIsUpdating(true);
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
      aboutMe: description,
      description: description,
      updatedAt: serverTimestamp()
    });
    if (displayName && displayName !== user.displayName) {
      try {
        updateProfile(auth.currentUser!, { displayName });
        updateDocumentNonBlocking(doc(firestore, "users", user.uid), { displayName });
      } catch (e) { console.error(e); }
    }
    triggerConfetti();
    toast({ title: "Profile Synced", description: "Your identity has been updated in the multiverse." });
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

  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !storage) return;
    const file = e.target.files[0];
    
    setIsUploadingPicture(true);
    toast({ title: "Uploading...", description: "Optimizing your new avatar." });
    
    try {
      const fileRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      setAvatarUrl(url);
      updateProperty('photoURL', url);
      toast({ title: "Success!", description: "Avatar updated successfully." });
      triggerConfetti();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload image." });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString();
    const newUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setAvatarUrl(newUrl);
    updateProperty('photoURL', newUrl);
    triggerConfetti();
  };


  if (isUserLoading || isDataLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>;
  if (!user) return <div className="p-32 text-center text-4xl font-black uppercase italic text-foreground">Sign in to view your profile.</div>;

  const cleanDisplayName = (displayName || user.displayName || "User").replace(/^@+/, "");

  // Helper for nameplate colors
  const getNameplateClass = (nameplate: string) => {
    switch (nameplate) {
      case 'golden': return "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent";
      case 'rainbow': return "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent animate-gradient";
      case 'hacker': return "text-green-500 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
      case 'magic': return "text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]";
      case 'sports': return "text-orange-500 italic drop-shadow-[0_4px_0_rgba(194,65,12,1)]";
      case 'pro': return "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent";
      case 'blue': return "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]";
      default: return "text-white";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto py-12 space-y-8 animate-fade-in px-8 pb-40 text-foreground">
      
      {/* Immersive Parallax Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative h-[350px] rounded-[3rem] overflow-hidden shadow-2xl bg-[#0c0c16] group"
      >
        {/* Banner */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <RenderBanner bannerKey={userData?.banner} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" />
          {!userData?.banner && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black" />
          )}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0c0c16] via-[#0c0c16]/50 to-transparent" />
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-12 flex items-end justify-between z-20">
          <div className="flex items-end gap-8">
            <div className="relative group/avatar cursor-pointer">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
              <div className={cn("relative p-2 rounded-[2.5rem] bg-[#0c0c16]/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105", userData?.aura && userData.aura !== 'none' ? `aura-${userData.aura}` : "")}>
                <RenderHat hatKey={userData?.hat} />
                <Avatar className="w-32 h-32 rounded-[2rem] border-2 border-white/5 bg-zinc-900">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-4xl font-black">{cleanDisplayName[0]}</AvatarFallback>
                </Avatar>
                {/* Active Indicator */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0c0c16] shadow-[0_0_15px_rgba(16,185,129,0.5)] z-30" />
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-4 mb-1">
                <h1 className={cn("text-6xl font-black uppercase italic leading-none tracking-tighter", getNameplateClass(userData?.nameplate))}>
                  {cleanDisplayName}
                </h1>
                {hasAdminAccess && (
                  <Badge className="bg-primary text-white font-black uppercase px-3 py-1 text-[10px] shadow-[0_0_15px_rgba(var(--primary),0.5)] border-none">Admin</Badge>
                )}
                <Badge className="bg-white/10 backdrop-blur-md text-white font-black uppercase px-3 py-1 text-[10px] border border-white/10">Verified</Badge>
              </div>
              <p className="text-white/50 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                @{cleanDisplayName.toLowerCase().replace(/\s/g, '')} <span className="opacity-50">•</span> {user.email}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-2">
             <Button variant="outline" className="rounded-full bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 text-white gap-2 font-bold uppercase text-xs tracking-wider">
               <Globe className="w-4 h-4" /> Public Profile
             </Button>
          </div>
        </div>
      </motion.header>

      {/* Bento Box Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Quick Info (4 cols) */}
        <div className="md:col-span-4 space-y-8">
          {/* Stats Bento */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <Card className="glass-card bg-[#0c0c16]/80 backdrop-blur-2xl border-white/5 p-6 rounded-[2rem] hover:bg-white/5 transition-colors group">
              <Zap className="w-6 h-6 text-amber-500 mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Credits</p>
              <p className="text-3xl font-black italic text-white">{userData?.currencyBalance || 0}</p>
            </Card>
            
            <Card className="glass-card bg-[#0c0c16]/80 backdrop-blur-2xl border-white/5 p-6 rounded-[2rem] hover:bg-white/5 transition-colors group">
              <Trophy className="w-6 h-6 text-purple-500 mb-4 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">XP Level</p>
              <p className="text-3xl font-black italic text-white">{userData?.xp || 0}</p>
            </Card>
            
            <Card className="glass-card bg-[#0c0c16]/80 backdrop-blur-2xl border-white/5 p-6 rounded-[2rem] hover:bg-white/5 transition-colors group col-span-2 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Followers</p>
                <p className="text-3xl font-black italic text-white">{userData?.followerCount || 0}</p>
              </div>
              <Heart className="w-10 h-10 text-rose-500/20 group-hover:text-rose-500/40 transition-colors" />
            </Card>
          </motion.div>

          {/* About Quick View Bento */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card bg-[#0c0c16]/80 backdrop-blur-2xl border-white/5 p-8 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><UserIcon className="w-32 h-32 -rotate-12" /></div>
              <h3 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Current Status
              </h3>
              <p className="text-sm font-bold text-white/80 leading-relaxed italic border-l-2 border-primary/50 pl-4 py-1">
                {description || "No bio set. Editing your profile to let the multiverse know who you are!"}
              </p>
            </Card>
          </motion.div>

          {/* Equipment Inventory Bento */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card bg-[#0c0c16]/80 backdrop-blur-2xl border-white/5 p-6 rounded-[2rem] flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Equipment
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {["All", "hat", "aura", "nameplate", "decor", "pet", "banner"].map((tab) => (
                  <Button
                    key={tab}
                    onClick={() => setInventoryTab(tab)}
                    className={cn(
                      "h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                      inventoryTab === tab 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {tab === "All" ? "All" : tab}
                  </Button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {userData?.inventory?.length > 0 ? (
                  ALL_SHOP_ITEMS
                    .filter(item => userData.inventory.includes(item.key) && (inventoryTab === "All" || item.type === inventoryTab))
                    .map((item) => {
                      const isEquipped = userData[item.type] === item.key;
                      return (
                        <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-white/5 group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg, item.color)}>
                                {item.type === 'hat' && <UserIcon className="w-4 h-4" />}
                                {item.type === 'aura' && <Zap className="w-4 h-4" />}
                                {item.type === 'nameplate' && <Edit3 className="w-4 h-4" />}
                                {item.type === 'decor' && <Sparkles className="w-4 h-4" />}
                                {item.type === 'pet' && <Heart className="w-4 h-4" />}
                                {item.type === 'banner' && <Globe className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{item.name}</p>
                                <p className="text-[9px] font-black uppercase text-white/40 tracking-wider">{item.category}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                if (isEquipped) {
                                  updateProperty(item.type, "none");
                                } else {
                                  updateProperty(item.type, item.key);
                                }
                              }}
                              className={cn(
                                "h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                isEquipped 
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20" 
                                  : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                              )}
                            >
                              {isEquipped ? "Unequip" : "Equip"}
                            </Button>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-6">
                    <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Inventory Empty</p>
                    <p className="text-xs mt-1 italic">Visit the shop to acquire items.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Settings & Customization (8 cols) */}
        <div className="md:col-span-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card bg-[#0c0c16]/80 backdrop-blur-2xl border-white/5 p-10 rounded-[3rem] shadow-2xl relative">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-widest flex items-center gap-3">
                    <Settings className="w-6 h-6 text-primary" /> Identity Settings
                  </h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Configure how you appear across Xakteir</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Name & Avatar Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">Display Name</label>
                    <div className="relative group">
                      <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input
                        value={displayName || ''}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        className="h-16 rounded-2xl bg-black/40 border-white/5 pl-12 text-sm font-bold text-white focus:border-primary/50 transition-colors shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">Avatar Source URL</label>
                    <div className="flex gap-2">
                      <Input 
                        value={avatarUrl}
                        onChange={(e) => { setAvatarUrl(e.target.value); updateProperty('photoURL', e.target.value); }}
                        className="h-16 rounded-2xl bg-black/40 border-white/5 pl-6 text-sm font-bold text-white focus:border-primary/50 shadow-inner flex-1"
                        placeholder="https://..."
                      />
                      <Button onClick={generateRandomAvatar} className="h-16 px-4 rounded-2xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-widest transition-all">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={isUploadingPicture}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Button disabled={isUploadingPicture} className="h-16 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest transition-all pointer-events-none">
                          {isUploadingPicture ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Area */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">Biography</label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell the multiverse about yourself..."
                    className="rounded-[2rem] bg-black/40 border-white/5 min-h-[160px] p-6 text-sm font-bold italic text-white/90 focus:border-primary/50 shadow-inner resize-none"
                  />
                </div>

                {/* Privacy Toggle Bento */}
                <div 
                  className="flex items-center justify-between bg-black/40 border border-white/5 rounded-[2rem] p-6 cursor-pointer hover:bg-white/5 transition-all group"
                  onClick={() => updateProperty('isPublic', !(userData?.isPublic ?? true))}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl transition-colors", (userData?.isPublic ?? true) ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400")}>
                      {(userData?.isPublic ?? true) ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase tracking-wider text-sm">Public Profile Visibility</h4>
                      <p className="text-white/40 text-xs font-bold mt-1">When disabled, only your friends can see your full profile data.</p>
                    </div>
                  </div>
                  <div className={cn("w-14 h-8 rounded-full transition-colors flex items-center p-1", (userData?.isPublic ?? true) ? "bg-emerald-500" : "bg-zinc-800")}>
                    <div className={cn("w-6 h-6 rounded-full bg-white transition-transform shadow-md", (userData?.isPublic ?? true) ? "translate-x-6" : "translate-x-0")} />
                  </div>
                </div>

                {/* Linked Accounts */}
                <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Link2 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-black uppercase italic tracking-widest text-white">Linked Accounts</h3>
                  </div>
                  <p className="text-xs text-white/40 font-bold mb-6">Connect other accounts to sign in seamlessly across devices.</p>
                  
                  <div className="space-y-4">
                    {/* Google */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shrink-0">
                           <svg viewBox="0 0 48 48" className="w-full h-full"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-white">Google</h4>
                          <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5 tracking-wider">
                            {providerData.find(p => p.providerId === 'google.com') ? 'Connected' : 'Not Connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => providerData.find(p => p.providerId === 'google.com') ? handleUnlinkProvider('google.com') : handleLinkProvider('google')}
                        variant="outline" 
                        className={cn("rounded-xl text-[10px] font-black uppercase tracking-widest", providerData.find(p => p.providerId === 'google.com') ? "border-rose-500/20 text-rose-500 hover:bg-rose-500/10" : "border-white/10 text-white hover:bg-white/10")}
                      >
                        {providerData.find(p => p.providerId === 'google.com') ? 'Unlink' : 'Link'}
                      </Button>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                           <Github className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-white">GitHub</h4>
                          <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5 tracking-wider">
                            {providerData.find(p => p.providerId === 'github.com') ? 'Connected' : 'Not Connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => providerData.find(p => p.providerId === 'github.com') ? handleUnlinkProvider('github.com') : handleLinkProvider('github')}
                        variant="outline" 
                        className={cn("rounded-xl text-[10px] font-black uppercase tracking-widest", providerData.find(p => p.providerId === 'github.com') ? "border-rose-500/20 text-rose-500 hover:bg-rose-500/10" : "border-white/10 text-white hover:bg-white/10")}
                      >
                        {providerData.find(p => p.providerId === 'github.com') ? 'Unlink' : 'Link'}
                      </Button>
                    </div>

                    {/* Apple */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                           <svg viewBox="0 0 384 512" className="w-5 h-5"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-white">Apple</h4>
                          <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5 tracking-wider">
                            {providerData.find(p => p.providerId === 'apple.com') ? 'Connected' : 'Not Connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => providerData.find(p => p.providerId === 'apple.com') ? handleUnlinkProvider('apple.com') : handleLinkProvider('apple')}
                        variant="outline" 
                        className={cn("rounded-xl text-[10px] font-black uppercase tracking-widest", providerData.find(p => p.providerId === 'apple.com') ? "border-rose-500/20 text-rose-500 hover:bg-rose-500/10" : "border-white/10 text-white hover:bg-white/10")}
                      >
                        {providerData.find(p => p.providerId === 'apple.com') ? 'Unlink' : 'Link'}
                      </Button>
                    </div>

                    {/* Email/Password */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                           <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-white">Email / Password</h4>
                          <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5 tracking-wider">
                            {providerData.find(p => p.providerId === 'password') ? 'Connected' : 'Not Connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        disabled={true}
                        variant="outline" 
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest border-white/10 text-white/40 bg-transparent opacity-50 cursor-not-allowed"
                      >
                        Primary
                      </Button>
                    </div>

                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleUpdate} 
                    disabled={isUpdating}
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[2rem] font-black uppercase text-lg tracking-widest shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none relative overflow-hidden group"
                  >
                    {/* Button Glare */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    
                    {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Profile Identity"}
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}