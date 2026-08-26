'use client'

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type QA = {
  id: number;
  q: string;
  options: string[];
  a: number; // index of correct option
};

export default function KnowledgeNotFound() {
  const dictionary = useMemo(() => ({
    "xakteir": 'Xakteir — a fictional, sprawling web ecosystem for creation, games, and productivity.',
    "knowledge": 'Information, facts, and skills acquired through experience or education; a body of information.',
    "meme": 'An idea, behavior, or style that spreads from person to person — usually with pictures and silly captions.',
    "ai": 'Artificial Intelligence — computer systems that perform tasks normally requiring human intelligence.',
    "encyclopedia": 'A comprehensive reference work containing articles on a wide range of subjects.'
  }), []);

  const encyclopedia = useMemo(() => ([
    { title: 'Xakteir', excerpt: 'A unified platform of many tiny apps: mail, social, games, and more.' },
    { title: 'Voltra', excerpt: 'The mobile and hardware division that builds VoltraMax devices.' },
    { title: 'Xak AI', excerpt: 'Conversational assistant and developer of creative game prototypes.' }
  ]), []);

  const memes = useMemo(() => ([
    { name: 'Distracted Boyfriend', meaning: 'A humorous way to show shifting attention.' },
    { name: 'This Is Fine', meaning: 'Satirical acceptance of disastrous circumstances.' },
    { name: 'Galaxy Brain', meaning: 'Jokingly indicating overly deep or silly ideas.' }
  ]), []);

  const peopleAndThings = useMemo(() => ([
    { name: 'Founder', desc: 'The visionary behind Xakteir.' },
    { name: 'Buddy (Virtual Pet)', desc: 'A friendly companion you can care for.' },
    { name: 'VoltraMax', desc: 'Flagship folding hardware.' }
  ]), []);

  // 20-question quiz (lightweight, fun)
  const QUESTIONS: QA[] = useMemo(() => ([
    { id: 1, q: 'What is the friendly name for Xakteir AI?', options: ['Xak AI', 'Akteir', 'Botty', 'X-A1'], a: 0 },
    { id: 2, q: 'Which app handles cloud file storage?', options: ['Drive', 'Sheets', 'Notes', 'Pics'], a: 0 },
    { id: 3, q: 'What does TOTP stand for?', options: ['Time-based One Time Password', 'Token One Time Pass', 'Tiny OTP', 'Two-factor Token'], a: 0 },
    { id: 4, q: 'Which format is commonly used for small vector images?', options: ['SVG', 'JPG', 'MP4', 'PDF'], a: 0 },
    { id: 5, q: 'What UI library is used for icons in Xakteir?', options: ['Lucide-React', 'Font Awesome', 'Bootstrap Icons', 'Material Icons'], a: 0 },
    { id: 6, q: 'What animation library is used?', options: ['framer-motion', 'anime.js', 'GSAP', 'Velocity'], a: 0 },
    { id: 7, q: 'Where are realtime listeners noted to be used?', options: ['Firestore', 'MySQL', 'Redis', 'LocalStorage'], a: 0 },
    { id: 8, q: 'Which app is for presentations?', options: ['Slides', 'Write', 'Sheets', 'Forms'], a: 0 },
    { id: 9, q: 'Meaning of meme: "This Is Fine"?', options: ['Accepting chaos', 'Perfection', 'Hyperjoy', 'Coolness'], a: 0 },
    { id: 10, q: 'What is a good place to store large images in production?', options: ['Object storage (S3)', 'Git repo', 'Local code folder', 'Inlined base64'], a: 0 },
    { id: 11, q: 'Which app provides video livestreaming?', options: ['Xakview', 'Sheets', 'Notes', 'Calculator'], a: 0 },
    { id: 12, q: 'What does E2EE stand for?', options: ['End-to-End Encryption', 'End-to-Event Encryption', 'Edge-to-Edge', 'Encrypted Everything'], a: 0 },
    { id: 13, q: 'Which file is mentioned as the global store?', options: ['globals.css', 'index.css', 'theme.css', 'tailwind.css'], a: 0 },
    { id: 14, q: 'Which subdomain is used for the IDE?', options: ['code.xakteir.com', 'chat.xakteir.com', 'drive.xakteir.com', 'meet.xakteir.com'], a: 0 },
    { id: 15, q: 'What is the name of the virtual pet app?', options: ['Buddy', 'Pal', 'Petz', 'Companion'], a: 0 },
    { id: 16, q: 'Which app is used for live sports?', options: ['Sports', 'Pics', 'Notes', 'Slides'], a: 0 },
    { id: 17, q: 'Xakteir prefers which design aesthetic in chat?', options: ['Glassmorphism', 'Neumorphism', 'Flat', 'Skeuomorphism'], a: 0 },
    { id: 18, q: 'Which database is referenced repeatedly?', options: ['Firestore', 'Postgres', 'MongoDB', 'MySQL'], a: 0 },
    { id: 19, q: 'Where should very large datasets be stored?', options: ['Databases or object storage', 'In git', 'On the server root', 'In comments'], a: 0 },
    { id: 20, q: 'What is the intended purpose of Xakteir Knowledge?', options: ['A central knowledge base', 'A game', 'An image editor', 'A mail client'], a: 0 }
  ]), []);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState<number>(1);
  const [finished, setFinished] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);

  useEffect(() => {
    if (finished) {
      // Simulate AI answers: probabilistic correctness (AI is strong but not perfect)
      let aiCorrect = 0;
      for (const q of QUESTIONS) {
        // AI has between 55% and 85% chance depending on question id randomness
        const chance = 0.55 + ((q.id % 7) * 0.05);
        if (Math.random() < chance) aiCorrect++;
      }
      setAiScore(aiCorrect);
    }
  }, [finished]);

  const handleSelect = (qid: number, idx: number) => {
    setAnswers(prev => ({ ...prev, [qid]: idx }));
  };

  const handleNext = () => {
    if (current < QUESTIONS.length) setCurrent(c => c + 1);
    else setFinished(true);
  };

  const score = useMemo(() => {
    let s = 0;
    for (const q of QUESTIONS) {
      if (answers[q.id] === q.a) s++;
    }
    return s;
  }, [answers]);

  const restart = () => {
    setAnswers({});
    setCurrent(1);
    setFinished(false);
    setAiScore(null);
  };

  const translate = (text: string, lang: string) => {
    // playful translator: a few canned translations
    const map: Record<string, Record<string, string>> = {
      'hello': { es: 'hola', fr: 'bonjour', de: 'hallo' },
      'knowledge': { es: 'conocimiento', fr: 'connaissance', de: 'Wissen' },
      'meme': { es: 'meme', fr: 'mème', de: 'Meme' }
    };
    const key = text.toLowerCase();
    return map[key] && map[key][lang] ? map[key][lang] : `${text} (${lang})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow">
            <h1 className="text-3xl font-extrabold">404 — Knowledge Not Found</h1>
            <p className="mt-2 text-slate-600">Looks like your curiosity took a wrong turn. But worry not — the Knowledge Archive has fun things to explore instead!</p>
            <div className="mt-4 flex gap-3 flex-wrap">
              <Link href="/knowledge" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back to Knowledge Home</Link>
              <a className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg" href="#dictionary">Dictionary</a>
              <a className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg" href="#encyclopedia">Encyclopedia</a>
              <a className="px-4 py-2 bg-pink-100 text-pink-800 rounded-lg" href="#memes">Meaning of Memes</a>
            </div>
          </div>

          <div id="dictionary" className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Quick Dictionary</h2>
            <p className="text-slate-600 mt-1">Search the little dictionary below for techy words and platform terms.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dictionary).map(([k, v]) => (
                <div key={k} className="p-4 border rounded-lg">
                  <div className="font-semibold">{k}</div>
                  <div className="text-sm text-slate-600 mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="encyclopedia" className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Mini-Encyclopedia</h2>
            <p className="text-slate-600 mt-1">Short articles you can explore instantly.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {encyclopedia.map(e => (
                <div key={e.title} className="p-4 rounded-lg border hover:shadow transition">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{e.excerpt}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="memes" className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Meaning of Memes</h2>
            <p className="text-slate-600 mt-1">A lighthearted guide to modern hieroglyphs.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {memes.map(m => (
                <div key={m.name} className="p-4 rounded-lg border">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-sm text-slate-600 mt-1">{m.meaning}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">People & Things</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {peopleAndThings.map(p => (
                <div key={p.name} className="p-4 rounded-lg border text-center">
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-sm text-slate-600 mt-1">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Tiny Translator</h2>
            <p className="text-slate-600 mt-1">Try translating a word for fun.</p>
            <div className="mt-4 flex gap-2 items-center">
              <input id="tinput" placeholder="word (e.g. hello)" className="flex-1 border rounded px-3 py-2" />
              <select id="tlang" className="border rounded px-2 py-2">
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => {
                const el = document.getElementById('tinput') as HTMLInputElement | null;
                const lang = (document.getElementById('tlang') as HTMLSelectElement).value;
                if (!el) return;
                const out = translate(el.value || 'hello', lang);
                alert(`Translation: ${out}`);
              }}>Translate</button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow sticky top-6">
            <h3 className="text-xl font-bold">20-Question Quiz — You vs AI</h3>
            <p className="text-sm text-slate-600 mt-1">Answer 20 quick questions and see if you beat the AI. Friendly rivalry encouraged.</p>

            {!finished ? (
              <div className="mt-4">
                <div className="text-sm text-slate-500">Question {current} / {QUESTIONS.length}</div>
                <div className="mt-2 font-semibold">{QUESTIONS[current - 1].q}</div>
                <div className="mt-3 space-y-2">
                  {QUESTIONS[current - 1].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(QUESTIONS[current - 1].id, idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${answers[QUESTIONS[current - 1].id] === idx ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => setCurrent(c => Math.max(1, c - 1))}>Prev</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleNext}>Next</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <div className="text-3xl font-extrabold">Your Score: {score} / {QUESTIONS.length}</div>
                <div className="mt-2 text-slate-600">AI Score: {aiScore ?? '—' } / {QUESTIONS.length}</div>
                <div className="mt-4">
                  {aiScore !== null && (
                    <div className={`inline-block px-4 py-2 rounded-full ${score > aiScore ? 'bg-emerald-100 text-emerald-800' : score < aiScore ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {score > aiScore ? 'You beat the AI — legend!' : score < aiScore ? 'AI wins this time — rematch?' : 'It is a tie — uncanny!'}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2 justify-center">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={restart}>Play Again</button>
                  <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-slate-500">No AI was harmed in the making of this quiz. The AI score is simulated for fun.</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="mt-2 text-sm text-slate-600 space-y-1">
              <li><Link href="/knowledge">Knowledge Home</Link></li>
              <li><Link href="/knowledge/a/xakteir-overview">Xakteir Overview</Link></li>
              <li><a href="/" className="text-blue-600">Return to main site</a></li>
            </ul>
          </div>

        </aside>
      </div>
    </div>
  );
}
