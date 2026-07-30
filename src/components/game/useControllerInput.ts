import { useState, useEffect } from 'react';

export function useControllerInput(playerIndex: 1 | 2 | 3 | 4 = 1) {
  const [input, setInput] = useState({ x: 0, y: 0, kick: false });

  useEffect(() => {
    // Keyboard fallback map
    const keys = { up: false, left: false, down: false, right: false, action: false };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (playerIndex === 1) {
        if (code === 'KeyW') keys.up = true;
        if (code === 'KeyA') keys.left = true;
        if (code === 'KeyS') keys.down = true;
        if (code === 'KeyD') keys.right = true;
        if (code === 'Space') keys.action = true;
      } else if (playerIndex === 2) {
        if (code === 'ArrowUp') keys.up = true;
        if (code === 'ArrowLeft') keys.left = true;
        if (code === 'ArrowDown') keys.down = true;
        if (code === 'ArrowRight') keys.right = true;
        if (code === 'Enter') keys.action = true;
      }
      // Players 3 and 4 do NOT have keyboard fallbacks.
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (playerIndex === 1) {
        if (code === 'KeyW') keys.up = false;
        if (code === 'KeyA') keys.left = false;
        if (code === 'KeyS') keys.down = false;
        if (code === 'KeyD') keys.right = false;
        if (code === 'Space') keys.action = false;
      } else if (playerIndex === 2) {
        if (code === 'ArrowUp') keys.up = false;
        if (code === 'ArrowLeft') keys.left = false;
        if (code === 'ArrowDown') keys.down = false;
        if (code === 'ArrowRight') keys.right = false;
        if (code === 'Enter') keys.action = false;
      }
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
      const gp = gamepads[playerIndex - 1]; // Map player N to pad N-1
      
      if (gp) {
        // Left stick axes
        const stickX = gp.axes[0];
        const stickY = gp.axes[1];
        
        // Deadzone
        if (Math.abs(stickX) > 0.1) x = stickX;
        if (Math.abs(stickY) > 0.1) y = stickY;
        
        // A / Cross button
        kick = Boolean(gp.buttons[0]?.pressed);
      }
      
      // Fallback/override to keyboard if P1 or P2 is actively typing
      if (playerIndex <= 2 && (keys.up || keys.down || keys.left || keys.right || keys.action)) {
        x = 0; y = 0; // Override gamepad movement
        if (keys.up) y -= 1;
        if (keys.down) y += 1;
        if (keys.left) x -= 1;
        if (keys.right) x += 1;
        if (keys.action) kick = true;
        
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
  }, [playerIndex]);

  return input;
}
