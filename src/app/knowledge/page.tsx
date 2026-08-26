'use client'

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type QA = { id: number; q: string; options: string[]; a: number };

export default function KnowledgeHome() {
  const dictionary = useMemo(() => ({
    xakteir: 'Xakteir — a sprawling web ecosystem for creation, games, and productivity.',
    knowledge: 'Information, facts, and skills acquired through experience or education.',
    meme: 'A cultural unit of humour or idea that spreads across the internet.',
    ai: 'Artificial Intelligence — systems that perform tasks which usually require human intelligence.',
    encyclopedia: 'A comprehensive reference with concise articles on many subjects.'
  }), []);

  const encyclopedia = useMemo(() => ([
    { title: 'Xakteir', excerpt: 'A unified platform of many tiny apps: mail, social, games, and more.' },
    { title: 'Voltra', excerpt: 'The hardware initiative behind VoltraMax devices.' },
    { title: 'Xak AI', excerpt: 'Conversational assistant and creative toolset.' }
  ]), []);

  const memes = useMemo(() => ([
    { name: 'Distracted Boyfriend', meaning: 'A comic way to show shifting attention.' },
    { name: 'This Is Fine', meaning: 'Ironically accepting chaos around you.' },
    { name: 'Galaxy Brain', meaning: 'Over-the-top “expanding intellect” jokes.' }
  ]), []);

  const peopleAndThings = useMemo(() => ([
    { name: 'Founder', desc: 'The visionary behind Xakteir.' },
    { name: 'Buddy (Virtual Pet)', desc: 'A friendly companion you can care for.' },
    { name: 'VoltraMax', desc: 'Flagship folding hardware.' }
  ]), []);

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
    { id: 16, q: 'Which app is used for live sports?', options: ['XakSports', 'Pics', 'Notes', 'Slides'], a: 0 },
    { id: 17, q: 'Xakteir prefers which design aesthetic in chat?', options: ['Glassmorphism', 'Neumorphism', 'Flat', 'Skeuomorphism'], a: 0 },
    { id: 18, q: 'Which database is referenced repeatedly?', options: ['Firestore', 'Postgres', 'MongoDB', 'MySQL'], a: 0 },
    { id: 19, q: 'Where should very large datasets be stored?', options: ['Databases or object storage', 'In git', 'On the server root', 'In comments'], a: 0 },
    { id: 20, q: 'What is the intended purpose of Xakteir Knowledge?', options: ['A central knowledge base', 'A game', 'An image editor', 'A mail client'], a: 0 }
  ]), []);

  // Translator state
  const [tInput, setTInput] = useState('hello');
  const [tLang, setTLang] = useState('es');
  const [tOutput, setTOutput] = useState('');

  // Quiz state (compact preview of 5 questions)
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(1);
  const [finished, setFinished] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);

  useEffect(() => {
    if (finished) {
      // Simulate AI answers
      let aiCorrect = 0;
      for (const q of QUESTIONS) {
        const chance = 0.6; // simplified
        if (Math.random() < chance) aiCorrect++;
      }
      setAiScore(aiCorrect);
    }
  }, [finished]);

  const handleTranslate = () => {
    const map: Record<string, Record<string, string>> = {
      hello: { es: 'hola', fr: 'bonjour', de: 'hallo' },
      knowledge: { es: 'conocimiento', fr: 'connaissance', de: 'Wissen' },
      meme: { es: 'meme', fr: 'mème', de: 'Meme' }
    };
    const key = tInput.toLowerCase();
    const out = map[key] && map[key][tLang] ? map[key][tLang] : `${tInput} (${tLang})`;
    setTOutput(out);
  };

  const handleSelect = (qid: number, idx: number) => setAnswers(prev => ({ ...prev, [qid]: idx }));
  const handleNext = () => { if (current < 5) setCurrent(c => c + 1); else setFinished(true); };
  const score = useMemo(() => {
    let s = 0;
    for (const q of QUESTIONS.slice(0, 5)) if (answers[q.id] === q.a) s++;
    return s;
  }, [answers]);
  const restart = () => { setAnswers({}); setCurrent(1); setFinished(false); setAiScore(null); };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Xakteir Knowledge</h1>
            <p className="text-gray-600">A central, fun knowledge base — dictionary, mini-encyclopedia, meme meanings, and more.</p>
          </div>
          <div className="text-sm text-gray-500">Tip: Try the mini-quiz on the right and beat the AI 🤖💥</div>
        </div>

        <div className="mt-6 flex gap-2">
          <input value={tInput} onChange={(e) => setTInput(e.target.value)} placeholder="word to translate" className="flex-1 border rounded px-3 py-2" />
          <select value={tLang} onChange={(e) => setTLang(e.target.value)} className="border rounded px-2 py-2">
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
          <button onClick={handleTranslate} className="px-4 py-2 bg-blue-600 text-white rounded">Translate</button>
        </div>
        {tOutput && <div className="mt-3 text-sm text-gray-700">Translation: <strong>{tOutput}</strong></div>}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Dictionary</h2>
            <p className="text-slate-600 mt-1">Quick definitions for common Xakteir terms.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dictionary).map(([k, v]) => (
                <div key={k} className="p-4 border rounded-lg">
                  <div className="font-semibold">{k}</div>
                  <div className="text-sm text-slate-600 mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Mini-Encyclopedia</h2>
            <p className="text-slate-600 mt-1">Short articles and context cards.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {encyclopedia.map(e => (
                <div key={e.title} className="p-4 rounded-lg border hover:shadow transition">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{e.excerpt}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold">Meaning of Memes</h2>
            <p className="text-slate-600 mt-1">A lighthearted guide to modern internet symbols.</p>
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
        </div>

        <aside className="space-y-6">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow sticky top-6">
            <h3 className="text-xl font-bold">Mini Quiz — 5 Questions</h3>
            <p className="text-sm text-slate-600 mt-1">Try a quick 5-question set and see if you beat the AI.</p>

            {!finished ? (
              <div className="mt-4">
                <div className="text-sm text-slate-500">Question {current} / 5</div>
                <div className="mt-2 font-semibold">{QUESTIONS[current - 1].q}</div>
                <div className="mt-3 space-y-2">
                  {QUESTIONS[current - 1].options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleSelect(QUESTIONS[current - 1].id, idx)} className={`w-full text-left px-3 py-2 rounded-lg border ${answers[QUESTIONS[current - 1].id] === idx ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
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
                <div className="text-2xl font-extrabold">Your Score: {score} / 5</div>
                <div className="mt-2 text-slate-600">AI Score: {aiScore ?? '—'} / 5</div>
                <div className="mt-4">
                  {aiScore !== null && (
                    <div className={`inline-block px-4 py-2 rounded-full ${score > aiScore ? 'bg-emerald-100 text-emerald-800' : score < aiScore ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {score > aiScore ? 'You beat the AI — legend!' : score < aiScore ? 'AI wins this time — rematch?' : 'It is a tie — uncanny!'}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2 justify-center">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={restart}>Play Again</button>
                  <Link href="/knowledge/a/xakteir-overview" className="px-4 py-2 bg-gray-100 rounded">Read an Article</Link>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-slate-500">Fun fact: the AI's score is simulated client-side for entertainment.</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="mt-2 text-sm text-slate-600 space-y-1">
              <li><Link href="/knowledge">Knowledge Home</Link></li>
              <li><Link href="/knowledge/a/xakteir-overview">Xakteir Overview</Link></li>
              <li><Link href="/">Return to main site</Link></li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
