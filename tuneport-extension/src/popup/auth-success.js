const params = new URLSearchParams(window.location.search);
const userName = params.get('user');
if (userName) {
  document.getElementById('user-info').textContent = `Welcome, ${decodeURIComponent(userName)}`;
}

setTimeout(() => {
  chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }, () => {
    if (chrome.runtime.lastError) {
      console.warn('Close message error:', chrome.runtime.lastError);
    }
    window.close();
  });
  setTimeout(() => window.close(), 500);
}, 5000);
