"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTickSound, playSelectSound } from './audio';

// Import our new Interactive UI Components
import HomeScreen from './HomeScreen';
import StoreScreen from './StoreScreen';
import QuickMenu from './QuickMenu';

type ScreenState = 'OFF' | 'BOOT' | 'WELCOME' | 'HOME' | 'STORE' | 'SETTINGS' | 'PROFILE' | 'QUICK_MENU';

export default function VoltraPlayHardware() {
  const [screen, setScreen] = useState<ScreenState>('OFF');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('HOME');
  
  // Navigation Indices
  const [homeIndex, setHomeIndex] = useState(0);
  const [storeIndex, setStoreIndex] = useState(-1);
  const [quickMenuIndex, setQuickMenuIndex] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen === 'OFF' || screen === 'BOOT') return;
      
      playTickSound();
      
      if (e.key.toLowerCase() === 'x') {
        if (screen === 'QUICK_MENU') {
          setScreen(previousScreen);
        } else {
          setPreviousScreen(screen);
          setScreen('QUICK_MENU');
        }
        return;
      }

      if (screen === 'WELCOME' && e.key === 'Enter') {
        playSelectSound();
        setScreen('HOME');
        return;
      }

      // Interactive Navigation Logic
      if (screen === 'HOME') {
        if (e.key === 'ArrowRight') setHomeIndex(p => Math.min(p + 1, 3));
        if (e.key === 'ArrowLeft') setHomeIndex(p => Math.max(p - 1, 0));
        if (e.key === 'Enter') {
          playSelectSound();
          if (homeIndex === 2) setScreen('STORE');
          if (homeIndex === 3) setScreen('SETTINGS');
        }
      } else if (screen === 'STORE') {
        if (e.key === 'ArrowDown') setStoreIndex(0);
        if (e.key === 'ArrowUp') setStoreIndex(-1);
        if (e.key === 'ArrowRight' && storeIndex >= 0) setStoreIndex(p => Math.min(p + 1, 3));
        if (e.key === 'ArrowLeft' && storeIndex >= 0) setStoreIndex(p => Math.max(p - 1, 0));
      } else if (screen === 'QUICK_MENU') {
        if (e.key === 'ArrowDown') setQuickMenuIndex(p => Math.min(p + 1, 4));
        if (e.key === 'ArrowUp') setQuickMenuIndex(p => Math.max(p - 1, 0));
      } else if (screen === 'PROFILE') {
        // Just for demo
        if (e.key === 'ArrowLeft') setScreen('STORE');
      } else if (screen === 'SETTINGS') {
        if (e.key === 'ArrowUp') setScreen('HOME');
      }
      
      if (e.key === 'Escape') {
        playSelectSound();
        if (screen === 'QUICK_MENU') setScreen(previousScreen);
        else if (screen === 'STORE' || screen === 'SETTINGS' || screen === 'PROFILE') setScreen('HOME');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, previousScreen, homeIndex, storeIndex, quickMenuIndex]);

  const handlePower = () => {
    if (screen === 'OFF') {
      playSelectSound();
      setScreen('BOOT');
      setTimeout(() => setScreen('WELCOME'), 3500);
    } else {
      setScreen('OFF');
    }
  };

  const handleXakKey = () => {
    if (screen === 'OFF' || screen === 'BOOT') return;
    playSelectSound();
    if (screen === 'QUICK_MENU') {
        setScreen(previousScreen);
    } else {
        setPreviousScreen(screen);
        setScreen('QUICK_MENU');
    }
  };

  return (
    <div className="relative w-[1600px] h-[900px] flex items-center justify-center select-none">
      
      {/* Hardware Chassis Image */}
      <img 
        src="/voltraplay/voltraplay_hardware_abxy_1782566431824.png" 
        alt="VoltraPlay Console" 
        className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl z-10 pointer-events-none"
      />

      <button 
        onClick={handlePower}
        className="absolute top-[28%] left-[16%] w-[60px] h-[40px] z-50 cursor-pointer outline-none bg-red-500/0 hover:bg-white/20 rounded-full transition-colors"
        title="Power Button"
      />

      <button 
        onClick={handleXakKey}
        className="absolute bottom-[35%] left-[24%] w-[50px] h-[50px] z-50 cursor-pointer outline-none bg-blue-500/0 hover:bg-white/20 rounded-full transition-colors"
        title="Xak Key"
      />

      {/* 📺 Screen Area Mask */}
      <div 
        className="absolute z-20 bg-black overflow-hidden flex items-center justify-center rounded-sm"
        style={{
          width: '46%', 
          height: '24%', 
          top: '28.5%', 
          left: '25%',
          transform: 'perspective(1000px) rotateY(12deg) rotateZ(1deg)',
          transformOrigin: 'center center'
        }}
      >
        <AnimatePresence mode="wait">
          {screen === 'OFF' && (
            <motion.div key="off" className="absolute inset-0 bg-black" />
          )}
          
          {screen === 'BOOT' && (
            <motion.div 
              key="boot" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-0 bg-black flex items-center justify-center flex-col"
            >
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_10px_rgba(255,255,255,0.8)] animate-ping" />
              <div className="mt-8 text-xl font-light tracking-[0.5em] text-white/90 animate-pulse">VOLTRAPLAY</div>
            </motion.div>
          )}

          {screen === 'WELCOME' && (
            <motion.div 
              key="welcome" 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-teal-900 to-black flex flex-col items-center justify-center text-white p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 mb-6 shadow-[0_0_30px_rgba(0,229,255,0.5)]"></div>
              <h1 className="text-3xl font-light mb-2 tracking-widest">Welcome to Xakteir</h1>
              <p className="text-teal-300/80 mb-12">The Ultimate Handheld OS</p>
              <p className="text-white/60 animate-pulse text-sm">Press [ENTER] on Keyboard to begin</p>
              <button onClick={() => setScreen('HOME')} className="absolute inset-0 w-full h-full cursor-pointer bg-transparent"></button>
            </motion.div>
          )}

          {/* Interactive React Components instead of Images! */}
          {screen === 'HOME' && <HomeScreen key="home" selectedIndex={homeIndex} />}
          {screen === 'STORE' && <StoreScreen key="store" selectedIndex={storeIndex} />}
          
          {screen === 'SETTINGS' && (
            <motion.img 
              key="settings" src="/voltraplay/voltraplay_settings_ui_1782566766027.png" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {screen === 'PROFILE' && (
            <motion.img 
              key="profile" src="/voltraplay/voltraplay_user_profile_ui_1782567072999.png" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {screen === 'QUICK_MENU' && (
            <motion.div key="quickmenu" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {previousScreen === 'HOME' ? <HomeScreen selectedIndex={homeIndex} /> : 
                 previousScreen === 'STORE' ? <StoreScreen selectedIndex={storeIndex} /> : 
                 <div className="absolute inset-0 bg-black"></div>}
                
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-40"></div>
                
                {/* Interactive Quick Menu Component */}
                <QuickMenu selectedIndex={quickMenuIndex} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono tracking-widest pointer-events-none text-center">
        CLICK TOP-LEFT EDGE TO POWER ON | PRESS 'X' FOR QUICK MENU | ARROW KEYS TO NAVIGATE
      </div>
    </div>
  );
}
