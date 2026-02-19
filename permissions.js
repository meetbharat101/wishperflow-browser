// Permissions Page - VibeCoding Extension
// This page requests microphone permission from the user

const grantBtn = document.getElementById('grantBtn');
const statusDiv = document.getElementById('status');

function setStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status-${type}`;
}

// Check current permission status
async function checkPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    console.log('Current microphone permission:', result.state);
    
    if (result.state === 'granted') {
      setStatus('✅ Microphone access granted! You can close this tab.', 'success');
      grantBtn.textContent = 'Permission Granted';
      grantBtn.disabled = true;
      
      // Notify the extension that permission was granted
      chrome.runtime.sendMessage({ type: 'MIC_PERMISSION_GRANTED' });
      
      // Auto-close after 2 seconds
      setTimeout(() => window.close(), 2000);
    } else if (result.state === 'denied') {
      setStatus('❌ Microphone access denied. Please enable it in your browser settings.', 'error');
      grantBtn.textContent = 'Permission Denied';
      grantBtn.disabled = true;
    }
    
    return result.state;
  } catch (error) {
    console.log('Permission query not supported, will request directly');
    return 'prompt';
  }
}

// Request microphone permission
async function requestMicrophonePermission() {
  setStatus('Requesting microphone access...', 'pending');
  grantBtn.disabled = true;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Permission granted - stop the stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    console.log('Microphone permission granted');
    setStatus('✅ Microphone access granted! You can close this tab.', 'success');
    grantBtn.textContent = 'Permission Granted';
    
    // Notify the extension that permission was granted
    chrome.runtime.sendMessage({ type: 'MIC_PERMISSION_GRANTED' });
    
    // Auto-close after 2 seconds
    setTimeout(() => window.close(), 2000);
    
  } catch (error) {
    console.error('Microphone permission error:', error);
    
    if (error.name === 'NotAllowedError') {
      setStatus('❌ Microphone access denied. Please click the button and allow access.', 'error');
    } else {
      setStatus(`❌ Error: ${error.message}`, 'error');
    }
    
    grantBtn.disabled = false;
    grantBtn.textContent = 'Try Again';
  }
}

// Initialize
grantBtn.addEventListener('click', requestMicrophonePermission);
checkPermission();
