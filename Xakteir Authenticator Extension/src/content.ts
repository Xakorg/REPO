import * as OTPAuth from "otpauth";

// generateTOTP local replica for content script
const generateTOTP = (secret: string) => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Xakteir', label: 'Auth', algorithm: 'SHA1', digits: 6, period: 30, secret: secret.replace(/\s+/g, '')
    });
    return totp.generate();
  } catch (e) { return "------"; }
};

let savedAccounts: any[] = [];

// Fetch initial accounts
chrome.storage?.local.get('xakteir_accounts', (res) => {
  if (res.xakteir_accounts) {
    savedAccounts = res.xakteir_accounts;
  }
});

// Listen for updates
chrome.storage?.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.xakteir_accounts) {
    savedAccounts = changes.xakteir_accounts.newValue;
  }
});

// Helper to autofill a specific account
function autofillAccount(account: any, passwordInput: HTMLInputElement) {
  // Find associated email input
  const emailInput = document.querySelector('input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]') as HTMLInputElement;
  
  if (emailInput && account.email) {
    emailInput.value = account.email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (passwordInput && account.password) {
    passwordInput.value = account.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Find TOTP input if present
  if (account.secret) {
    const totpInput = document.querySelector('input[name*="totp"], input[name*="code"], input[name*="otp"], input[id*="code"], input[id*="otp"]') as HTMLInputElement;
    if (totpInput && totpInput.type !== 'hidden') {
      totpInput.value = generateTOTP(account.secret);
      totpInput.dispatchEvent(new Event('input', { bubbles: true }));
      totpInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

// Function to inject the Xakteir icon into a password field
function injectIcon(passwordInput: HTMLInputElement) {
  // Check if we already injected
  if (passwordInput.dataset.xakteirInjected) return;
  passwordInput.dataset.xakteirInjected = 'true';

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.width = '100%';

  // We must carefully wrap the input without breaking the layout
  passwordInput.parentNode?.insertBefore(wrapper, passwordInput);
  wrapper.appendChild(passwordInput);

  const icon = document.createElement('img');
  icon.src = 'https://xakteir.com/favicon.ico';
  icon.style.position = 'absolute';
  icon.style.right = '10px';
  icon.style.top = '50%';
  icon.style.transform = 'translateY(-50%)';
  icon.style.width = '20px';
  icon.style.height = '20px';
  icon.style.cursor = 'pointer';
  icon.style.zIndex = '999999';
  icon.style.opacity = '0.7';
  icon.style.transition = 'opacity 0.2s';

  icon.onmouseover = () => icon.style.opacity = '1';
  icon.onmouseout = () => icon.style.opacity = '0.7';

  wrapper.appendChild(icon);

  // Shadow DOM for the dropdown to prevent CSS bleeding
  const dropdownHost = document.createElement('div');
  dropdownHost.style.position = 'absolute';
  dropdownHost.style.top = '100%';
  dropdownHost.style.right = '0';
  dropdownHost.style.zIndex = '1000000';
  dropdownHost.style.display = 'none';
  wrapper.appendChild(dropdownHost);

  const shadow = dropdownHost.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = `
    .xak-menu {
      background: #0d0a1a;
      border: 1px solid #3b2b80;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      padding: 8px 0;
      width: 250px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      margin-top: 5px;
    }
    .xak-item {
      padding: 10px 15px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .xak-item:last-child {
      border-bottom: none;
    }
    .xak-item:hover {
      background: rgba(147, 51, 234, 0.2);
    }
    .xak-email { font-size: 14px; font-weight: 500; }
    .xak-website { font-size: 11px; color: #a1a1aa; margin-top: 2px; }
    .xak-empty { padding: 15px; text-align: center; color: #a1a1aa; font-size: 13px; }
  `;
  shadow.appendChild(style);

  const menu = document.createElement('div');
  menu.className = 'xak-menu';
  shadow.appendChild(menu);

  icon.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle menu
    if (dropdownHost.style.display === 'block') {
      dropdownHost.style.display = 'none';
      return;
    }

    // Filter accounts by current domain
    const currentDomain = window.location.hostname.replace('www.', '');
    const relevantAccounts = savedAccounts.filter(a => a.website?.toLowerCase().includes(currentDomain.toLowerCase()));

    menu.innerHTML = '';
    
    if (relevantAccounts.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'xak-empty';
      empty.innerText = 'No Xakteir accounts saved for this website.';
      menu.appendChild(empty);
    } else {
      relevantAccounts.forEach(acc => {
        const item = document.createElement('div');
        item.className = 'xak-item';
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'xak-email';
        emailDiv.innerText = acc.email || acc.name;
        
        const siteDiv = document.createElement('div');
        siteDiv.className = 'xak-website';
        siteDiv.innerText = acc.website;

        item.appendChild(emailDiv);
        item.appendChild(siteDiv);

        item.onclick = () => {
          autofillAccount(acc, passwordInput);
          dropdownHost.style.display = 'none';
        };

        menu.appendChild(item);
      });
    }

    dropdownHost.style.display = 'block';
  };

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== icon && !dropdownHost.contains(e.target as Node)) {
      dropdownHost.style.display = 'none';
    }
  });
}

// Run scanner periodically (for SPAs)
setInterval(() => {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach((input) => injectIcon(input as HTMLInputElement));
}, 1000);

// Legacy listener for background script manual injection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    // If they trigger from popup, we just fill the first found password box
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    autofillAccount(request.credentials, passwordInput);
    sendResponse({ success: true });
  }
});

// Phase 3: Intelligent Auto-Save Overlay
document.addEventListener("submit", (e) => {
  const form = e.target as HTMLFormElement;
  if (!form) return;

  const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
  if (!passwordInput || !passwordInput.value) return;

  const emailInput = form.querySelector('input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]') as HTMLInputElement;
  const username = emailInput ? emailInput.value : "";
  const password = passwordInput.value;

  if (!username || !password) return;

  // Show Custom Xakteir Overlay
  showSavePrompt(username, password, window.location.hostname.replace('www.', ''));
}, true);

function showSavePrompt(email: string, password: string, website: string) {
  // Check if we already have a prompt
  if (document.getElementById('xakteir-save-prompt-host')) return;

  const host = document.createElement('div');
  host.id = 'xakteir-save-prompt-host';
  host.style.position = 'fixed';
  host.style.top = '20px';
  host.style.right = '20px';
  host.style.zIndex = '2147483647'; // Max z-index
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .prompt-container {
      background: rgba(5, 3, 13, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(147, 51, 234, 0.4);
      box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(147, 51, 234, 0.2);
      border-radius: 16px;
      padding: 16px 20px;
      width: 320px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header img {
      width: 24px;
      height: 24px;
    }
    .title {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      font-style: italic;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .subtitle {
      font-size: 12px;
      color: #a1a1aa;
      margin: 0;
      font-weight: 500;
    }
    .account-info {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      color: #e4e4e7;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }
    button {
      flex: 1;
      padding: 8px 0;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-save {
      background: #9333ea;
      color: white;
    }
    .btn-save:hover {
      background: #7e22ce;
    }
    .btn-close {
      background: rgba(255,255,255,0.1);
      color: #a1a1aa;
    }
    .btn-close:hover {
      background: rgba(255,255,255,0.15);
      color: white;
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'prompt-container';

  container.innerHTML = `
    <div class="header">
      <img src="https://xakteir.com/favicon.ico" />
      <div>
        <h3 class="title">Xakteir Vault</h3>
        <p class="subtitle">Save password for ${website}?</p>
      </div>
    </div>
    <div class="account-info">
      ${email}
    </div>
    <div class="actions">
      <button class="btn-close" id="btn-nope">Nope</button>
      <button class="btn-save" id="btn-save">Save Password</button>
    </div>
  `;

  shadow.appendChild(container);

  const closePrompt = () => {
    container.style.animation = 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) reverse';
    setTimeout(() => host.remove(), 380);
  };

  shadow.getElementById('btn-nope')?.addEventListener('click', closePrompt);
  
  shadow.getElementById('btn-save')?.addEventListener('click', () => {
    // Send to background to queue for Firebase sync
    chrome.runtime.sendMessage({
      action: "queue_save",
      credentials: { service: website, email, password, website }
    });
    
    container.innerHTML = `<div style="text-align:center; padding:20px; font-weight:bold; color:#34d399;">Saved!</div>`;
    setTimeout(closePrompt, 1500);
  });
}
