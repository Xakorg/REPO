"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTickSound, playSelectSound } from '../audio';

type ScreenState = 'OFF' | 'BOOT' | 'WELCOME' | 'HOME' | 'STORE' | 'SETTINGS' | 'PROFILE' | 'QUICK_MENU';

export default function VoltraPlayHardware() {
  const [screen, setScreen] = useState<ScreenState>('OFF');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('HOME');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen === 'OFF' || screen === 'BOOT') return;
      
      playTickSound();
      
      if (e.key.toLowerCase() === 'x') {
        // Toggle Quick Menu
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

      // Simple navigation simulation mapping
      if (screen === 'HOME') {
        if (e.key === 'ArrowRight') setScreen('STORE');
        if (e.key === 'ArrowDown') setScreen('SETTINGS');
      } else if (screen === 'STORE') {
        if (e.key === 'ArrowLeft') setScreen('HOME');
        if (e.key === 'ArrowRight') setScreen('PROFILE');
      } else if (screen === 'PROFILE') {
        if (e.key === 'ArrowLeft') setScreen('STORE');
      } else if (screen === 'SETTINGS') {
        if (e.key === 'ArrowUp') setScreen('HOME');
      }
      
      if (e.key === 'Escape') {
        playSelectSound();
        if (screen === 'QUICK_MENU') setScreen(previousScreen);
        else setScreen('HOME');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, previousScreen]);

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

      {/* 🔴 Invisible Power Button Overlay (Top Leftish area) */}
      <button 
        onClick={handlePower}
        className="absolute top-[28%] left-[16%] w-[60px] h-[40px] z-50 cursor-pointer outline-none bg-red-500/0 hover:bg-white/20 rounded-full transition-colors"
        title="Power Button"
      />

      {/* 🔵 Invisible Xak Key Overlay (Bottom Left area under D-PAD) */}
      <button 
        onClick={handleXakKey}
        className="absolute bottom-[35%] left-[24%] w-[50px] h-[50px] z-50 cursor-pointer outline-none bg-blue-500/0 hover:bg-white/20 rounded-full transition-colors"
        title="Xak Key"
      />

      {/* 📺 Screen Area Mask (Perfectly aligned over the console screen in the photo) */}
      {/* Adjust these percentages to perfectly align with the screen inside the bezel in the image */}
      <div className="absolute z-20 w-[55.5%] h-[55.5%] top-[22.2%] left-[22.2%] bg-black overflow-hidden rounded-[4px] flex items-center justify-center">
        
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
              <p className="text-white/60 animate-pulse text-sm">Press [ENTER] on Keyboard or click Screen to begin</p>
              
              {/* Fallback click just in case */}
              <button onClick={() => setScreen('HOME')} className="absolute inset-0 w-full h-full cursor-pointer bg-transparent"></button>
            </motion.div>
          )}

          {screen === 'HOME' && (
            <motion.img 
              key="home" src="/voltraplay/voltraplay_home_mockup_1782563938672.png" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {screen === 'STORE' && (
            <motion.img 
              key="store" src="/voltraplay/xakteir_store_mockup_1782566232803.png" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

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
                {/* Background Context */}
                <img src="/voltraplay/voltraplay_home_mockup_1782563938672.png" className="absolute inset-0 w-full h-full object-cover blur-sm brightness-50" />
                
                {/* Quick Menu Overlay Image */}
                <motion.img 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    src="/voltraplay/voltraplay_quick_menu_mockup_1782564985698.png" 
                    className="absolute right-0 top-0 h-full w-full object-cover shadow-2xl"
                />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono tracking-widest pointer-events-none text-center">
        CLICK TOP-LEFT EDGE TO POWER ON | PRESS 'X' FOR QUICK MENU | ARROW KEYS TO NAVIGATE SCREENS
      </div>
    </div>
  );
}
