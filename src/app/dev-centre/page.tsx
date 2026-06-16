"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { 
  Copy, ShieldCheck, Key, Code2, CheckCircle2, Cloud, Database, 
  Users, Mail, Globe, Settings, Activity, AlertTriangle, Plus, 
  Trash2, RefreshCw, Terminal, LayoutGrid, HelpCircle, User, 
  Layers, PlusCircle, UserCheck, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function DevCentrePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  
  // Custom accounts switching state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  // Dev Account creation & document loading
  const devAccountRef = firestore && user ? doc(firestore, "dev_accounts", user.uid) : null;
  const { data: devAccount, isDocLoading } = useDoc(devAccountRef);

  // App Integration states (retaining existing functionality)
  const [appName, setAppName] = useState("");
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [oauthName, setOauthName] = useState("");
  const [oauthRedirect, setOauthRedirect] = useState("");
  const [oauthCreds, setOauthCreds] = useState<{clientId: string, clientSecret: string} | null>(null);

  // Teams & Custom Email states
  const [teamName, setTeamName] = useState("");
  const [teamMemberEmail, setTeamMemberEmail] = useState("");
  const [customDomainName, setCustomDomainName] = useState("");
  const [customEmailName, setCustomEmailName] = useState("");
  const [customEmailRouting, setCustomEmailRouting] = useState("");

  // Simulated deployment states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployments, setDeployments] = useState([
    { id: "dep_1", name: "Production Web App", env: "production", status: "Running", url: "my-app.xakteir.cloud" }
  ]);

  useEffect(() => {
    const updateAccounts = () => {
      const accs = localStorage.getItem("xakteir_accounts");
      const activeId = localStorage.getItem("xakteir_active_account_id");
      if (accs) setAccounts(JSON.parse(accs));
      if (activeId) setActiveAccountId(activeId);
    };
    updateAccounts();
    window.addEventListener("xakteir-accounts-changed", updateAccounts);
    return () => window.removeEventListener("xakteir-accounts-changed", updateAccounts);
  }, []);

  const handleSwitchAccount = (uid: string) => {
    localStorage.setItem("xakteir_active_account_id", uid);
    window.dispatchEvent(new Event("xakteir-accounts-changed"));
    toast({ title: "Account Switched", description: "Active developer profile changed." });
  };

  const handleCreateDevAccount = async () => {
    if (!firestore || !user) return;
    try {
      await setDoc(doc(firestore, "dev_accounts", user.uid), {
        tier: "Standard Developer",
        joinedAt: new Date().toISOString(),
        customEmails: [
          { id: "email_1", domain: "xakteir.com", email: `${user.displayName?.toLowerCase().replace(/\s+/g, '') || 'dev'}@xakteir.com`, verified: true, routes: "Inbox" }
        ],
        teams: [
          { id: "team_1", name: "Personal Workgroup", role: "Owner", members: 1 }
        ]
      });
      toast({ title: "Welcome to Developer Centre!", description: "Your developer profile has been activated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: e.message });
    }
  };

  const handleCreateTeam = async () => {
    if (!firestore || !user || !teamName.trim() || !devAccountRef) return;
    try {
      const newTeam = {
        id: "team_" + Math.random().toString(36).substring(2, 7),
        name: teamName,
        role: "Owner",
        members: 1
      };
      await updateDoc(devAccountRef, {
        teams: arrayUnion(newTeam)
      });
      setTeamName("");
      toast({ title: "Team Created", description: `Team "${newTeam.name}" is now active.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleInviteMember = async () => {
    if (!teamMemberEmail.trim()) return;
    toast({ title: "Invitation Sent", description: `Invited ${teamMemberEmail} to your dev team.` });
    setTeamMemberEmail("");
  };

  const handleAddCustomEmail = async () => {
    if (!firestore || !user || !customDomainName.trim() || !customEmailName.trim() || !devAccountRef) return;
    try {
      const newEmail = {
        id: "email_" + Math.random().toString(36).substring(2, 7),
        domain: customDomainName,
        email: `${customEmailName}@${customDomainName}`,
        verified: true,
        routes: customEmailRouting || "Main Inbox"
      };
      await updateDoc(devAccountRef, {
        customEmails: arrayUnion(newEmail)
      });
      setCustomDomainName("");
      setCustomEmailName("");
      setCustomEmailRouting("");
      toast({ title: "Domain Bound Successfully", description: `Routed email ${newEmail.email} to ${newEmail.routes}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleSimulateDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setDeployments(prev => [
        ...prev,
        {
          id: "dep_" + Math.random().toString(36).substring(2, 7),
          name: "Staging API Gateway",
          env: "staging",
          status: "Running",
          url: "staging-gateway.xakteir.cloud"
        }
      ]);
      setIsDeploying(false);
      toast({ title: "Deployment Successful", description: "Your new API microservice is live on Xakteir Edge." });
    }, 3000);
  };

  const generateApiKey = async () => {
    if (!user || !firestore || !appName || !domain) return;
    const newKey = "xak_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      await setDoc(doc(firestore, "dev_apps", newKey), {
        owner: user.uid,
        appName,
        domain,
        createdAt: new Date().toISOString()
      });
      setApiKey(newKey);
      toast({ title: "API Key Generated!", description: "Your XakCaptcha API key is ready." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const createOAuthApp = async () => {
    if (!user || !firestore || !oauthName || !oauthRedirect) return;
    const clientId = "xak_id_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const clientSecret = "xak_sec_" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      await setDoc(doc(firestore, "oauth_apps", clientId), {
        owner: user.uid,
        name: oauthName,
        redirectUri: oauthRedirect,
        clientSecret: clientSecret,
        createdAt: new Date().toISOString()
      });
      setOauthCreds({ clientId, clientSecret });
      toast({ title: "OAuth App Created!", description: "Your Client ID and Secret are ready." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070710] flex items-center justify-center text-white p-6">
        <Card className="max-w-md w-full p-8 bg-zinc-950/60 border-2 border-white/10 rounded-[2.5rem] text-center space-y-6">
          <Code2 className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Sign In Required</h1>
          <p className="text-sm text-zinc-400">Please sign in to access the Xakteir Developer Center and resources.</p>
        </Card>
      </div>
    );
  }

  // Render "No Developer Profile" Screen
  if (!devAccount) {
    return (
      <div className="min-h-screen bg-[#070710] text-white pt-28 px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">Profile Status Check</h1>
                <p className="text-sm text-zinc-400 font-medium">Developer console access dashboard.</p>
              </div>
            </div>
            {/* Account Switcher */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 font-bold uppercase">Active:</span>
              <select 
                value={activeAccountId || ""} 
                onChange={(e) => handleSwitchAccount(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.uid} value={acc.uid}>{acc.displayName} ({acc.email})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Promotion Card */}
          <Card className="p-10 bg-zinc-950/40 border-4 border-rose-500/15 rounded-[3rem] relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Code2 className="w-96 h-96 text-white" />
            </div>
            
            <div className="relative z-10 space-y-8 max-w-2xl">
              <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-400 font-black uppercase tracking-widest px-4 py-1">
                Access Blocked
              </Badge>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">
                Your account doesn't have a dev account
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed font-medium">
                To start building plugins, integrating Captcha checks, managing custom email domains, and deploying secure microservices, you must promote your active profile to a Developer Account.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={handleCreateDevAccount} 
                  className="h-16 px-10 bg-primary hover:bg-primary/95 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20"
                >
                  Create Developer Account
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline" 
                  className="h-16 px-10 border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/5"
                >
                  Go back home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Render Azure-style Developer Portal
  return (
    <div className="min-h-screen bg-[#070710] text-zinc-100 flex flex-col md:flex-row pt-20">
      
      {/* Sidebar Navigation (Azure Services Panel) */}
      <div className="w-full md:w-72 bg-[#090912]/80 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Xakteir Azure</span>
          </div>
          <Badge className="bg-sky-400/10 border-sky-400/20 text-sky-400 text-[9px] font-black uppercase">DEV</Badge>
        </div>
        
        {/* Active Account Switcher in Sidebar */}
        <div className="p-4 bg-black/40 border-b border-white/5 flex flex-col gap-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Profile</label>
          <select 
            value={activeAccountId || ""} 
            onChange={(e) => handleSwitchAccount(e.target.value)}
            className="w-full bg-zinc-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
          >
            {accounts.map(acc => (
              <option key={acc.uid} value={acc.uid}>{acc.displayName}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("overview")} 
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left", activeTab === "overview" ? "bg-white/5 text-primary" : "text-zinc-400 hover:bg-white/5")}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("emails")} 
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left", activeTab === "emails" ? "bg-white/5 text-primary" : "text-zinc-400 hover:bg-white/5")}
          >
            <Mail className="w-4 h-4 shrink-0" />
            Custom Emails
          </button>
          <button 
            onClick={() => setActiveTab("teams")} 
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left", activeTab === "teams" ? "bg-white/5 text-primary" : "text-zinc-400 hover:bg-white/5")}
          >
            <Users className="w-4 h-4 shrink-0" />
            Teams & IAM
          </button>
          <button 
            onClick={() => setActiveTab("integrations")} 
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left", activeTab === "integrations" ? "bg-white/5 text-primary" : "text-zinc-400 hover:bg-white/5")}
          >
            <Key className="w-4 h-4 shrink-0" />
            App Credentials
          </button>
          <button 
            onClick={() => setActiveTab("monitoring")} 
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left", activeTab === "monitoring" ? "bg-white/5 text-primary" : "text-zinc-400 hover:bg-white/5")}
          >
            <Activity className="w-4 h-4 shrink-0" />
            Cloud Monitoring
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-10 animate-in fade-in duration-500">
        
        {/* Azure Blade Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            {activeTab === "overview" && <LayoutGrid className="w-5 h-5 text-primary" />}
            {activeTab === "emails" && <Mail className="w-5 h-5 text-primary" />}
            {activeTab === "teams" && <Users className="w-5 h-5 text-primary" />}
            {activeTab === "integrations" && <Key className="w-5 h-5 text-primary" />}
            {activeTab === "monitoring" && <Activity className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Developer Resource</span>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              {activeTab === "overview" && "Welcome to Dev Centre"}
              {activeTab === "emails" && "Custom Email Routing"}
              {activeTab === "teams" && "Teams & Collaborators"}
              {activeTab === "integrations" && "Application Integrations"}
              {activeTab === "monitoring" && "Cloud Monitoring & VMs"}
            </h1>
          </div>
        </div>

        {/* 1. OVERVIEW BLADE */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="p-8 bg-zinc-950/40 border-2 border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Welcome, {user.displayName || "Developer"}!</h3>
                <p className="text-sm text-zinc-400">All services are operating normally. Your account is on the Developer Tier.</p>
              </div>
              <Button onClick={() => toast({ title: "Quickstart Guide", description: "Loading SDK guides..." })} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider h-11 px-6">
                Developer SDK
              </Button>
            </div>

            {/* Micro Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Active VMs</p>
                <p className="text-3xl font-black text-sky-400">02</p>
              </Card>
              <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Custom Domains</p>
                <p className="text-3xl font-black text-emerald-400">{devAccount.customEmails?.length || 0}</p>
              </Card>
              <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Dev Teams</p>
                <p className="text-3xl font-black text-indigo-400">{devAccount.teams?.length || 0}</p>
              </Card>
              <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Monthly Cost</p>
                <p className="text-3xl font-black text-purple-400">$0.00 <span className="text-xs text-zinc-500 font-bold">Free</span></p>
              </Card>
            </div>

            {/* Azure Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Quick Deployment</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Launch a simulated container or microservice in the cloud. Instantly spin up servers for your app backends.</p>
                <Button onClick={handleSimulateDeploy} disabled={isDeploying} className="bg-sky-500 hover:bg-sky-600 text-black text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-lg">
                  {isDeploying ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Deploy Microservice
                </Button>
              </Card>
              
              <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Ecosystem API</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Setup client IDs and secrets to use the unified Xakteir Sign-In SSO within your web applications.</p>
                <Button onClick={() => setActiveTab("integrations")} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-lg">
                  Setup Credentials
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* 2. CUSTOM EMAILS BLADE */}
        {activeTab === "emails" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Custom Email Address Routing Support</h3>
              <p className="text-xs text-zinc-400 font-medium font-medium">Map custom enterprise domains directly to your Xakteir Mail inbox. Add domain routing records automatically.</p>
            </div>

            {/* Binding Form */}
            <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary italic">Bind New Custom Mailbox Domain</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Custom Domain</label>
                  <Input value={customDomainName} onChange={(e) => setCustomDomainName(e.target.value)} placeholder="mybusiness.com" className="bg-black/60 border-white/10 h-11 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Custom Email Prefix</label>
                  <Input value={customEmailName} onChange={(e) => setCustomEmailName(e.target.value)} placeholder="support" className="bg-black/60 border-white/10 h-11 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Routing Destination</label>
                  <Input value={customEmailRouting} onChange={(e) => setCustomEmailRouting(e.target.value)} placeholder="Xakteir Inbox" className="bg-black/60 border-white/10 h-11 text-xs text-white" />
                </div>
              </div>
              <Button onClick={handleAddCustomEmail} disabled={!customDomainName || !customEmailName} className="bg-primary hover:bg-primary/95 text-black text-xs font-black uppercase tracking-widest h-12 px-8 rounded-xl mt-4">
                Add Custom Address & Domain
              </Button>
            </Card>

            {/* Email List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Active Routing Mappings</h4>
              {devAccount.customEmails?.map((item: any) => (
                <div key={item.id} className="p-4 bg-zinc-950/20 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.email}</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Routes to: {item.routes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 uppercase text-[9px] font-black">Active & Verified</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TEAMS BLADE */}
        {activeTab === "teams" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Teams & Access Roles</h3>
              <p className="text-xs text-zinc-400 font-medium">Create collaborative developer workspaces, delegate admin controls, and add resource groups.</p>
            </div>

            {/* Team Creator */}
            <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary italic">Create Collaborative Dev Team</h4>
              <div className="flex gap-4">
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Frontend Engineers" className="bg-black/60 border-white/10 h-12 text-xs flex-1 text-white" />
                <Button onClick={handleCreateTeam} disabled={!teamName.trim()} className="bg-primary hover:bg-primary/95 text-black text-xs font-black uppercase tracking-widest h-12 px-8 rounded-xl shrink-0">
                  Create Team
                </Button>
              </div>
            </Card>

            {/* Active Teams */}
            <div className="grid md:grid-cols-2 gap-6">
              {devAccount.teams?.map((team: any) => (
                <Card key={team.id} className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-white">{team.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-black uppercase">Role: {team.role}</p>
                    </div>
                    <Badge className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-black uppercase text-[9px]">{team.members} Member(s)</Badge>
                  </div>
                  
                  <div className="h-0.5 bg-white/5 my-4" />
                  
                  {/* Invite Member */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Invite Developer</label>
                    <div className="flex gap-2">
                      <Input value={teamMemberEmail} onChange={(e) => setTeamMemberEmail(e.target.value)} placeholder="dev@xakteir.com" className="bg-black/40 border-white/10 h-10 text-xs text-white" />
                      <Button onClick={handleInviteMember} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider h-10 px-4 rounded-lg">Invite</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. APP CREDENTIALS BLADE (Captcha & OAuth apps) */}
        {activeTab === "integrations" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* XakCaptcha Section */}
              <div className="glass-card rounded-[2rem] p-8 border-4 border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="w-32 h-32 text-emerald-400" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Anti-Bot Service
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">XakCaptcha</h2>
                    <p className="text-xs text-zinc-400 font-medium">Protect your websites from bots using Xakteir's advanced behavioral analysis.</p>
                  </div>

                  {!apiKey ? (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">App Name</label>
                        <Input 
                          value={appName} 
                          onChange={(e) => setAppName(e.target.value)} 
                          placeholder="My Awesome App" 
                          className="h-14 rounded-2xl bg-black/40 border-white/10 text-white text-xs" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Allowed Domain</label>
                        <Input 
                          value={domain} 
                          onChange={(e) => setDomain(e.target.value)} 
                          placeholder="example.com" 
                          className="h-14 rounded-2xl bg-black/40 border-white/10 text-white text-xs" 
                        />
                      </div>
                      <Button onClick={generateApiKey} disabled={!appName || !domain} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black uppercase tracking-widest text-xs text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        Generate API Key <Key className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="p-4 bg-black/40 rounded-2xl border-2 border-white/10">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Your API Key</label>
                        <div className="flex gap-2">
                          <Input readOnly value={apiKey} className="font-mono text-emerald-400 bg-black/60 border-white/5 text-xs" />
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey)} className="shrink-0 bg-white/5 border-white/10">
                            <Copy className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-black/40 rounded-2xl border-2 border-white/10">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Embed Code</label>
                        <div className="relative">
                          <pre className="text-xs font-mono text-zinc-300 bg-black/60 p-4 rounded-xl overflow-x-auto border-2 border-white/5">
                            {`<script src="https://xakteir.com/api/xakcaptcha.js"></script>\n<div class="xak-captcha" data-sitekey="${apiKey}"></div>`}
                          </pre>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`<script src="https://xakteir.com/api/xakcaptcha.js"></script>\n<div class="xak-captcha" data-sitekey="${apiKey}"></div>`)} className="absolute top-2 right-2 hover:bg-white/10">
                            <Copy className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OAuth Provider Section */}
              <div className="glass-card rounded-[2rem] p-8 border-4 border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Key className="w-32 h-32 text-indigo-400" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-full text-indigo-400 text-xs font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Identity Provider
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Login with Xakteir</h2>
                    <p className="text-xs text-zinc-400 font-medium">Let users securely sign into your application using their Xakteir profile.</p>
                  </div>
                  
                  {!oauthCreds ? (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">App Name</label>
                        <Input 
                          value={oauthName} 
                          onChange={(e) => setOauthName(e.target.value)} 
                          placeholder="My Web App" 
                          className="h-14 rounded-2xl bg-black/40 border-white/10 text-white text-xs" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Redirect URI</label>
                        <Input 
                          value={oauthRedirect} 
                          onChange={(e) => setOauthRedirect(e.target.value)} 
                          placeholder="https://example.com/api/auth/callback" 
                          className="h-14 rounded-2xl bg-black/40 border-white/10 text-white text-xs" 
                        />
                      </div>
                      <Button onClick={createOAuthApp} disabled={!oauthName || !oauthRedirect} className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                         Create OAuth App <Key className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="p-4 bg-black/40 rounded-2xl border-2 border-white/10 space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Client ID</label>
                          <div className="flex gap-2">
                            <Input readOnly value={oauthCreds.clientId} className="font-mono text-indigo-400 bg-black/60 border-white/5 text-xs" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(oauthCreds.clientId)} className="shrink-0 bg-white/5 border-white/10">
                              <Copy className="w-4 h-4 text-white" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Client Secret <span className="text-red-400">(Secret!)</span></label>
                          <div className="flex gap-2">
                            <Input readOnly type="password" value={oauthCreds.clientSecret} className="font-mono text-indigo-400 bg-black/60 border-white/5 text-xs" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(oauthCreds.clientSecret)} className="shrink-0 bg-white/5 border-white/10">
                              <Copy className="w-4 h-4 text-white" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. CLOUD MONITORING BLADE */}
        {activeTab === "monitoring" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Xakteir VM Container Services</h3>
              <p className="text-xs text-zinc-400 font-medium">Virtual machine deployment monitors, memory consumption, API traffic logs, and edge routing metrics.</p>
            </div>

            {/* Virtual Servers List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Virtual Machine Instances</h4>
                <Button onClick={handleSimulateDeploy} disabled={isDeploying} className="h-10 px-4 bg-sky-500 hover:bg-sky-600 text-black text-xs font-black uppercase rounded-lg">
                  {isDeploying ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} New VM
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {deployments.map((dep) => (
                  <Card key={dep.id} className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Cloud className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-white text-base">{dep.name}</h5>
                          <span className="text-[10px] text-zinc-500 font-mono">{dep.url}</span>
                        </div>
                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 uppercase text-[9px] font-black">{dep.status}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3 mt-3">
                        <div>
                          <p className="text-[9px] text-zinc-500 font-black uppercase">Environment</p>
                          <p className="text-zinc-200 capitalize font-bold">{dep.env}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 font-black uppercase">Edge CPU</p>
                          <p className="text-zinc-200 font-bold">4.2%</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Logs Terminal */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Container Terminal Console Logs</h4>
              <div className="bg-black border border-white/10 rounded-2xl p-6 font-mono text-xs text-sky-400 space-y-1.5 shadow-inner">
                <p className="text-zinc-500">[2026-06-16 16:15:02] INITIALIZING EDGE VIRTUAL NETWORK ROUTER...</p>
                <p className="text-zinc-500">[2026-06-16 16:15:04] SUCCESS: BOUND PORT 443 ON SUBNET 10.0.1.2</p>
                <p className="text-emerald-400">[2026-06-16 16:15:05] SYSTEM ONLINE: Edge worker is listening for requests.</p>
                <p className="text-primary">[2026-06-16 16:15:09] API GATEWAY: Routed inbound request "/api/auth" successfully (200 OK)</p>
                <p className="text-zinc-500">[2026-06-16 16:15:15] MONITOR: CPU Load Average: 0.12, Mem Usage: 184MB</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
