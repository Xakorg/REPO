"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSuiteStore } from '@/lib/store';
import { Settings, Share, MessageSquare, History, Wand2, Eye, Plus, FileText, Trash2, ArrowLeft, GripVertical, CheckCircle2, Copy, BarChart3, LayoutTemplate, Printer, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navigateTo } from '@/lib/navigation';

function FormsApp() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFocusMode, toggleFocusMode } = useSuiteStore();
  const { toast } = useToast();
  
  const formId = searchParams.get('id');
  const viewMode = searchParams.get('view') || 'edit'; // 'edit', 'preview', 'responses'
  
  // Dashboard Queries
  const [myForms, setMyForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);

  // Editor State
  const [activeForm, setActiveForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (!firestore || !user) return;
    
    if (formId) {
      // Load specific form
      const loadForm = async () => {
        const docRef = doc(firestore, 'forms', formId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActiveForm({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Form not found" });
          navigateTo('/forms', router);
        }
      };
      loadForm();
    } else {
      setActiveForm(null);
      // Load forms list manually
      const q = query(collection(firestore, 'forms'), where('ownerId', '==', user.uid));
      // Using simple listener or fetch
      getDoc(doc(firestore, 'users', user.uid)).then(() => {
         // just fetch once for dashboard
         import('firebase/firestore').then(({ getDocs }) => {
            getDocs(q).then(snapshot => {
               setMyForms(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
               setIsLoadingForms(false);
            });
         });
      });
    }
  }, [firestore, user, formId]);

  const handleCreateForm = async () => {
    if (!firestore || !user) return;
    try {
      const newForm = {
        ownerId: user.uid,
        title: 'Untitled Form',
        description: '',
        themeColor: 'from-purple-500 to-indigo-500',
        questions: [
          { id: Date.now().toString(), type: 'choice', title: 'Untitled Question', options: ['Option 1'], required: false }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(firestore, 'forms'), newForm);
      navigateTo(`/forms?id=${docRef.id}`, router);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const saveForm = async (updatedData: any) => {
    if (!firestore || !formId) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, 'forms', formId), {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      setActiveForm(updatedData);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to save", description: e.message });
    }
    setSaving(false);
  };

  const updateQuestion = (qId: string, updates: any) => {
    if (!activeForm) return;
    const newQuestions = activeForm.questions.map((q: any) => q.id === qId ? { ...q, ...updates } : q);
    const newData = { ...activeForm, questions: newQuestions };
    setActiveForm(newData);
    saveForm(newData);
  };

  const addQuestion = (type: string) => {
    if (!activeForm) return;
    const newQuestions = [...activeForm.questions, {
      id: Date.now().toString(),
      type,
      title: 'New Question',
      options: type === 'choice' ? ['Option 1'] : undefined,
      required: false
    }];
    const newData = { ...activeForm, questions: newQuestions };
    setActiveForm(newData);
    saveForm(newData);
  };

  const deleteQuestion = (qId: string) => {
    if (!activeForm) return;
    const newQuestions = activeForm.questions.filter((q: any) => q.id !== qId);
    const newData = { ...activeForm, questions: newQuestions };
    setActiveForm(newData);
    saveForm(newData);
  };

  const moveQuestion = (qId: string, direction: 'up' | 'down') => {
    if (!activeForm) return;
    const index = activeForm.questions.findIndex((q: any) => q.id === qId);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeForm.questions.length - 1) return;
    
    const newQuestions = [...activeForm.questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
    
    const newData = { ...activeForm, questions: newQuestions };
    setActiveForm(newData);
    saveForm(newData);
  };

  // Dashboard View
  if (!formId) {
    return (
      <div className="min-h-screen bg-[#05030d] text-white pt-24 px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Xakteir Forms</h1>
              <p className="text-white/40 font-bold mt-2">Create beautiful, engaging forms in seconds.</p>
            </div>
            <Button onClick={handleCreateForm} className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-2xl h-12 px-8 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
              <Plus className="w-5 h-5 mr-2" /> New Form
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateForm} className="aspect-video rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group">
               <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-primary" />
               </div>
               <span className="font-black uppercase tracking-widest text-white/60 group-hover:text-primary">Blank Form</span>
            </motion.div>
            
            {myForms.map((form) => (
              <motion.div key={form.id} whileHover={{ scale: 1.02 }} className="aspect-video rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden relative group cursor-pointer" onClick={() => navigateTo(`/forms?id=${form.id}`, router)}>
                 <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", form.themeColor || "from-purple-500 to-indigo-500")}></div>
                 <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 bg-black/40 group-hover:bg-black/20 transition-all">
                    <div>
                      <h3 className="text-xl font-black truncate text-white">{form.title || "Untitled Form"}</h3>
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">{form.description || "No description"}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-white/40 uppercase tracking-widest">
                       <span>{form.questions?.length || 0} Questions</span>
                       <FileText className="w-4 h-4" />
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  if (!activeForm) {
    return <div className="min-h-screen flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-[#05030d] text-white pt-20 overflow-hidden">
      {/* Forms Toolbar */}
      <div className={`fixed top-20 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 flex items-center px-10 transition-transform duration-500 z-40 ${isFocusMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/forms', router)} className="text-white/60 hover:text-white rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          <div className="h-6 w-px bg-white/10"></div>
          <Button variant="ghost" className={cn("text-[11px] font-black uppercase tracking-widest rounded-xl transition-all", viewMode === 'edit' ? "bg-white/10 text-white" : "text-white/40 hover:text-white")} onClick={() => navigateTo(`/forms?id=${formId}&view=edit`, router)}>Questions</Button>
          <Button variant="ghost" className={cn("text-[11px] font-black uppercase tracking-widest rounded-xl transition-all", viewMode === 'responses' ? "bg-white/10 text-white" : "text-white/40 hover:text-white")} onClick={() => navigateTo(`/forms?id=${formId}&view=responses`, router)}>Responses</Button>
          <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest rounded-xl text-white/40 hover:text-white transition-all"><Settings className="w-4 h-4 mr-2" /> Theme</Button>
        </div>
        <div className="ml-auto flex gap-3">
           {saving && <span className="text-[10px] font-black uppercase text-white/40 mr-4 self-center tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Saving...</span>}
           <Button variant="ghost" onClick={() => window.print()} className="text-[10px] font-black uppercase tracking-widest rounded-xl text-white/40 hover:text-white transition-all"><Printer className="w-4 h-4 mr-2" /> Print</Button>
           <Button variant="outline" onClick={() => navigateTo(`/forms?id=${formId}&view=preview`, router)} className="border-white/10 bg-zinc-900 text-white gap-2 font-black uppercase text-[10px] tracking-widest rounded-xl"><Eye className="w-4 h-4" /> Preview</Button>
           <Button className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-[10px] rounded-xl"><Share className="w-4 h-4 mr-2" /> Send</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-16 p-8 flex justify-center bg-zinc-950/50">
         <div className="w-full max-w-[800px] space-y-6 pb-32">
            
            {/* Form Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group">
               <div className={cn("absolute top-0 left-0 right-0 h-3 bg-gradient-to-r", activeForm.themeColor || "from-purple-500 to-indigo-500")}></div>
               <input 
                 value={activeForm.title} 
                 onChange={(e) => {
                   const newData = { ...activeForm, title: e.target.value };
                   setActiveForm(newData);
                   saveForm(newData);
                 }}
                 className="w-full bg-transparent border-none text-5xl font-black tracking-tighter mb-4 text-white focus:outline-none focus:ring-0 placeholder-white/20" 
                 placeholder="Form Title"
               />
               <textarea 
                 value={activeForm.description}
                 onChange={(e) => {
                   const newData = { ...activeForm, description: e.target.value };
                   setActiveForm(newData);
                   saveForm(newData);
                 }}
                 className="w-full bg-transparent border-none text-white/60 text-lg resize-none focus:outline-none focus:ring-0 placeholder-white/20"
                 placeholder="Form Description"
                 rows={2}
               />
            </motion.div>

            {/* Questions List */}
            <AnimatePresence>
              {activeForm.questions?.map((q: any, i: number) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-8 shadow-xl group relative focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                   
                   <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                     <button onClick={() => moveQuestion(q.id, 'up')} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"><ArrowUp className="w-5 h-5" /></button>
                     <button onClick={() => moveQuestion(q.id, 'down')} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"><ArrowDown className="w-5 h-5" /></button>
                   </div>

                   <div className="flex items-start gap-6 mb-6">
                      <div className="flex-1">
                        <input 
                          value={q.title} 
                          onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-4 text-lg font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-white/20" 
                          placeholder="Question" 
                        />
                      </div>
                      <select 
                        value={q.type}
                        onChange={(e) => updateQuestion(q.id, { type: e.target.value, options: e.target.value === 'choice' ? ['Option 1'] : undefined })}
                        className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary w-48"
                      >
                         <option value="choice">Multiple Choice</option>
                         <option value="checkboxes">Checkboxes</option>
                         <option value="dropdown">Dropdown</option>
                         <option value="text">Short Answer</option>
                         <option value="paragraph">Paragraph</option>
                         <option value="rating">Rating</option>
                         <option value="date">Date</option>
                      </select>
                   </div>
                   
                   {/* Options for Choice, Checkboxes, Dropdown */}
                   {(q.type === 'choice' || q.type === 'checkboxes' || q.type === 'dropdown') && (
                     <div className="space-y-3 pl-2">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-4 text-white/60 group/opt">
                             {q.type === 'choice' && <div className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0"></div>}
                             {q.type === 'checkboxes' && <div className="w-5 h-5 rounded-[4px] border-2 border-white/20 shrink-0"></div>}
                             {q.type === 'dropdown' && <div className="text-xs font-bold w-5 text-center shrink-0">{optIdx + 1}.</div>}
                             <input 
                               value={opt} 
                               onChange={(e) => {
                                 const newOpts = [...q.options];
                                 newOpts[optIdx] = e.target.value;
                                 updateQuestion(q.id, { options: newOpts });
                               }}
                               className="flex-1 bg-transparent border-b border-transparent hover:border-white/10 focus:border-primary focus:outline-none py-1 transition-colors" 
                               placeholder={`Option ${optIdx + 1}`} 
                             />
                             {q.logicEnabled && (
                               <select className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:border-primary focus:outline-none max-w-[150px]">
                                  <option value="next">Continue to next</option>
                                  <option value="submit">Submit form</option>
                               </select>
                             )}
                             <button onClick={() => {
                               const newOpts = q.options.filter((_: any, idx: number) => idx !== optIdx);
                               updateQuestion(q.id, { options: newOpts });
                             }} className="opacity-0 group-hover/opt:opacity-100 p-2 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-4 text-white/40 pt-2">
                           {q.type === 'choice' && <div className="w-5 h-5 rounded-full border-2 border-white/10 shrink-0"></div>}
                           {q.type === 'checkboxes' && <div className="w-5 h-5 rounded-[4px] border-2 border-white/10 shrink-0"></div>}
                           {q.type === 'dropdown' && <div className="text-xs font-bold w-5 text-center shrink-0">{(q.options?.length || 0) + 1}.</div>}
                           <button onClick={() => {
                             const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                             updateQuestion(q.id, { options: newOpts });
                           }} className="text-sm font-bold hover:text-white transition-colors">Add option</button>
                        </div>
                     </div>
                   )}

                   {/* Text Placeholders */}
                   {q.type === 'text' && (
                     <div className="border-b-2 border-white/10 w-1/2 pb-2 text-white/20 text-sm font-bold pl-2">Short answer text</div>
                   )}
                   {q.type === 'paragraph' && (
                     <div className="border-b-2 border-white/10 w-full pb-2 text-white/20 text-sm font-bold pl-2">Long answer text</div>
                   )}
                   {q.type === 'rating' && (
                     <div className="flex gap-4 pl-2">
                       {[1,2,3,4,5].map(star => <div key={star} className="w-10 h-10 bg-white/5 rounded-xl border border-white/10"></div>)}
                     </div>
                   )}
                   {q.type === 'date' && (
                     <div className="border-b-2 border-white/10 w-48 pb-2 text-white/20 text-sm font-bold pl-2 flex items-center justify-between">
                        <span>Month, day, year</span>
                        <div className="w-4 h-4 bg-white/20 rounded"></div>
                     </div>
                   )}

                   {/* Question Footer Actions */}
                   <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-end gap-4">
                      {(q.type === 'choice' || q.type === 'dropdown') && (
                        <Button variant="ghost" size="sm" onClick={() => updateQuestion(q.id, { logicEnabled: !q.logicEnabled })} className={cn("text-[10px] font-black uppercase tracking-widest rounded-lg", q.logicEnabled ? "text-primary bg-primary/10" : "text-white/40 hover:text-white")}>
                           Logic
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => addQuestion(q.type)} className="text-white/40 hover:text-white hover:bg-white/5 rounded-lg"><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)} className="text-white/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                      <div className="w-px h-6 bg-white/10"></div>
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 cursor-pointer hover:text-white transition-colors">
                        <span>Required</span>
                        <div className={cn("w-10 h-5 rounded-full transition-colors flex items-center px-1", q.required ? "bg-primary" : "bg-white/10")}>
                           <div className={cn("w-3 h-3 rounded-full bg-white transition-transform", q.required ? "translate-x-5" : "translate-x-0")}></div>
                        </div>
                        <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, { required: e.target.checked })} className="hidden" />
                      </label>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-8">
               <div className="bg-zinc-900 border border-white/10 rounded-full p-2 flex gap-2 shadow-2xl">
                 <Button onClick={() => addQuestion('choice')} variant="ghost" size="sm" className="rounded-full text-white/60 hover:text-white hover:bg-white/10"><Plus className="w-4 h-4 mr-2" /> Add Choice</Button>
                 <Button onClick={() => addQuestion('text')} variant="ghost" size="sm" className="rounded-full text-white/60 hover:text-white hover:bg-white/10"><FileText className="w-4 h-4 mr-2" /> Add Text</Button>
                 <Button onClick={() => addQuestion('rating')} variant="ghost" size="sm" className="rounded-full text-white/60 hover:text-white hover:bg-white/10"><CheckCircle2 className="w-4 h-4 mr-2" /> Add Rating</Button>
               </div>
            </motion.div>

         </div>
      </div>
    </div>
  );
}

export default function XakteirForms() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <FormsApp />
    </Suspense>
  );
}
