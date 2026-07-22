'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicWriteDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firestore || !id) return;
    const fetchDoc = async () => {
      try {
        const docRef = doc(firestore, 'write_docs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDocData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Document not found or has been deleted.');
        }
      } catch (e) {
        setError('Error loading document.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [firestore, id]);

  if (loading) {
    return <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (error || !docData) {
    return <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-white"><p className="text-rose-500 font-bold">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-white text-black print:bg-white print:text-black">
       {/* Top Bar - Hidden in Print */}
       <div className="h-14 border-b border-zinc-200 flex items-center px-8 bg-zinc-50 print:hidden sticky top-0 z-50">
          <div className="font-black tracking-tighter text-lg">Xakteir Write</div>
          <div className="mx-4 w-px h-6 bg-zinc-200" />
          <div className="text-sm font-bold text-zinc-500 truncate max-w-[300px]">{docData.title || 'Untitled Document'}</div>
          
          <div className="ml-auto flex items-center gap-4">
             <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white">
                <Printer className="w-3 h-3" /> Print
             </Button>
          </div>
       </div>

       {/* Document Canvas */}
       <div className="flex justify-center p-8 md:p-16">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-[850px]">
             {/* Render HTML content safely */}
             <div 
                className="prose prose-lg prose-headings:font-black prose-h1:text-5xl prose-h1:tracking-tighter prose-p:text-xl prose-p:leading-relaxed max-w-none text-black"
                dangerouslySetInnerHTML={{ __html: docData.content || '' }} 
             />
             
             <div className="mt-32 pt-8 border-t border-zinc-200 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest print:hidden">
                Published with Xakteir Write
             </div>
          </motion.div>
       </div>
    </div>
  );
}
