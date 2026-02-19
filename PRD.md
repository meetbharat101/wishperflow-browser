# Product Requirements Document (PRD) - VibeCoding Extension

## 1. Product Statement
The **VibeCoding Extension** is a private, offline-first Chrome extension that enables "Voice-to-Text" for any text input on the web. Unlike standard dictation, it uses a state-of-the-art **Local AI Model (Whisper)** to transcribe speech accurately and applies smart formatting to make the text "ready to send" immediately.

## 2. The "Why" (Mistakes Avoided)
*Based on previous iterations, we identified three critical failures to avoid:*
1.  **Latency:** Cloud APIs or heavy Local LLMs (1GB+) introduce "loading hangs" that frustrate users. We prioritize **Speed (<2s)**.
2.  **Hallucinations:** Smaller, unoptimized models (like Moonshine base) often output phantom text (e.g., "1700 hours" instead of "17:00"). We use **Whisper Tiny** for the best balance of size vs. accuracy.
3.  **UI Clutter:** Users don't need to see "Original" vs "Formatted" text if they are identical. The UI must be smart.

## 3. Core Features (MVP)
1.  **Universal Dictation:**
    -   Global Keyboard Shortcut (`Alt+Shift+R`) to toggle recording.
    -   *Note: We have intentionally removed the "Floating Microphone" on input fields to avoid UI clutter and complexity for this session.*
2.  **Local Intelligence (No Cloud):**
    -   **Transcription:** `Xenova/whisper-tiny` (approx 40MB). Runs in-browser via WASM.
    -   **Formatting:** Rule-based engine (Regex) to handle capitalization, filler words ("um", "uh"), and punctuation. *Note: We deliberately skip heavy LLMs for the MVP to ensure speed.*
3.  **Review & Edit:**
    -   A popup implementation that allows previewing the text before insertion.
    -   "Auto-Paste" mode for power users.

## 4. Non-Functional Requirements
-   **Privacy:** No audio leaves the device.
-   **Performance:** Transcription must happen in a dedicated "Offscreen Document" to prevent the Service Worker from dying during processing.
-   **Stability:** Must handle browser tab switches without losing the recording.

## 6. Implementation Strategy (The Baby Steps)
We follow a strict "Granular verification" protocol.
-   **Atomic Steps:** Each feature is broken down into ~10 small tasks.
-   **Stop & Verify:** We do not write Step 2 code until Step 1 is verified in the browser.
-   **No Magic:** We verify with `console.log` at every architectural boundary (Popup -> SW -> Offscreen).
