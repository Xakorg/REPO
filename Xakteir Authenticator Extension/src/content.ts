// content.ts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    const { email, password, totp } = request.credentials;

    // Autofill Email/Username fields
    if (email) {
      const emailInputs = document.querySelectorAll('input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]');
      emailInputs.forEach((input: any) => {
        if (!input.value) {
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    // Autofill Password fields
    if (password) {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      passwordInputs.forEach((input: any) => {
        if (!input.value) {
          input.value = password;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    // Autofill TOTP code if a field looks like it
    if (totp) {
      const totpInputs = document.querySelectorAll('input[name*="totp"], input[name*="code"], input[name*="otp"], input[id*="code"], input[id*="otp"]');
      totpInputs.forEach((input: any) => {
         if (!input.value && input.type !== 'hidden') {
           input.value = totp;
           input.dispatchEvent(new Event('input', { bubbles: true }));
           input.dispatchEvent(new Event('change', { bubbles: true }));
         }
      });
    }

    sendResponse({ success: true });
  }
});
