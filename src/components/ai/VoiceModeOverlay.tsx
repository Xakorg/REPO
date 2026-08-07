'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  state: 'idle' | 'listening' | 'speaking';
  transcript: string;
  onMute: () => void;
  isMuted: boolean;
}

export function VoiceModeOverlay({
  isOpen,
  onClose,
  state,
  transcript,
  onMute,
  isMuted,
}: VoiceModeOverlayProps) {
  const orbColor =
    state === 'listening'
      ? ['#7C3AED', '#4F46E5']
      : state === 'speaking'
      ? ['#059669', '#10B981']
      : ['#1a1a2e', '#16213e'];

  const label =
    state === 'listening' ? 'Listening...' : state === 'speaking' ? 'Speaking...' : 'Tap mic to speak';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
        >
          {/* Orb */}
          <div className="relative flex items-center justify-center mb-12">
            {/* Ripple rings */}
            {state !== 'idle' && (
              <>
                {[1, 2, 3].map(ring => (
                  <motion.div
                    key={ring}
                    className="absolute rounded-full border"
                    style={{
                      borderColor: state === 'listening' ? 'rgba(124,58,237,0.2)' : 'rgba(16,185,129,0.2)',
                      width: 160 + ring * 60,
                      height: 160 + ring * 60,
                    }}
                    animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: ring * 0.4,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </>
            )}

            {/* Main orb */}
            <motion.div
              className="w-40 h-40 rounded-full relative flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${orbColor[0]}, ${orbColor[1]})`,
                boxShadow:
                  state !== 'idle'
                    ? `0 0 60px ${state === 'listening' ? 'rgba(124,58,237,0.4)' : 'rgba(16,185,129,0.4)'}`
                    : 'none',
              }}
              animate={
                state !== 'idle'
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {state === 'speaking' ? (
                <Volume2 className="w-12 h-12 text-white drop-shadow-xl" />
              ) : (
                <Mic className={cn('w-12 h-12 drop-shadow-xl', isMuted ? 'text-white/30' : 'text-white')} />
              )}
            </motion.div>
          </div>

          {/* Status */}
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-sm font-black uppercase tracking-widest mb-3',
              state === 'listening' ? 'text-violet-400' : state === 'speaking' ? 'text-emerald-400' : 'text-white/30'
            )}
          >
            {label}
          </motion.p>

          {/* Transcript */}
          <div className="w-full max-w-lg px-8 min-h-[60px] text-center mb-16">
            <AnimatePresence mode="wait">
              {transcript ? (
                <motion.p
                  key={transcript}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-white/60 text-base leading-relaxed"
                >
                  {transcript}
                </motion.p>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/20 text-sm italic"
                >
                  {state === 'idle' ? 'Xak AI is ready' : 'Your words will appear here...'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Mute */}
            <button
              onClick={onMute}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center border transition-all',
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End call */}
            <button
              onClick={onClose}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-2xl shadow-rose-500/30 transition-all active:scale-95"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Xak AI label */}
          <p className="absolute top-6 left-0 right-0 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
            Xak AI — Voice Mode
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
