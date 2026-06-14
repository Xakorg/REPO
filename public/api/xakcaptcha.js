// XakCaptcha Client Script

(function() {
  function initXakCaptcha() {
    const containers = document.querySelectorAll('.xak-captcha');
    
    containers.forEach(container => {
      const siteKey = container.getAttribute('data-sitekey');
      if (!siteKey) {
        console.error('XakCaptcha: Missing data-sitekey attribute.');
        return;
      }
      
      // Render the basic checkbox UI
      container.style.cssText = 'width: 300px; height: 74px; border: 2px solid #333; border-radius: 8px; background: #0a0a15; display: flex; align-items: center; padding: 0 16px; font-family: sans-serif; user-select: none; box-sizing: border-box; position: relative;';
      
      const checkboxBox = document.createElement('div');
      checkboxBox.style.cssText = 'width: 28px; height: 28px; border: 2px solid #555; border-radius: 4px; background: #111; margin-right: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
      
      const label = document.createElement('div');
      label.style.cssText = 'color: #fff; font-size: 14px; font-weight: bold; flex-grow: 1;';
      label.innerText = "I'm a human (Xakteir)";
      
      const logo = document.createElement('div');
      logo.style.cssText = 'width: 24px; height: 24px; background-image: url("https://xakteir.com/favicon.ico"); background-size: cover; opacity: 0.8;';
      
      container.appendChild(checkboxBox);
      container.appendChild(label);
      container.appendChild(logo);
      
      // Handle the challenge popup
      checkboxBox.addEventListener('click', () => {
        if (checkboxBox.getAttribute('data-verified') === 'true') return;
        
        // Open verification window
        const width = 400;
        const height = 500;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        const challengeWindow = window.open(
          `https://xakteir.com/challenge?sitekey=${siteKey}`, 
          'XakCaptcha Challenge', 
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Listen for the verification success message from the popup
        const messageHandler = (e) => {
          if (e.origin !== 'https://xakteir.com') return;
          if (e.data && e.data.type === 'XAKCAPTCHA_SUCCESS') {
            
            // Verification passed!
            checkboxBox.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            checkboxBox.style.borderColor = '#10b981';
            checkboxBox.setAttribute('data-verified', 'true');
            checkboxBox.style.cursor = 'default';
            
            // Create a hidden input for form submission
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'xak-captcha-response';
            hiddenInput.value = e.data.token;
            container.appendChild(hiddenInput);
            
            window.removeEventListener('message', messageHandler);
            
            // Dispatch a custom event on the container so dev can hook into it
            container.dispatchEvent(new CustomEvent('xakcaptcha-verified', { detail: { token: e.data.token } }));
          }
        };
        
        window.addEventListener('message', messageHandler);
      });
    });
  }

  // Auto-init when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initXakCaptcha);
  } else {
    initXakCaptcha();
  }
})();
