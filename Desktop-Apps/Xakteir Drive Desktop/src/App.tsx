import { useEffect, useState, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { upload } from '@vercel/blob/client';
import { Folder, File, UploadCloud, Plus, Search, MoreVertical, LogOut, HardDrive } from 'lucide-react';
import clsx from 'clsx';

// Types
type DriveFile = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  url?: string;
  size?: number;
  createdAt: any;
  parentId: string | null;
};

// Titlebar Component
function Titlebar() {
  const appWindow = getCurrentWindow();

  return (
    <div data-tauri-drag-region className="h-10 select-none flex justify-between items-center bg-neutral-900 border-b border-neutral-800">
      <div data-tauri-drag-region className="flex items-center pl-4 gap-2">
        <svg data-tauri-drag-region className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
        <span data-tauri-drag-region className="text-sm font-semibold text-neutral-300 tracking-wide">Xakteir Drive</span>
      </div>
      <div className="flex h-full">
        <button className="w-12 h-full inline-flex justify-center items-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" onClick={() => appWindow.minimize()}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <button className="w-12 h-full inline-flex justify-center items-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" onClick={() => appWindow.toggleMaximize()}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4z" />
          </svg>
        </button>
        <button className="w-12 h-full inline-flex justify-center items-center hover:bg-red-500 text-neutral-400 hover:text-white transition-colors" onClick={() => appWindow.close()}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Login Component
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white overflow-hidden rounded-lg">
      <Titlebar />
      <div className="flex-1 flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
          <h2 className="text-2xl font-semibold mb-6 text-center">Sign in to Xakteir</h2>
          {error && <div className="p-3 mb-4 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 focus:border-indigo-500 outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 focus:border-indigo-500 outline-none transition-colors" required />
            </div>
            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 rounded transition-colors mt-2">Sign In</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch Files
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, `users/${user.uid}/drive`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs: DriveFile[] = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() } as DriveFile));
      setFiles(docs);
    });
    return () => unsub();
  }, [user]);

  // Derived state
  const visibleFiles = files.filter(f => f.parentId === currentFolder);

  // Create Folder
  const handleCreateFolder = async () => {
    if (!user) return;
    const name = prompt("Folder Name:");
    if (!name) return;
    await addDoc(collection(db, `users/${user.uid}/drive`), {
      name,
      type: 'folder',
      parentId: currentFolder,
      createdAt: serverTimestamp()
    });
  };

  // Upload File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadProgress(0);

    try {
      // Connect to Live Vercel Blob Endpoint
      const uploadedBlob = await upload(`users/${user.uid}/drive/${Date.now()}_${file.name}`, file, {
        access: 'public',
        handleUploadUrl: 'https://drive.xakteir.com/api/upload', 
        onUploadProgress: (ev) => setUploadProgress(ev.percentage)
      });

      await addDoc(collection(db, `users/${user.uid}/drive`), {
        name: file.name,
        type: 'file',
        url: uploadedBlob.url,
        size: file.size,
        parentId: currentFolder,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      alert("Upload failed. Make sure the web app is deployed with the Vercel Blob keys!");
    } finally {
      setUploadProgress(null);
    }
  };

  if (loading) return <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center text-neutral-500">Loading...</div>;
  if (!user) return <Login />;

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white overflow-hidden rounded-lg">
      <Titlebar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate text-sm font-medium text-neutral-300">{user.email}</div>
          </div>
          
          <div className="space-y-1">
            <button onClick={() => setCurrentFolder(null)} className={clsx("w-full text-left px-3 py-2 rounded flex items-center gap-3 font-medium transition-colors", currentFolder === null ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-neutral-800 text-neutral-400")}>
              <HardDrive className="w-4 h-4" /> My Drive
            </button>
          </div>

          <div className="mt-auto">
            <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-300 font-semibold uppercase tracking-wider">X: Drive Sync</span>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              </div>
              <p className="text-[10px] text-neutral-500">Service is active but folder is not yet mounted.</p>
              <button className="mt-3 w-full py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium text-neutral-200 transition-colors">
                Configure
              </button>
            </div>
            <button onClick={() => auth.signOut()} className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-neutral-950 relative">
          {/* Header */}
          <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-200">
              {currentFolder ? (
                <>
                  <button onClick={() => setCurrentFolder(null)} className="hover:text-indigo-400">My Drive</button>
                  <span className="text-neutral-600">/</span>
                  <span>{files.find(f => f.id === currentFolder)?.name}</span>
                </>
              ) : "My Drive"}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" placeholder="Search files..." className="bg-neutral-900 border border-neutral-800 text-sm rounded-full pl-9 pr-4 py-1.5 focus:border-indigo-500 outline-none w-64" />
              </div>
              <button onClick={handleCreateFolder} className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Folder
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> Upload
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {/* Upload Progress Overlay */}
          {uploadProgress !== null && (
            <div className="absolute top-16 left-0 w-full h-1 bg-neutral-800">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}

          {/* File Grid Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {visibleFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                <UploadCloud className="w-12 h-12 mb-4 opacity-50" />
                <p>This folder is empty.</p>
                <p className="text-sm">Drag and drop files here to upload.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visibleFiles.map(file => (
                  <div 
                    key={file.id} 
                    onDoubleClick={() => file.type === 'folder' && setCurrentFolder(file.id)}
                    className="group flex flex-col p-4 bg-neutral-900/50 border border-neutral-800/80 rounded-xl hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {file.type === 'folder' ? (
                        <Folder className="w-10 h-10 text-indigo-400 fill-indigo-400/20" />
                      ) : (
                        <File className="w-10 h-10 text-emerald-400 fill-emerald-400/20" />
                      )}
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded text-neutral-400 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-neutral-300 group-hover:text-white truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1">
                      {file.type === 'folder' ? 'Folder' : `${((file.size || 0) / 1024 / 1024).toFixed(2)} MB`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
