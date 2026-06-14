import { useState, useEffect } from 'react';

export function useControllerInput() {
  const [input, setInput] = useState({ x: 0, y: 0, kick: false });

  useEffect(() => {
    // Keyboard fallback map
    const keys = { w: false, a: false, s: false, d: false, space: false };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keys.hasOwnProperty(key)) keys[key as keyof typeof keys] = true;
      if (e.code === 'Space') keys.space = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keys.hasOwnProperty(key)) keys[key as keyof typeof keys] = false;
      if (e.code === 'Space') keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop polling for gamepads
    let animationFrameId: number;
    
    const updateInput = () => {
      let x = 0;
      let y = 0;
      let kick = false;

      // Check Gamepads
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find(pad => pad !== null); // get first connected gamepad
      
      if (gp) {
        // Left stick axes
        const stickX = gp.axes[0];
        const stickY = gp.axes[1];
        
        // Deadzone
        if (Math.abs(stickX) > 0.1) x = stickX;
        if (Math.abs(stickY) > 0.1) y = stickY;
        
        // A / Cross button (usually index 0)
        kick = gp.buttons[0]?.pressed;
      } else {
        // Fallback to keyboard
        if (keys.w) y -= 1;
        if (keys.s) y += 1;
        if (keys.a) x -= 1;
        if (keys.d) x += 1;
        if (keys.space) kick = true;
        
        // Normalize diagonal
        if (x !== 0 && y !== 0) {
          const length = Math.sqrt(x*x + y*y);
          x /= length;
          y /= length;
        }
      }

      setInput({ x, y, kick });
      animationFrameId = requestAnimationFrame(updateInput);
    };

    animationFrameId = requestAnimationFrame(updateInput);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return input;
}
