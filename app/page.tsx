'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

type Phase = 'chat' | 'transitioning' | 'results';
interface ChatMessage { role: 'user' | 'ai'; text: string; }
interface CardItem { title: string; content: string; }
interface ScenarioCard { id: number; label: string; polarity?: string | null; summary: string; cards: CardItem[]; }

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(mq.matches);
    const h = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return r;
}

const T = {
  sky: '#EDE5D8', sun1: '#E8B4A0', sun2: '#DE9880',
  hill1: '#C4C49A', hill2: '#A0A468', hill3: '#8A7850', hill4: '#624E30',
  olive: '#7C8C5A', oliveMid: '#C5D0A8', oliveLight: '#E8EDDA',
  text: '#2C2A24', textMid: '#7A7060', textLight: '#B0A898',
  white: '#FDFCF8', pos: '#D4E8C8', posT: '#3A5C28', neg: '#E8DCD4', negT: '#6B3A28',
};

const TINTS = [
  { border: '#C5D0A8', text: '#3A4A28', card: 'rgba(245,248,238,0.93)' },
  { border: '#C8BAA8', text: '#4A3C28', card: 'rgba(248,244,238,0.93)' },
  { border: '#A8C8B8', text: '#284A3A', card: 'rgba(238,248,244,0.93)' },
  { border: '#C8B8A8', text: '#4A382A', card: 'rgba(248,242,238,0.93)' },
];

const QUOTES = [
  { text: "The quality of your life is determined by the quality of your decisions.", author: "Tony Robbins" },
  { text: "In any moment of decision, the best thing you can do is the right thing.", author: "Theodore Roosevelt" },
  { text: "Every choice you make has an end result.", author: "Zig Ziglar" },
  { text: "You are the sum total of all your choices.", author: "Wayne Dyer" },
  { text: "The most difficult thing is the decision to act — the rest is merely tenacity.", author: "Amelia Earhart" },
  { text: "It is not what happens to you but how you react that matters.", author: "Epictetus" },
  { text: "Good decisions come from experience. Experience comes from bad decisions.", author: "Mark Twain" },
  { text: "Exploration is really the essence of the human spirit.", author: "Frank Borman" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Your life changes the moment you make a new, congruent decision.", author: "Tony Robbins" },
];

export default function WhatIfGame() {
  const [phase, setPhase] = useState<Phase>('chat');
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [scenarios, setScenarios] = useState<ScenarioCard[]>([]);
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [contextNote, setContextNote] = useState('');
  const [editInput, setEditInput] = useState('');
  const [baseline, setBaseline] = useState<Record<string, unknown> | null>(null);
  const [collectedContext, setCollectedContext] = useState<Record<string, unknown>>({});
  const [ageGate, setAgeGate] = useState<{popup: {title: string; body: string; acknowledge: string}; category: string} | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ageInput, setAgeInput] = useState('');
  const [legalWarning, setLegalWarning] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [winH, setWinH] = useState(844);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rm = usePrefersReducedMotion();

  useEffect(() => {
    setWinH(window.innerHeight);
    const h = () => setWinH(window.innerHeight);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const iv = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 4000);
    return () => clearInterval(iv);
  }, [isLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
  }, [chatHistory, rm]);

  useEffect(() => {
    if (phase === 'chat') setTimeout(() => inputRef.current?.focus(), 100);
  }, [phase]);

  const buildScenarios = (arr: Record<string, unknown>[]): ScenarioCard[] =>
    arr.map((p, i) => {
      const detail = (p.detail as string) || '';
      const paras = detail.split('\n\n').filter(s => s.trim().length > 10);
      const cards: CardItem[] = [{ title: 'Overview', content: (p.summary as string) || (p.label as string) || 'Path ' + (i + 1) }];
      if (paras.length >= 3) {
        cards.push({ title: 'Short term', content: paras[0] });
        cards.push({ title: 'Medium term', content: paras[1] });
        cards.push({ title: 'Long term', content: paras[2] });
      } else if (detail.trim().length > 20) {
        cards.push({ title: 'What happens', content: detail });
      }
      return { id: (p.id as number) || i + 1, label: (p.label as string) || 'Path ' + (i + 1), polarity: (p.polarity as string) || null, summary: (p.summary as string) || '', cards };
    });

  const handleSubmit = async () => {
    if (inputValue.length < 3 || isLoading) return;
    const q = inputValue; const isFirst = chatHistory.length === 0;
    if (isFirst) setOriginalQuestion(q);
    setInputValue(''); setIsLoading(true);
    const hist: ChatMessage[] = [...chatHistory, { role: 'user', text: q }];
    setChatHistory(hist);
    try {
      const res = await fetch('/api/clarify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: isFirst ? q : originalQuestion, history: hist, phase: isFirst ? 'classify' : 'gather', baseline, collected_context: collectedContext }) });
      const data = await res.json();
      if (data.crisis || data.phase === 'hard_stop') { setChatHistory([...hist, { role: 'ai', text: data.message || 'Please seek support.' }]); setIsLoading(false); return; }
      if (data.phase === 'age_gate' && data.popup) { setAgeGate({ popup: data.popup, category: data.category }); setIsLoading(false); return; }
      if (data.baseline) setBaseline(data.baseline);
      if (data.collected_context) setCollectedContext(data.collected_context);
      if (data.needs_clarification && data.question) { setChatHistory([...hist, { role: 'ai', text: data.question }]); setIsLoading(false); }
      else await generate(isFirst ? q : originalQuestion, hist, data.baseline || baseline, data.collected_context || collectedContext);
    } catch { await generate(isFirst ? q : originalQuestion, hist, baseline, collectedContext); }
  };

  const generate = async (dec: string, hist: ChatMessage[], bl: Record<string, unknown> | null, cc: Record<string, unknown>) => {
    setPhase('transitioning'); setIsLoading(true); setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
    // Phase stays 'transitioning' until results arrive — quotes show the whole time
    try {
      const ctx = hist.map(m => `${m.role === 'user' ? 'User' : 'Guide'}: ${m.text}`).join('\n');
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: dec, context: ctx, baseline: bl, collected_context: cc }) });
      const data = await res.json();
      if (data.context_note) setContextNote(data.context_note);
      const built = buildScenarios(data.possibilities || []);
      setScenarios(built.length > 0 ? built : [{ id: 1, label: 'Option A', polarity: null, summary: 'Loading...', cards: [{ title: 'Overview', content: 'Generating...' }] }]);
      setPhase('results');
    } catch { setScenarios([{ id: 1, label: 'Error', polarity: null, summary: 'Try again', cards: [{ title: 'Overview', content: 'Could not generate. Please try again.' }] }]); setPhase('results'); }
    finally { setIsLoading(false); }
  };

  const swipe = useCallback((dir: number) => {
    const s = expandedScenario !== null ? scenarios[expandedScenario] : null; if (!s) return;
    setActiveCard(p => { const n = p + dir; if (n >= s.cards.length) return 0; if (n < 0) return s.cards.length - 1; return n; });
  }, [scenarios, expandedScenario]);

  const onDragEnd = (_: unknown, info: PanInfo) => { if (Math.abs(info.offset.x) > 60) swipe(info.offset.x > 0 ? -1 : 1); };
  const onCardKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); swipe(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); swipe(-1); }
    if (e.key === 'Escape') { setExpandedScenario(null); setActiveCard(0); }
  }, [swipe]);

  const open = (i: number) => { setExpandedScenario(i); setActiveCard(0); setTimeout(() => cardRef.current?.focus(), 100); };
  const close = () => { setExpandedScenario(null); setActiveCard(0); };

  const handleEdit = async () => {
    if (editInput.length < 2 || isLoading) return;
    const nc: ChatMessage[] = [...chatHistory, { role: 'user', text: editInput }];
    setChatHistory(nc); setEditInput('');
    setScenarios([]); // Clear old results before new ones load
    await generate(originalQuestion, nc, baseline, collectedContext);
  };

  const reset = () => { setPhase('chat'); setInputValue(''); setChatHistory([]); setOriginalQuestion(''); setScenarios([]); setExpandedScenario(null); setActiveCard(0); setContextNote(''); setEditInput(''); setBaseline(null); setCollectedContext({}); };

  // SVG landscape — sized to actual window height
  const W = 1400; const H = winH;
  const sunY = H * 0.16;
  const h1Y = H * 0.72; const h2Y = H * 0.78; const h3Y = H * 0.84; const h4Y = H * 0.90;

  const landscape = `
    <rect width="${W}" height="${H}" fill="${T.sky}"/>
    <circle cx="160" cy="${sunY}" r="62" fill="${T.sun1}" opacity="0.5"/>
    <circle cx="160" cy="${sunY}" r="42" fill="${T.sun2}" opacity="0.42"/>
    <path d="M0 ${h1Y} Q175 ${h1Y-80} 350 ${h1Y-45} Q525 ${h1Y-80} 700 ${h1Y-50} Q875 ${h1Y-78} 1050 ${h1Y-48} Q1225 ${h1Y-75} ${W} ${h1Y-52} L${W} ${H} L0 ${H} Z" fill="${T.hill1}" opacity="0.55"/>
    <path d="M0 ${h2Y} Q175 ${h2Y-72} 350 ${h2Y-40} Q525 ${h2Y-70} 700 ${h2Y-42} Q875 ${h2Y-68} 1050 ${h2Y-38} Q1225 ${h2Y-65} ${W} ${h2Y-40} L${W} ${H} L0 ${H} Z" fill="${T.hill2}" opacity="0.62"/>
    <path d="M0 ${h3Y} Q175 ${h3Y-62} 350 ${h3Y-34} Q525 ${h3Y-60} 700 ${h3Y-36} Q875 ${h3Y-58} 1050 ${h3Y-32} Q1225 ${h3Y-55} ${W} ${h3Y-34} L${W} ${H} L0 ${H} Z" fill="${T.hill3}" opacity="0.72"/>
    <path d="M0 ${h4Y} Q350 ${h4Y-28} 700 ${h4Y-16} Q1050 ${h4Y-26} ${W} ${h4Y-14} L${W} ${H} L0 ${H} Z" fill="${T.hill4}" opacity="0.85"/>
  `;

  const bgStyle = {
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>${landscape}</svg>`)}")`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
  };

  const inputBar = (isResults: boolean) => (
    <div style={{ padding: '14px 20px 32px', background: 'rgba(237,229,216,0.92)', borderTop: '1px solid rgba(180,165,145,0.3)', backdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', gap: '10px' }}>
        <input
          ref={isResults ? undefined : inputRef}
          value={isResults ? editInput : inputValue}
          onChange={e => isResults ? setEditInput(e.target.value) : setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { isResults ? handleEdit() : handleSubmit(); } }}
          placeholder={isResults ? 'Add context or change something...' : (chatHistory.length === 0 ? "What's on your mind?" : 'Your answer...')}
          disabled={isLoading}
          suppressHydrationWarning
          style={{ flex: 1, borderRadius: '26px', outline: 'none', background: 'rgba(253,252,248,0.95)', border: '1.5px solid rgba(197,208,168,0.8)', color: T.text, fontFamily: 'system-ui,sans-serif', fontSize: '15px', padding: '13px 22px' }}
        />
        <button
          onClick={isResults ? handleEdit : handleSubmit}
          disabled={(isResults ? editInput.length < 2 : inputValue.length < 1) || isLoading}
          style={{ borderRadius: '26px', padding: '13px 24px', background: (isResults ? editInput.length >= 2 : inputValue.length >= 1) ? T.olive : 'rgba(197,208,168,0.5)', color: (isResults ? editInput.length >= 2 : inputValue.length >= 1) ? T.white : T.textLight, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '18px', fontFamily: 'system-ui,sans-serif', transition: 'all 0.2s' }}>
          →
        </button>
      </div>
      {isResults ? (
        <p onClick={reset} style={{ textAlign: 'center', marginTop: '10px', cursor: 'pointer', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px' }}>← ask something new</p>
      ) : chatHistory.length >= 2 ? (
        <p onClick={() => generate(originalQuestion, chatHistory, baseline, collectedContext)} style={{ textAlign: 'center', marginTop: '10px', cursor: 'pointer', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px' }}>skip to results →</p>
      ) : null}
    </div>
  );

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', ...bgStyle }}>

      {/* CHAT PHASE */}
      <AnimatePresence>
        {phase === 'chat' && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, y: rm ? 0 : -20 }} transition={{ duration: 0.35 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '48px 24px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.olive, fontFamily: 'system-ui,sans-serif' }}>what if?</p>
              <h1 style={{ margin: '10px 0 0', fontSize: '26px', fontWeight: 700, color: T.text, lineHeight: 1.2, fontFamily: 'Georgia,serif', textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>explore your possibilities</h1>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', minHeight: 0 }}>
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                {chatHistory.length === 0 && (
                  <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                    <p style={{ color: T.textMid, fontSize: '13px', marginBottom: '14px', fontFamily: 'system-ui,sans-serif' }}>try one of these</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {['Should I go to gym today?', 'Red or blue dress?', 'Should I take this job?', 'MacBook or Windows?'].map(ex => (
                        <button key={ex} onClick={async () => { setOriginalQuestion(ex); setInputValue(''); setIsLoading(true); const hist = [{ role: 'user' as const, text: ex }]; setChatHistory(hist); try { const res = await fetch('/api/clarify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: ex, history: hist, phase: 'classify', baseline: null, collected_context: {} }) }); const data = await res.json(); if (data.baseline) setBaseline(data.baseline); if (data.collected_context) setCollectedContext(data.collected_context); if (data.needs_clarification && data.question) { setChatHistory([...hist, { role: 'ai', text: data.question }]); setIsLoading(false); } else { await generate(ex, hist, data.baseline, data.collected_context || {}); } } catch { await generate(ex, hist, null, {}); } }}
                          style={{ background: 'rgba(253,252,248,0.75)', border: '1px solid ' + T.oliveMid, color: '#4A5A30', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer', backdropFilter: 'blur(6px)', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                    style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ padding: '12px 18px', borderRadius: msg.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px', background: msg.role === 'user' ? 'rgba(197,208,168,0.92)' : 'rgba(253,252,248,0.92)', color: msg.role === 'user' ? '#3A4A28' : T.text, fontSize: '15px', lineHeight: '1.55', maxWidth: '82%', border: msg.role === 'ai' ? '1px solid rgba(197,185,165,0.5)' : 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', backdropFilter: 'blur(8px)', fontFamily: msg.role === 'ai' ? 'Georgia,serif' : 'system-ui,sans-serif' }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isLoading && chatHistory.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'inline-flex', gap: '5px', padding: '12px 18px', borderRadius: '20px 20px 20px 6px', background: 'rgba(253,252,248,0.92)', border: '1px solid rgba(197,185,165,0.5)', backdropFilter: 'blur(8px)' }}>
                      {[0,1,2].map(i => <motion.div key={i} animate={{ y: [0,-5,0] }} transition={{ duration: 0.5, delay: i*0.12, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.oliveMid }} />)}
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
            {inputBar(false)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS PHASE */}
      <AnimatePresence>
        {(phase === 'transitioning' || phase === 'results') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ padding: '32px 24px 14px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: T.olive, fontFamily: 'system-ui,sans-serif', fontWeight: 700 }}>what if</p>
              <h2 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: 700, color: T.text, lineHeight: 1.25, fontFamily: 'Georgia,serif', textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>{originalQuestion}</h2>
            </motion.div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', minHeight: 0 }}>
              <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  style={{ display: 'grid', gridTemplateColumns: scenarios.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                  {scenarios.map((s, i) => {
                    const tint = TINTS[i % TINTS.length];
                    return (
                      <motion.div key={s.id} whileHover={{ scale: rm ? 1 : 1.02 }} whileTap={{ scale: rm ? 1 : 0.97 }} onClick={() => open(i)}
                        style={{ background: tint.card, border: '1.5px solid ' + tint.border, borderRadius: '22px', padding: '24px 22px', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.09)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', borderRadius: '0 22px 0 60px', background: tint.border, opacity: 0.4 }} />
                        <p style={{ margin: '0 0 8px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: tint.text, opacity: 0.5, fontFamily: 'system-ui,sans-serif', fontWeight: 700 }}>{s.label}</p>
                        <p style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 700, color: tint.text, lineHeight: 1.3, fontFamily: 'Georgia,serif' }}>{s.summary || s.label}</p>
                        {s.polarity && (
                          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', background: s.polarity === 'positive' ? T.pos : T.neg, color: s.polarity === 'positive' ? T.posT : T.negT, fontFamily: 'system-ui,sans-serif', fontWeight: 600, marginBottom: '12px' }}>
                            {s.polarity === 'positive' ? '↑ likely positive' : '↓ likely challenging'}
                          </div>
                        )}
                        <div style={{ marginTop: '14px' }}>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', color: tint.text, opacity: 0.52, fontFamily: 'Georgia,serif', fontStyle: 'italic', lineHeight: 1.45 }}>
                            {s.cards.length > 1 ? s.cards[1]?.content?.substring(0, 90) + '...' : 'Tap to explore the full timeline'}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); open(i); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: tint.border, border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                          >
                            <span style={{ fontSize: '13px', color: tint.text, fontFamily: 'system-ui,sans-serif', fontWeight: 600 }}>Read timeline</span>
                            <span style={{ fontSize: '15px', color: tint.text, fontWeight: 700 }}>→</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
                {contextNote && <p style={{ textAlign: 'center', color: T.textMid, fontFamily: 'Georgia,serif', fontSize: '13px', fontStyle: 'italic', margin: '0 0 16px' }}>{contextNote}</p>}
              </div>
            </div>
            {inputBar(true)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXPANDED TIMELINE */}
      <AnimatePresence>
        {expandedScenario !== null && scenarios[expandedScenario] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}
            style={{ position: 'absolute', inset: 0, background: 'rgba(44,38,28,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }} transition={{ type: 'spring', damping: 26 }}
              onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px' }}>
              <AnimatePresence mode="wait">
                {(() => {
                  const s = scenarios[expandedScenario];
                  const tint = TINTS[expandedScenario % TINTS.length];
                  const card = s.cards[activeCard];
                  return (
                    <motion.div key={activeCard} ref={cardRef} tabIndex={0} onKeyDown={onCardKey}
                      initial={{ opacity: 0, x: rm ? 0 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: rm ? 0 : -50 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                      drag={rm ? false : 'x'} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12} onDragEnd={onDragEnd}
                      style={{ outline: 'none', cursor: rm ? 'default' : 'grab' }}>
                      <div style={{ background: 'rgba(253,252,248,0.98)', border: '1.5px solid ' + tint.border, borderRadius: '26px', padding: '32px 30px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative', overflow: 'hidden', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 26px 0 80px', background: tint.border, opacity: 0.35 }} />
                        <button onClick={close} style={{ position: 'absolute', top: '18px', right: '22px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: tint.text, opacity: 0.35, lineHeight: 1, fontFamily: 'system-ui,sans-serif', zIndex: 1 }}>×</button>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: tint.text, opacity: 0.45, fontFamily: 'system-ui,sans-serif', fontWeight: 700 }}>{s.label}</p>
                          <p style={{ margin: '0 0 16px', fontSize: '12px', color: tint.text, opacity: 0.45, fontFamily: 'system-ui,sans-serif' }}>{card.title} · {activeCard + 1} of {s.cards.length}</p>
                          {activeCard === 0 ? (
                            <div>
                              <p style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 700, color: tint.text, fontFamily: 'Georgia,serif', lineHeight: 1.25 }}>{s.label}</p>
                              <p style={{ margin: 0, fontSize: '15px', color: tint.text, fontFamily: 'Georgia,serif', lineHeight: 1.65, opacity: 0.88 }}>{card.content}</p>
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '16px', color: tint.text, fontFamily: 'Georgia,serif', lineHeight: 1.7 }}>{card.content}</p>
                          )}
                          {s.polarity && activeCard === 0 && (
                            <div style={{ marginTop: '16px', display: 'inline-block', padding: '5px 14px', borderRadius: '12px', fontSize: '12px', background: s.polarity === 'positive' ? T.pos : T.neg, color: s.polarity === 'positive' ? T.posT : T.negT, fontFamily: 'system-ui,sans-serif', fontWeight: 600 }}>
                              {s.polarity === 'positive' ? '↑ likely positive' : '↓ likely challenging'}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {s.cards.map((c, i) => <button key={i} onClick={() => setActiveCard(i)} aria-label={c.title} style={{ width: activeCard === i ? '24px' : '8px', height: '8px', borderRadius: '4px', background: activeCard === i ? tint.border : tint.border + '55', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />)}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                            <button onClick={() => swipe(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: tint.border, border: 'none', cursor: 'pointer', fontSize: '18px', color: tint.text, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.8 }}>←</button>
                            <p style={{ margin: 0, fontSize: '11px', color: tint.text, opacity: 0.28, fontFamily: 'system-ui,sans-serif' }}>{activeCard + 1} of {s.cards.length}</p>
                            <button onClick={() => swipe(1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: tint.border, border: 'none', cursor: 'pointer', fontSize: '18px', color: tint.text, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.8 }}>→</button>
                          </div>
                          <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: tint.text, opacity: 0.22, fontFamily: 'system-ui,sans-serif' }}>swipe · arrow keys · esc to close</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AGE GATE POPUP */}
      <AnimatePresence>
        {ageGate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(44,38,28,0.65)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 20 }}
              style={{ background: 'rgba(253,252,248,0.98)', borderRadius: '26px', padding: '32px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: T.olive, fontFamily: 'system-ui,sans-serif', fontWeight: 700 }}>
                {ageGate.popup.title}
              </p>
              <p style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: T.text, fontFamily: 'Georgia,serif', lineHeight: 1.3 }}>
                {ageGate.popup.body}
              </p>
              {!ageConfirmed ? (
                <div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input
                      value={ageInput}
                      onChange={e => setAgeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="Your age"
                      style={{ flex: 1, borderRadius: '20px', outline: 'none', background: '#FAF8F5', border: '1.5px solid ' + T.oliveMid, color: T.text, fontFamily: 'system-ui,sans-serif', fontSize: '16px', padding: '11px 18px' }}
                    />
                    <button onClick={() => {
                      const age = parseInt(ageInput);
                      const legalAge = ageGate.category === 'alcohol' ? 21 : 18;
                      if (age < legalAge) {
                        const msg = ageGate.category === 'alcohol'
                          ? "🧃 You're not quite of legal drinking age yet! The good news? Sparkling water with lime hits different — and your liver will thank you later. Come back when you're legal, and until then, let's raise a glass of OJ! 🍊"
                          : "🌿 You're too young for this one! Your body is still developing and deserves better. Find something that actually feels good — sports, music, art. Your future self will be grateful. 💪";
                        setChatHistory(prev => [...prev, { role: 'ai', text: msg }]);
                        setAgeGate(null); setAgeInput(''); setAgeConfirmed(false);
                      } else {
                        setAgeConfirmed(true);
                        const warning = ageGate.category === 'alcohol'
                          ? "⚠️ What If will explore both paths honestly — including the not-so-glamorous parts. This is not encouragement to drink."
                          : "⚠️ Smoking carries significant health risks. What If will show possibilities honestly, including long-term impacts. This is not encouragement.";
                        setLegalWarning(warning);
                      }
                    }}
                      disabled={ageInput.length < 1}
                      style={{ borderRadius: '20px', padding: '11px 20px', background: ageInput.length >= 1 ? T.olive : T.oliveMid, color: T.white, border: 'none', cursor: ageInput.length >= 1 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '15px', fontFamily: 'system-ui,sans-serif' }}>
                      Confirm
                    </button>
                  </div>
                  <button onClick={() => { setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '4px' }}>
                    go back
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#8C4A28', fontFamily: 'Georgia,serif', lineHeight: 1.55, fontStyle: 'italic', background: '#FFF0E0', borderRadius: '12px', padding: '12px 16px' }}>
                    {ageGate.popup.acknowledge}
                  </p>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: T.textMid, fontFamily: 'Georgia,serif', lineHeight: 1.55 }}>
                    {legalWarning}
                  </p>
                  <button onClick={async () => {
                    const q = originalQuestion || chatHistory[0]?.text || '';
                    const confirmedAge = ageInput;
                    const confirmedCategory = ageGate.category;
                    setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning('');
                    setIsLoading(true);
                    // Pass age as collected context — NOT as chat message so gatherer won't re-ask
                    const ageCollected = {
                      ...collectedContext,
                      shared: { ...(collectedContext.shared as Record<string,unknown> || {}), user_age: confirmedAge, age_verified: true, category: confirmedCategory }
                    };
                    setCollectedContext(ageCollected);
                    try {
                      const res = await fetch('/api/clarify', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ decision: q, history: chatHistory, phase: 'gather', baseline, collected_context: ageCollected }),
                      });
                      const data = await res.json();
                      if (data.baseline) setBaseline(data.baseline);
                      if (data.collected_context) setCollectedContext(data.collected_context);
                      if (data.needs_clarification && data.question) {
                        setChatHistory(prev => [...prev, { role: 'ai' as const, text: data.question }]);
                        setIsLoading(false);
                      } else {
                        await generate(q, chatHistory, data.baseline || baseline, data.collected_context || ageCollected);
                      }
                    } catch {
                      await generate(q, chatHistory, baseline, ageCollected);
                    }
                  }}
                    style={{ width: '100%', borderRadius: '22px', padding: '13px', background: T.olive, color: T.white, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: 'system-ui,sans-serif' }}>
                    I understand — show me the possibilities
                  </button>
                  <button onClick={() => { setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning(''); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '10px' }}>
                    go back
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING WITH QUOTES */}
      <AnimatePresence>
        {isLoading && phase === 'transitioning' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'rgba(237,229,216,0.94)', borderRadius: '28px', padding: '40px 36px', maxWidth: '300px', width: '100%', margin: '0 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.14)', border: '1px solid rgba(197,208,168,0.5)', backdropFilter: 'blur(16px)' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
                {[0,1,2].map(i => <motion.div key={i} animate={{ y: rm ? 0 : [0,-10,0] }} transition={{ duration: 0.7, delay: i*0.18, repeat: Infinity }} style={{ width: '10px', height: '10px', borderRadius: '50%', background: TINTS[i].border }} />)}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={quoteIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', color: '#4A3C28', lineHeight: 1.55, fontStyle: 'italic', margin: '0 0 10px' }}>&ldquo;{QUOTES[quoteIdx % QUOTES.length].text}&rdquo;</p>
                  <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: '11px', color: '#8C7060', letterSpacing: '0.06em', margin: 0, textTransform: 'uppercase' }}>— {QUOTES[quoteIdx % QUOTES.length].author}</p>
                </motion.div>
              </AnimatePresence>
              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: T.textLight, fontFamily: 'system-ui,sans-serif', letterSpacing: '0.08em' }}></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}