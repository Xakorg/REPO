"use client";

import React, { useState, useEffect } from 'react';
import { useSuiteStore } from '@/lib/store';
import { Settings, Share, MessageSquare, History, Wand2, Plus, FileText, ArrowLeft, Printer, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { XakteirEditor } from '@/components/editor/XakteirEditor';
import { useUser, useFirestore } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function XakteirWrite() {
  const { isFocusMode, toggleFocusMode } = useSuiteStore();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const docId = searchParams.get('id');
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [content, setContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!firestore || !user) return;
    
    if (docId) {
      // Load specific document
      const loadDoc = async () => {
        try {
           const ref = doc(firestore, 'write_docs', docId);
           const snap = await getDoc(ref);
           if (snap.exists() && (snap.data().ownerId === user.uid || snap.data().collaborators?.includes(user.uid))) {
              setActiveDoc({ id: snap.id, ...snap.data() });
              setContent(snap.data().content || `<h1>Untitled Document</h1><p></p>`);
           } else {
              router.push('/write');
           }
        } catch (e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
      };
      loadDoc();
    } else {
      // Load dashboard
      const loadDashboard = async () => {
        try {
           const q = query(collection(firestore, 'write_docs'), where('ownerId', '==', user.uid), orderBy('updatedAt', 'desc'));
           const snap = await getDocs(q);
           setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
      };
      loadDashboard();
    }
  }, [firestore, user, docId, router]);

  const handleCreateNew = async () => {
    if (!firestore || !user) return;
    setLoading(true);
    const newDoc = await addDoc(collection(firestore, 'write_docs'), {
       title: 'Untitled Document',
       content: `<h1>Untitled Document</h1><p></p>`,
       ownerId: user.uid,
       collaborators: [],
       createdAt: serverTimestamp(),
       updatedAt: serverTimestamp()
    });
    window.location.href = `/write?id=${newDoc.id}`;
  };

  const saveContent = async (html: string, plainText: string) => {
    if (!firestore || !user || !docId || !activeDoc) return;
    
    // Update stats locally
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setCharCount(plainText.length);
    
    // Extract title from h1 if present
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
    const newTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled Document';
    
    setSaving(true);
    try {
      await setDoc(doc(firestore, 'write_docs', docId), {
         content: html,
         title: newTitle,
         updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {}
    setSaving(false);
  };

  if (loading) {
     return <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  // --- DASHBOARD VIEW ---
  if (!docId) {
     return (
       <div className="min-h-screen bg-[#05030d] text-white pt-24 px-8 pb-32">
          <div className="max-w-[1200px] mx-auto">
             <div className="flex items-center justify-between mb-12">
                <div>
                   <h1 className="text-4xl font-black tracking-tighter mb-2">Xakteir Write</h1>
                   <p className="text-white/60">Your beautiful, distraction-free documents.</p>
                </div>
                <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-xl h-12 px-6">
                   <Plus className="w-5 h-5 mr-2" /> New Document
                </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {documents.map((d, i) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                     key={d.id} 
                     onClick={() => window.location.href = `/write?id=${d.id}`}
                     className="bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 transition-all rounded-3xl p-6 cursor-pointer group flex flex-col aspect-[4/5]"
                   >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                         <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{d.title || 'Untitled Document'}</h3>
                      <div className="mt-auto flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                         <span>Just now</span>
                      </div>
                   </motion.div>
                ))}
             </div>
          </div>
       </div>
     );
  }

  // --- EDITOR VIEW ---
  return (
    <div className={`min-h-screen flex flex-col bg-[#05030d] text-white pt-24 transition-colors duration-700 ${isFocusMode ? 'bg-black' : ''}`}>
      {/* Document Toolbar */}
      <div className={`fixed top-20 left-0 right-0 h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 flex items-center px-6 transition-transform duration-500 z-40 ${isFocusMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = '/write'} className="text-white/60 hover:text-white rounded-xl mr-2"><ArrowLeft className="w-4 h-4" /></Button>
          <span className="font-bold text-sm text-white/80 max-w-[200px] truncate pr-4 border-r border-white/10">{activeDoc?.title || 'Untitled'}</span>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black hidden md:flex">File</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black hidden md:flex">Edit</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-black hidden md:flex">View</Button>
        </div>
        <div className="ml-auto flex gap-2">
           {saving && <span className="text-[10px] font-black uppercase text-white/40 mr-4 self-center tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Saving...</span>}
           <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-white/60 hover:text-white gap-2 font-black uppercase text-[10px] tracking-widest"><Printer className="w-3 h-3" /> Print</Button>
           <Button variant="outline" size="sm" onClick={() => setIsPublishModalOpen(true)} className="border-white/10 bg-zinc-900 text-white gap-2 font-black uppercase text-[10px] tracking-widest"><Share className="w-3 h-3" /> Share</Button>
           <Button variant="default" size="sm" className="bg-primary text-black font-black uppercase tracking-widest text-[10px]"><Wand2 className="w-3 h-3 mr-2" /> Xak AI</Button>
        </div>
      </div>

      <div className="flex-1 flex justify-center p-8 mt-10">
         <div className={`w-full max-w-[850px] min-h-[1100px] bg-white text-black p-12 md:p-24 shadow-2xl rounded-sm relative transition-all duration-700 ${isFocusMode ? 'shadow-none bg-black text-white/90 p-4 md:p-12' : ''}`}>
            {content === null ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : (
               <XakteirEditor 
                  initialContent={content} 
                  onChange={(html, text) => saveContent(html, text)} 
                  isFocusMode={isFocusMode}
               />
            )}
         </div>
      </div>

      {/* Analytics Widget (Hide in Focus Mode) */}
      <div className={`fixed bottom-8 left-8 bg-zinc-900 border border-white/10 rounded-2xl p-4 flex gap-6 shadow-2xl transition-all duration-500 z-40 ${isFocusMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
         <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Words</div>
            <div className="text-xl font-black text-white">{wordCount}</div>
         </div>
         <div className="w-px bg-white/10" />
         <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Characters</div>
            <div className="text-xl font-black text-white">{charCount}</div>
         </div>
         <div className="w-px bg-white/10" />
         <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Read Time</div>
            <div className="text-xl font-black text-white">{Math.max(1, Math.ceil(wordCount / 200))} min</div>
         </div>
      </div>

      {/* Floating Action Menu */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 transition-opacity duration-500 ${isFocusMode ? 'opacity-20 hover:opacity-100' : ''}`}>
        <Button onClick={toggleFocusMode} variant="ghost" size="icon" className={`rounded-full transition-colors ${isFocusMode ? 'bg-primary text-black hover:bg-primary/90' : 'hover:bg-white/10 text-white/60 hover:text-white'}`} title="Toggle Focus Mode (F)">
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60 hover:text-white">
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60 hover:text-white">
          <History className="w-4 h-4" />
        </Button>
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
         {isPublishModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-[500px] w-full shadow-2xl relative">
                <Button variant="ghost" size="icon" onClick={() => setIsPublishModalOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white rounded-xl"><Settings className="w-5 h-5" /></Button>
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                   <Share className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Publish Document</h2>
                <p className="text-white/60 mb-8">Share this link to let anyone read your document. It will be beautifully formatted and distraction-free.</p>
                
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-6">
                   <div className="flex-1 truncate text-white/80 font-mono text-sm">
                      {`https://write.suite.xakteir.com/p/${docId}`}
                   </div>
                   <Button onClick={() => {
                      navigator.clipboard.writeText(`https://write.suite.xakteir.com/p/${docId}`);
                      alert('Link copied to clipboard!');
                   }} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 px-4 flex-shrink-0">
                      Copy Link
                   </Button>
                </div>

                <div className="flex gap-4">
                   <Button onClick={() => window.open(`/p/${docId}`, '_blank')} className="flex-1 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-xl h-12">
                      Open Published Doc
                   </Button>
                   <Button onClick={() => setIsPublishModalOpen(false)} variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest rounded-xl h-12">
                      Close
                   </Button>
                </div>
             </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
