import { pipeline, env } from './lib/transformers.min.js';
import { formatTranscription } from './lib/formatter.js';

env.allowLocalModels = false;
env.useBrowserCache = true;

console.log('Offscreen Loaded');

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let transcriber = null;
let modelLoading = false;

async function loadModel() {
  if (transcriber) return transcriber;
  if (modelLoading) return null;

  modelLoading = true;
  broadcast({ type: 'MODEL_STATUS', payload: { status: 'loading', progress: 0 } });

  try {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      quantized: true,
      progress_callback: (data) => {
        if (data.status === 'progress') {
          const pct = Math.round(data.progress || 0);
          broadcast({ type: 'MODEL_STATUS', payload: { status: 'loading', progress: pct, file: data.file } });
        }
        if (data.status === 'done') {
          console.log('Offscreen: Model file loaded:', data.file);
        }
      }
    });

    console.log('Offscreen: Whisper model ready');
    modelLoading = false;
    broadcast({ type: 'MODEL_STATUS', payload: { status: 'ready' } });
    return transcriber;
  } catch (error) {
    console.error('Offscreen: Model load error:', error);
    modelLoading = false;
    broadcast({ type: 'MODEL_STATUS', payload: { status: 'error', message: error.message } });
    return null;
  }
}

function broadcast(message) {
  try {
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch (e) {}
}

async function startRecording() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, sampleRate: 16000 }
    });

    mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.start(1000);
    console.log('Offscreen: Recording started');

    loadModel();

    return { success: true, message: 'Recording started' };
  } catch (error) {
    console.error('Offscreen: Mic error:', error);
    return { success: false, message: error.message };
  }
}

function stopRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') {
      resolve({ success: false, message: 'No active recording' });
      return;
    }

    mediaRecorder.onstop = async () => {
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
        audioStream = null;
      }

      if (audioChunks.length === 0) {
        resolve({ success: false, message: 'No audio captured' });
        return;
      }

      resolve({ success: true, message: 'Processing audio...' });

      const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      audioChunks = [];
      processAudio(blob);
    };

    mediaRecorder.stop();
  });
}

async function processAudio(blob) {
  broadcast({ type: 'TRANSCRIPTION_STATUS', payload: { status: 'processing' } });

  try {
    const audioData = await decodeAudioBlob(blob);

    const model = transcriber || await loadModel();
    if (!model) {
      broadcast({ type: 'TRANSCRIPTION_RESULT', payload: { success: false, error: 'Model failed to load' } });
      return;
    }

    console.log('Offscreen: Running transcription on', audioData.length, 'samples');
    const result = await model(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });

    const rawText = result.text.trim();
    const formattedText = formatTranscription(rawText);

    console.log('Offscreen: Transcription done:', rawText);
    broadcast({
      type: 'TRANSCRIPTION_RESULT',
      payload: { success: true, raw: rawText, formatted: formattedText }
    });
  } catch (error) {
    console.error('Offscreen: Transcription error:', error);
    broadcast({
      type: 'TRANSCRIPTION_RESULT',
      payload: { success: false, error: error.message }
    });
  }
}

async function decodeAudioBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = decoded.getChannelData(0);

  if (decoded.sampleRate !== 16000) {
    const ratio = decoded.sampleRate / 16000;
    const newLength = Math.floor(channelData.length / ratio);
    const resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      resampled[i] = channelData[Math.floor(i * ratio)];
    }
    audioCtx.close();
    return resampled;
  }

  audioCtx.close();
  return channelData;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.type?.startsWith('OFFSCREEN_') && message.type !== 'PING_OFFSCREEN') {
    return false;
  }

  console.log('Offscreen received:', message.type);

  switch (message.type) {
    case 'PING_OFFSCREEN':
      sendResponse({ message: 'Pong from Offscreen!' });
      return true;

    case 'OFFSCREEN_START_RECORDING':
      startRecording().then(sendResponse);
      return true;

    case 'OFFSCREEN_STOP_RECORDING':
      stopRecording().then(sendResponse);
      return true;

    case 'OFFSCREEN_LOAD_MODEL':
      loadModel().then(() => sendResponse({ success: true }));
      return true;

    default:
      console.log('Offscreen: Unknown message:', message.type);
  }
});
