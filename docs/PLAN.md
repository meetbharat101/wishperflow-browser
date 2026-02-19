# PLAN - WhisperFlow Build Phases

## Phase 1: The Bare Metal (Manifest & Popup)
**Goal:** Get the extension installed and opening a popup.
- [x] **Step 1.1:** Create `manifest.json` (MV3) with name, version, and empty `background`.
- [x] **Step 1.2:** Create icons (placeholders) to avoid load errors.
- [x] **Step 1.3:** Create `popup.html` with a single "Hello World" `<h1>`.
- [x] **Step 1.4:** Load unpacked extension in Chrome. Check for errors.
- [x] **Step 1.5:** Open Popup. verify "Hello World".

## Phase 2: The Infrastructure (Service Worker & Offscreen)
**Goal:** Establish the hidden "AI Server" (Offscreen) environment.
- [x] **Step 2.1:** Create `service-worker.js`. Add `console.log('SW Loaded')`.
- [x] **Step 2.2:** Update `manifest.json` to register the service worker. Reload & Verify console.
- [x] **Step 2.3:** Create `offscreen.html` (empty body) and `offscreen.js` (console log).
- [x] **Step 2.4:** In `service-worker.js`, write `setupOffscreenDocument()` function using `chrome.offscreen.createDocument`.
- [x] **Step 2.5:** Call setup on SW install. Reload. Validate `offscreen.html` is inspecting in Chrome Task Manager or `chrome://inspect`.

## Phase 3: The Nervous System (Messaging)
**Goal:** Popup talks to SW, SW talks to Offscreen.
- [x] **Step 3.1:** In `popup.js`, add button "Ping". Add click listener sending `{type: 'PING'}` to runtime.
- [x] **Step 3.2:** In `service-worker.js`, add `onMessage`. Log "Received Ping". Verify Popup -> SW connection.
- [x] **Step 3.3:** In `offscreen.js`, add `onMessage`. Log "Offscreen received".
- [x] **Step 3.4:** Update `service-worker.js` to forward the PING to `chrome.runtime.sendMessage` (targeting offscreen).
- [x] **Step 3.5:** Verify end-to-end: Click Popup -> Log in SW -> Log in Offscreen.

## Phase 4: The Ear (Microphone Access)
**Goal:** Get access to the mic stream.
- [x] **Step 4.1:** Update `manifest.json` permissions: `["offscreen", "activeTab", "scripting"]`.
- [x] **Step 4.2:** In `popup.html`, add `Record` and `Stop` buttons.
- [x] **Step 4.3:** In `popup.js`, send recording commands to Service Worker instead of capturing locally.
- [x] **Step 4.4:** Implement `offscreen.js` audio capture (`getUserMedia` + `MediaRecorder`) with `USER_MEDIA` reason.
- [x] **Step 4.5:** Add `permissions.html`/`permissions.js` visible page to request mic permission. Auto-close tab on grant.

## Phase 5: The Carrier (Audio Data Handling)
**Goal:** Capture and decode audio in the offscreen document.
- [x] **Step 5.1:** In `offscreen.js`, collect audio chunks via `MediaRecorder.ondataavailable`.
- [x] **Step 5.2:** On stop, create `Blob` from chunks.
- [x] **Step 5.3:** Decode blob to `Float32Array` via `AudioContext.decodeAudioData()`.
- [x] **Step 5.4:** Resample audio to 16kHz for Whisper input.
- [x] **Step 5.5:** Pass decoded audio to transcription pipeline.

## Phase 6: The Brain (Model Setup)
**Goal:** Load Whisper WASM without crashing.
- [x] **Step 6.1:** Add `lib/transformers.min.js` (local ES module from `@xenova/transformers`).
- [x] **Step 6.2:** Copy ONNX Runtime WASM files to `lib/`.
- [x] **Step 6.3:** In `offscreen.js`, import `pipeline` and `env` from transformers.
- [x] **Step 6.4:** Configure `env.allowLocalModels = false` and `env.useBrowserCache = true`.
- [x] **Step 6.5:** Trigger `pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', { quantized: true })`.
- [x] **Step 6.6:** Broadcast model download progress to popup via `MODEL_STATUS` messages.

## Phase 7: The Transcriber (Inference)
**Goal:** Turn Audio into Text.
- [x] **Step 7.1:** In `offscreen.js`, decode audio blob to `Float32Array` via AudioContext.
- [x] **Step 7.2:** Pass `Float32Array` to the Whisper pipeline.
- [x] **Step 7.3:** Run `transcriber(audioData)` with chunked processing.
- [x] **Step 7.4:** Extract result text.
- [x] **Step 7.5:** Send text back: Offscreen -> SW -> Popup via `TRANSCRIPTION_RESULT` message.

## Phase 8: The Formatter (Regex)
**Goal:** Clean up the text.
- [x] **Step 8.1:** Create `lib/formatter.js` with `formatTranscription()` function.
- [x] **Step 8.2:** Add capitalization (first letter + after sentence endings).
- [x] **Step 8.3:** Add filler word removal (um, uh, er, ah, like you know, basically like).
- [x] **Step 8.4:** Add punctuation cleanup (trailing period, space-before-punct fix).
- [x] **Step 8.5:** Integrate into offscreen transcription flow. Show both raw and formatted in Popup.

## Phase 9: The Hands (Injection)
**Goal:** Put text in the website.
- [x] **Step 9.1:** Create `content.js` for text injection.
- [x] **Step 9.2:** Add `runtime.onMessage` listener for `INSERT_TEXT` messages.
- [x] **Step 9.3:** Implement injection for `input`, `textarea`, and `contentEditable` elements.
- [x] **Step 9.4:** Add auto-paste mode via `chrome.storage.local` toggle.
- [x] **Step 9.5:** Service worker dynamically injects content script via `chrome.scripting.executeScript`.
