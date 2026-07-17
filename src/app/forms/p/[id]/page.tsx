'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export default function PublicFormPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const [form, setForm] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firestore || !params.id) return;
    const fetchForm = async () => {
      try {
        const docRef = doc(firestore, 'forms', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Form not found.');
        }
      } catch (e) {
        setError('Error loading form.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [firestore, params.id]);

  const handleSubmit = async () => {
    if (!firestore || !form) return;
    // Validate required
    for (const q of form.questions || []) {
      if (q.required && (!answers[q.id] || answers[q.id].length === 0)) {
         setError('Please fill out all required fields.');
         return;
      }
    }
    
    setSubmitting(true);
    setError('');
    
    try {
       await addDoc(collection(firestore, 'forms', form.id, 'responses'), {
          answers,
          submittedAt: serverTimestamp(),
          userAgent: navigator.userAgent
       });
       setSubmitted(true);
    } catch (e) {
       setError('Failed to submit form. Please try again.');
    } finally {
       setSubmitting(false);
    }
  };

  const updateAnswer = (questionId: string, value: any) => {
     setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  if (loading) {
    return <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (error || !form) {
    return <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-white"><p className="text-rose-500 font-bold">{error}</p></div>;
  }

  if (submitted) {
    return (
      <div className={cn("min-h-screen pt-32 px-4 pb-32 transition-colors duration-1000 bg-gradient-to-br flex justify-center", form.themeColor || "from-zinc-900 to-black")}>
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl max-w-[600px] w-full text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-4xl font-black text-white mb-4">Response Recorded</h1>
            <p className="text-white/60 mb-8">Your response has been successfully submitted. Thank you!</p>
            <Button onClick={() => { setSubmitted(false); setAnswers({}); }} variant="outline" className="border-white/10 text-white hover:bg-white/5">Submit another response</Button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pt-24 px-4 pb-32 transition-colors duration-1000 bg-gradient-to-br flex justify-center", form.themeColor || "from-zinc-900 to-black")}>
       <div className="w-full max-w-[700px] space-y-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
             <div className={cn("absolute top-0 left-0 right-0 h-3 bg-gradient-to-r", form.themeColor || "from-purple-500 to-indigo-500")}></div>
             <h1 className="text-5xl font-black tracking-tighter text-white mb-4">{form.title || "Untitled Form"}</h1>
             <p className="text-white/60 text-lg">{form.description}</p>
             {error && <p className="text-rose-500 font-bold mt-4 bg-rose-500/10 p-4 rounded-xl">{error}</p>}
          </motion.div>

          {form.questions?.map((q: any, i: number) => (
            <motion.div key={q.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-bold text-white mb-6 flex items-start gap-2">
                 {q.title} {q.required && <span className="text-rose-500">*</span>}
               </h3>
               
               {q.type === 'text' && <input value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} type="text" className="w-full bg-transparent border-b border-white/20 focus:border-white focus:outline-none py-2 text-white transition-colors" placeholder="Your answer" />}
               
               {q.type === 'paragraph' && <textarea value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} className="w-full bg-transparent border-b border-white/20 focus:border-white focus:outline-none py-2 text-white transition-colors resize-y min-h-[100px]" placeholder="Your answer" />}
               
               {q.type === 'choice' && (
                 <div className="space-y-4">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <label key={optIdx} className="flex items-center gap-4 cursor-pointer group">
                         <div className={cn("w-5 h-5 border-2 flex items-center justify-center transition-colors rounded-full", answers[q.id] === opt ? "border-primary" : "border-white/20 group-hover:border-white/40")}>
                            {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                         </div>
                         <input type="radio" className="hidden" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => updateAnswer(q.id, opt)} />
                         <span className="text-white/80 group-hover:text-white transition-colors">{opt}</span>
                      </label>
                    ))}
                 </div>
               )}

               {q.type === 'checkboxes' && (
                 <div className="space-y-4">
                    {q.options?.map((opt: string, optIdx: number) => {
                       const checked = (answers[q.id] || []).includes(opt);
                       return (
                         <label key={optIdx} className="flex items-center gap-4 cursor-pointer group">
                            <div className={cn("w-5 h-5 border-2 flex items-center justify-center transition-colors rounded", checked ? "border-primary bg-primary" : "border-white/20 group-hover:border-white/40")}>
                               {checked && <CheckCircle2 className="w-4 h-4 text-black" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={checked} onChange={(e) => {
                               const arr = answers[q.id] || [];
                               if (e.target.checked) updateAnswer(q.id, [...arr, opt]);
                               else updateAnswer(q.id, arr.filter((x: string) => x !== opt));
                            }} />
                            <span className="text-white/80 group-hover:text-white transition-colors">{opt}</span>
                         </label>
                       );
                    })}
                 </div>
               )}

               {q.type === 'dropdown' && (
                 <select value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} className="w-full bg-zinc-900 border border-white/20 text-white rounded-xl px-4 py-3 focus:border-white focus:outline-none">
                    <option value="">Choose</option>
                    {q.options?.map((opt: string, optIdx: number) => <option key={optIdx} value={opt}>{opt}</option>)}
                 </select>
               )}

               {q.type === 'rating' && (
                 <div className="flex gap-4">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => updateAnswer(q.id, star)} className={cn("w-12 h-12 rounded-full border font-bold transition-all", answers[q.id] === star ? "bg-primary text-black border-primary" : "border-white/20 hover:bg-white/10 text-white/60 hover:text-white")}>{star}</button>
                    ))}
                 </div>
               )}

               {q.type === 'date' && <input value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} type="date" className="bg-transparent border-b border-white/20 focus:border-white focus:outline-none py-2 text-white transition-colors [color-scheme:dark]" />}
            </motion.div>
          ))}

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-between items-center pt-4">
             <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                {submitting ? 'Submitting...' : 'Submit'}
             </Button>
             <Button onClick={() => setAnswers({})} variant="ghost" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest">Clear form</Button>
          </motion.div>
          
          <div className="text-center pt-8 text-white/20 text-xs font-bold uppercase tracking-widest">
            Powered by Xakteir Forms
          </div>
       </div>
    </div>
  );
}
