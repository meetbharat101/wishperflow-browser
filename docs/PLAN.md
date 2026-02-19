# PLAN - VibeCoding Session (Granular Edition)

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
- [x] **Step 3.4:** Update `service-worker.js` to forward the PING to `chrome.runtime.sendMessage` (targeting offscreen) or use clients.matchAll. *Careful here: Offscreen is a runtime target.*
- [x] **Step 3.5:** Verify end-to-end: Click Popup -> Log in SW -> Log in Offscreen.

## Phase 4: The Ear (Microphone Access)
**Goal:** Get access to the mic stream.
- [x] **Step 4.1:** Update `manifest.json` permissions: `["offscreen", "activeTab", "scripting"]` (Note: `microphone` is requested at runtime).
- [x] **Step 4.2:** In `popup.html`, add `Record` and `Stop` buttons.
- [x] **Step 4.3:** In `popup.js`, send recording commands to Service Worker instead of capturing locally.
- [x] **Step 4.4:** Implement `offscreen.js` audio capture (`getUserMedia` + `MediaRecorder`) because offscreen needs `USER_MEDIA` reason to access the mic.
- [x] **Step 4.5:** Add `permissions.html`/`permissions.js` visible page to request mic permission (offscreen cannot prompt). Auto-close tab on grant.

## Phase 5: The Carrier (Audio Data Handling)
**Goal:** Move audio from Popup (UI) to Offscreen (Processor).
- [ ] **Step 5.1:** In `popup.js`, handle `ondataavailable`. Push chunks to array.
- [ ] **Step 5.2:** On `stop`, create `Blob`.
- [ ] **Step 5.3:** Create helper `blobToBase64`. Verify conversion.
- [ ] **Step 5.4:** Send `{type: 'AUDIO_DATA', data: base64}` to Service Worker.
- [ ] **Step 5.5:** SW forwards to Offscreen. Verify Offscreen logs "Received Audio: X bytes".

## Phase 6: The Brain (Model Setup)
**Goal:** Load Whisper WASM without crashing.
- [ ] **Step 6.1:** Add `lib/transformers.js` (or import from CDN for dev, but local preferred).
- [ ] **Step 6.2:** Create `lib/whisper-worker.js`. Standard Web Worker setup.
- [ ] **Step 6.3:** In `offscreen.js`, initialize `new Worker('lib/whisper-worker.js')`.
- [ ] **Step 6.4:** In `whisper-worker.js`, import `pipeline` from transformers.
- [ ] **Step 6.5:** Trigger `pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny')`.
- [ ] **Step 6.6:** Verify Model Download progress logs in Offscreen Console.

## Phase 7: The Transcriber (Inference)
**Goal:** Turn Audio into Text.
- [ ] **Step 7.1:** In `offscreen.js`, decode the Base64 audio to `Float32Array`. *Crucial Step: AudioContext needed here.*
- [ ] **Step 7.2:** Pass `Float32Array` to `moonshine-worker.js`.
- [ ] **Step 7.3:** Worker runs `transcriber(audio)`.
- [ ] **Step 7.4:** Log result text in Worker.
- [ ] **Step 7.5:** Send text back up the chain: Worker -> Offscreen -> SW -> Popup.

## Phase 8: The Formatter (Regex)
**Goal:** Clean up the text.
- [ ] **Step 8.1:** Create `lib/formatter.js`.
- [ ] **Step 8.2:** Add function `capitalizeFirst(text)`. Test it.
- [ ] **Step 8.3:** Add logic to remove "um", "uh". Test it.
- [ ] **Step 8.4:** Integrate into `message` flow. Display formatted text in Popup.

## Phase 9: The Hands (Injection)
**Goal:** Put text in the website.
- [ ] **Step 9.1:** Create `content.js`. Register in Manifest.
- [ ] **Step 9.2:** Add `runtime.onMessage` in content script to listen for 'INSERT_TEXT'.
- [ ] **Step 9.3:** Implement `document.execCommand('insertText')` on `document.activeElement`.
- [ ] **Step 9.4:** Test on a simple HTML page with a textarea.
