// Popup Script - VibeCoding Extension
// Role: Dumb view layer - sends commands, shows UI

console.log('Popup Loaded');

// DOM Elements
const pingBtn = document.getElementById('pingBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const statusText = document.getElementById('status');

// Ping button click handler
pingBtn.addEventListener('click', async () => {
  statusText.textContent = 'Sending ping...';
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'PING' });
    console.log('Response from SW:', response);
    statusText.textContent = `Response: ${response?.message || 'No response'}`;
  } catch (error) {
    console.error('Error sending ping:', error);
    statusText.textContent = `Error: ${error.message}`;
  }
});

// Record button click handler
recordBtn.addEventListener('click', async () => {
  try {
    statusText.textContent = 'Starting recording...';
    
    // Send command to offscreen document via service worker
    const response = await chrome.runtime.sendMessage({ type: 'START_RECORDING' });
    console.log('Start recording response:', response);
    
    if (response?.success) {
      statusText.textContent = '🔴 Recording...';
      recordBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      statusText.textContent = `Error: ${response?.message || 'Failed to start recording'}`;
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    statusText.textContent = `Error: ${error.message}`;
  }
});

// Stop button click handler
stopBtn.addEventListener('click', async () => {
  try {
    statusText.textContent = 'Stopping recording...';
    
    // Send command to offscreen document via service worker
    const response = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    console.log('Stop recording response:', response);
    
    if (response?.success) {
      statusText.textContent = 'Recording stopped';
    } else {
      statusText.textContent = response?.message || 'No active recording';
    }
    
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  } catch (error) {
    console.error('Error stopping recording:', error);
    statusText.textContent = `Error: ${error.message}`;
  }
});
