/* global chrome, turnstile */
const COBALT_INSTANCE = 'https://cobalt.micr.dev';

async function onTurnstileSuccess(token) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Verifying...';
  statusEl.className = 'status loading';
  
  try {
    const response = await fetch(`${COBALT_INSTANCE}/session`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'cf-turnstile-response': token
      }
    });
    
    if (!response.ok) {
      throw new Error(`Session request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.token) {
      const tokenData = {
        token: data.token,
        exp: Date.now() + (data.exp * 1000),
        instance: COBALT_INSTANCE
      };
      
      await chrome.storage.local.set({ cobalt_jwt: tokenData });
      
      statusEl.textContent = 'Verified! You can close this window.';
      statusEl.className = 'status success';
      
      chrome.runtime.sendMessage({ type: 'COBALT_AUTH_SUCCESS', tokenData });
      
      setTimeout(() => window.close(), 2000);
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('Cobalt auth error:', error);
    statusEl.textContent = `Error: ${error.message}. Please try again.`;
    statusEl.className = 'status error';
    
    if (window.turnstile) {
      turnstile.reset();
    }
  }
}

function onTurnstileError(error) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Verification failed. Please refresh and try again.';
  statusEl.className = 'status error';
  console.error('Turnstile error:', error);
}

async function init() {
  try {
    const response = await fetch(`${COBALT_INSTANCE}/`, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();
    
    if (data.cobalt?.turnstileSitekey) {
      const widget = document.querySelector('.cf-turnstile');
      widget.setAttribute('data-sitekey', data.cobalt.turnstileSitekey);
      
      if (window.turnstile) {
        turnstile.render('.cf-turnstile', {
          sitekey: data.cobalt.turnstileSitekey,
          callback: onTurnstileSuccess,
          'error-callback': onTurnstileError
        });
      }
    } else {
      throw new Error('No Turnstile sitekey found');
    }
  } catch (error) {
    console.error('Failed to get sitekey:', error);
    document.getElementById('status').textContent = 'Failed to initialize. Please try again.';
    document.getElementById('status').className = 'status error';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
