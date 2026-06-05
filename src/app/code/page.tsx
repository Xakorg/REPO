"use client";

import { useState, useEffect, useRef, useMemo, type ChangeEvent } from "react";
import { 
  Code2, 
  Terminal, 
  Globe, 
  Database, 
  ShieldCheck, 
  Activity, 
  HardDrive, 
  Cpu,
  Plus,
  Play,
  Loader2,
  FileCode,
  FolderTree,
  Monitor,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Layout,
  UserCheck,
  Rocket,
  X,
  Lock,
  Download,
  FolderOpen,
  MessageSquare,
  Wand2,
  RefreshCw,
  FileArchive,
  Upload,
  ExternalLink,
  Settings,
  ChevronRight,
  Info,
  ShieldPlus,
  Tv,
  Check,
  AlertTriangle,
  Folder,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { codeArchitect, type CodeArchitectOutput } from "@/ai/flows/code-architect-flow";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, orderBy, limit, addDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

type ProjectTab = 'ide' | 'hosting' | 'console' | 'settings';
type IDEViewMode = 'code' | 'ai';

export default function XakCodePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>('ide');
  const [viewMode, setViewMode] = useState<IDEViewMode>('code');
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [aiPrompt, setPrompt] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  
  // Multi-File states
  const [activeFile, setActiveFile] = useState("App.jsx");
  const [codeText, setCodeText] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");
  
  const [newFileName, setNewFileName] = useState("");
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  
  // Custom DNS States
  const [customDomain, setCustomDomain] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [isVerifyingDNS, setIsVerifyingDNS] = useState(false);
  
  const [newRecordType, setNewRecordType] = useState<'A' | 'CNAME' | 'TXT' | 'MX'>('A');
  const [newRecordName, setNewRecordName] = useState("");
  const [newRecordValue, setNewRecordValue] = useState("");
  const [newRecordTTL, setNewRecordTTL] = useState(3600);
  
  const [liveNameservers, setLiveNameservers] = useState<string[]>([]);
  const [checkingNS, setCheckingNS] = useState(false);

  // Refs for IDE UI
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "code_projects"), orderBy("updatedAt", "desc"), limit(20));
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection(projectsQuery);
  const activeProject = projects?.find(p => p.id === activeProjectId) || projects?.[0];

  useEffect(() => {
    if (projects?.length && !activeProjectId) {
      setActiveId(projects[0].id);
    }
  }, [projects]);

  // Load and verify files on project load
  const projectFiles = useMemo(() => {
    if (!activeProject) return { "App.jsx": "" };
    if (activeProject.files && Object.keys(activeProject.files).length > 0) {
      return activeProject.files;
    }
    return { "App.jsx": activeProject.code || "" };
  }, [activeProject]);

  // Handle active file switching
  useEffect(() => {
    if (projectFiles) {
      const firstAvailableFile = Object.keys(projectFiles).find(f => f === activeFile) || Object.keys(projectFiles)[0] || "App.jsx";
      setActiveFile(firstAvailableFile);
      setCodeText(projectFiles[firstAvailableFile] || "");
      setDebouncedCode(projectFiles[firstAvailableFile] || "");
    }
  }, [activeProjectId, activeFile, projectFiles]);

  // Debounce updates to compile preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(codeText);
    }, 1000);
    return () => clearTimeout(timer);
  }, [codeText]);

  // Nameservers DoH check
  useEffect(() => {
    if (activeProject?.deployment?.customDomain) {
      checkNameservers();
    }
  }, [activeProject?.deployment?.customDomain]);

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

  const handleArchitect = async (e: React.FormEvent, customInstruction?: string) => {
    if (e) e.preventDefault();
    const instruction = customInstruction || aiPrompt;
    if (!instruction.trim() || isArchitecting || !user || !firestore || !activeProject) return;
    
    setIsArchitecting(true);
    try {
      const res = await codeArchitect({ 
        prompt: instruction,
        context: codeText 
      });
      
      handleFileChange(res.code);
      toast({ title: "Neural Shard Configured", description: "AI code modifications completed." });
      setPrompt("");
    } catch (err) {
      toast({ variant: "destructive", title: "Logic Synced Failed" });
    } finally {
      setIsArchitecting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !firestore || !newProjName.trim()) return;
    try {
      const docRef = await addDoc(collection(firestore, "users", user.uid, "code_projects"), {
        name: newProjName,
        code: `// Neural React Logic Core\nexport default function App() {\n  return (\n    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-black text-white">\n      <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl text-center space-y-6">\n        <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto animate-pulse">\n          <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">\n            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />\n          </svg>\n        </div>\n        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">${newProjName}</h1>\n        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Status: Live and Connected</p>\n        <div className="h-px bg-white/5" />\n        <p className="text-sm italic font-medium opacity-80">Edit this template in Code Mode or prompt the Neural Architect in AI Mode to upgrade this page.</p>\n      </div>\n    </div>\n  );\n}`,
        files: {
          "App.jsx": `export default function App() {\n  return (\n    <div className="p-20 flex flex-col items-center justify-center min-h-screen bg-black text-white">\n      <h1 className="text-5xl font-black italic uppercase text-primary mb-4">${newProjName}</h1>\n      <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Multi-File React Workspace Active</p>\n    </div>\n  );\n}`
        },
        dnsRecords: [
          { id: '1', type: 'A', name: '@', value: '76.76.21.21', ttl: 3600 },
          { id: '2', type: 'CNAME', name: 'www', value: 'xakteir.com', ttl: 3600 }
        ],
        explanation: "Initialized new neural React shard.",
        deployment: {
          status: 'idle',
          domain: `${newProjName.toLowerCase().replace(/\s+/g, '-')}.xakteir.app`,
          isVerified: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveId(docRef.id);
      setIsNewModalOpen(false);
      setNewProjName("");
      toast({ title: "Shard Initialized" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

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

  const handleCreateFile = async () => {
    if (!activeProject || !user || !firestore || !newFileName.trim()) return;
    if (projectFiles[newFileName]) {
      toast({ variant: "destructive", title: "File already exists" });
      return;
    }
    const updatedFiles = { ...projectFiles, [newFileName]: `// Logic for ${newFileName}\nexport default function ${newFileName.replace(/\.[^/.]+$/, "")}() {\n  return null;\n}\n` };
    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });
    setActiveFile(newFileName);
    setIsNewFileModalOpen(false);
    setNewFileName("");
    toast({ title: "File created" });
  };

  const handleDeleteFile = async (name: string) => {
    if (name === "App.jsx") {
      toast({ variant: "destructive", title: "Protected File", description: "Entry point App.jsx cannot be removed." });
      return;
    }
    if (!activeProject || !user || !firestore) return;
    const updatedFiles = { ...projectFiles };
    delete updatedFiles[name];

    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });
    setActiveFile("App.jsx");
    toast({ title: "File deleted" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      handleFileChange(newVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleFolderUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (!uploadedFiles.length || !activeProject || !user || !firestore) return;
    
    setUploadingZip(true);
    try {
      const workspaceFiles = { ...projectFiles };
      for (const file of uploadedFiles) {
        const relativePath = file.webkitRelativePath || file.name;
        // Strip out the leading root folder name from relativePath to mount clean paths in explorer
        const parts = relativePath.split('/');
        const cleanPath = parts.slice(1).join('/') || relativePath;
        const content = await file.text();
        workspaceFiles[cleanPath] = content;
      }
      
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        files: workspaceFiles,
        updatedAt: serverTimestamp()
      });
      
      setActiveFile("App.jsx");
      toast({ title: "Folder Uploaded", description: `Loaded ${uploadedFiles.length} files into workspace.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Folder Upload Failed" });
    } finally {
      setUploadingZip(false);
    }
  };

  const handleDeploy = async () => {
    if (!activeProject || !user || !firestore) return;
    setIsDeploying(true);
    setTimeout(async () => {
      const activeProjRef = doc(firestore, "users", user.uid, "code_projects", activeProject.id);
      await updateDoc(activeProjRef, {
        "deployment.status": 'live',
        "deployment.liveAt": serverTimestamp()
      });

      try {
        await setDoc(doc(firestore, "publishedProjects", activeProject.id), {
          projectId: activeProject.id,
          ownerId: user.uid,
          ownerName: user.displayName?.replace(/^@+/, "") || "Member",
          name: activeProject.name,
          domain: activeProject.deployment?.customDomain || activeProject.deployment?.domain || `${(activeProject.name || 'project').toLowerCase().replace(/\s+/g, '-')}.xakteir.app`,
          publishedAt: serverTimestamp(),
          status: 'published',
          files: projectFiles
        });
      } catch (e) {}

      setIsDeploying(false);
      toast({ title: "Unit Published!", description: `Live at ${activeProject.deployment?.customDomain || activeProject.deployment?.domain || 'the Hub'}` });
    }, 2000);
  };

  const handleCustomDomain = async () => {
    if (!activeProject || !customDomain.trim() || !firestore || !user) return;
    try {
      const verificationCode = `xak-verify-${activeProject.id}`;
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        "deployment.customDomain": customDomain.toLowerCase().trim(),
        "deployment.verificationCode": verificationCode,
        "deployment.isVerified": false
      });
      toast({ title: "Domain Key Generated", description: "Configured target custom domain. Run DNS verification check to link." });
      setCustomDomain("");
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
        } catch(e) {}

        toast({ title: "DNS Match Successful!", description: `Linked custom domain ${domain} to this shard.` });
      } else {
        toast({ 
          variant: "destructive", 
          title: "DNS Verification Failed", 
          description: `No TXT record matching "${expectedValue}" was found on _xakteir-challenge.${domain}. Please verify records propagation.` 
        });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "DNS Lookup Offline" });
    } finally {
      setIsVerifyingDNS(false);
    }
  };

  // DNS records modification
  const handleAddDnsRecord = async () => {
    if (!activeProject || !user || !firestore || !newRecordName.trim() || !newRecordValue.trim()) return;
    const records = activeProject.dnsRecords || [];
    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      type: newRecordType,
      name: newRecordName.trim(),
      value: newRecordValue.trim(),
      ttl: Number(newRecordTTL) || 3600
    };
    const updatedRecords = [...records, newRecord];
    
    await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
      dnsRecords: updatedRecords,
      updatedAt: serverTimestamp()
    });
    
    setNewRecordName("");
    setNewRecordValue("");
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

  // Compile React preview content in iframe via srcDoc supporting local module resolution
  const getIframeSrcDoc = (files: Record<string, string>) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { 
            margin: 0; 
            background: #000; 
            color: #fff; 
            font-family: system-ui, sans-serif; 
            overflow-x: hidden; 
          }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 99px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          const modules = {};
          
          // Simple relative path resolver/require function
          const require = (name) => {
            const cleanName = name.replace(/^\\.\\//, '').replace(/\\.(jsx?|tsx?)$/, '');
            for (const key of Object.keys(modules)) {
              const cleanKey = key.replace(/\\.(jsx?|tsx?)$/, '');
              if (cleanKey === cleanName) {
                return modules[key];
              }
            }
            if (name === 'react') return React;
            if (name === 'react-dom') return ReactDOM;
            throw new Error("Cannot find module " + name);
          };

          const filesData = ${JSON.stringify(files)};

          // 1. Load CSS files dynamically
          Object.keys(filesData).forEach(filename => {
            if (filename.endsWith('.css')) {
              const style = document.createElement('style');
              style.innerHTML = filesData[filename];
              document.head.appendChild(style);
            }
          });

          // 2. Transpile and evaluate JS/JSX/TS/TSX files
          Object.keys(filesData).forEach(filename => {
            if (filename.endsWith('.css') || filename.endsWith('.json') || filename.endsWith('.md')) return;
            
            const rawCode = filesData[filename];
            let codeToRun = rawCode;
            codeToRun = codeToRun.replace(/export\\s+default\\s+function\\s+(\\w+)/g, 'function $1');
            codeToRun = codeToRun.replace(/export\\s+default\\s+/g, 'const DefaultExport = ');

            try {
              const compiled = Babel.transform(codeToRun, { 
                presets: ['react'],
                filename: filename
              }).code;

              const moduleFn = new Function('exports', 'require', 'React', 'ReactDOM', 
                compiled + '\\n;if (typeof App !== "undefined") { exports.default = App; } else if (typeof DefaultExport !== "undefined") { exports.default = DefaultExport; }'
              );

              const exports = {};
              moduleFn(exports, require, React, ReactDOM);
              modules[filename] = exports;
            } catch(err) {
              console.error("Compile/Eval Error in " + filename + ":", err);
            }
          });

          // 3. Render Entry Point Component (App.jsx / App.js / Default)
          try {
            let App = null;
            if (modules['App.jsx'] && modules['App.jsx'].default) {
              App = modules['App.jsx'].default;
            } else if (modules['App.js'] && modules['App.js'].default) {
              App = modules['App.js'].default;
            } else {
              for (const key of Object.keys(modules)) {
                if (modules[key] && modules[key].default) {
                  App = modules[key].default;
                  break;
                }
              }
            }

            if (App) {
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(App));
            } else {
              document.getElementById('root').innerHTML = '<div style="padding:40px;color:#f87171;font-family:monospace;line-height:1.6;background:#111;border:1px solid #ef4444;border-radius:12px;margin:20px;"><h2 style="font-weight:900;margin-top:0;">Build Error</h2>No export default component was found. Ensure App.jsx has a default export: <br/><code>export default function App() { ... }</code></div>';
            }
          } catch(err) {
            document.getElementById('root').innerHTML = '<div style="padding:40px;color:#f87171;font-family:monospace;background:#111;border:1px solid #ef4444;border-radius:12px;margin:20px;"><h2 style="font-weight:900;margin-top:0;">Runtime Error</h2>' + err.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
  };

  const lineNumbersArray = Array.from({ length: codeText.split('\n').length }, (_, i) => i + 1);

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center p-20 text-center space-y-10 animate-fade-in text-foreground">
      <div className="w-32 h-32 rounded-[3.5rem] bg-sky-500/10 flex items-center justify-center border-4 border-sky-500/20 shadow-2xl">
        <Code2 className="w-16 h-16 text-sky-500" />
      </div>
      <h2 className="text-6xl font-black uppercase italic tracking-tighter text-white">Architect Entry</h2>
      <p className="text-muted-foreground font-bold uppercase tracking-widest max-w-sm">Sign in to initialize your neural code library and hosting suite.</p>
      <Link href="/auth"><Button className="bg-primary hover:bg-primary/90 h-16 px-16 rounded-[2rem] font-black uppercase text-xs">Sign In</Button></Link>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-20 z-[50] bg-[#07070e] flex flex-col animate-fade-in text-white overflow-hidden">
      
      {/* IDE Header Controls */}
      <header className="h-16 border-b border-white/5 bg-[#090915]/95 backdrop-blur-xl px-6 flex items-center justify-between shadow-lg relative z-[60] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-900/40">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-black uppercase italic tracking-tighter text-white">XakCode IDE</h2>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setIsNewModalOpen(true)} variant="outline" className="h-9 px-3.5 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 text-white"><Plus className="w-3.5 h-3.5 mr-2" /> New Shard</Button>
            
            {/* Native Folder Upload Input Trigger */}
            <input 
              type="file" 
              ref={folderInputRef} 
              className="hidden" 
              webkitdirectory="" 
              directory="" 
              multiple 
              onChange={handleFolderUpload} 
            />
            <Button onClick={() => folderInputRef.current?.click()} variant="outline" className="h-9 px-3.5 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 text-white" disabled={uploadingZip}>
              {uploadingZip ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />} Upload Folder
            </Button>
          </div>
        </div>

        {/* MODE CONTROLLER: Code Mode vs AI Mode */}
        <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-white/10 items-center">
          <button 
            onClick={() => setViewMode('code')}
            className={cn(
              "px-5 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              viewMode === 'code' ? "bg-sky-500 text-white shadow-xl" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <Code2 className="w-3 h-3" /> Code Mode
          </button>
          <button 
            onClick={() => setViewMode('ai')}
            className={cn(
              "px-5 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              viewMode === 'ai' ? "bg-primary text-white shadow-xl animate-pulse" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <Sparkles className="w-3 h-3" /> AI Mode
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <span className={cn("w-1.5 h-1.5 rounded-full", activeProject?.deployment?.status === 'live' ? "bg-green-500 animate-pulse" : "bg-amber-500")} />
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{activeProject?.name || "No active project"}</span>
          </div>
          <Button onClick={handleDeploy} disabled={isDeploying || !activeProject} className="bg-primary hover:bg-primary/95 h-9 rounded-xl px-5 font-black uppercase text-[10px] tracking-widest text-black shadow-xl transition-all">
            {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <><Rocket className="w-3.5 h-3.5 mr-2" /> PUBLISH</>}
          </Button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* MULTI-FILE DIRECTORY TREE EXPLORER - Hidden in AI Mode */}
        {viewMode === 'code' && (
          <aside className="w-60 border-r border-white/5 bg-[#06060c] flex flex-col shrink-0">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5 text-sky-400" />
                <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Files</h3>
              </div>
              <Button onClick={() => setIsNewFileModalOpen(true)} size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/5 rounded-md"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mt-10 opacity-20" />
                ) : (
                  Object.keys(projectFiles).map(fileName => (
                    <div 
                      key={fileName}
                      onClick={() => setActiveFile(fileName)}
                      className={cn(
                        "p-2.5 rounded-xl flex items-center justify-between group cursor-pointer transition-all border text-left",
                        activeFile === fileName ? "bg-sky-500/15 border-sky-500/30 text-sky-400 font-black" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        {fileName.endsWith('.css') ? <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                        <span className="text-[10px] truncate w-full font-bold">{fileName}</span>
                      </div>
                      
                      {fileName !== 'App.jsx' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFile(fileName); }}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-opacity p-0.5 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* IDE VIEW MODE: CODE MODE PANEL */}
        {viewMode === 'code' && (
          <main className="flex-1 flex overflow-hidden bg-[#090910]">
            {/* Left Hand: Scroll-Synchronized Textarea Editor */}
            <section className="flex-1 flex flex-col border-r border-white/5 relative bg-[#0b0b14]/50">
              <header className="h-10 bg-black/40 border-b border-white/5 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-sky-400 tracking-widest italic">{activeFile}</span>
                  <Badge variant="outline" className="text-[7px] border-white/5 text-muted-foreground uppercase">{activeFile.split('.').pop() || 'CODE'}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setCodeText(projectFiles[activeFile] || "")} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white rounded-md"><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden relative">
                {/* Line Gutter */}
                <div 
                  ref={gutterRef}
                  className="w-11 bg-black/35 text-white/20 text-right pr-2.5 pt-4 font-mono text-[11px] leading-relaxed border-r border-white/5 select-none overflow-hidden h-full shrink-0"
                >
                  {lineNumbersArray.map(n => (
                    <div key={n} className="h-5">{n}</div>
                  ))}
                </div>
                {/* Editor Input Area */}
                <textarea
                  ref={textareaRef}
                  value={codeText}
                  onChange={(e) => handleFileChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={(e) => {
                    if (gutterRef.current) {
                      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                    }
                  }}
                  className="flex-1 bg-transparent p-4 pt-4 font-mono text-[11px] leading-relaxed text-foreground/90 outline-none border-none resize-none overflow-y-auto whitespace-pre h-full"
                  spellCheck={false}
                  placeholder="// File loading..."
                />
              </div>
            </section>

            {/* Right Hand Tab View: Preview / Hosting & DNS / Logs */}
            <aside className="w-[480px] bg-[#05050a]/95 flex flex-col shrink-0">
              <header className="h-10 bg-[#090915] border-b border-white/5 flex p-0.5 relative z-10 shrink-0">
                {(['ide', 'hosting', 'console'] as ProjectTab[]).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 h-full rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab ? "bg-sky-500/20 text-sky-400 font-bold border-b border-sky-400 rounded-none" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {tab === 'ide' ? 'Live Preview' : tab}
                  </button>
                ))}
              </header>

              <div className="flex-1 overflow-hidden relative">
                {/* Tab Content: Live Preview */}
                {activeTab === 'ide' && (
                  <div className="h-full flex flex-col relative bg-black">
                    <div className="absolute top-4 right-4 z-[99] flex gap-2">
                      <Button onClick={() => previewIframeRef.current?.setAttribute('srcdoc', getIframeSrcDoc(projectFiles))} size="icon" className="h-8 w-8 bg-sky-600 rounded-lg shadow-lg hover:bg-sky-500 text-white"><Play className="w-4 h-4" /></Button>
                    </div>
                    <iframe
                      ref={previewIframeRef}
                      title="XakCode Live React Frame"
                      srcDoc={getIframeSrcDoc(projectFiles)}
                      sandbox="allow-scripts"
                      className="w-full h-full border-none bg-black"
                    />
                  </div>
                )}

                {/* Tab Content: Hosting & DNS Console */}
                {activeTab === 'hosting' && (
                  <ScrollArea className="h-full p-6 bg-zinc-950/40">
                    <div className="space-y-8 pb-10">
                      <div className="space-y-2">
                        <h3 className="text-base font-black uppercase italic text-white">DNS Records Console</h3>
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">Point nameservers to Xakteir DNS to configure records directly from this dashboard.</p>
                      </div>

                      {/* Domain Setup */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">1. Target Custom Domain</p>
                        <div className="flex gap-2">
                          <Input 
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            placeholder="www.mycustomdomain.com" 
                            className="bg-black/60 h-10 border-white/10 text-xs font-bold text-white focus:border-sky-500" 
                          />
                          <Button onClick={handleCustomDomain} disabled={!customDomain.trim()} className="bg-sky-600 hover:bg-sky-500 rounded-xl h-10 px-4 font-black uppercase text-[9px] text-white">Save</Button>
                        </div>
                      </div>

                      {activeProject?.deployment?.customDomain && (
                        <>
                          {/* Nameservers Delegation Panel */}
                          <div className="p-5 bg-zinc-900 border border-white/10 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-amber-500 italic">2. Nameserver Delegation</span>
                              <Badge className={cn("text-[7px] px-2 font-black border-none", liveNameservers.includes('ns1.xakteir.com') ? "bg-green-500 text-white animate-pulse" : "bg-amber-500 text-black")}>
                                {liveNameservers.includes('ns1.xakteir.com') ? "DELEGATED ACTIVE" : "PENDING DELEGATION"}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-[10px]">
                              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                Point nameservers at your domain registrar (GoDaddy, Namecheap, etc.) to:
                              </p>
                              <div className="font-mono text-[9px] bg-black/40 p-3 rounded-lg border border-white/5 space-y-1.5 select-all">
                                <div>ns1.xakteir.com</div>
                                <div>ns2.xakteir.com</div>
                              </div>
                              
                              {liveNameservers.length > 0 ? (
                                <div className="pt-2 text-[9px] text-white/50">
                                  <span className="font-black uppercase text-white/30 block mb-1">Live Nameservers:</span>
                                  {liveNameservers.join(', ')}
                                </div>
                              ) : (
                                <div className="text-[9px] text-rose-400 italic">No nameserver records resolved yet.</div>
                              )}
                              
                              <Button 
                                onClick={checkNameservers} 
                                disabled={checkingNS}
                                variant="outline" 
                                className="w-full h-8 text-[8px] font-black uppercase border-white/15 hover:bg-white/5 mt-2 text-white"
                              >
                                {checkingNS ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <RefreshCw className="w-3 h-3 mr-1.5" />} Check Live Delegation
                              </Button>
                            </div>
                          </div>

                          {/* DNS records editor table */}
                          <div className="p-5 bg-zinc-900 border border-white/10 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-sky-400 italic">3. Custom Zone Editor</span>
                              <Badge variant="outline" className="text-[7px] border-white/10 font-black">XAKCODE DNS</Badge>
                            </div>

                            {/* Active Records List */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {(activeProject.dnsRecords || []).length === 0 ? (
                                <p className="text-[10px] text-white/20 italic text-center py-4">No custom DNS records configured.</p>
                              ) : (
                                (activeProject.dnsRecords || []).map((rec: any) => (
                                  <div key={rec.id} className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-[10px] font-mono">
                                    <div className="space-y-0.5 text-left">
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-sky-500/10 text-sky-400 text-[8px] px-1.5 py-0 border-none">{rec.type}</Badge>
                                        <span className="font-black text-white">{rec.name}</span>
                                      </div>
                                      <p className="text-white/40 truncate w-60">{rec.value}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteDnsRecord(rec.id)}
                                      className="text-rose-500 hover:text-rose-400 p-1 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add DNS Record form */}
                            <div className="h-px bg-white/5 my-4" />
                            <div className="space-y-3 pt-2 text-left">
                              <span className="text-[9px] font-black uppercase text-white/40 ml-1">Add Record</span>
                              <div className="grid grid-cols-4 gap-2">
                                <select 
                                  value={newRecordType}
                                  onChange={(e: any) => setNewRecordType(e.target.value)}
                                  className="bg-black border border-white/15 rounded-lg text-[10px] p-2 text-white font-bold outline-none"
                                >
                                  <option value="A">A</option>
                                  <option value="CNAME">CNAME</option>
                                  <option value="TXT">TXT</option>
                                  <option value="MX">MX</option>
                                </select>
                                <Input 
                                  value={newRecordName}
                                  onChange={(e) => setNewRecordName(e.target.value)}
                                  placeholder="Host (@, www)" 
                                  className="bg-black border-white/15 h-9 text-[10px] font-bold text-white col-span-3"
                                />
                              </div>
                              <Input 
                                value={newRecordValue}
                                onChange={(e) => setNewRecordValue(e.target.value)}
                                placeholder="Value (IP address or domain target)" 
                                className="bg-black border-white/15 h-9 text-[10px] font-bold text-white w-full"
                              />
                              <Button 
                                onClick={handleAddDnsRecord}
                                disabled={!newRecordName.trim() || !newRecordValue.trim()}
                                className="w-full h-9 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase text-[9px] rounded-lg"
                              >
                                Commit DNS Record
                              </Button>
                            </div>
                          </div>

                          {/* DNS TXT verification challenge */}
                          <div className="p-5 bg-zinc-900 border border-white/10 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-amber-500 italic">TXT Backup Challenge</span>
                              <Badge className={cn("text-[7px] px-2 font-black border-none", activeProject.deployment.isVerified ? "bg-green-500 text-white" : "bg-amber-500 text-black")}>
                                {activeProject.deployment.isVerified ? "VERIFIED" : "TXT PENDING"}
                              </Badge>
                            </div>
                            
                            <div className="space-y-3 font-mono text-[9px] text-left">
                              <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 space-y-1">
                                <span className="text-white/40 block font-sans text-[8px] font-black uppercase">TXT Hostname</span>
                                <span className="text-white select-all">_xakteir-challenge.{activeProject.deployment.customDomain}</span>
                              </div>
                              <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 space-y-1">
                                <span className="text-white/40 block font-sans text-[8px] font-black uppercase">TXT Value</span>
                                <span className="text-white select-all">{activeProject.deployment.verificationCode || `xak-verify-${activeProject.id}`}</span>
                              </div>
                            </div>

                            {!activeProject.deployment.isVerified ? (
                              <Button 
                                onClick={verifyDNS} 
                                disabled={isVerifyingDNS} 
                                className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[9px] rounded-xl flex items-center justify-center gap-2"
                              >
                                {isVerifyingDNS ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                Verify Backup TXT Record
                              </Button>
                            ) : (
                              <div className="flex gap-2 items-center bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-green-500 text-[10px] font-black justify-center">
                                <Check className="w-4 h-4" /> Domain synchronized and active!
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                )}

                {/* Tab Content: Console Logs */}
                {activeTab === 'console' && (
                  <div className="h-full p-6 flex flex-col font-mono text-[10px] text-sky-400">
                    <ScrollArea className="flex-1">
                      <div className="space-y-1.5 p-1 text-left">
                        <p className="text-white/40">// Diagnostic console initialized...</p>
                        <p>[{new Date().toLocaleTimeString()}] Local Server bound to port 9002</p>
                        <p>[{new Date().toLocaleTimeString()}] Hot module reloading active</p>
                        <p>[{new Date().toLocaleTimeString()}] Modular file system parser listening</p>
                        <p>[{new Date().toLocaleTimeString()}] Babel-standalone bundler buffer loaded.</p>
                        {activeProject?.deployment?.isVerified && (
                          <p className="text-green-400">[{new Date().toLocaleTimeString()}] DNS Verification Check: Passed for {activeProject.deployment.customDomain}</p>
                        )}
                        <p className="text-white/60">[{new Date().toLocaleTimeString()}] Standby. Ready to compile.</p>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </aside>
          </main>
        )}

        {/* IDE VIEW MODE: AI ASSISTANT MODE PANEL */}
        {viewMode === 'ai' && (
          <main className="flex-1 flex overflow-hidden">
            {/* Left 70%: Large Live Preview IFrame */}
            <section className="w-[70%] h-full flex flex-col border-r border-white/5 bg-black relative">
              <header className="h-10 bg-black/40 border-b border-white/5 flex items-center justify-between px-5 shrink-0 z-10">
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[9px] font-black uppercase text-white tracking-widest">Active UI Preview (70%)</span>
                </div>
                <Button onClick={() => previewIframeRef.current?.setAttribute('srcdoc', getIframeSrcDoc(projectFiles))} size="sm" variant="ghost" className="h-7 px-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-white"><RefreshCw className="w-3 h-3 mr-1.5" /> Reload View</Button>
              </header>
              <div className="flex-1 bg-black">
                <iframe
                  ref={previewIframeRef}
                  title="XakCode AI Mode Frame"
                  srcDoc={getIframeSrcDoc(projectFiles)}
                  sandbox="allow-scripts"
                  className="w-full h-full border-none bg-black"
                />
              </div>
            </section>

            {/* Right 30%: AI Chat Assistant Sidebar */}
            <section className="w-[30%] h-full bg-[#05050a] flex flex-col shrink-0">
              <header className="h-10 bg-white/5 border-b border-white/5 px-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-sky-400 animate-pulse" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Neural Shard Assistant (30%)</h3>
                </div>
                <Badge className="bg-primary/20 text-primary border-none text-[8px] font-bold">READY</Badge>
              </header>
              
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] text-[11px] leading-relaxed italic text-white/70 text-left">
                    "I am locked in with the current shard logic buffer. Describe the visual modifications, grids, or logic operations you want configured, and I will refactor the React script instantly."
                  </div>
                  
                  {activeProject?.explanation && (
                    <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-[1.8rem] space-y-2 text-left">
                      <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Architect Commentary</span>
                      <p className="text-[10px] leading-relaxed italic text-white/80">{activeProject.explanation}</p>
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <p className="text-[8px] font-black uppercase text-muted-foreground ml-2">Quick Commands</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button onClick={() => handleArchitect(null as any, "Upgrade this UI. Add a dark glassmorphic cyber design theme with nice neon accents and gradient typography.")} variant="outline" className="h-10 text-[8px] font-black uppercase justify-start px-4 rounded-xl border-white/5 bg-white/5 hover:bg-sky-500/10 text-white">
                        <Sparkles className="w-3 h-3 mr-2 text-sky-400" /> Apply Cyber Aesthetic
                      </Button>
                      <Button onClick={() => handleArchitect(null as any, "Add a dynamic grid system showing dashboard cards with interactive stats and micro-animations.")} variant="outline" className="h-10 text-[8px] font-black uppercase justify-start px-4 rounded-xl border-white/5 bg-white/5 hover:bg-sky-500/10 text-white">
                        <Tv className="w-3 h-3 mr-2 text-sky-400" /> Add Dashboard Grid
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/5 bg-black/40">
                <form onSubmit={handleArchitect} className="relative">
                  <Input 
                    value={aiPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter architecture prompts..." 
                    className="h-14 bg-zinc-950 border-white/10 rounded-2xl pr-14 text-xs font-bold text-white focus:border-sky-500"
                  />
                  <Button disabled={isArchitecting || !aiPrompt.trim()} type="submit" size="icon" className="absolute right-1.5 top-1.5 h-11 w-11 bg-sky-600 rounded-xl hover:bg-sky-500 shadow-xl transition-all">
                    {isArchitecting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                  </Button>
                </form>
              </div>
            </section>
          </main>
        )}
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2.5rem] max-w-md text-white p-8 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
              <ShieldPlus className="w-6 h-6 text-sky-500" /> Initialize Shard
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[10px] italic">Create a new React code shard inside your user namespace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Project Name</label>
              <Input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="my-dynamic-shard" className="h-12 bg-black border-white/10 rounded-xl text-white font-bold" />
            </div>
            <Button onClick={handleCreateProject} disabled={!newProjName.trim()} className="w-full h-14 bg-sky-600 hover:bg-sky-500 rounded-xl font-black uppercase tracking-widest text-white shadow-xl italic">Create Shard</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog open={isNewFileModalOpen} onOpenChange={setIsNewFileModalOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2.5rem] max-w-md text-white p-8 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Plus className="w-6 h-6 text-sky-500" /> Add File Shard
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[10px] italic">Specify path and name for the new workspace module.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">File Name / Path</label>
              <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="components/Button.jsx" className="h-12 bg-black border-white/10 rounded-xl text-white font-bold" />
            </div>
            <Button onClick={handleCreateFile} disabled={!newFileName.trim()} className="w-full h-14 bg-sky-600 hover:bg-sky-500 rounded-xl font-black uppercase tracking-widest text-white shadow-xl italic">Create File</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
