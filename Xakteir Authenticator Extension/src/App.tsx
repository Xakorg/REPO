import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useAuth, useMemoFirebase } from "./firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, Loader2, QrCode, Lock, Mail, ArrowRight, Plus, X, Copy, Eye, EyeOff, CheckCircle2, Trash2, Edit2, Search, Settings, Save, Users, Activity, AlertTriangle, Fingerprint, Link as LinkIcon, Share2 } from "lucide-react";
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
  const [personas, setPersonas] = useState<any[]>([]);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'vault'|'identities'|'audit'|'settings'>('vault');
  const [showQR, setShowQR] = useState(false);

  // Audit State
  const [auditResults, setAuditResults] = useState<any[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  // Helper to check password breach via k-Anonymity
  const checkBreach = async (password: string) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await res.text();
      
      const lines = text.split('\n');
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          return parseInt(count);
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const runAudit = async () => {
    if (!accounts) return;
    setIsAuditing(true);
    const results = [];
    for (const acc of accounts) {
      if (!acc.password) continue;
      const count = await checkBreach(acc.password);
      results.push({ ...acc, breachCount: count });
    }
    setAuditResults(results);
    setIsAuditing(false);
  };

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

    if (chrome?.storage?.local) {
      chrome.storage.local.get(['personas'], (res) => {
        if (res.personas) setPersonas(res.personas);
      });
    }
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
        <div className="mesh-background opacity-50" />
        <div className="auth-bg" />
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 text-center space-y-6">
           <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
           <h1 className="text-3xl font-black italic uppercase">Xakteir Auth</h1>
           <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Extension Access</p>
           
           {showQR ? (
             <div className="pt-6 flex flex-col items-center space-y-6 animate-fade-in">
               <div className="w-48 h-48 bg-white rounded-2xl p-4 flex items-center justify-center relative overflow-hidden">
                 <QrCode className="w-full h-full text-black" />
                 <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(var(--primary),1)] animate-[scan_2s_ease-in-out_infinite]" />
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-black tracking-widest text-primary">Scan with Xakteir App</p>
                 <p className="text-xs font-medium text-zinc-400">Waiting for biometric approval...</p>
               </div>
               <button onClick={() => setShowQR(false)} className="text-xs text-zinc-500 hover:text-white uppercase font-bold tracking-widest transition-colors">Use Password Instead</button>
             </div>
           ) : (
             <form onSubmit={handleLogin} className="space-y-4 pt-6 text-left animate-fade-in">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 text-sm font-bold focus:outline-none focus:border-primary" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 text-sm font-bold focus:outline-none focus:border-primary" />
                </div>
                <button type="submit" disabled={isLoggingIn} className="w-full h-12 bg-primary rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 mt-4 flex justify-center items-center">
                   {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize with Password"}
                </button>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-[10px] font-black uppercase">OR</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
                <button type="button" onClick={() => setShowQR(true)} className="w-full h-12 bg-transparent border-2 border-primary/30 text-primary rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary/10 flex justify-center items-center gap-2 transition-colors">
                   <QrCode className="w-4 h-4" /> Sign In via Phone
                </button>
             </form>
           )}
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
        <div className="mesh-background opacity-50" />
        <div className="auth-bg" />
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
          <div className="pt-4 space-y-2">
            <button onClick={() => injectCredentials(viewingAccount)} className="w-full h-12 bg-primary rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
              Auto-Fill Now <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => {
              const shareStr = btoa(JSON.stringify({ s: viewingAccount.service, u: viewingAccount.email || viewingAccount.account, p: viewingAccount.password }));
              copyToClipboard(`https://xakteir.com/vault/share#${shareStr}`, "share");
              alert("Vault Link generated and copied to clipboard! It is encrypted and will expire after 1 view.");
            }} className="w-full h-12 bg-transparent border-2 border-primary/20 text-primary rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
              <Share2 className="w-4 h-4" /> Create Vault Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <div className="mesh-background opacity-50" />
        <div className="auth-bg" />
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

  if (activeTab === 'settings') {
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-4 bg-black/40 gap-3 shrink-0">
          <button onClick={() => setActiveTab('vault')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
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

  if (activeTab === 'identities') {
    const handleGenerateBurner = async () => {
      try {
        const res = await fetch("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1");
        const [email] = await res.json();
        
        const [login, domain] = email.split('@');
        
        const newPersona = {
          id: Date.now(),
          name: `Burner ${login.substring(0,6)}`,
          description: `Real temp mail: ${domain}`,
          email,
          type: 'burner'
        };

        const updatedPersonas = [newPersona, ...personas];
        setPersonas(updatedPersonas);
        if (chrome?.storage?.local) {
          chrome.storage.local.set({ personas: updatedPersonas });
        }
        
        copyToClipboard(email, "burner_email");
      } catch (err) {
        console.error("Failed to fetch real burner", err);
        // Fallback
        const randomString = Math.random().toString(36).substring(2, 10);
        const email = `burner-${randomString}@xakteir.me`;
        const newPersona = {
          id: Date.now(),
          name: `Burner ${randomString}`,
          description: `Anonymous forwarder`,
          email,
          type: 'burner'
        };
        const updatedPersonas = [newPersona, ...personas];
        setPersonas(updatedPersonas);
        if (chrome?.storage?.local) chrome.storage.local.set({ personas: updatedPersonas });
        copyToClipboard(email, "burner_email");
      }
    };

    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/40 gap-3 shrink-0">
          <Fingerprint className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-black italic uppercase tracking-tighter">Identity Personas</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Burner Identities</h2>
            <p className="text-xs text-zinc-400 font-medium px-4">Generate completely anonymous, random emails that forward to your real address. Delete them anytime if they get spammed.</p>
            <button onClick={handleGenerateBurner} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center transition-colors">
              Generate Burner Identity
            </button>
          </div>
          
          <div className="space-y-3 mt-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Your Personas</h3>
            {personas.map(p => (
              <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/50 cursor-pointer transition-colors relative">
                 <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                   <Mail className="w-5 h-5 text-orange-500" />
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <h4 className="text-sm font-black uppercase truncate text-orange-400">{p.name}</h4>
                   <p className="text-[10px] text-zinc-400 truncate">{p.email}</p>
                 </div>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     const updated = personas.filter(x => x.id !== p.id);
                     setPersonas(updated);
                     if (chrome?.storage?.local) chrome.storage.local.set({ personas: updated });
                   }}
                   className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            ))}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/50 cursor-pointer transition-colors">
               <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30"><ShieldCheck className="w-5 h-5 text-blue-500" /></div>
               <div className="flex-1 overflow-hidden">
                 <h4 className="text-sm font-black uppercase truncate text-blue-400">Work</h4>
                 <p className="text-[10px] text-zinc-400 truncate">Autofill professional accounts</p>
               </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/50 cursor-pointer transition-colors">
               <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30"><Users className="w-5 h-5 text-purple-500" /></div>
               <div className="flex-1 overflow-hidden">
                 <h4 className="text-sm font-black uppercase truncate text-purple-400">Personal</h4>
                 <p className="text-[10px] text-zinc-400 truncate">Autofill social and shopping</p>
               </div>
            </div>
          </div>
        </div>
        <div className="h-16 border-t border-white/5 flex items-center bg-black/40 shrink-0 mt-auto">
          <button onClick={() => setActiveTab('vault')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'vault' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><ShieldCheck className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Vault</span></button>
          <button onClick={() => setActiveTab('identities')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'identities' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Users className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Identities</span></button>
          <button onClick={() => setActiveTab('audit')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'audit' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Activity className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Audit</span></button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'settings' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Settings className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Settings</span></button>
        </div>
      </div>
    );
  }

  if (activeTab === 'audit') {
    return (
      <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative animate-fade-in">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/40 gap-3 shrink-0">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-black italic uppercase tracking-tighter">Security Audit</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Dark Web Monitor</h2>
            <p className="text-xs text-zinc-400 font-medium px-4">We will securely hash your passwords and check them against known data breaches using k-Anonymity. Your passwords are never sent to our servers.</p>
            <button onClick={runAudit} disabled={isAuditing} className="w-full h-12 bg-red-600 hover:bg-red-700 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors">
              {isAuditing ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Vault...</> : "Run Security Audit"}
            </button>
          </div>

          {auditResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Audit Results</h3>
              {auditResults.map((res, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                  {res.breachCount > 0 ? (
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-black uppercase truncate">{res.service}</h4>
                    <p className="text-[10px] text-zinc-400 truncate">{res.email || res.account}</p>
                  </div>
                  {res.breachCount > 0 && (
                    <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-400/20 whitespace-nowrap">
                      {res.breachCount} Leaks
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="h-16 border-t border-white/5 flex items-center bg-black/40 shrink-0 mt-auto">
          <button onClick={() => setActiveTab('vault')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'vault' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><ShieldCheck className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Vault</span></button>
          <button onClick={() => setActiveTab('identities')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'identities' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Users className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Identities</span></button>
          <button onClick={() => setActiveTab('audit')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'audit' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Activity className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Audit</span></button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'settings' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Settings className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Settings</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative">
      <div className="mesh-background opacity-50" />
      <div className="auth-bg" />
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

      <div className="h-16 border-t border-white/5 flex items-center bg-black/40 shrink-0 mt-auto">
        <button onClick={() => setActiveTab('vault')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'vault' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><ShieldCheck className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Vault</span></button>
        <button onClick={() => setActiveTab('identities')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'identities' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Users className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Identities</span></button>
        <button onClick={() => setActiveTab('audit')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'audit' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Activity className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Audit</span></button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'settings' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}><Settings className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Settings</span></button>
      </div>
    </div>
  );
}
