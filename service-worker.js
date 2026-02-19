// Service Worker - VibeCoding Extension
console.log('SW Loaded');

// Offscreen document path
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Check if offscreen document already exists
async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
      return true;
    }
  }
  return false;
}

// Close existing offscreen document
async function closeOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    console.log('Closing existing offscreen document');
    await chrome.offscreen.closeDocument();
  }
}

// Create offscreen document for AI processing
async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    console.log('Offscreen document already exists');
    return;
  }

  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.USER_MEDIA, chrome.offscreen.Reason.WORKERS],
      justification: 'Capture microphone audio and run Whisper AI model for speech-to-text transcription'
    });
    console.log('Offscreen document created with USER_MEDIA + WORKERS');
  } catch (error) {
    console.error('Error creating offscreen document:', error);
  }
}

// Recreate offscreen document with correct permissions (used on install/update)
async function recreateOffscreenDocument() {
  await closeOffscreenDocument();
  await setupOffscreenDocument();
}

// Initialize offscreen document on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed - recreating offscreen document with correct permissions');
  recreateOffscreenDocument();
});

// Also setup on startup (in case SW was killed)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started - setting up offscreen document');
  setupOffscreenDocument();
});

// Open permissions page in a new tab
async function openPermissionsPage() {
  const permissionsUrl = chrome.runtime.getURL('permissions.html');
  
  // Check if permissions page is already open
  const existingTabs = await chrome.tabs.query({ url: permissionsUrl });
  if (existingTabs.length > 0) {
    // Focus existing tab
    await chrome.tabs.update(existingTabs[0].id, { active: true });
    await chrome.windows.update(existingTabs[0].windowId, { focused: true });
    return;
  }
  
  // Open new tab
  await chrome.tabs.create({ url: permissionsUrl });
}

// Message handler - Routes messages between Popup and Offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('SW received message:', message.type, 'from:', sender.url || 'extension');

  // Handle messages based on type
  switch (message.type) {
    case 'PING':
      handlePing(sendResponse);
      return true; // Keep channel open for async response

    case 'START_RECORDING':
      handleStartRecording(sendResponse);
      return true; // Keep channel open for async response

    case 'STOP_RECORDING':
      handleStopRecording(sendResponse);
      return true; // Keep channel open for async response

    case 'MIC_PERMISSION_GRANTED':
      console.log('Microphone permission granted by user');
      sendResponse({ success: true });
      return true;

    case 'REQUEST_MIC_PERMISSION':
      openPermissionsPage().then(() => {
        sendResponse({ success: true, message: 'Permissions page opened' });
      });
      return true;

    case 'OFFSCREEN_PONG':
      // Response from offscreen (handled via the forwarding promise)
      console.log('SW received PONG from Offscreen');
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
});

// Forward PING to offscreen and get response
async function handlePing(sendResponse) {
  try {
    // Ensure offscreen document exists
    await setupOffscreenDocument();

    // Forward to offscreen
    console.log('SW forwarding PING to Offscreen');
    const response = await chrome.runtime.sendMessage({ type: 'PING_OFFSCREEN' });
    console.log('SW got response from Offscreen:', response);

    sendResponse({ message: 'Pong! (via SW → Offscreen → SW)' });
  } catch (error) {
    console.error('Error in handlePing:', error);
    sendResponse({ message: `Error: ${error.message}` });
  }
}

// Forward START_RECORDING to offscreen
async function handleStartRecording(sendResponse) {
  try {
    // Ensure offscreen document exists
    await setupOffscreenDocument();

    console.log('SW forwarding START_RECORDING to Offscreen');
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_START_RECORDING' });
    console.log('SW got response from Offscreen:', response);

    // If permission was denied, open the permissions page
    if (!response.success && response.message.includes('Permission')) {
      console.log('Microphone permission needed, opening permissions page');
      await openPermissionsPage();
      sendResponse({ success: false, message: 'Please grant microphone permission in the opened tab, then try again.' });
      return;
    }

    sendResponse(response);
  } catch (error) {
    console.error('Error in handleStartRecording:', error);
    sendResponse({ success: false, message: error.message });
  }
}

// Forward STOP_RECORDING to offscreen
async function handleStopRecording(sendResponse) {
  try {
    console.log('SW forwarding STOP_RECORDING to Offscreen');
    const response = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_RECORDING' });
    console.log('SW got response from Offscreen:', response);

    sendResponse(response);
  } catch (error) {
    console.error('Error in handleStopRecording:', error);
    sendResponse({ success: false, message: error.message });
  }
}
