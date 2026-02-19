// Offscreen Document - VibeCoding Extension
// This runs in a hidden document context for AI processing
console.log('Offscreen Loaded');

// Audio Recording State
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;

// Start recording audio
async function startRecording() {
  try {
    console.log('Offscreen: Requesting microphone access...');
    
    audioStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        channelCount: 1,
        sampleRate: 16000
      } 
    });
    
    console.log('Offscreen: Microphone access granted');
    
    mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        console.log('Offscreen: Audio chunk received:', event.data.size, 'bytes');
      }
    };
    
    mediaRecorder.onstop = async () => {
      console.log('Offscreen: Recording stopped, total chunks:', audioChunks.length);
      // Stop all tracks to release the microphone
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
      
      // Create blob from chunks
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        console.log('Offscreen: Audio blob created:', audioBlob.size, 'bytes');
        // TODO: Phase 5 will process this audio
      }
    };
    
    mediaRecorder.start(1000); // Collect data every 1 second
    console.log('Offscreen: Recorder Started');
    
    return { success: true, message: 'Recording started' };
  } catch (error) {
    console.error('Offscreen: Error accessing microphone:', error);
    return { success: false, message: error.message };
  }
}

// Stop recording audio
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    console.log('Offscreen: MediaRecorder stopped');
    return { success: true, message: 'Recording stopped' };
  }
  return { success: false, message: 'No active recording' };
}

// Message handler - receives messages from Service Worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only handle messages intended for offscreen (prefixed with OFFSCREEN_)
  if (!message.type?.startsWith('OFFSCREEN_') && message.type !== 'PING_OFFSCREEN') {
    return false; // Ignore messages not meant for us
  }
  
  console.log('Offscreen received message:', message.type);

  switch (message.type) {
    case 'PING_OFFSCREEN':
      console.log('Offscreen processing PING');
      sendResponse({ message: 'Pong from Offscreen!' });
      return true;

    case 'OFFSCREEN_START_RECORDING':
      startRecording().then(sendResponse);
      return true; // Keep channel open for async response

    case 'OFFSCREEN_STOP_RECORDING':
      sendResponse(stopRecording());
      return true;

    default:
      console.log('Offscreen: Unknown message type:', message.type);
  }
});
