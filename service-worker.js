console.log('SW Loaded');

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
let recordingState = false;

async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(c => c.url.endsWith(OFFSCREEN_DOCUMENT_PATH));
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.USER_MEDIA, chrome.offscreen.Reason.WORKERS],
      justification: 'Microphone capture and Whisper AI transcription'
    });
    console.log('Offscreen document created');
  } catch (error) {
    console.error('Offscreen creation error:', error);
  }
}

async function openPermissionsPage() {
  const url = chrome.runtime.getURL('permissions.html');
  const existing = await chrome.tabs.query({ url });
  if (existing.length > 0) {
    await chrome.tabs.update(existing[0].id, { active: true });
    await chrome.windows.update(existing[0].windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url });
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    console.warn('Content script injection failed:', e.message);
  }
}

async function insertTextIntoActiveTab(text) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    await injectContentScript(tab.id);
    await chrome.tabs.sendMessage(tab.id, { type: 'INSERT_TEXT', payload: text });
  } catch (e) {
    console.warn('Insert text failed:', e.message);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  setupOffscreenDocument();
  chrome.storage.local.set({ recording: false, autoPaste: false });
});

chrome.runtime.onStartup.addListener(() => {
  setupOffscreenDocument();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-recording') return;

  await setupOffscreenDocument();
  const { recording } = await chrome.storage.local.get('recording');

  if (recording) {
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_RECORDING' });
    recordingState = false;
    await chrome.storage.local.set({ recording: false });
    console.log('Shortcut: stopped recording', response);
  } else {
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_START_RECORDING' });
    if (response?.success) {
      recordingState = true;
      await chrome.storage.local.set({ recording: true });
      console.log('Shortcut: started recording');
    } else if (response?.message?.includes('Permission') || response?.message?.includes('NotAllowed')) {
      await openPermissionsPage();
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('SW received:', message.type);

  switch (message.type) {
    case 'PING':
      handlePing(sendResponse);
      return true;

    case 'START_RECORDING':
      handleStartRecording(sendResponse);
      return true;

    case 'STOP_RECORDING':
      handleStopRecording(sendResponse);
      return true;

    case 'GET_STATE':
      chrome.storage.local.get(['recording', 'autoPaste', 'lastResult']).then(sendResponse);
      return true;

    case 'SET_AUTO_PASTE':
      chrome.storage.local.set({ autoPaste: message.payload });
      sendResponse({ success: true });
      return true;

    case 'INSERT_TEXT_ACTIVE':
      insertTextIntoActiveTab(message.payload).then(() => sendResponse({ success: true }));
      return true;

    case 'LOAD_MODEL':
      handleLoadModel(sendResponse);
      return true;

    case 'MIC_PERMISSION_GRANTED':
      sendResponse({ success: true });
      return true;

    case 'REQUEST_MIC_PERMISSION':
      openPermissionsPage().then(() => sendResponse({ success: true }));
      return true;

    case 'TRANSCRIPTION_RESULT':
      handleTranscriptionResult(message.payload);
      return false;

    case 'TRANSCRIPTION_STATUS':
    case 'MODEL_STATUS':
      return false;

    default:
      return false;
  }
});

async function handlePing(sendResponse) {
  try {
    await setupOffscreenDocument();
    const response = await chrome.runtime.sendMessage({ type: 'PING_OFFSCREEN' });
    sendResponse({ message: 'Pong! (SW -> Offscreen -> SW)' });
  } catch (error) {
    sendResponse({ message: `Error: ${error.message}` });
  }
}

async function handleStartRecording(sendResponse) {
  try {
    await setupOffscreenDocument();
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_START_RECORDING' });

    if (response?.success) {
      recordingState = true;
      await chrome.storage.local.set({ recording: true });
    } else if (response?.message?.includes('Permission') || response?.message?.includes('NotAllowed')) {
      await openPermissionsPage();
      sendResponse({ success: false, message: 'Please grant microphone permission in the opened tab, then try again.' });
      return;
    }

    sendResponse(response);
  } catch (error) {
    sendResponse({ success: false, message: error.message });
  }
}

async function handleStopRecording(sendResponse) {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_RECORDING' });
    recordingState = false;
    await chrome.storage.local.set({ recording: false });
    sendResponse(response);
  } catch (error) {
    sendResponse({ success: false, message: error.message });
  }
}

async function handleLoadModel(sendResponse) {
  try {
    await setupOffscreenDocument();
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_LOAD_MODEL' });
    sendResponse(response);
  } catch (error) {
    sendResponse({ success: false, message: error.message });
  }
}

async function handleTranscriptionResult(payload) {
  await chrome.storage.local.set({ lastResult: payload });

  if (payload.success) {
    const { autoPaste } = await chrome.storage.local.get('autoPaste');
    if (autoPaste) {
      await insertTextIntoActiveTab(payload.formatted);
    }
  }
}
