// background.ts

chrome.runtime.onInstalled.addListener(() => {
  console.log("Xakteir Authenticator Extension Installed");

  chrome.contextMenus.create({
    id: "xakteir-root",
    title: "Xakteir Authenticator",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "xakteir-save",
    parentId: "xakteir-root",
    title: "Save Current Website",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "xakteir-generate",
    parentId: "xakteir-root",
    title: "Generate Secure Password",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "xakteir-save") {
    // Open the popup (Chrome doesn't allow programmatically opening the popup, 
    // but we can send a message or open a new tab). For now, we notify the user.
    chrome.scripting.executeScript({
      target: { tabId: tab?.id as number },
      func: () => alert("Click the Xakteir icon in your toolbar to save this website!")
    });
  } else if (info.menuItemId === "xakteir-generate") {
    // Generate password and copy to clipboard
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    const cryptoObj = globalThis.crypto;
    const randomValues = new Uint32Array(20);
    cryptoObj.getRandomValues(randomValues);
    for (let i = 0; i < 20; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    chrome.scripting.executeScript({
      target: { tabId: tab?.id as number },
      func: (pw) => {
        navigator.clipboard.writeText(pw).then(() => {
          alert("Secure password generated and copied to clipboard!\n\n" + pw);
        });
      },
      args: [password]
    });
  }
});

// Listen for auto-save from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "queue_save") {
    chrome.storage.local.get(['pending_saves'], (res) => {
      const pending = res.pending_saves || [];
      pending.push(request.credentials);
      chrome.storage.local.set({ pending_saves: pending }, () => {
        // Optional: show a notification that it was queued
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'https://xakteir.com/favicon.ico',
          title: 'Xakteir Vault',
          message: 'Password saved! Open the extension to sync to cloud.'
        });
        sendResponse({ success: true });
      });
    });
    return true; // async response
  }
});
