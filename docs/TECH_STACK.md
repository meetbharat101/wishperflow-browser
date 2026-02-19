# Tech Stack

## Core Technologies
-   **Runtime:** Chrome Extension Manifest V3
-   **Language:** Vanilla JavaScript (ES2022 Modules)
-   **Build Tooling:** None (Raw / Native support) *or* minimal Vite for testing only.

## AI & ML
-   **Library:** [Transformers.js](https://huggingface.co/docs/transformers.js) (v2.x or v3.x alpha)
    -   *Why:* Runs PyTorch models directly in the browser via WASM/WebGPU.
-   **Model:** `Xenova/whisper-tiny`
    -   *Why:* ~40MB size. Runs on almost any CPU. Good enough for simple dictation.
    -   *Fallback:* `int8` quantization is mandatory for speed.

## Audio & Permissions
- **Capture Location:** Audio is captured in a visible permissions page (`permissions.html`) and handled in the offscreen document (`offscreen.js`). Popups cannot reliably request `getUserMedia`.
- **Offscreen Reason:** `chrome.offscreen.createDocument` is created with `USER_MEDIA` and `WORKERS` reasons so `offscreen.js` can access the microphone and host heavy model work.
- **Message Protocol:** `popup.js` → `service-worker.js` → `offscreen.js` using explicit `OFFSCREEN_` prefixed messages to avoid broadcast collisions.

## State & Storage
-   **Persistence:** `chrome.storage.local`
-   **Messaging:** `chrome.runtime.sendMessage` (One-time requests)

## Testing
-   **Framework:** `Vitest`
-   **Environment:** `JSDOM` (for simulating UI interactions in tests)
