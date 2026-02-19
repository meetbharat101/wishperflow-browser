const micBtn = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const rawSection = document.getElementById('rawSection');
const rawText = document.getElementById('rawText');
const actionsBar = document.getElementById('actionsBar');
const copyBtn = document.getElementById('copyBtn');
const insertBtn = document.getElementById('insertBtn');
const clearBtn = document.getElementById('clearBtn');
const autoPasteToggle = document.getElementById('autoPasteToggle');
const modelBadge = document.getElementById('modelBadge');

let isRecording = false;
let isProcessing = false;
let currentResult = null;

async function init() {
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (state?.recording) {
      setRecordingUI();
    }
    if (state?.autoPaste) {
      autoPasteToggle.checked = true;
    }
    if (state?.lastResult?.success) {
      showResult(state.lastResult);
    }
  } catch (e) {
    console.warn('Init state fetch failed:', e);
  }
}

function setRecordingUI() {
  isRecording = true;
  micBtn.classList.add('recording');
  micBtn.classList.remove('processing');
  statusText.textContent = 'Recording... click to stop';
  statusText.className = 'status-text recording';
  statusDot.className = 'dot';
  statusDot.style.background = '#ef4444';
}

function setProcessingUI() {
  isProcessing = true;
  isRecording = false;
  micBtn.classList.remove('recording');
  micBtn.classList.add('processing');
  statusText.textContent = 'Transcribing...';
  statusText.className = 'status-text processing';
  progressBar.classList.add('visible');
  progressFill.style.width = '100%';
  progressFill.style.animation = 'none';
}

function setIdleUI() {
  isRecording = false;
  isProcessing = false;
  micBtn.classList.remove('recording', 'processing');
  statusText.textContent = 'Click to start recording';
  statusText.className = 'status-text';
  statusDot.className = 'dot';
  statusDot.style.background = '#22c55e';
  progressBar.classList.remove('visible');
  progressFill.style.width = '0%';
}

function showResult(payload) {
  currentResult = payload;
  resultText.textContent = payload.formatted;
  resultSection.classList.add('visible');
  actionsBar.classList.remove('hidden');

  if (payload.raw !== payload.formatted) {
    rawText.textContent = payload.raw;
    rawSection.style.display = 'block';
  } else {
    rawSection.style.display = 'none';
  }
}

function clearResult() {
  currentResult = null;
  resultSection.classList.remove('visible');
  actionsBar.classList.add('hidden');
  resultText.textContent = '';
  rawText.textContent = '';
  rawSection.style.display = 'none';
  chrome.storage.local.remove('lastResult');
}

micBtn.addEventListener('click', async () => {
  if (isProcessing) return;

  if (isRecording) {
    statusText.textContent = 'Stopping...';
    try {
      const response = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
      if (response?.success) {
        setProcessingUI();
      } else {
        setIdleUI();
        statusText.textContent = response?.message || 'Stop failed';
      }
    } catch (e) {
      setIdleUI();
      statusText.textContent = 'Error: ' + e.message;
    }
  } else {
    statusText.textContent = 'Starting...';
    try {
      const response = await chrome.runtime.sendMessage({ type: 'START_RECORDING' });
      if (response?.success) {
        setRecordingUI();
      } else {
        setIdleUI();
        statusText.textContent = response?.message || 'Failed to start';
      }
    } catch (e) {
      setIdleUI();
      statusText.textContent = 'Error: ' + e.message;
    }
  }
});

copyBtn.addEventListener('click', async () => {
  if (!currentResult?.formatted) return;
  try {
    await navigator.clipboard.writeText(currentResult.formatted);
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy';
    }, 1500);
  } catch (e) {
    console.error('Copy failed:', e);
  }
});

insertBtn.addEventListener('click', async () => {
  if (!currentResult?.formatted) return;
  try {
    await chrome.runtime.sendMessage({ type: 'INSERT_TEXT_ACTIVE', payload: currentResult.formatted });
    insertBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Inserted!';
    setTimeout(() => {
      insertBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Insert';
    }, 1500);
  } catch (e) {
    console.error('Insert failed:', e);
  }
});

clearBtn.addEventListener('click', clearResult);

autoPasteToggle.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_AUTO_PASTE', payload: autoPasteToggle.checked });
});

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'MODEL_STATUS':
      handleModelStatus(message.payload);
      break;
    case 'TRANSCRIPTION_STATUS':
      if (message.payload?.status === 'processing') {
        setProcessingUI();
      }
      break;
    case 'TRANSCRIPTION_RESULT':
      handleTranscriptionResult(message.payload);
      break;
  }
});

function handleModelStatus(payload) {
  if (payload.status === 'loading') {
    modelBadge.textContent = `Loading ${payload.progress || 0}%`;
    modelBadge.className = 'model-badge loading';
    statusDot.className = 'dot loading';

    if (payload.progress > 0) {
      progressBar.classList.add('visible');
      progressFill.style.width = payload.progress + '%';
    }
  } else if (payload.status === 'ready') {
    modelBadge.textContent = 'whisper-tiny';
    modelBadge.className = 'model-badge ready';
    statusDot.className = 'dot';
    statusDot.style.background = '#22c55e';
  } else if (payload.status === 'error') {
    modelBadge.textContent = 'Error';
    modelBadge.className = 'model-badge';
    statusDot.className = 'dot error';
  }
}

function handleTranscriptionResult(payload) {
  setIdleUI();

  if (payload.success) {
    showResult(payload);
  } else {
    statusText.textContent = 'Transcription failed: ' + (payload.error || 'Unknown error');
    statusText.className = 'status-text';
  }
}

init();
