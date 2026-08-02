"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, orderBy, limit, addDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { codeArchitect } from "@/ai/flows/code-architect-flow";

export type EditorTheme = 'dracula' | 'cyberpunk' | 'vscode' | 'monokai' | 'nord' | 'github-light';

export interface Commit {
  id: string;
  message: string;
  createdAt: any;
  author: string;
  files: Record<string, string>;
  hash: string;
}

export interface ConsoleLog {
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: string;
}

interface XakCodeContextProps {
  user: any;
  firestore: any;
  projects: any[] | null | undefined;
  isLoadingProjects: boolean;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  activeProject: any;
  projectFiles: Record<string, string>;
  activeFile: string;
  setActiveFile: (fileName: string) => void;
  codeText: string;
  setCodeText: (code: string) => void;
  openTabs: string[];
  openTab: (fileName: string) => void;
  closeTab: (fileName: string) => void;
  closeOtherTabs: (fileName: string) => void;
  closeAllTabs: () => void;
  handleFileChange: (newCode: string) => void;
  handleCreateFile: (fileName: string) => Promise<boolean>;
  handleDeleteFile: (fileName: string) => Promise<void>;
  handleRenameFile: (oldName: string, newName: string) => Promise<boolean>;
  handleDuplicateFile: (fileName: string) => Promise<void>;
  handleCreateProject: (name: string) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
  
  // Editor Settings
  theme: EditorTheme;
  setTheme: (theme: EditorTheme) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  wordWrap: boolean;
  setWordWrap: (wrap: boolean) => void;
  tabSize: number;
  setTabSize: (size: number) => void;
  autoSaveInterval: number; // in seconds
  setAutoSaveInterval: (interval: number) => void;

  // Compilation & Sandbox
  isCompiling: boolean;
  setIsCompiling: (val: boolean) => void;
  compileDuration: number;
  setCompileDuration: (val: number) => void;
  autoReloadPreview: boolean;
  setAutoReloadPreview: (val: boolean) => void;
  previewUrl: string;
  setPreviewUrl: (url: string) => void;
  customCss: string;
  setCustomCss: (css: string) => void;
  cdnDependencies: string[];
  toggleCdnDependency: (cdn: string) => void;

  // Console Logs
  logs: ConsoleLog[];
  addLog: (log: ConsoleLog) => void;
  clearLogs: () => void;

  // Real Commits
  commits: Commit[];
  isCommitting: boolean;
  handleCreateCommit: (message: string) => Promise<boolean>;
  handleCheckoutCommit: (commit: Commit) => Promise<void>;
  
  // Pomodoro
  pomodoroTime: number;
  pomodoroActive: boolean;
  pomodoroSession: 'work' | 'break';
  setPomodoroActive: (active: boolean) => void;
  resetPomodoro: () => void;
  setPomodoroSession: (session: 'work' | 'break') => void;
  setPomodoroTime: (time: number) => void;

  // Ambient Sounds
  ambientVolumes: Record<string, number>;
  setAmbientVolume: (sound: string, volume: number) => void;

  // Multiplayer Simulation
  multiplayerActive: boolean;
  setMultiplayerActive: (val: boolean) => void;
  multiplayerLogs: string[];
  
  // DNS / Custom Domain
  liveNameservers: string[];
  checkingNS: boolean;
  checkNameservers: () => Promise<void>;
  customDomain: string;
  setCustomDomain: (domain: string) => void;
  handleAddDomain: () => Promise<void>;
  handleRemoveDomain: (domain: string) => Promise<void>;
  verifyDNS: () => Promise<void>;
  isVerifyingDNS: boolean;
  handleAddDnsRecord: (type: 'A' | 'CNAME' | 'TXT' | 'MX', name: string, value: string, ttl: number) => Promise<void>;
  handleDeleteDnsRecord: (recordId: string) => Promise<void>;
  
  // Publish
  isDeploying: boolean;
  handleDeploy: () => Promise<void>;

  // AI Assistant
  isGenerating: boolean;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  aiExplanation: string;
  setAiExplanation: (val: string) => void;
  aiPromptHistory: string[];
  addAiPromptHistory: (val: string) => void;
  handleGenerateCode: (prompt: string, overrideCode?: string) => Promise<void>;
}

const XakCodeContext = createContext<XakCodeContextProps | undefined>(undefined);

export const XakCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string>("App.jsx");
  const [codeText, setCodeText] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<string[]>(["App.jsx"]);

  // Editor Settings
  const [theme, setTheme] = useState<EditorTheme>("dracula");
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<string>("JetBrains Mono");
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [tabSize, setTabSize] = useState<number>(2);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(10);

  // Compilation & Sandbox
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileDuration, setCompileDuration] = useState(42);
  const [autoReloadPreview, setAutoReloadPreview] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("/");
  const [customCss, setCustomCss] = useState("");
  const [cdnDependencies, setCdnDependencies] = useState<string[]>(["tailwind"]);

  // Console Logs
  const [logs, setLogs] = useState<ConsoleLog[]>([
    { type: 'info', text: "Diagnostic console initialized...", timestamp: new Date().toLocaleTimeString() },
    { type: 'info', text: "Hot module reloading active", timestamp: new Date().toLocaleTimeString() }
  ]);

  // Real Commits
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);

  // Pomodoro
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSession, setPomodoroSession] = useState<'work' | 'break'>('work');

  // Ambient Sounds
  const [ambientVolumes, setAmbientVolumes] = useState<Record<string, number>>({
    lofi: 0,
    rain: 0,
    cafe: 0,
    keyboard: 0
  });

  // Multiplayer Simulation
  const [multiplayerActive, setMultiplayerActive] = useState(false);
  const [multiplayerLogs, setMultiplayerLogs] = useState<string[]>([]);

  // DNS / Domain
  const [liveNameservers, setLiveNameservers] = useState<string[]>([]);
  const [checkingNS, setCheckingNS] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [isVerifyingDNS, setIsVerifyingDNS] = useState(false);

  // Publish
  const [isDeploying, setIsDeploying] = useState(false);

  // AI Assistant
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiPromptHistory, setAiPromptHistory] = useState<string[]>([
    "Upgrade this UI. Add a dark glassmorphic cyber design theme.",
    "Add a dynamic grid system showing dashboard cards with interactive stats."
  ]);

  // Fetch projects list
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "code_projects"), orderBy("updatedAt", "desc"), limit(20));
  }, [firestore, user]);

  const { data: projects, isLoading: isLoadingProjects } = useCollection(projectsQuery);
  const activeProject = useMemo(() => {
    if (!projects) return null;
    return projects.find(p => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Sync active project selection
  useEffect(() => {
    if (projects?.length && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // Resolve files list from active project
  const projectFiles = useMemo((): Record<string, string> => {
    if (!activeProject) return { "App.jsx": "" };
    if (activeProject.files && Object.keys(activeProject.files).length > 0) {
      return activeProject.files as Record<string, string>;
    }
    return { "App.jsx": activeProject.code || "" };
  }, [activeProject]);

  // Sync editor with active file
  useEffect(() => {
    if (projectFiles) {
      const fileName = Object.keys(projectFiles).find(f => f === activeFile) || Object.keys(projectFiles)[0] || "App.jsx";
      setActiveFile(fileName);
      setCodeText(projectFiles[fileName] || "");
      
      // Make sure it is in open tabs
      if (!openTabs.includes(fileName)) {
        setOpenTabs(prev => [...prev, fileName]);
      }
    }
  }, [activeProjectId, activeFile, projectFiles]);

  // Subscribe to real commits under Firestore subcollection
  useEffect(() => {
    if (!firestore || !user || !activeProject?.id) {
      setCommits([]);
      return;
    }

    const commitsRef = collection(firestore, "users", user.uid, "code_projects", activeProject.id, "commits");
    const q = query(commitsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCommits: Commit[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedCommits.push({
          id: docSnap.id,
          message: data.message,
          createdAt: data.createdAt,
          author: data.author,
          files: data.files || {},
          hash: data.hash || docSnap.id.substring(0, 7)
        });
      });
      setCommits(fetchedCommits);
    });

    return () => unsubscribe();
  }, [firestore, user, activeProject?.id]);

  // Auto-Save implementation
  useEffect(() => {
    if (autoSaveInterval <= 0 || !activeProject || !user || !firestore) return;
    const timer = setTimeout(() => {
      handleFileChange(codeText);
    }, autoSaveInterval * 1000);
    return () => clearTimeout(timer);
  }, [codeText, autoSaveInterval]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            // Alarm / Complete cycle
            if (interval) clearInterval(interval);
            setPomodoroActive(false);
            toast({
              title: pomodoroSession === 'work' ? "Focus session complete!" : "Break complete!",
              description: pomodoroSession === 'work' ? "Take a 5-minute break." : "Time to write some code!",
            });
            if (pomodoroSession === 'work') {
              setPomodoroSession('break');
              return 5 * 60;
            } else {
              setPomodoroSession('work');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroActive, pomodoroTime, pomodoroSession]);



  // DNS nameserver resolution
  const checkNameservers = async () => {
    if (!activeProject?.deployment?.customDomain) return;
    setCheckingNS(true);
    const domain = activeProject.deployment.customDomain;
    try {
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`);
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) {
        const nsList = data.Answer.map((ans: any) => ans.data.replace(/\.$/, '').toLowerCase());
        setLiveNameservers(nsList);
      } else {
        setLiveNameservers([]);
      }
    } catch (e) {
      setLiveNameservers([]);
    } finally {
      setCheckingNS(false);
    }
  };

  const handleAddDomain = async () => {
    if (!activeProject || !customDomain.trim() || !firestore || !user) return;
    try {
      const formattedDomain = customDomain.toLowerCase().trim();
      
      // 1. Programmatically add to Vercel
      const res = await fetch('/api/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: formattedDomain })
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast({ variant: "destructive", title: "Domain Error", description: data.error || "Failed to link domain to server." });
        return;
      }

      // 2. Save in Firestore domains array
      const currentDomains = activeProject.deployment?.domains || [];
      // Fallback migration: if there's a customDomain string but no array, include it
      if (activeProject.deployment?.customDomain && !currentDomains.includes(activeProject.deployment.customDomain)) {
         currentDomains.push(activeProject.deployment.customDomain);
      }
      
      if (!currentDomains.includes(formattedDomain)) {
        currentDomains.push(formattedDomain);
      }

      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        "deployment.domains": currentDomains
      });
      
      toast({ title: "Domain Added", description: `Successfully linked ${formattedDomain}.` });
      setCustomDomain("");
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Error" });
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (!activeProject || !firestore || !user) return;
    try {
      // 1. Programmatically remove from Vercel
      const res = await fetch(`/api/domain?domain=${encodeURIComponent(domain)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast({ variant: "destructive", title: "Domain Error", description: data.error || "Failed to remove domain from server." });
        return;
      }

      // 2. Remove from Firestore domains array
      const currentDomains = activeProject.deployment?.domains || [];
      const updatedDomains = currentDomains.filter((d: string) => d !== domain);

      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        "deployment.domains": updatedDomains
      });
      
      toast({ title: "Domain Removed", description: `Successfully removed ${domain}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Error" });
    }
  };

  const verifyDNS = async () => {
    if (!activeProject || !activeProject.deployment?.customDomain || !firestore || !user) return;
    setIsVerifyingDNS(true);
    const domain = activeProject.deployment.customDomain;
    const expectedValue = activeProject.deployment.verificationCode || `xak-verify-${activeProject.id}`;
    
    try {
      const res = await fetch(`https://dns.google/resolve?name=_xakteir-challenge.${domain}&type=TXT`);
      const data = await res.json();
      
      let verified = false;
      if (data.Answer && data.Answer.length > 0) {
        for (const record of data.Answer) {
          const txtVal = record.data.replace(/"/g, '').trim();
          if (txtVal === expectedValue) {
            verified = true;
            break;
          }
        }
      }

      if (verified) {
        await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
          "deployment.isVerified": true,
          "deployment.domain": domain,
          "deployment.status": 'live'
        });

        try {
          await setDoc(doc(firestore, "publishedProjects", activeProject.id), {
            domain: domain,
            isVerified: true
          }, { merge: true });
        } catch (e) { console.error(e); }

        toast({ title: "DNS Match Successful!", description: `Linked custom domain ${domain} to this project.` });
      } else {
        toast({ 
          variant: "destructive", 
          title: "DNS Verification Failed", 
          description: `No TXT record matching challenge was found on _xakteir-challenge.${domain}` 
        });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "DNS Lookup Offline" });
    } finally {
      setIsVerifyingDNS(false);
    }
  };

  const handleAddDnsRecord = async (type: 'A' | 'CNAME' | 'TXT' | 'MX', name: string, value: string, ttl: number) => {
    if (!activeProject || !user || !firestore || !name.trim() || !value.trim()) return;
    const records = activeProject.dnsRecords || [];
    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name: name.trim(),
      value: value.trim(),
      ttl: Number(ttl) || 3600
    };
    const updatedRecords = [...records, newRecord];
    
    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      dnsRecords: updatedRecords,
      updatedAt: serverTimestamp()
    });
    toast({ title: "DNS Record Added" });
  };

  const handleDeleteDnsRecord = async (recordId: string) => {
    if (!activeProject || !user || !firestore) return;
    const records = activeProject.dnsRecords || [];
    const updatedRecords = records.filter((r: any) => r.id !== recordId);
    
    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      dnsRecords: updatedRecords,
      updatedAt: serverTimestamp()
    });
    toast({ title: "DNS Record Deleted" });
  };

  const handleDeploy = async () => {
    if (!activeProject || !user || !firestore) return;
    setIsDeploying(true);
    try {
      // Derive a URL-safe slug from project name, e.g. "My Cool App" → "my-cool-app"
      const slug = (activeProject.name || 'project')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const domainName = activeProject.deployment?.customDomain || `xakteir.com/sites/${slug}`;

      // Update project deployment status
      const activeProjRef = doc(firestore, "users", user.uid, "code_projects", activeProject.id);
      await updateDoc(activeProjRef, {
        "deployment.status": 'live',
        "deployment.liveAt": serverTimestamp(),
        "deployment.domain": domainName,
        "deployment.slug": slug,
      });

      // Build a safe, size-limited snapshot of files for the public index
      const safeFiles: Record<string, string> = {};
      let totalSize = 0;
      for (const [name, content] of Object.entries(projectFiles)) {
        const chunk = content ? String(content).slice(0, 50000) : "";
        totalSize += chunk.length;
        if (totalSize > 900000) break; // Stay well under Firestore 1MB limit
        safeFiles[name] = chunk;
      }

      // Upsert public project index — merge:true means re-deploys update in-place
      await setDoc(
        doc(firestore, "publishedProjects", activeProject.id),
        {
          projectId: activeProject.id,
          ownerId: user.uid,
          ownerName: user.displayName?.replace(/^@+/, "") || "Member",
          name: activeProject.name,
          slug,
          domain: domainName,
          publishedAt: serverTimestamp(),
          status: 'published',
          files: safeFiles,
        },
        { merge: true }
      );

      toast({
        title: "🚀 Published!",
        description: `Live at https://${domainName}`,
      });
    } catch (e: any) {
      console.error("Deploy error:", e);
      toast({
        variant: "destructive",
        title: "Publish Failed",
        description: e?.message || "Could not deploy. Check your connection and try again.",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Log Interception Helpers
  const addLog = (log: ConsoleLog) => {
    setLogs(prev => [...prev.slice(-99), log]); // Keep last 100 logs
  };

  const clearLogs = () => setLogs([]);

  // Create a real commit
  const handleCreateCommit = async (message: string): Promise<boolean> => {
    if (!activeProject || !user || !firestore || !message.trim()) return false;
    setIsCommitting(true);
    try {
      const commitsRef = collection(firestore, "users", user.uid, "code_projects", activeProject.id, "commits");
      const sha = Math.random().toString(36).substring(2, 9);
      
      await addDoc(commitsRef, {
        message,
        createdAt: serverTimestamp(),
        author: user.displayName || user.email || "Developer",
        files: projectFiles,
        hash: sha
      });

      // Update project main metadata
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        updatedAt: serverTimestamp()
      });

      toast({ title: "Commit Successful!", description: `Saved snapshot as SHA: ${sha}` });
      return true;
    } catch (e) {
      toast({ variant: "destructive", title: "Git Commit Failed" });
      return false;
    } finally {
      setIsCommitting(false);
    }
  };

  // Rollback checkout commit
  const handleCheckoutCommit = async (commit: Commit) => {
    if (!activeProject || !user || !firestore) return;
    try {
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        files: commit.files,
        code: commit.files["App.jsx"] || "",
        updatedAt: serverTimestamp()
      });
      
      if (commit.files[activeFile]) {
        setCodeText(commit.files[activeFile]);
      } else {
        const first = Object.keys(commit.files)[0] || "App.jsx";
        setActiveFile(first);
        setCodeText(commit.files[first] || "");
      }
      
      toast({ title: "Checked out successfully!", description: `Workspace rolled back to: ${commit.message}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Checkout Failed" });
    }
  };

  // Tabs management
  const openTab = (fileName: string) => {
    if (!openTabs.includes(fileName)) {
      setOpenTabs(prev => [...prev, fileName]);
    }
    setActiveFile(fileName);
  };

  const closeTab = (fileName: string) => {
    const nextTabs = openTabs.filter(t => t !== fileName);
    setOpenTabs(nextTabs);
    
    if (activeFile === fileName) {
      setActiveFile(nextTabs[nextTabs.length - 1] || "App.jsx");
    }
  };

  const closeOtherTabs = (fileName: string) => {
    setOpenTabs([fileName]);
    setActiveFile(fileName);
  };

  const closeAllTabs = () => {
    setOpenTabs(["App.jsx"]);
    setActiveFile("App.jsx");
  };

  // Update cloud files with debouncing
  const handleFileChange = (newCode: string) => {
    setCodeText(newCode);
    if (!activeProject || !user || !firestore) return;
    
    const updatedFiles = { ...projectFiles, [activeFile]: newCode };
    updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      code: activeFile === 'App.jsx' ? newCode : (activeProject.code || ""),
      updatedAt: serverTimestamp()
    });
  };

  // File system interactions
  const handleCreateFile = async (fileName: string): Promise<boolean> => {
    if (!activeProject || !user || !firestore || !fileName.trim()) return false;
    if (projectFiles[fileName]) {
      toast({ variant: "destructive", title: "File already exists" });
      return false;
    }
    
    const extension = fileName.split('.').pop() || 'jsx';
    let defaultCode = `// Logic for ${fileName}\n`;
    if (extension === 'css') {
      defaultCode = `/* CSS styles for ${fileName} */\n`;
    } else if (extension === 'jsx' || extension === 'tsx' || extension === 'js' || extension === 'ts') {
      defaultCode = `export default function ${fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "")}() {\n  return (\n    <div>${fileName} Component</div>\n  );\n}\n`;
    }

    const updatedFiles = { ...projectFiles, [fileName]: defaultCode };
    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });
    
    openTab(fileName);
    toast({ title: "File created" });
    return true;
  };

  const handleDeleteFile = async (fileName: string) => {
    if (fileName === "App.jsx") {
      toast({ variant: "destructive", title: "Protected File", description: "Entry point App.jsx cannot be removed." });
      return;
    }
    if (!activeProject || !user || !firestore) return;
    const updatedFiles = { ...projectFiles };
    delete updatedFiles[fileName];

    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });
    
    closeTab(fileName);
    toast({ title: "File deleted" });
  };

  const handleRenameFile = async (oldName: string, newName: string): Promise<boolean> => {
    if (oldName === "App.jsx") {
      toast({ variant: "destructive", title: "Protected File", description: "Entry point App.jsx cannot be renamed." });
      return false;
    }
    if (!activeProject || !user || !firestore || !newName.trim()) return false;
    if (projectFiles[newName]) {
      toast({ variant: "destructive", title: "Target filename already exists" });
      return false;
    }

    const updatedFiles = { ...projectFiles };
    updatedFiles[newName] = updatedFiles[oldName] || "";
    delete updatedFiles[oldName];

    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });

    // Swap tab
    const nextTabs = openTabs.map(t => t === oldName ? newName : t);
    setOpenTabs(nextTabs);
    if (activeFile === oldName) {
      setActiveFile(newName);
    }
    
    toast({ title: "File renamed" });
    return true;
  };

  const handleDuplicateFile = async (fileName: string) => {
    if (!activeProject || !user || !firestore) return;
    const parts = fileName.split('.');
    const ext = parts.pop();
    const base = parts.join('.');
    const newName = `${base}-copy.${ext}`;
    
    if (projectFiles[newName]) {
      toast({ variant: "destructive", title: "Duplicate target already exists" });
      return;
    }

    const updatedFiles = { ...projectFiles };
    updatedFiles[newName] = projectFiles[fileName] || "";

    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });

    openTab(newName);
    toast({ title: "File duplicated" });
  };

  const handleCreateProject = async (name: string) => {
    if (!user || !firestore || !name.trim()) return;
    try {
        const safeSlug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const defaultDomain = `${safeSlug}.code.xakteir.com`;
        
        // Ensure Vercel knows about the new subdomain
        try {
          await fetch('/api/domain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: defaultDomain })
          });
        } catch (e) {
          console.error("Failed to auto-register default domain on Vercel");
        }

        const docRef = await addDoc(collection(firestore, "users", user.uid, "code_projects"), {
        name: name,
        code: `export default function App() {\n  return (\n    <div className="p-20 flex flex-col items-center justify-center min-h-screen bg-black text-white">\n      <h1 className="text-5xl font-black italic uppercase text-sky-400 mb-4">${name}</h1>\n      <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Multi-File React Workspace Active</p>\n    </div>\n  );\n}`,
        files: {
          "App.jsx": `export default function App() {\n  return (\n    <div className="p-20 flex flex-col items-center justify-center min-h-screen bg-black text-white">\n      <h1 className="text-5xl font-black italic uppercase text-sky-400 mb-4">${name}</h1>\n      <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Multi-File React Workspace Active</p>\n    </div>\n  );\n}`
        },
        dnsRecords: [
          { id: '1', type: 'A', name: '@', value: '76.76.21.21', ttl: 3600 },
          { id: '2', type: 'CNAME', name: 'www', value: 'xakteir.com', ttl: 3600 }
        ],
        explanation: "Initialized new React project.",
        deployment: {
          status: 'idle',
          domains: [defaultDomain]
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveProjectId(docRef.id);
      toast({ title: "Project Initialized" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error creating project" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "code_projects", projectId));
      toast({ title: "Project deleted" });
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const toggleCdnDependency = (cdn: string) => {
    setCdnDependencies(prev => 
      prev.includes(cdn) ? prev.filter(c => c !== cdn) : [...prev, cdn]
    );
  };

  // Pomodoro Actions
  const resetPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroTime(pomodoroSession === 'work' ? 25 * 60 : 5 * 60);
  };

  const setAmbientVolume = (sound: string, volume: number) => {
    setAmbientVolumes(prev => ({
      ...prev,
      [sound]: volume
    }));
  };

  const addAiPromptHistory = (val: string) => {
    if (!aiPromptHistory.includes(val)) {
      setAiPromptHistory(prev => [val, ...prev.slice(0, 9)]);
    }
  };

  // AI Architect Flow Code Execution
  const handleGenerateCode = async (prompt: string, overrideCode?: string) => {
    const instruction = prompt || aiPrompt;
    if (!instruction.trim() || isGenerating || !user || !firestore || !activeProject) return;
    
    setIsGenerating(true);
    try {
      const sourceCode = overrideCode || codeText;
      const res = await codeArchitect({ 
        prompt: instruction,
        context: sourceCode 
      });
      
      handleFileChange(res.code);
      if (res.explanation) {
        setAiExplanation(res.explanation);
      }
      addAiPromptHistory(instruction);
      toast({ title: "AI Code Sync Successful", description: "Modifications committed directly." });
      setAiPrompt("");
    } catch (err) {
      toast({ variant: "destructive", title: "AI Code Synthesis Failed" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <XakCodeContext.Provider value={{
      user,
      firestore,
      projects,
      isLoadingProjects,
      activeProjectId,
      setActiveProjectId,
      activeProject,
      projectFiles,
      activeFile,
      setActiveFile,
      codeText,
      setCodeText,
      openTabs,
      openTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      handleFileChange,
      handleCreateFile,
      handleDeleteFile,
      handleRenameFile,
      handleDuplicateFile,
      handleCreateProject,
      handleDeleteProject,
      theme,
      setTheme,
      fontSize,
      setFontSize,
      fontFamily,
      setFontFamily,
      wordWrap,
      setWordWrap,
      tabSize,
      setTabSize,
      autoSaveInterval,
      setAutoSaveInterval,
      isCompiling,
      setIsCompiling,
      compileDuration,
      setCompileDuration,
      autoReloadPreview,
      setAutoReloadPreview,
      previewUrl,
      setPreviewUrl,
      customCss,
      setCustomCss,
      cdnDependencies,
      toggleCdnDependency,
      logs,
      addLog,
      clearLogs,
      commits,
      isCommitting,
      handleCreateCommit,
      handleCheckoutCommit,
      pomodoroTime,
      pomodoroActive,
      pomodoroSession,
      setPomodoroActive,
      resetPomodoro,
      setPomodoroSession,
      setPomodoroTime,
      ambientVolumes,
      setAmbientVolume,
      multiplayerActive,
      setMultiplayerActive,
      multiplayerLogs,
      liveNameservers,
      checkingNS,
      checkNameservers,
      customDomain,
      setCustomDomain,
      handleAddDomain,
      handleRemoveDomain,
      verifyDNS,
      isVerifyingDNS,
      handleAddDnsRecord,
      handleDeleteDnsRecord,
      isDeploying,
      handleDeploy,
      isGenerating,
      aiPrompt,
      setAiPrompt,
      aiExplanation,
      setAiExplanation,
      aiPromptHistory,
      addAiPromptHistory,
      handleGenerateCode
    }}>
      {children}
    </XakCodeContext.Provider>
  );
};

export const useXakCode = () => {
  const context = useContext(XakCodeContext);
  if (context === undefined) {
    throw new Error("useXakCode must be used within a XakCodeProvider");
  }
  return context;
};
