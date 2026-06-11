import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useAuth, useMemoFirebase } from "./firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, Loader2, QrCode, Lock, Mail, ArrowRight, Plus, X, Copy, Eye, EyeOff, CheckCircle2, Trash2, Edit2, Search, Settings, Save } from "lucide-react";
import * as OTPAuth from "otpauth";
import './index.css';

const generateTOTP = (secret: string) => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Xakteir', label: 'Auth', algorithm: 'SHA1', digits: 6, period: 30, secret: secret.replace(/\s+/g, '')
    });
    return totp.generate();
    return totp.generate();
  } catch (e) { return "------"; }
};

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { label: "", color: "bg-transparent", w: "w-0" };
  if (pwd.length < 8) return { label: "WEAK", color: "bg-red-500", w: "w-1/3" };
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return { label: "STRONG", color: "bg-emerald-500", w: "w-full" };
  return { label: "GOOD", color: "bg-amber-500", w: "w-2/3" };
};

export default function App() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const [currentDomain, setCurrentDomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [viewingAccount, setViewingAccount] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // New states
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isSettings, setIsSettings] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    service: "", email: "", website: "", password: "", secret: "", backupCodes: "", notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url);
          setCurrentDomain(url.hostname.replace('www.', ''));
        } catch (e) {}
      }
    });
  }, []);

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "auth_accounts"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: accounts, isLoading } = useCollection(accountsQuery);

  useEffect(() => {
    if (accounts && typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ xakteir_accounts: accounts });
    }
  }, [accounts]);

  // Sync pending saves to firestore
  useEffect(() => {
    if (user && firestore && typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(['pending_saves'], async (res) => {
        if (res.pending_saves && res.pending_saves.length > 0) {
          for (const cred of res.pending_saves) {
            try {
              await addDoc(collection(firestore, "users", user.uid, "auth_accounts"), {
                service: cred.service,
                email: cred.email,
                website: cred.website,
                password: cred.password,
                timestamp: serverTimestamp()
              });
            } catch (err) { console.error(err); }
          }
          chrome.storage.local.remove('pending_saves');
        }
      });
    }
  }, [user, firestore]);

  const sortedAccounts = useMemo(() => {
    if (!accounts) return [];
    let list = [...accounts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.service?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.account?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      const aMatch = a.website?.toLowerCase().includes(currentDomain.toLowerCase()) ? 1 : 0;
      const bMatch = b.website?.toLowerCase().includes(currentDomain.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [accounts, currentDomain, searchQuery]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    setIsLoggingIn(true);
    signInWithEmailAndPassword(auth, email, password).finally(() => setIsLoggingIn(false));
  };

  const injectCredentials = (acc: any) => {
    const totp = acc.secret ? generateTOTP(acc.secret) : "";
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "autofill",
          credentials: { email: acc.account || acc.email, password: acc.password, totp }
        });
        window.close(); // Close popup after inject
      }
    });
  };

  if (!user) {
    return (
      <div className="w-[400px] h-[600px] bg-[#05030d] text-white p-8 flex flex-col justify-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 text-center space-y-6">
           <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
           <h1 className="text-3xl font-black italic uppercase">Xakteir Auth</h1>
           <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Extension Access</p>
           
           <form onSubmit={handleLogin} className="space-y-4 pt-6 text-left">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 text-sm font-bold focus:outline-none focus:border-primary" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 text-sm font-bold focus:outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full h-12 bg-primary rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary/90 mt-4 flex justify-center items-center">
                 {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize"}
              </button>
           </form>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2000);
    });
  };

  const handleCreateAccount = async (e: any) => {
    e.preventDefault();
    if (!firestore || !user) return;
    setIsSaving(true);
    try {
      await addDoc(collection(firestore, "users", user.uid, "auth_accounts"), {
        service: createForm.service,
        email: createForm.email,
        website: createForm.website,
        password: createForm.password,
        secret: createForm.secret,
        notes: createForm.notes,
        backupCodes: createForm.backupCodes.split(',').map(c => c.trim()).filter(Boolean),
        timestamp: serverTimestamp()
      });
      setIsCreating(false);
      setCreateForm({ service: "", email: "", website: "", password: "", secret: "", backupCodes: "", notes: "" });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!firestore || !user || !viewingAccount || !window.confirm("Are you sure you want to permanently delete this account?")) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "auth_accounts", viewingAccount.id));
      setViewingAccount(null);
    } catch(err) { console.error(err); }
  };

  const handleSaveEdit = async (e: any) => {
    e.preventDefault();
    if (!firestore || !user || !viewingAccount) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid, "auth_accounts", viewingAccount.id), {
        service: editForm.service,
        email: editForm.email,
        website: editForm.website,
        password: editForm.password,
        secret: editForm.secret,
        notes: editForm.notes,
        backupCodes: typeof editForm.backupCodes === 'string' ? editForm.backupCodes.split(',').map((c:string) => c.trim()).filter(Boolean) : editForm.backupCodes,
      });
      setViewingAccount({ ...viewingAccount, ...editForm, backupCodes: typeof editForm.backupCodes === 'string' ? editForm.backupCodes.split(',').map((c:string) => c.trim()).filter(Boolean) : editForm.backupCodes });
      setIsEditing(false);
    } catch(err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  if (viewingAccount) {
    const totp = viewingAccount.secret ? generateTOTP(viewingAccount.secret) : null;
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-4 bg-black/40 gap-3 shrink-0">
          <button onClick={() => setViewingAccount(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-black italic uppercase tracking-tighter truncate">{viewingAccount.service}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Website</p>
            <p className="text-sm font-bold bg-white/5 p-3 rounded-xl break-all">{viewingAccount.website || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Email / Username</p>
            <div className="relative group">
              <p className="text-sm font-bold bg-white/5 p-3 rounded-xl">{viewingAccount.email || viewingAccount.account}</p>
              <button onClick={() => copyToClipboard(viewingAccount.email || viewingAccount.account, "email")} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors">
                {copiedField === "email" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400 group-hover:text-white" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Password</p>
            <div className="relative group flex gap-2 items-center bg-white/5 p-1 rounded-xl">
              <input type={showPassword ? "text" : "password"} readOnly value={viewingAccount.password || ""} className="bg-transparent border-none focus:outline-none text-sm font-bold flex-1 px-3" />
              <button onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
              </button>
              <button onClick={() => copyToClipboard(viewingAccount.password, "password")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {copiedField === "password" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400 group-hover:text-white" />}
              </button>
            </div>
          </div>
          {totp && (
            <div className="space-y-1">
              <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center justify-between">
                <span>Authenticator Code</span>
                <span className="text-emerald-400 animate-pulse">Live</span>
              </p>
              <div className="relative group">
                <p className="text-3xl font-black tracking-[0.2em] bg-primary/10 text-primary p-4 rounded-xl text-center border border-primary/20">{totp.slice(0,3)} {totp.slice(3)}</p>
                <button onClick={() => copyToClipboard(totp, "totp")} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/20 rounded-lg transition-colors bg-black/40 backdrop-blur">
                  {copiedField === "totp" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
          )}
          {viewingAccount.backupCodes && viewingAccount.backupCodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Backup Codes</p>
              <div className="grid grid-cols-2 gap-2">
                {viewingAccount.backupCodes.map((code: string, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center text-xs font-mono text-zinc-300">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
          {viewingAccount.notes && (
            <div className="space-y-1">
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Secure Notes</p>
              <p className="text-xs text-zinc-300 bg-white/5 p-3 rounded-xl whitespace-pre-wrap">{viewingAccount.notes}</p>
            </div>
          )}
          <div className="pt-4">
            <button onClick={() => injectCredentials(viewingAccount)} className="w-full h-12 bg-primary rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90">
              Auto-Fill Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-4 bg-black/40 gap-3 shrink-0">
          <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-black italic uppercase tracking-tighter truncate">Add Account</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest">Service Name *</label>
              <input required value={createForm.service} onChange={e => setCreateForm({...createForm, service: e.target.value})} placeholder="e.g. Google, Github" className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs font-bold focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest">Email / Username *</label>
              <input required value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} placeholder="user@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs font-bold focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest">Website URL</label>
              <input value={createForm.website} onChange={e => setCreateForm({...createForm, website: e.target.value})} placeholder="e.g. google.com" className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs font-bold focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-primary font-black uppercase tracking-widest">Password</label>
                {getPasswordStrength(createForm.password).label && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${getPasswordStrength(createForm.password).color} text-white`}>{getPasswordStrength(createForm.password).label}</span>}
              </div>
              <div className="relative group">
                <input type={showPassword ? "text" : "password"} value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} placeholder="••••••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs font-bold focus:border-primary focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Eye className="w-4 h-4 text-zinc-500" /></button>
              </div>
              {getPasswordStrength(createForm.password).label && <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden"><div className={`h-full ${getPasswordStrength(createForm.password).color} ${getPasswordStrength(createForm.password).w} transition-all duration-500`} /></div>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest">Authenticator Key (Optional)</label>
              <input value={createForm.secret} onChange={e => setCreateForm({...createForm, secret: e.target.value})} placeholder="Base32 / Base26 Key" className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs font-bold focus:border-primary focus:outline-none uppercase font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest">Backup Codes (Comma separated)</label>
              <input value={createForm.backupCodes} onChange={e => setCreateForm({...createForm, backupCodes: e.target.value})} placeholder="000000, 111111" className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs font-bold focus:border-primary focus:outline-none font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest">Notes (Optional)</label>
              <textarea value={createForm.notes} onChange={e => setCreateForm({...createForm, notes: e.target.value})} placeholder="Extra details..." className="w-full bg-white/5 border border-white/10 rounded-xl h-20 p-4 text-xs font-bold focus:border-primary focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={isSaving} className="w-full h-12 bg-primary rounded-xl font-black uppercase tracking-widest flex items-center justify-center hover:bg-primary/90 mt-6">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save to Vault"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isSettings) {
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-4 bg-black/40 gap-3 shrink-0">
          <button onClick={() => setIsSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-black italic uppercase tracking-tighter truncate">Vault Settings</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-primary mb-2">Auto-Lock Timer</h3>
            <p className="text-[10px] text-zinc-400 font-medium mb-3">Require re-authentication after inactivity.</p>
            <select className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-3 text-xs font-bold focus:border-primary focus:outline-none text-white">
              <option value="5">5 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="never">Never Lock</option>
            </select>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-primary mb-2">Import & Export</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button className="h-10 bg-black border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-colors">Import CSV</button>
              <button className="h-10 bg-black border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-colors text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/20">Export JSON</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSettings) {
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-4 bg-black/40 gap-3 shrink-0">
          <button onClick={() => setIsSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-black italic uppercase tracking-tighter truncate">Vault Settings</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-primary mb-2">Auto-Lock Timer</h3>
            <p className="text-[10px] text-zinc-400 font-medium mb-3">Require re-authentication after inactivity.</p>
            <select className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-3 text-xs font-bold focus:border-primary focus:outline-none text-white">
              <option value="5">5 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="never">Never Lock</option>
            </select>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-primary mb-2">Import & Export</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button className="h-10 bg-black border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-colors">Import CSV</button>
              <button className="h-10 bg-black border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-colors text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/20">Export JSON</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative">
      <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/40 justify-between gap-4">
         <div className="flex items-center">
           <ShieldCheck className="w-6 h-6 text-primary mr-3" />
         </div>
         <div className="flex-1 relative">
           <Search className="w-3 h-3 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
           <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search vault..." className="w-full bg-white/5 border border-white/10 rounded-full h-8 pl-8 pr-3 text-[10px] font-bold focus:outline-none focus:border-primary text-white" />
         </div>
         <div className="flex items-center gap-1">
           <button onClick={() => setIsCreating(true)} className="w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary/40 flex items-center justify-center transition-colors">
             <Plus className="w-4 h-4" />
           </button>
           <button onClick={() => setIsSettings(true)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
             <Settings className="w-4 h-4 text-zinc-300" />
           </button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}
        
        {sortedAccounts.map((acc) => {
          const isMatch = currentDomain && acc.website?.toLowerCase().includes(currentDomain.toLowerCase());
          return (
            <div key={acc.id} onClick={() => setViewingAccount(acc)} className={isMatch ? "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white/5 border-white/5 hover:border-white/20"}>
               {acc.website ? (
                 <img src={"https://www.google.com/s2/favicons?domain=" + acc.website + "&sz=64"} className="w-10 h-10 rounded-full bg-white p-1" />
               ) : (
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5"><QrCode className="w-5 h-5 text-primary" /></div>
               )}
               <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-black uppercase truncate">{acc.service}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{acc.email || acc.account}</p>
               </div>
               {isMatch && <span className="text-[8px] bg-primary text-white px-2 py-1 rounded-full font-black uppercase shrink-0">Current Site</span>}
               <ArrowRight className="w-4 h-4 text-white/20 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          )
        })}
      </div>
    </div>
  );
}
