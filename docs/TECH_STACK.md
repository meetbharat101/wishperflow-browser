# Tech Stack

## Core Technologies
-   **Runtime:** Chrome Extension Manifest V3
-   **Language:** Vanilla JavaScript (ES2022 Modules)
-   **Build Tooling:** None -- raw vanilla JS. Dependencies copied from `node_modules` via `npm run setup`.

## AI & ML
-   **Library:** [Transformers.js](https://huggingface.co/docs/transformers.js) v2.17
    -   *Why:* Runs ONNX models directly in the browser via WASM.
-   **Model:** `Xenova/whisper-tiny` (quantized, ~40MB)
    -   *Why:* Small enough for in-browser use. Good accuracy for dictation.
    -   *Quantization:* int8 via `quantized: true` flag for speed.
-   **Runtime:** ONNX Runtime Web (WASM backend, bundled with Transformers.js)

## Audio Pipeline
- **Capture:** `navigator.mediaDevices.getUserMedia()` in the offscreen document
- **Recording:** `MediaRecorder` with `audio/webm;codecs=opus` format
- **Decoding:** `AudioContext.decodeAudioData()` to convert webm to raw PCM
- **Resampling:** Linear interpolation to 16kHz mono `Float32Array` for Whisper input
- **Offscreen Reason:** `chrome.offscreen.createDocument` with `USER_MEDIA` + `WORKERS` reasons

## Text Processing
- **Formatting:** Regex-based engine (`lib/formatter.js`)
  - Capitalize first letter and after sentence endings
  - Remove filler words (um, uh, er, ah, like you know)
  - Fix punctuation spacing and add trailing period
- **Injection:** `document.execCommand('insertText')` + direct value manipulation for input/textarea

## Message Protocol
- `popup.js` → `service-worker.js` → `offscreen.js` using `OFFSCREEN_` prefixed message types
- Broadcast messages (`MODEL_STATUS`, `TRANSCRIPTION_RESULT`) received by all extension contexts

## State & Storage
-   **Persistence:** `chrome.storage.local` (recording state, auto-paste preference, last result)
-   **Messaging:** `chrome.runtime.sendMessage` (one-time requests with async response)

## Keyboard Shortcut
- `Alt+Shift+R` to toggle recording from any tab (via `chrome.commands` API)
