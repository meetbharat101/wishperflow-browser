chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'INSERT_TEXT') return false;

  const text = message.payload;
  if (!text) {
    sendResponse({ success: false, message: 'No text provided' });
    return true;
  }

  const el = document.activeElement;
  if (!el) {
    sendResponse({ success: false, message: 'No active element' });
    return true;
  }

  try {
    if (el.isContentEditable) {
      document.execCommand('insertText', false, text);
      sendResponse({ success: true });
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const before = el.value.substring(0, start);
      const after = el.value.substring(end);
      el.value = before + text + after;
      el.selectionStart = el.selectionEnd = start + text.length;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      sendResponse({ success: true });
    } else {
      document.execCommand('insertText', false, text);
      sendResponse({ success: true, message: 'Used execCommand fallback' });
    }
  } catch (error) {
    sendResponse({ success: false, message: error.message });
  }

  return true;
});
