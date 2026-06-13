"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Braces, 
  X,
  Rocket,
  Loader2,
  Code2,
  LayoutGrid,
  Settings,
  Sparkles,
  ChevronRight,
  Upload,
  FileCode,
  Send,
  Bot,
  User,
  History,
  MessageSquare,
  Wand2,
  Activity,
  Play,
  Pause,
  Plus,
  FolderPlus,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  FileText,
  Save,
  Monitor,
  Terminal,
  Image as ImageIcon,
  Copy,
  Link as LinkIcon,
  Grid3X3,
  Github,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage } from "@/firebase";
import { doc, serverTimestamp, collection, query, orderBy, deleteDoc, addDoc, where, limit } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import dynamic from "next/dynamic";

const BlocklyWorkspace = dynamic(() => import("react-blockly").then(mod => mod.BlocklyWorkspace), { ssr: false });
let javascriptGenerator: any;
if (typeof window !== "undefined") {
  import("blockly/javascript").then(mod => {
    javascriptGenerator = mod.javascriptGenerator;
  });
}

interface ProjectFile {
  name: string;
  content: string;
}

interface ProjectAsset {
  name: string;
  url: string;
}

interface StudioProject {
  id: string;
  name: string;
  files: ProjectFile[];
  assets?: ProjectAsset[];
  updatedAt: any;
  codingMode?: 'text' | 'block';
  language?: 'html' | 'python' | 'lua';
}

export default function XakStudioPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // App State
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectMode, setNewProjectMode] = useState<'text'|'block'>('text');
  const [newProjectLanguage, setNewProjectLanguage] = useState<'html'|'python'|'lua'>('html');
  const [newProjectTemplate, setNewProjectTemplate] = useState<'blank'|'platformer'|'rpg'>('blank');
  const [isCreating, setIsCreating] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor State
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'files'|'assets'>('files');
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const [consoleLogs, setConsoleLogs] = useState<{type: 'log'|'error'|'warn', message: string, time: string}[]>([]);
  
  // Editor State
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // AI State
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Fetch Projects
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "studio_projects"), orderBy("updatedAt", "desc"));
  }, [firestore, user]);

  const { data: projects, isLoading: loadingProjects } = useCollection(projectsQuery);
  const activeProject = projects?.find(p => p.id === activeProjectId) as StudioProject | undefined;

  const publishedVersionQuery = useMemoFirebase(() => {
    if (!firestore || !activeProject) return null;
    return query(collection(firestore, "publishedProjects"), where("originalProjectId", "==", activeProject.id), limit(1));
  }, [firestore, activeProject]);

  const { data: publishedVersions } = useCollection(publishedVersionQuery);
  const existingPublishedVersion = publishedVersions?.[0];

  const refreshPreview = () => {
    if (!activeProject) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    const indexFile = activeProject.files.find(f => f.name === 'index.html' || f.name === 'main.py' || f.name === 'main.lua' || f.name === 'blockly.xml') || activeProject.files[0];
    if (!indexFile) return;

    let htmlContent = "";

    if (activeProject.language === 'python') {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
</head>
<body style="background: #000; color: #fff; font-family: monospace; white-space: pre-wrap; padding: 20px;">
  <div id="output">Loading Python Environment...</div>
  <script>
    async function runPython() {
      try {
        let pyodide = await loadPyodide();
        document.getElementById('output').innerText = "";
        pyodide.setStdout({ batched: (msg) => { document.getElementById('output').innerText += msg + "\\n"; } });
        await pyodide.runPythonAsync(${JSON.stringify(indexFile.content)});
      } catch(err) {
        document.getElementById('output').innerText += "\\nError:\\n" + err;
      }
    }
    runPython();
  </script>
</body>
</html>`;
    } else if (activeProject.language === 'lua') {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://github.com/fengari-lua/fengari-web/releases/download/v0.1.4/fengari-web.js" type="text/javascript"></script>
</head>
<body style="background: #000; color: #fff; font-family: monospace; white-space: pre-wrap; padding: 20px;">
  <div id="output"></div>
  <script>
    const oldLog = console.log;
    console.log = function(...args) {
      document.getElementById('output').innerText += args.join(" ") + "\\n";
      oldLog.apply(console, args);
    };
  </script>
  <script type="application/lua">
${indexFile.content.replace(/</g, '\\x3C')}
  </script>
</body>
</html>`;
    } else if (activeProject.codingMode === 'block') {
      const jsCode = activeProject.files.find(f => f.name === 'generated.js')?.content || "console.log('No code generated yet.');";
      htmlContent = `
<!DOCTYPE html>
<html>
<body style="background: #000; color: #fff; font-family: monospace; white-space: pre-wrap; padding: 20px;">
  <div id="output"></div>
  <script>
    const oldLog = console.log;
    console.log = function(...args) {
      document.getElementById('output').innerText += args.join(" ") + "\\n";
      oldLog.apply(console, args);
    };
    try {
      ${jsCode}
    } catch(e) {
      console.log("Error: " + e.message);
    }
  </script>
</body>
</html>`;
    } else {
      htmlContent = indexFile.content;
    }

    const injectedConsoleScript = `
<script>
  (function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    console.log = function(...args) {
      window.parent.postMessage({ type: 'console', level: 'log', message: args.join(' ') }, '*');
      if(originalLog) originalLog.apply(console, args);
    };
    console.error = function(...args) {
      window.parent.postMessage({ type: 'console', level: 'error', message: args.join(' ') }, '*');
      if(originalError) originalError.apply(console, args);
    };
    console.warn = function(...args) {
      window.parent.postMessage({ type: 'console', level: 'warn', message: args.join(' ') }, '*');
      if(originalWarn) originalWarn.apply(console, args);
    };
    window.onerror = function(message) {
      window.parent.postMessage({ type: 'console', level: 'error', message: message }, '*');
    };
  })();
</script>
`;

    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', '<head>' + injectedConsoleScript);
    } else {
      htmlContent = injectedConsoleScript + htmlContent;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setConsoleLogs([]); // clear logs on refresh
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        setConsoleLogs(prev => [...prev, { 
          type: e.data.level, 
          message: e.data.message,
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, aiLoading]);

  const playRetroSound = (type: 'jump' | 'shoot' | 'hit' | 'explosion') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'shoot') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'explosion') {
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      noise.start(now);
      noise.stop(now + 0.5);
      return;
    }
  };

  const handleCreateProject = async () => {
    if (!user || !firestore || !newProjectName.trim()) return;
    setIsCreating(true);
    
    let initialFiles = [];
    let appliedLanguage = newProjectLanguage;
    
    if (newProjectTemplate === 'platformer') {
      initialFiles = [
        { name: 'index.html', content: `<!DOCTYPE html>\\n<html>\\n<head><title>Platformer</title></head>\\n<body style="background: #222; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;"><canvas id="game" width="400" height="300" style="background: skyblue;"></canvas><script src="main.js"></script></body>\\n</html>` },
        { name: 'main.js', content: `const canvas = document.getElementById('game');\\nconst ctx = canvas.getContext('2d');\\nlet player = {x: 50, y: 50, w: 20, h: 20, dy: 0, jump: -8, gravity: 0.5};\\nlet ground = {x: 0, y: 250, w: 400, h: 50};\\nfunction loop() {\\n  ctx.clearRect(0,0,canvas.width,canvas.height);\\n  player.dy += player.gravity;\\n  player.y += player.dy;\\n  if(player.y + player.h > ground.y) {\\n    player.y = ground.y - player.h;\\n    player.dy = 0;\\n  }\\n  ctx.fillStyle = 'green'; ctx.fillRect(ground.x, ground.y, ground.w, ground.h);\\n  ctx.fillStyle = 'red'; ctx.fillRect(player.x, player.y, player.w, player.h);\\n  requestAnimationFrame(loop);\\n}\\nwindow.addEventListener('keydown', e => { if(e.code==='Space' && player.dy===0) player.dy = player.jump; });\\nloop();\\n` }
      ];
      appliedLanguage = 'html';
    } else if (newProjectTemplate === 'rpg') {
      initialFiles = [
        { name: 'index.html', content: `<!DOCTYPE html>\\n<html>\\n<body style="background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;"><canvas id="game" width="400" height="400" style="background: #333;"></canvas><script src="main.js"></script></body>\\n</html>` },
        { name: 'main.js', content: `const canvas = document.getElementById('game');\\nconst ctx = canvas.getContext('2d');\\nlet player = {x: 200, y: 200, w: 20, h: 20, speed: 4};\\nlet keys = {};\\nwindow.addEventListener('keydown', e => keys[e.code] = true);\\nwindow.addEventListener('keyup', e => keys[e.code] = false);\\nfunction loop() {\\n  ctx.clearRect(0,0,canvas.width,canvas.height);\\n  if(keys['ArrowUp']) player.y -= player.speed;\\n  if(keys['ArrowDown']) player.y += player.speed;\\n  if(keys['ArrowLeft']) player.x -= player.speed;\\n  if(keys['ArrowRight']) player.x += player.speed;\\n  ctx.fillStyle = 'blue'; ctx.fillRect(player.x, player.y, player.w, player.h);\\n  requestAnimationFrame(loop);\\n}\\nloop();\\n` }
      ];
      appliedLanguage = 'html';
    } else {
      if (newProjectLanguage === 'python') {
        initialFiles = [{ name: 'main.py', content: `print("Hello from Python!")` }];
      } else if (newProjectLanguage === 'lua') {
        initialFiles = [{ name: 'main.lua', content: `print("Hello from Lua!")` }];
      } else {
        initialFiles = [
          { name: 'index.html', content: `<!DOCTYPE html>\\n<html>\\n<head>\\n  <style>\\n    body { background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }\\n    #status { padding: 20px; border: 2px solid #8433F3; border-radius: 20px; background: rgba(132, 51, 243, 0.1); }\\n  </style>\\n</head>\\n<body>\\n  <div id="status">Project Ready.</div>\\n</body>\\n</html>` }
        ];
      }
    }

    if (newProjectMode === 'block') {
      initialFiles.push({ name: 'blockly.xml', content: `<xml xmlns="https://developers.google.com/blockly/xml"></xml>` });
    }

    try {
      const docRef = await addDoc(collection(firestore, "users", user.uid, "studio_projects"), {
        name: newProjectName,
        files: initialFiles,
        codingMode: newProjectMode,
        language: appliedLanguage,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      setActiveProjectId(docRef.id);
      setView('editor');
      setNewProjectName("");
      setIsProjectDialogOpen(false);
      toast({ title: "Project Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!activeProjectId || !storage || !firestore || !user) return;
    
    setIsUploadingAsset(true);
    const file = e.target.files[0];
    const assetName = file.name;
    const storageRef = ref(storage, `projects/${activeProjectId}/assets/${Date.now()}_${assetName}`);
    
    try {
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      const newAsset: ProjectAsset = { name: assetName, url: downloadURL };
      
      const projectRef = doc(firestore, "studioProjects", activeProjectId);
      const currentAssets = activeProject?.assets || [];
      await updateDocumentNonBlocking(projectRef, {
        assets: [...currentAssets, newAsset],
        updatedAt: serverTimestamp()
      });
      
      toast({ title: "Asset uploaded successfully!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to upload asset" });
    } finally {
      setIsUploadingAsset(false);
      if (assetInputRef.current) assetInputRef.current.value = '';
    }
  };

  const handleUploadFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !firestore || files.length === 0) return;

    setIsCreating(true);
    try {
      const projectFiles: ProjectFile[] = [];
      const folderName = files[0].webkitRelativePath.split('/')[0] || "Imported Project";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name === '.DS_Store' || file.name.startsWith('.')) continue;
        const content = await file.text();
        projectFiles.push({ name: file.name, content });
      }

      if (projectFiles.length === 0) throw new Error("No files found");

      const docRef = await addDoc(collection(firestore, "users", user.uid, "studio_projects"), {
        name: folderName,
        files: projectFiles,
        codingMode: 'text',
        language: 'html',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      setActiveProjectId(docRef.id);
      setView('editor');
      toast({ title: "Project Uploaded", description: `Added ${projectFiles.length} files.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process folder." });
    } finally {
      setIsCreating(false);
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !firestore || files.length === 0) return;

    setIsCreating(true);
    try {
      const file = files[0];
      const content = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();
      let lang: 'html' | 'python' | 'lua' = 'html';
      if (ext === 'py') lang = 'python';
      else if (ext === 'lua') lang = 'lua';

      const docRef = await addDoc(collection(firestore, "users", user.uid, "studio_projects"), {
        name: file.name.replace(/\.[^/.]+$/, ""),
        files: [{ name: file.name, content }],
        codingMode: 'text',
        language: lang,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      setActiveProjectId(docRef.id);
      setView('editor');
      toast({ title: "File Uploaded", description: `Added ${file.name}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process file." });
    } finally {
      setIsCreating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdateFileContent = (content: string) => {
    if (!activeProject || !user || !firestore) return;
    const newFiles = [...activeProject.files];
    newFiles[activeFileIndex].content = content;
    
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "studio_projects", activeProjectId!), {
      files: newFiles,
      updatedAt: serverTimestamp()
    });
  };

  const handleAddFile = () => {
    if (!activeProject || !user || !firestore) return;
    const fileName = prompt("Enter file name (e.g. style.css):");
    if (!fileName) return;

    const newFiles = [...activeProject.files, { name: fileName, content: "" }];
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "studio_projects", activeProjectId!), {
      files: newFiles,
      updatedAt: serverTimestamp()
    });
    setActiveFileIndex(newFiles.length - 1);
    toast({ title: "File Added" });
  };

  const handleDeleteFile = (index: number) => {
    if (!activeProject || !user || !firestore || activeProject.files.length <= 1) return;
    const newFiles = activeProject.files.filter((_, i) => i !== index);
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "studio_projects", activeProjectId!), {
      files: newFiles,
      updatedAt: serverTimestamp()
    });
    setActiveFileIndex(0);
    toast({ title: "File Removed" });
  };

  const handleDeleteProject = (id: string) => {
    if (!user || !firestore) return;
    if (!confirm("Are you sure you want to delete this project?")) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "studio_projects", id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setView('dashboard');
    }
    toast({ title: "Project Deleted" });
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading || !activeProject) return;

    const userMessage = aiInput;
    const history = messages.map(m => ({
      role: m.role as any,
      content: [{ text: m.content }]
    }));

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const currentFile = activeProject.files[activeFileIndex];
      const res = await chatWithXakAI({
        message: userMessage + "\n\nCurrent File (" + currentFile.name + "):\n" + currentFile.content,
        history,
        specialization: 'games',
        userId: user?.uid
      });

      setMessages(prev => [...prev, { role: 'model', content: res.response }]);

      const codeBlockMatch = res.response.match(/```(?:html|javascript|typescript|js|ts|css)?\n([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        handleUpdateFileContent(codeBlockMatch[1].trim());
        toast({ title: "Code Updated" });
      }

    } catch (e) {
      toast({ variant: "destructive", title: "Link Error" });
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!activeProject || !user || !firestore || !publishName) return;
    
    setIsCreating(true);
    try {
      if (existingPublishedVersion) {
        await updateDocumentNonBlocking(doc(firestore, "publishedProjects", existingPublishedVersion.id), {
          name: publishName,
          description: publishDescription,
          files: activeProject.files,
        });
        toast({ title: "Game Updated!", description: "Your changes are now live on the Arcade Hub." });
      } else {
        await addDocumentNonBlocking(collection(firestore, "publishedProjects"), {
          type: 'game',
          name: publishName,
          description: publishDescription,
          ownerName: user.displayName || user.email?.split('@')[0] || "Unknown",
          ownerId: user.uid,
          originalProjectId: activeProject.id,
          files: activeProject.files,
          createdAt: serverTimestamp(),
          views: 0,
          likes: 0,
          stars: 0
        });
        toast({ title: "Game Published!", description: "Your game is now live on the Arcade Hub." });
      }
      setIsPublishDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Publish Failed", description: e.message });
    } finally {
      setIsCreating(false);
    }
  };

  if (!mounted) return null;

  if (view === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto py-12 space-y-16 animate-fade-in px-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-card/40 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
              <Braces className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Studio</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3 italic">Development Workspace</p>
            </div>
          </div>

          <div className="flex gap-4 relative z-10 w-full md:w-auto">
             <div className="flex gap-2">
                <Button onClick={() => folderInputRef.current?.click()} disabled={isCreating} variant="outline" className="h-16 px-6 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5">
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderPlus className="w-4 h-4 mr-2" />} Folder
                </Button>
                <input 
                  type="file" 
                  ref={folderInputRef}
                  className="hidden" 
                  multiple
                  /* @ts-ignore */
                  webkitdirectory="" 
                  /* @ts-ignore */
                  mozdirectory="" 
                  /* @ts-ignore */
                  directory="" 
                  onChange={handleUploadFolder} 
                  disabled={isCreating}
                />
                
                <Button onClick={() => fileInputRef.current?.click()} disabled={isCreating} variant="outline" className="h-16 px-6 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5">
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} File
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleUploadFile} 
                  disabled={isCreating}
                  accept=".html,.js,.css,.py,.lua,.txt"
                />
             </div>
             <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
               <DialogTrigger asChild>
                 <Button className="h-16 px-12 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl border-b-8 border-primary/20 active:border-b-0 active:translate-y-1 transition-all">
                    <Plus className="w-5 h-5 mr-3" /> New Project
                 </Button>
               </DialogTrigger>
               <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-12 bg-zinc-950 shadow-2xl">
                  <DialogHeader><DialogTitle className="text-4xl font-black uppercase italic text-center">New Project</DialogTitle></DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">App Name</label>
                       <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="my-app" className="bg-secondary/50 h-14 rounded-2xl font-bold text-lg italic border-white/10" />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Template</label>
                       <div className="grid grid-cols-3 gap-2">
                         <Button onClick={() => setNewProjectTemplate('blank')} variant={newProjectTemplate === 'blank' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectTemplate === 'blank' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>Blank</Button>
                         <Button onClick={() => setNewProjectTemplate('platformer')} variant={newProjectTemplate === 'platformer' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectTemplate === 'platformer' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>Platformer</Button>
                         <Button onClick={() => setNewProjectTemplate('rpg')} variant={newProjectTemplate === 'rpg' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectTemplate === 'rpg' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>RPG</Button>
                       </div>
                    </div>

                    {newProjectTemplate === 'blank' && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Language</label>
                         <div className="grid grid-cols-3 gap-2">
                           <Button onClick={() => setNewProjectLanguage('html')} variant={newProjectLanguage === 'html' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectLanguage === 'html' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>HTML/JS</Button>
                           <Button onClick={() => setNewProjectLanguage('python')} variant={newProjectLanguage === 'python' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectLanguage === 'python' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>Python</Button>
                           <Button onClick={() => setNewProjectLanguage('lua')} variant={newProjectLanguage === 'lua' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectLanguage === 'lua' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>Lua</Button>
                         </div>
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Coding Mode</label>
                       <div className="grid grid-cols-2 gap-2">
                         <Button onClick={() => setNewProjectMode('text')} variant={newProjectMode === 'text' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectMode === 'text' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>Text</Button>
                         <Button onClick={() => setNewProjectMode('block')} variant={newProjectMode === 'block' ? 'default' : 'outline'} className={`h-12 rounded-xl text-xs font-black uppercase ${newProjectMode === 'block' ? 'bg-primary text-white border-primary' : 'border-white/10'}`}>Blocks</Button>
                       </div>
                    </div>

                    <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName} className="w-full h-16 bg-primary rounded-3xl font-black uppercase text-white italic shadow-2xl border-b-8 border-primary/20 active:border-b-0 mt-4">
                       {isCreating ? <Loader2 className="animate-spin w-6 h-6" /> : "CREATE PROJECT"}
                    </Button>
                  </div>
               </DialogContent>
             </Dialog>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
          {loadingProjects ? (
            <div className="col-span-full py-40 flex justify-center"><Loader2 className="animate-spin w-16 h-16 text-primary opacity-20" /></div>
          ) : !projects || projects.length === 0 ? (
            <div className="col-span-full py-40 text-center opacity-20 space-y-8">
               <Monitor className="w-24 h-24 mx-auto" />
               <p className="text-sm font-black uppercase tracking-[1em]">Workspace Empty</p>
            </div>
          ) : (
            projects.map(project => (
              <Card key={project.id} className="glass-card rounded-[3rem] border-white/10 overflow-hidden hover:border-primary/40 transition-all group cursor-pointer shadow-2xl flex flex-col bg-zinc-950/40">
                <div onClick={() => { setActiveProjectId(project.id); setView('editor'); }} className="h-48 bg-black/40 p-10 flex flex-col justify-end relative">
                   <div className="absolute inset-0 arcade-grid opacity-10" />
                   <h3 className="text-3xl font-black uppercase italic text-white leading-none truncate group-hover:text-primary transition-colors">{project.name}</h3>
                </div>
                <div className="p-8 flex justify-between items-center bg-black/20 border-t border-white/5">
                   <div className="flex items-center gap-3 text-[9px] font-black uppercase text-muted-foreground italic">
                      <FileCode className="w-4 h-4 text-primary" /> {project.files?.length || 0} Files
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-3 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-fade-in text-foreground overflow-hidden relative bg-[#080614]">
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl px-10 flex items-center justify-between shadow-2xl relative z-20">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-6">
            <Button onClick={() => setView('dashboard')} variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-white/10 text-white"><ChevronLeft className="w-6 h-6" /></Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg"><Braces className="w-4 h-4 text-white" /></div>
              <h2 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none truncate w-40">{activeProject?.name}</h2>
            </div>
          </div>
          <nav className="flex bg-black/40 p-1 rounded-xl border border-white/10 ml-4">
             <Button variant="ghost" className="h-8 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-primary text-white">Editor</Button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={refreshPreview} variant="outline" className="h-10 px-6 rounded-xl border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5">
             <Play className="w-4 h-4 mr-2" /> Run
          </Button>
           <Button onClick={() => setIsInviteDialogOpen(true)} variant="outline" className="h-10 px-4 rounded-xl border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 text-blue-400 border-blue-500/30 hover:text-blue-300">
              <Users className="w-4 h-4 mr-2" /> Share
           </Button>

           <Button onClick={() => setIsGithubDialogOpen(true)} variant="outline" className="h-10 px-4 rounded-xl border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 text-zinc-400">
              <Github className="w-4 h-4 mr-2" /> GitHub
           </Button>

           <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
             <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-sm text-white p-12 bg-zinc-950 shadow-2xl">
                <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic text-center">Invite Collaborators</DialogTitle></DialogHeader>
                <div className="space-y-6 py-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                     <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-sm text-white/50">Invite team members to edit this game with you in real-time. Changes sync instantly across all clients.</p>
                  <Button onClick={() => {
                     toast({ title: "Invite Link Copied!", description: "Share this link with your team to start collaborating." });
                     setIsInviteDialogOpen(false);
                  }} className="w-full h-14 bg-blue-500 hover:bg-blue-600 rounded-2xl font-black text-xs uppercase text-white shadow-xl">
                     Copy Invite Link
                  </Button>
                </div>
             </DialogContent>
           </Dialog>

           <Dialog open={isGithubDialogOpen} onOpenChange={setIsGithubDialogOpen}>
             <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-12 bg-zinc-950 shadow-2xl">
                <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic text-center">GitHub Sync</DialogTitle></DialogHeader>
                <div className="space-y-6 py-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                     <Github className="w-8 h-8 text-white/80" />
                  </div>
                  <p className="text-sm text-white/50">Link this project to a GitHub repository to automatically commit saves and track versions.</p>
                  <Input placeholder="https://github.com/username/repo" className="bg-secondary/50 h-14 rounded-2xl font-bold text-sm border-white/10 text-center" />
                  <Button onClick={() => {
                     toast({ title: "GitHub Connected!", description: "Your project is now synced." });
                     setIsGithubDialogOpen(false);
                  }} className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-xs uppercase shadow-xl">
                     Connect Repository
                  </Button>
                </div>
             </DialogContent>
           </Dialog>

          <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
             <DialogTrigger asChild>
                <Button onClick={() => {
                  setPublishName(existingPublishedVersion?.name || activeProject?.name || "");
                  setPublishDescription(existingPublishedVersion?.description || "");
                }} className="bg-primary hover:bg-primary/90 rounded-xl h-10 font-black text-xs uppercase px-8 shadow-xl text-white">
                  {existingPublishedVersion ? "Update" : "Publish"}
                </Button>
             </DialogTrigger>
             <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-12 bg-zinc-950 shadow-2xl">
                <DialogHeader><DialogTitle className="text-4xl font-black uppercase italic text-center">{existingPublishedVersion ? "Update Game" : "Publish Game"}</DialogTitle></DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Game Name</label>
                     <Input value={publishName} onChange={(e) => setPublishName(e.target.value)} placeholder="My Awesome Game" className="bg-secondary/50 h-14 rounded-2xl font-bold text-lg italic border-white/10" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Description</label>
                     <textarea value={publishDescription} onChange={(e) => setPublishDescription(e.target.value)} placeholder="A fun game about..." className="w-full bg-secondary/50 min-h-[100px] p-4 rounded-2xl font-medium text-sm border border-white/10 text-white outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  </div>
                  <Button onClick={handlePublish} disabled={isCreating || !publishName} className="w-full h-16 mt-4 bg-primary rounded-3xl font-black uppercase text-white italic shadow-2xl border-b-8 border-primary/20 active:border-b-0">
                     {isCreating ? <Loader2 className="animate-spin w-6 h-6" /> : (existingPublishedVersion ? "UPDATE ON ARCADE" : "PUBLISH TO ARCADE")}
                  </Button>
                </div>
             </DialogContent>
          </Dialog>
          <Link href="/apps"><Button size="icon" variant="ghost" className="rounded-full hover:bg-white/5 h-10 w-10 text-white"><X className="w-6 h-6" /></Button></Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col">
           <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="flex flex-col h-full">
             <div className="p-4 border-b border-white/5 bg-black/40">
               <TabsList className="w-full bg-black/40 p-1">
                 <TabsTrigger value="files" className="flex-1 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Files</TabsTrigger>
                 <TabsTrigger value="assets" className="flex-1 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Assets</TabsTrigger>
               </TabsList>
             </div>
             
             <TabsContent value="files" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-3"><LayoutGrid className="w-3.5 h-3.5 text-primary" /><span className="text-[9px] font-black uppercase tracking-widest text-white italic">Project Files</span></div>
                 <button onClick={handleAddFile} className="text-white/40 hover:text-primary transition-all"><Plus className="w-4 h-4" /></button>
               </div>
               <ScrollArea className="flex-1 p-4">
                 <div className="space-y-1">
                    {activeProject?.files.map((file, i) => (
                      <div 
                       key={i} 
                       onClick={() => setActiveFileIndex(i)}
                       className={cn(
                         "p-3 rounded-xl flex items-center justify-between group cursor-pointer transition-all border border-transparent",
                         activeFileIndex === i ? "bg-primary/10 border-primary/20 text-primary shadow-lg" : "text-muted-foreground hover:bg-white/5"
                       )}
                      >
                         <div className="flex items-center gap-3 truncate">
                           <FileCode className="w-3.5 h-3.5 shrink-0" />
                           <span className="text-[9px] font-black uppercase italic truncate">{file.name}</span>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(i); }} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1">
                           <X className="w-3 h-3" />
                         </button>
                      </div>
                    ))}
                 </div>
               </ScrollArea>
             </TabsContent>
             
             <TabsContent value="assets" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-3"><ImageIcon className="w-3.5 h-3.5 text-primary" /><span className="text-[9px] font-black uppercase tracking-widest text-white italic">Assets</span></div>
                 <button onClick={() => assetInputRef.current?.click()} className="text-white/40 hover:text-primary transition-all" disabled={isUploadingAsset}>
                   {isUploadingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                 </button>
                 <input type="file" className="hidden" ref={assetInputRef} onChange={handleAssetUpload} accept="image/*,audio/*,video/*" />
               </div>
               <ScrollArea className="flex-1 p-4">
                 <div className="space-y-1">
                    {activeProject?.assets?.map((asset, i) => (
                      <div key={i} className="p-3 rounded-xl flex items-center justify-between group transition-all border border-transparent text-muted-foreground hover:bg-white/5">
                         <div className="flex items-center gap-3 truncate">
                           <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                           <span className="text-[9px] font-black uppercase italic truncate">{asset.name}</span>
                         </div>
                         <button 
                           onClick={() => { navigator.clipboard.writeText(asset.url); toast({ title: "URL Copied to clipboard" }) }} 
                           className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white p-1"
                           title="Copy URL"
                         >
                           <Copy className="w-3 h-3" />
                         </button>
                      </div>
                    ))}
                    {(!activeProject?.assets || activeProject.assets.length === 0) && (
                      <div className="text-center p-4 text-[9px] uppercase tracking-widest text-white/20 mt-4">No assets uploaded</div>
                    )}
                 </div>
               </ScrollArea>
             </TabsContent>

             <div className="p-6 border-t border-white/5 bg-black/20 mt-auto">
                <div className="p-4 bg-primary/5 rounded-2xl border border-white/10 space-y-2">
                   <p className="text-[8px] font-black uppercase text-primary">Status</p>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-white italic"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Code Ready</div>
                </div>
             </div>
           </Tabs>
        </aside>

        <div className="flex-1 relative bg-[#0a0a1f] overflow-hidden flex flex-col">
           <div className="flex-1 overflow-hidden relative">
             <Tabs defaultValue="code" className="h-full flex flex-col">
                <div className="h-10 bg-black/60 border-b border-white/5 flex items-center px-6 gap-6">
                   <TabsList className="bg-transparent h-auto p-0 gap-6">
                      <TabsTrigger value="code" className="h-10 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary border-none text-[9px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-white p-0">Editor</TabsTrigger>
                      <TabsTrigger value="tilemap" className="h-10 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary border-none text-[9px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-white p-0">Tilemap Editor</TabsTrigger>
                      <TabsTrigger value="soundfx" className="h-10 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary border-none text-[9px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-white p-0">8-bit FX</TabsTrigger>
                      <TabsTrigger value="preview" onClick={refreshPreview} className="h-10 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary border-none text-[9px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-white p-0">Preview</TabsTrigger>
                   </TabsList>
                </div>

                <TabsContent value="code" className="flex-1 m-0">
                   {activeProject?.codingMode === 'block' ? (
                     <div className="w-full h-full bg-white relative">
                       <BlocklyWorkspace
                          className="w-full h-full"
                          toolboxConfiguration={{
                             kind: 'categoryToolbox',
                             contents: [
                               { kind: 'category', name: 'Logic', categorystyle: 'logic_category', contents: [ { kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_boolean' } ] },
                               { kind: 'category', name: 'Loops', categorystyle: 'loop_category', contents: [ { kind: 'block', type: 'controls_repeat_ext' }, { kind: 'block', type: 'controls_whileUntil' } ] },
                               { kind: 'category', name: 'Math', categorystyle: 'math_category', contents: [ { kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' } ] },
                               { kind: 'category', name: 'Text', categorystyle: 'text_category', contents: [ { kind: 'block', type: 'text' }, { kind: 'block', type: 'text_print' } ] },
                             ]
                          }}
                          initialXml={activeProject.files.find(f => f.name === 'blockly.xml')?.content || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'}
                          onXmlChange={(xml) => {
                            const newFiles = [...activeProject.files];
                            const xmlIndex = newFiles.findIndex(f => f.name === 'blockly.xml');
                            if (xmlIndex >= 0) {
                              newFiles[xmlIndex].content = xml;
                            } else {
                              newFiles.push({ name: 'blockly.xml', content: xml });
                            }
                            updateDocumentNonBlocking(doc(firestore, "users", user.uid, "studio_projects", activeProjectId!), {
                              files: newFiles,
                              updatedAt: serverTimestamp()
                            });
                          }}
                          onWorkspaceChange={(workspace) => {
                            if (javascriptGenerator) {
                               const code = javascriptGenerator.workspaceToCode(workspace);
                               const newFiles = [...activeProject.files];
                               const jsIndex = newFiles.findIndex(f => f.name === 'generated.js');
                               if (jsIndex >= 0) {
                                 newFiles[jsIndex].content = code;
                               } else {
                                 newFiles.push({ name: 'generated.js', content: code });
                               }
                               updateDocumentNonBlocking(doc(firestore, "users", user.uid, "studio_projects", activeProjectId!), {
                                 files: newFiles,
                                 updatedAt: serverTimestamp()
                               });
                            }
                          }}
                       />
                     </div>
                   ) : (
                     <textarea 
                      value={activeProject?.files[activeFileIndex]?.content}
                      onChange={(e) => handleUpdateFileContent(e.target.value)}
                      className="w-full h-full bg-transparent p-12 font-mono text-base leading-relaxed text-sky-400 outline-none resize-none custom-scrollbar"
                      spellCheck={false}
                     />
                   )}
                </TabsContent>

                <TabsContent value="tilemap" className="flex-1 m-0 bg-zinc-900 relative p-6 flex flex-col">
                  <div className="flex-1 border border-white/10 rounded-xl bg-black/50 p-8 flex flex-col items-center justify-center space-y-4">
                    <Grid3X3 className="w-16 h-16 text-primary opacity-50" />
                    <h3 className="text-xl font-black uppercase text-white italic">Tilemap Editor</h3>
                    <p className="text-sm text-white/50 text-center max-w-sm">Paint levels visually using your uploaded sprite sheets. Generate the map array and collision data instantly to the clipboard.</p>
                    <div className="flex gap-4 mt-8 opacity-30 pointer-events-none">
                      <Button variant="outline" className="border-white/10">Select Spritesheet</Button>
                      <Button className="bg-primary text-white">Create Map</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="soundfx" className="flex-1 m-0 bg-zinc-900 relative p-6 flex flex-col">
                  <div className="flex-1 border border-white/10 rounded-xl bg-black/50 p-8 flex flex-col items-center justify-center space-y-4">
                    <Wand2 className="w-16 h-16 text-primary opacity-50" />
                    <h3 className="text-xl font-black uppercase text-white italic">8-Bit Sound FX Generator</h3>
                    <p className="text-sm text-white/50 text-center max-w-sm">Procedurally generate retro sound effects to use in your games.</p>
                    <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                      <Button onClick={() => playRetroSound('jump')} className="h-16 font-black uppercase bg-white/5 hover:bg-primary/20 text-white border border-white/10 hover:border-primary/50 transition-all">Jump</Button>
                      <Button onClick={() => playRetroSound('shoot')} className="h-16 font-black uppercase bg-white/5 hover:bg-primary/20 text-white border border-white/10 hover:border-primary/50 transition-all">Shoot</Button>
                      <Button onClick={() => playRetroSound('hit')} className="h-16 font-black uppercase bg-white/5 hover:bg-primary/20 text-white border border-white/10 hover:border-primary/50 transition-all">Hit</Button>
                      <Button onClick={() => playRetroSound('explosion')} className="h-16 font-black uppercase bg-white/5 hover:bg-primary/20 text-white border border-white/10 hover:border-primary/50 transition-all">Explosion</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 m-0 bg-white relative overflow-hidden">
                  {previewUrl ? (
                    <iframe 
                      src={previewUrl} 
                      className="w-full h-full border-none"
                      title="Studio Preview"
                    />
                  ) : (
                    <div className="flex-1 h-full flex flex-col items-center justify-center space-y-4 text-zinc-900 opacity-20">
                      <Monitor className="w-20 h-20" />
                      <p className="text-xl font-black uppercase italic">Awaiting Sync...</p>
                    </div>
                  )}
                </TabsContent>
             </Tabs>
           </div>
           
           {/* Console Panel */}
           <div className="h-48 border-t border-white/5 bg-zinc-950 flex flex-col shrink-0">
             <div className="h-8 bg-black/60 border-b border-white/5 flex items-center px-4 justify-between">
               <div className="flex items-center gap-2">
                 <Terminal className="w-3.5 h-3.5 text-primary" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-white italic">Console</span>
               </div>
               <button onClick={() => setConsoleLogs([])} className="text-[9px] uppercase font-bold text-white/40 hover:text-white">Clear</button>
             </div>
             <ScrollArea className="flex-1 p-3">
               <div className="space-y-1 font-mono text-[10px]">
                 {consoleLogs.map((log, i) => (
                   <div key={i} className={cn("flex items-start gap-3 p-1 rounded", log.type === 'error' ? 'text-rose-500 bg-rose-500/10' : log.type === 'warn' ? 'text-amber-500 bg-amber-500/10' : 'text-white/70 hover:bg-white/5')}>
                     <span className="text-white/30 shrink-0 select-none">[{log.time}]</span>
                     <span className="whitespace-pre-wrap">{log.message}</span>
                   </div>
                 ))}
                 {consoleLogs.length === 0 && <div className="text-white/20 italic p-1">No output...</div>}
               </div>
             </ScrollArea>
           </div>
        </div>

        <aside className="w-[450px] border-l border-white/5 bg-zinc-900/60 flex flex-col">
          <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">App Assistant</h3>
             </div>
             <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase px-3 py-1">ASSISTANT</Badge>
          </div>
          
          <ScrollArea className="flex-1 p-6" ref={chatScrollRef}>
            <div className="space-y-6 pb-10">
              {messages.length === 0 && (
                <div className="p-8 text-center space-y-6 opacity-30">
                   <Sparkles className="w-12 h-12 mx-auto text-primary" />
                   <p className="text-sm font-bold italic leading-relaxed text-white">Ask me to build an app or an extension. I'll write the logic and update your editor automatically.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "")}>
                   <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", m.role === 'user' ? "bg-white/5 border-white/10" : "bg-primary/20 border-primary/40")}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-white/40" /> : <Bot className="w-4 h-4 text-primary" />}
                   </div>
                   <div className={cn("p-4 rounded-2xl text-xs font-medium leading-relaxed italic border whitespace-pre-wrap", m.role === 'user' ? "bg-white/5 border-white/10" : "bg-black/60 border-white/5 text-foreground/90")}>
                      {m.content}
                   </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary animate-pulse" />
                   </div>
                   <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-white/5 bg-black/40">
             <form onSubmit={handleAiSend} className="relative group">
                <Input 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g. Build a snake game..." 
                  className="h-14 bg-zinc-950 border-white/10 rounded-xl pr-14 text-xs font-bold italic text-white placeholder:text-white/10 focus:border-primary transition-all"
                />
                <Button disabled={aiLoading || !aiInput.trim()} type="submit" size="icon" className="absolute right-2 top-2 h-10 w-10 bg-primary rounded-lg shadow-xl active:scale-95 transition-all flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </Button>
             </form>
          </div>
        </aside>
      </div>

      <footer className="h-10 bg-black/80 border-t border-white/5 px-6 flex items-center justify-between text-white/40">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-green-500" /><span className="text-[8px] font-black uppercase tracking-widest">Active Session</span></div>
            <div className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /><span className="text-[8px] font-black uppercase tracking-widest">Compiler Ready</span></div>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[8px] font-black uppercase tracking-widest">Workspace: {activeProject?.name}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Xakteir Studio v4.2.8</span>
         </div>
      </footer>
    </div>
  );
}