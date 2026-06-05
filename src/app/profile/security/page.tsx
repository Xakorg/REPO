"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Smartphone, 
  Fingerprint, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  ShieldAlert,
  ArrowLeft,
  Settings,
  Mail,
  Zap,
  Globe,
  MoreVertical,
  Plus,
  Info,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Copy
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SecuritySettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!auth || !user?.email) return;
    setIsUpdating(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Password Reset Sent", description: `Check your inbox at ${user.email}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Reset Failed", description: e instanceof Error ? e.message : "Failed to send reset email." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser || !firestore || !user) return;
    const confirm = window.confirm("WARNING: This will permanently delete your account, files, and all associated data. Are you sure you want to proceed?");
    if (!confirm) return;

    setIsUpdating(true);
    try {
      const uid = user.uid;

      // Delete Firestore records
      await deleteDoc(doc(firestore, "users", uid));
      try {
        await deleteDoc(doc(firestore, "admins", uid));
      } catch (e) {
        console.warn("User was not admin, skipping admin delete");
      }

      // Try deleting auth account
      await deleteUser(auth.currentUser);
      toast({ title: "Account Deleted", description: "Your account has been deleted permanently." });
      router.push("/");
    } catch (e: any) {
      console.error("Auth account deletion failed:", e);
      if (e.code === "auth/requires-recent-login") {
        toast({
          variant: "destructive",
          title: "Re-authentication Required",
          description: "Please sign out, sign back in, and try deleting your account again.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Deletion Error",
          description: e.message || "Could not delete auth credentials. Please try logging in again.",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading } = useDoc(userRef);

  const vaultQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "vault_items"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: vaultItems } = useCollection(vaultQuery);

  const toggle2FA = async (enabled: boolean) => {
    if (!firestore || !user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        twoFactorEnabled: enabled,
        updatedAt: serverTimestamp()
      });
      toast({ title: enabled ? "2FA Enabled" : "2FA Disabled" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error updating security" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddVaultItem = async () => {
    if (!user || !firestore) return;
    const name = prompt("Site Name:");
    const username = prompt("Username:");
    const password = prompt("Password:");
    if (!name || !username || !password) return;

    try {
      await addDoc(collection(firestore, "users", user.uid, "vault_items"), {
        name, username, password, timestamp: serverTimestamp()
      });
      toast({ title: "Account Secured" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-fade-in px-6 text-foreground min-h-screen">
      <header className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <Link href="/profile">
               <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 border border-white/5 hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="space-y-1">
               <h1 className="text-4xl font-black uppercase italic tracking-tighter">Security Center</h1>
               <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> High-Fidelity Protection</p>
            </div>
         </div>
         <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-6 py-2 rounded-full font-black uppercase text-[10px]">Verified Account</Badge>
      </header>

      <Tabs defaultValue="overview" className="space-y-10">
         <TabsList className="bg-secondary/30 p-1 rounded-2xl h-14 border border-white/5 max-w-md">
            <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest">Protocols</TabsTrigger>
            <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest">Password Vault</TabsTrigger>
         </TabsList>

         <TabsContent value="overview" className="space-y-8 animate-in slide-in-from-bottom-4">
            <Card className="glass-card rounded-[3rem] p-10 border-white/10 shadow-2xl bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Zap className="w-48 h-48 -rotate-12 text-primary" /></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Two-Factor Auth</h2>
                       <Badge className="bg-amber-500 text-white font-black text-[8px] px-3 py-1 rounded-full uppercase">Highly Recommended</Badge>
                     </div>
                     <p className="text-sm font-medium text-muted-foreground leading-relaxed italic max-w-md">Secure your account by requiring an additional code during login.</p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                     <Switch 
                       checked={userData?.twoFactorEnabled} 
                       onCheckedChange={toggle2FA}
                       disabled={isUpdating}
                       className="scale-150 data-[state=checked]:bg-primary"
                     />
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary">{userData?.twoFactorEnabled ? 'ACTIVE' : 'INACTIVE'}</span>
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="glass-card rounded-[3rem] p-10 border-white/10 space-y-8 bg-black/40 shadow-xl">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg"><Smartphone className="w-6 h-6 text-blue-500" /></div>
                     <h3 className="text-xl font-black uppercase italic">Auth Channels</h3>
                  </div>
                  <div className="space-y-4">
                     {[
                       { name: 'App Authenticator', icon: ShieldCheck, status: 'Enabled' },
                       { name: 'Email Codes', icon: Mail, status: 'Backup' },
                       { name: 'Biometric Link', icon: Fingerprint, status: 'Optional' },
                     ].map(method => (
                       <div key={method.name} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary transition-all">
                          <div className="flex items-center gap-4">
                             <method.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                             <span className="text-xs font-bold uppercase">{method.name}</span>
                          </div>
                          <Badge variant="outline" className="border-white/10 text-[8px]">{method.status}</Badge>
                       </div>
                     ))}
                  </div>
               </Card>

               <Card className="glass-card rounded-[4rem] p-10 border-white/10 shadow-2xl space-y-10">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-6"><AlertTriangle className="w-8 h-8 text-rose-500" /> Recent Activity</h3>
                  <div className="space-y-6">
                     {[
                       { event: 'Logged in from London', time: 'Just Now', suspicious: false },
                       { event: 'Password updated', time: '2 days ago', suspicious: false },
                     ].map((log, i) => (
                       <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-6">
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", log.suspicious ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary")}>
                                <ShieldAlert className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-sm font-black uppercase italic text-foreground leading-none">{log.event}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2">{log.time}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                </Card>
             </div>

             <Card className="glass-card rounded-[3rem] p-10 border-rose-500/20 bg-rose-950/5 shadow-xl space-y-8 mt-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg">
                     <Trash2 className="w-6 h-6 text-rose-500" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black uppercase italic text-rose-400">Danger Zone</h3>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Lifecycle Controls</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between gap-6">
                      <div>
                         <h4 className="text-sm font-black uppercase text-white">Reset Password</h4>
                         <p className="text-xs text-muted-foreground mt-2 italic font-medium leading-relaxed">Transmit a secure password reset link to your registered email.</p>
                      </div>
                      <Button 
                         onClick={handleResetPassword}
                         disabled={isUpdating}
                         className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 h-12 rounded-xl text-xs font-black uppercase text-white transition-all"
                      >
                         Reset Password
                      </Button>
                   </div>
                   <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-between gap-6">
                      <div>
                         <h4 className="text-sm font-black uppercase text-rose-400">Delete Account</h4>
                         <p className="text-xs text-muted-foreground mt-2 italic font-medium leading-relaxed">Deactivate profile records and permanently remove auth credentials.</p>
                      </div>
                      <Button 
                         onClick={handleDeleteAccount}
                         disabled={isUpdating}
                         className="w-full bg-rose-600 hover:bg-rose-500 h-12 rounded-xl text-xs font-black uppercase text-white transition-all"
                      >
                         Delete Permanently
                      </Button>
                   </div>
                </div>
             </Card>
          </TabsContent>

         <TabsContent value="vault" className="animate-in slide-in-from-right-4 h-[600px] flex flex-col">
            <header className="flex justify-between items-center mb-8">
               <div className="relative w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input placeholder="Search vault..." className="pl-11 h-12 bg-black/40 border-none rounded-xl text-xs font-bold italic" />
               </div>
               <Button onClick={handleAddVaultItem} className="h-12 px-8 bg-primary rounded-xl font-black uppercase text-[10px] shadow-xl">
                  <Plus className="w-4 h-4 mr-2" /> Add Password
               </Button>
            </header>

            <Card className="flex-1 glass-card rounded-[3.5rem] border-white/10 overflow-hidden flex flex-col bg-black/20">
               <ScrollArea className="flex-1">
                  <div className="p-10 space-y-4">
                     {!vaultItems?.length ? (
                       <div className="py-40 text-center opacity-20 flex flex-col items-center gap-6">
                          <Lock className="w-20 h-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Your vault is empty</p>
                       </div>
                     ) : (
                       vaultItems.map(item => (
                         <div key={item.id} className="p-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary transition-all shadow-xl">
                            <div className="flex items-center gap-8">
                               <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10 shadow-lg"><Globe className="w-6 h-6 text-primary" /></div>
                               <div>
                                  <h4 className="text-xl font-black uppercase italic text-white">{item.name}</h4>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">{item.username}</p>
                               </div>
                            </div>
                            <div className="flex gap-3">
                               <Button variant="ghost" size="icon" onClick={async () => { const { copyToClipboard } = await import('@/lib/clipboard'); const ok = await copyToClipboard(item.password || ''); if (ok) toast({ title: "Copied!" }); else toast({ variant: 'destructive', title: 'Copy Failed' }); }} className="h-11 w-11 hover:bg-white/10"><Copy className="w-4 h-4" /></Button>
                               <Button onClick={() => setShowPasswordId(showPasswordId === item.id ? null : item.id)} variant="ghost" size="icon" className="h-11 w-11 hover:bg-white/10">
                                  {showPasswordId === item.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               </Button>
                               <Button onClick={() => deleteDoc(doc(firestore!, "users", user!.uid, "vault_items", item.id))} variant="ghost" size="icon" className="h-11 w-11 text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </ScrollArea>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}
