'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type GameState = 'idle' | 'typing' | 'thinking' | 'results' | 'walking';

interface Possibility {
  id: number;
  label: string;
  summary: string;
  detail: string;
  road: 'left' | 'center' | 'right';
}

const SIGNPOST_POSITIONS = {
  left:   { bottom: '28%', left: '12%' },
  center: { bottom: '38%', left: '46%' },
  right:  { bottom: '28%', right: '12%' },
};

const WALK_TARGETS = {
  left:   { x: -320, y: -80,  scale: 0.35 },
  center: { x: 0,    y: -160, scale: 0.25 },
  right:  { x: 320,  y: -80,  scale: 0.35 },
};

export default function CrossroadsScene() {
  const [gameState, setGameState]       = useState<GameState>('idle');
  const [inputValue, setInputValue]     = useState('');
  const [lookDir, setLookDir]           = useState<'left' | 'right' | 'center'>('center');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [chosenRoad, setChosenRoad]     = useState<'left' | 'center' | 'right' | null>(null);
  const [possibilities, setPossibilities] = useState<Possibility[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const lookRef = useRef(0);

  useEffect(() => {
    if (gameState !== 'idle') return;
    const dirs: Array<'left' | 'right' | 'center'> = ['left', 'center', 'right', 'center', 'left', 'right'];
    const timer = setInterval(() => {
      lookRef.current = (lookRef.current + 1) % dirs.length;
      setLookDir(dirs[lookRef.current]);
    }, 1800);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleAvatarClick = () => {
    if (gameState === 'idle' || gameState === 'results') {
      setGameState('typing');
    }
  };

  const handleSubmit = async () => {
    if (inputValue.length < 10 || isLoading) return;
    setGameState('thinking');
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: inputValue }),
      });
      const data = await res.json();
      setPossibilities(data.possibilities ?? mockPossibilities(inputValue));
    } catch {
      setPossibilities(mockPossibilities(inputValue));
    } finally {
      setIsLoading(false);
      setGameState('results');
    }
  };

  const handleChooseRoad = (road: 'left' | 'center' | 'right') => {
    setChosenRoad(road);
    setExpandedCard(null);
    setGameState('walking');
    setTimeout(() => setGameState('results'), 2400);
  };

  const walkTarget = chosenRoad ? WALK_TARGETS[chosenRoad] : { x: 0, y: 0, scale: 1 };

  return (
    <main className="relative w-full h-screen overflow-hidden select-none">

      <Image
        src="/background.png"
        alt="Dusty Texas crossroads at golden hour"
        fill
        className="object-cover object-center"
        priority
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)' }}
      />

      {/* SIGNPOSTS */}
      <AnimatePresence>
        {gameState === 'results' && possibilities.map((p) => {
          const pos = SIGNPOST_POSITIONS[p.road];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', damping: 14, delay: (p.id - 1) * 0.25 }}
              className="absolute cursor-pointer z-20"
              style={{ ...pos, width: '160px' }}
              onClick={() => setExpandedCard(expandedCard === p.id ? null : p.id)}
            >
              <div className="relative">
                <Image
                  src="/signpost.png"
                  alt={`Possibility ${p.id}`}
                  width={160}
                  height={200}
                <div
                  className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-center"
                  style={{
                    bottom: '30px',
                    background: 'rgba(254,243,199,0.85)',
                    fontSize: '8px',
                    color: '#B45309',
                    fontFamily: 'Georgia, serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  tap to read
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* BLUR OVERLAY */}
      <AnimatePresence>
        {(gameState === 'typing' || gameState === 'thinking') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 35,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0,0,0,0.25)',
            }}
          />
        )}
      </AnimatePresence>

      {/* CHARACTER TYPING VIDEO */}
      <AnimatePresence>
        {(gameState === 'typing' || gameState === 'thinking') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
            className="absolute z-40 pointer-events-none"
            style={{
              bottom: '220px',
              left: '0',
              right: '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '70%',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '560px',
              height: '85%',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: '24px',
              zIndex: 0,
            }} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              style={{
                background: 'rgba(254,243,199,0.95)',
                border: '1.5px solid #B45309',
                borderRadius: '20px',
                padding: '6px 18px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: '13px',
                color: '#451A03',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                marginBottom: '40px',
                zIndex: 2,
                position: 'relative',
              }}
            >
              {gameState === 'thinking' ? '✦ reading the roads...' : "✦ I'm listening..."}
            </motion.div>
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '520px',
                height: 'auto',
                flexShrink: 0,
                mixBlendMode: 'screen',
                display: 'block',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <source src="/character-typing.webm" type="video/webm" />
              <source src="/character-typing.mp4" type="video/mp4" />
            </video>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHARACTER AT CROSSROADS */}
      <motion.div
        className="absolute z-30 cursor-pointer"
        style={{
          bottom: '18%',
          left: '50%',
          translateX: '-50%',
          width: '200px',
          isolation: 'isolate',
        }}
        animate={
          gameState === 'walking'
            ? { x: walkTarget.x, y: walkTarget.y, scale: walkTarget.scale }
            : gameState === 'typing' || gameState === 'thinking'
            ? { opacity: 0, scale: 0.95 }
            : { x: 0, y: 0, scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        onClick={handleAvatarClick}
        title="Click to share your question"
      >
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div
              key="bubble"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 px-2 py-1 rounded-xl text-xs whitespace-nowrap"
              style={{
                background: 'rgba(254,243,199,0.95)',
                border: '1.5px solid #B45309',
                color: '#451A03',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {lookDir === 'left' ? '← which way...' : lookDir === 'right' ? 'which way... →' : '🤔 hmm...'}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                style={{
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #B45309',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '480px',
              height: 'auto',
              mixBlendMode: 'screen',
              clipPath: 'inset(0 0 12% 0)',
              transform: lookDir === 'left'
                ? 'rotate(-3deg) scale(1.75)'
                : lookDir === 'right'
                ? 'rotate(3deg) scale(1.75)'
                : 'rotate(0deg) scale(1.75)',
              transformOrigin: 'center bottom',
              transition: 'transform 0.5s ease',
              display: 'block',
            }}
          >
            <source src="/character-idle.webm" type="video/webm" />
            <source src="/character-idle.mp4" type="video/mp4" />
          </video>
        </div>
      </motion.div>

      {/* INPUT PANEL */}
      <AnimatePresence>
        {gameState === 'typing' && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            className="absolute z-50"
            style={{
              bottom: '32px',
              left: '31%',
              transform: 'translateX(-30%)',
              width: '540px',
              maxWidth: '50vw',
            }}
          >
            <p className="text-center mb-2 italic" style={{ color: '#78350F', fontFamily: 'Georgia, serif', fontSize: '13px' }}>
              What decision are you standing at?
            </p>
            <textarea
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
              }}
              placeholder="Should I quit my job to start a company?"
              rows={3}
              className="w-full resize-none rounded-2xl outline-none text-sm"
              style={{
                background: 'rgba(254,243,199,0.95)',
                border: '1.5px solid #B45309',
                color: '#451A03',
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                padding: '12px 16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSubmit}
                disabled={inputValue.length < 10 || isLoading}
                className="flex-1 py-2.5 rounded-full text-sm font-medium"
                style={{
                  background: inputValue.length >= 10 ? '#B45309' : '#D97706',
                  color: '#FEF3C7',
                  fontFamily: 'Georgia, serif',
                  border: 'none',
                  cursor: inputValue.length >= 10 ? 'pointer' : 'not-allowed',
                  opacity: inputValue.length >= 10 ? 1 : 0.6,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
              >
                {isLoading ? 'Reading the roads...' : 'Show me the paths →'}
              </button>
              <button
                onClick={() => { setGameState('idle'); setInputValue(''); }}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  background: 'rgba(254,243,199,0.9)',
                  color: '#B45309',
                  fontFamily: 'Georgia, serif',
                  border: '1.5px solid #B45309',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THINKING STATE */}
      <AnimatePresence>
        {gameState === 'thinking' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="px-6 py-3 rounded-full" style={{ background: 'rgba(254,243,199,0.97)', border: '2px solid #B45309', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <p className="text-sm italic" style={{ color: '#451A03', fontFamily: 'Georgia, serif' }}>
                ✦ The roads are revealing themselves...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS HINT */}
      <AnimatePresence>
        {gameState === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-center"
          >
            <p className="text-xs mb-2 italic" style={{ color: '#FEF3C7', fontFamily: 'Georgia, serif', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              Tap the signposts to explore each path
            </p>
            <button
              onClick={() => { setGameState('typing'); setChosenRoad(null); }}
              className="px-5 py-2 rounded-full text-xs"
              style={{ background: 'rgba(254,243,199,0.92)', border: '1.5px solid #B45309', color: '#B45309', fontFamily: 'Georgia, serif', cursor: 'pointer' }}
            >
              Ask a different question
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXPANDED CARD */}
      <AnimatePresence>
        {expandedCard !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setExpandedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="rounded-2xl p-6 max-w-md w-full"
              style={{ background: '#FEF3C7', border: '2px solid #B45309', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Image src="/signpost.png" alt="" width={40} height={52} style={{ width: '40px', height: 'auto' }} />
                <h3 className="text-xl font-bold" style={{ color: '#451A03', fontFamily: 'Georgia, serif' }}>
                  Possibility {expandedCard}
                </h3>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#78350F', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
                {possibilities.find((p) => p.id === expandedCard)?.detail}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const road = possibilities.find((p) => p.id === expandedCard)?.road;
                    if (road) handleChooseRoad(road);
                  }}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium"
                  style={{ background: '#B45309', color: '#FEF3C7', fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer' }}
                >
                  Walk this road →
                </button>
                <button
                  onClick={() => setExpandedCard(null)}
                  className="flex-1 py-2.5 rounded-full text-sm"
                  style={{ background: 'transparent', color: '#B45309', fontFamily: 'Georgia, serif', border: '1.5px solid #B45309', cursor: 'pointer' }}
                >
                  Keep reading
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IDLE HINT */}
      <AnimatePresence>
        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center"
          >
            <p className="text-sm italic" style={{ color: '#FEF3C7', fontFamily: 'Georgia, serif', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              tap the traveller to begin
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}

function mockPossibilities(decision: string): Possibility[] {
  return [
    {
      id: 1,
      label: 'Possibility 1',
      summary: 'Stay the course',
      detail: `In this path, you continue with your current situation. The first 6 months bring stability and clarity. By 2 years, you have built a foundation you can rely on. At 5 years, you look back and understand exactly why this path chose you — and what it asked of you in return.`,
      road: 'left',
    },
    {
      id: 2,
      label: 'Possibility 2',
      summary: 'Take the leap',
      detail: `In this path, you make the bold change. The first 6 months are turbulent — uncertain mornings and restless nights. By 2 years, the turbulence has settled into something that feels unmistakably yours. At 5 years, the person you've become would be unrecognizable to the one who stood at this crossroads.`,
      road: 'center',
    },
    {
      id: 3,
      label: 'Possibility 3',
      summary: 'The middle way',
      detail: `In this path, you test the waters before committing. The first 6 months are a careful experiment — you gather evidence without burning bridges. By 2 years, the data is clear enough to make a real choice. At 5 years, you have built something that honours both who you were and who you are becoming.`,
      road: 'right',
    },
  ];
}
