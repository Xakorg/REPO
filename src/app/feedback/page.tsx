"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Star, MessageSquareQuote, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { navigateTo } from '@/lib/navigation';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const fetchReviews = async () => {
      try {
        const q = query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error(e); }
    };
    fetchReviews();
  }, [firestore]);

  const handleSubmit = async () => {
    if (!firestore) return;
    if (rating === 0) {
      toast({ variant: "destructive", title: "Wait!", description: "Please select a star rating." });
      return;
    }
    
    setSubmitting(true);
    try {
      const newReview = {
        rating,
        review,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, 'feedback'), newReview);
      setReviews([newReview, ...reviews]);
      setRating(0);
      setReview("");
      toast({ title: "Thank you!", description: "Your anonymous feedback has been posted." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white pt-24 pb-32 px-10">
      <div className="max-w-[1000px] mx-auto">
        <Button variant="ghost" onClick={() => navigateTo('/', router)} className="mb-8 text-white/40 hover:text-white rounded-xl group">
           <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Button>

        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <MessageSquareQuote className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            Anonymous Feedback
          </h1>
          <p className="text-white/60 font-bold mt-4 text-lg">Help us improve Xakteir. Rate your experience and share your thoughts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
           {/* Post Review Form */}
           <div className="md:col-span-5">
              <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl sticky top-32">
                 <h2 className="text-2xl font-black tracking-tighter mb-8 italic uppercase text-white">Leave a Review</h2>
                 
                 <div className="flex items-center gap-2 mb-8 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="transition-transform hover:scale-125 focus:outline-none"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star className={cn("w-10 h-10 transition-colors drop-shadow-xl", (hoverRating || rating) >= star ? "fill-amber-500 text-amber-500" : "text-white/20")} />
                      </button>
                    ))}
                 </div>

                 <textarea
                   value={review}
                   onChange={(e) => setReview(e.target.value)}
                   placeholder="Tell us what you think... (Optional)"
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 h-32 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-white placeholder-white/20 font-medium mb-8"
                 />

                 <Button 
                   onClick={handleSubmit} 
                   disabled={submitting}
                   className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all"
                 >
                    {submitting ? "Posting..." : "Post Anonymously"} <Send className="w-5 h-5 ml-2" />
                 </Button>
              </div>
           </div>

           {/* Reviews List */}
           <div className="md:col-span-7 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-4">
                 Community Reviews <div className="h-px bg-white/10 flex-1"></div>
              </h3>
              
              <AnimatePresence>
                {reviews.length === 0 ? (
                  <div className="p-10 border border-white/5 rounded-[2rem] bg-white/5 text-center text-white/40 font-bold italic">
                    No reviews yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  reviews.map((rev, i) => (
                    <motion.div 
                      key={rev.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 bg-zinc-900 border border-white/5 rounded-[2rem] shadow-xl"
                    >
                       <div className="flex items-center gap-1 mb-4">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star key={star} className={cn("w-5 h-5", rev.rating >= star ? "fill-amber-500 text-amber-500" : "text-white/10")} />
                         ))}
                       </div>
                       {rev.review ? (
                         <p className="text-white/80 font-medium leading-relaxed">{rev.review}</p>
                       ) : (
                         <p className="text-white/30 italic text-sm">No written comment provided.</p>
                       )}
                       <div className="mt-6 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                             <span className="text-xs font-black text-white/40">?</span>
                           </div>
                           <span className="text-xs font-bold uppercase tracking-wider text-white/40">Anonymous</span>
                         </div>
                       </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
