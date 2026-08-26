"use client"

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function KnowledgeNotFound() {
  const jokes = useMemo(
    () => [
      "404 — Our librarians are on coffee break. The books said 'BRB'.",
      "Lost? So is this page. We tried calling it but it didn't pick up.",
      "This page took a vacation to the Land of Missing Links.",
      "404 — The knowledge hamster escaped the wheel. We'll find him."
    ],
    []
  );

  const [joke, setJoke] = useState(jokes[0]);
  const [query, setQuery] = useState('');
  const suggestions = ['xakteir', 'ai', 'voltra', 'xakdrive'];
  const { toast } = useToast();

  useEffect(() => {
    // Pick a random joke on mount
    setJoke(jokes[Math.floor(Math.random() * jokes.length)]);
  }, [jokes]);

  const handleSearch = (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return toast({ title: 'Try a search', description: 'Type a topic to look up in Knowledge.' });
    // Redirect to the knowledge search or article list — here we go to /knowledge with a query param
    window.location.href = `/knowledge?search=${encodeURIComponent(term)}`;
  };

  const handleTranslate = (text: string, lang: string) => {
    const map: Record<string, Record<string, string>> = {
      hello: { es: 'hola', fr: 'bonjour', de: 'hallo' },
      knowledge: { es: 'conocimiento', fr: 'connaissance', de: 'Wissen' },
      meme: { es: 'meme', fr: 'mème', de: 'Meme' }
    };
    const key = text.toLowerCase();
    const out = map[key] && map[key][lang] ? map[key][lang] : `${text} → ${lang}`;
    toast({ title: 'Translation', description: out });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="max-w-4xl w-full bg-gradient-to-br from-slate-800 to-slate-900/80 border border-slate-700 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="flex gap-6 items-center">
          <div className="w-28 h-28 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 shadow-lg">
            {/* Simple SVG hero */}
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="white" fillOpacity="0.06" />
              <path d="M8 9h8M8 13h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="0.8" fill="white" />
              <circle cx="15" cy="7" r="0.8" fill="white" />
            </svg>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight">404 — Knowledge Not Found</h1>
            <p className="mt-2 text-slate-300 text-sm">{joke}</p>

            <div className="mt-4 flex gap-3">
              <input
                aria-label="Search Knowledge"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search the Knowledge base..."
                className="flex-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={() => handleSearch()} className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm">Search</button>
              <Link href="/knowledge" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center">Knowledge Home</Link>
            </div>

            <div className="mt-3 text-xs text-slate-400">Quick suggestions: {suggestions.map((s, i) => (
              <button key={s} onClick={() => handleSearch(s)} className="ml-2 text-indigo-300 hover:underline">{s}{i < suggestions.length - 1 ? ',' : ''}</button>
            ))}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <h3 className="font-semibold">Quick Dictionary</h3>
            <p className="text-slate-400 mt-1 text-sm">Tiny definitions to get you moving.</p>
            <ul className="mt-3 text-sm text-slate-200 space-y-1">
              <li><strong>Xakteir</strong> — The whole delightful ecosystem.</li>
              <li><strong>Knowledge</strong> — Facts, guides, and lore.</li>
              <li><strong>Meme</strong> — The internet's tiny hieroglyphs.</li>
            </ul>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <h3 className="font-semibold">Translator (quick)</h3>
            <p className="text-slate-400 mt-1 text-sm">Translate one word for fun.</p>
            <div className="mt-3 flex gap-2">
              <input id="tn" placeholder="word (e.g. hello)" className="flex-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded" />
              <select id="tl" className="bg-slate-800 border border-slate-700 px-2 py-2 rounded">
                <option value="es">ES</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
              </select>
              <button
                onClick={() => {
                  const txt = (document.getElementById('tn') as HTMLInputElement)?.value || 'hello';
                  const lang = (document.getElementById('tl') as HTMLSelectElement)?.value || 'es';
                  handleTranslate(txt, lang);
                }}
                className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-sm"
              >
                Translate
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Still lost? Try our full Knowledge hub — it's packed with dictionary entries, short encyclopedia articles, meme meanings, and a quiz or two.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link href="/" className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">Home</Link>
            <Link href="/knowledge" className="px-4 py-2 bg-indigo-500 rounded-lg text-white hover:bg-indigo-600">Open Knowledge Hub</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
