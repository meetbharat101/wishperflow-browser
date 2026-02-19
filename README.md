# WhisperFlow

**Universal voice-to-text for any web input using local Whisper AI.**

WhisperFlow is a privacy-first Chrome extension that transcribes your speech to text directly in the browser. No cloud APIs, no data leaving your device -- everything runs locally using the Whisper Tiny model via [Transformers.js](https://huggingface.co/docs/transformers.js).

## Features

- **Universal dictation** -- works on any text input, textarea, or contentEditable element on the web
- **100% local & private** -- audio never leaves your device; all AI inference runs in-browser via WASM
- **Keyboard shortcut** -- `Alt+Shift+R` to toggle recording from any tab
- **Smart formatting** -- auto-capitalizes sentences, removes filler words (um, uh, er), fixes punctuation
- **Auto-paste mode** -- optionally insert transcribed text directly into the active input field
- **Dark themed UI** -- clean popup with animated mic button, progress bar, and result preview

## Architecture

```
popup.html/js       UI layer (record button, result preview, copy/insert)
    |
service-worker.js   Orchestrator (routes messages, handles shortcuts)
    |
offscreen.html/js   Heavy lifter (mic capture, audio decode, Whisper inference)
    |
lib/
  transformers.min.js   Transformers.js runtime (ES module)
  formatter.js          Regex-based text cleanup
  ort-wasm-*.wasm       ONNX Runtime WASM binaries
```

**Message flow:**
```
User clicks Record → Popup → Service Worker → Offscreen (starts mic)
User clicks Stop   → Popup → Service Worker → Offscreen (stops mic, decodes audio, runs Whisper)
Transcription done → Offscreen → Service Worker → Popup (shows result)
User clicks Insert → Popup → Service Worker → Content Script (inserts text at cursor)
```

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- Google Chrome (v116+)

### Installation

```bash
# Clone the repository
git clone https://github.com/meetbharat101/wishperflow-browser.git
cd wishperflow-browser

# Install dependencies and copy runtime files to lib/
npm run setup
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the project folder (`wishperflow-browser`)
5. The WhisperFlow icon appears in the toolbar

### First Use

1. Click the WhisperFlow icon to open the popup
2. Click the mic button -- you'll be prompted to grant microphone permission
3. The Whisper model (~40MB) downloads automatically on first use and is cached for subsequent runs
4. Speak, then click the mic button again to stop
5. Review the transcription, then **Copy** or **Insert** into the active page

## Usage

| Action | How |
|---|---|
| Start/stop recording | Click the mic button in the popup, or press `Alt+Shift+R` |
| Copy transcription | Click the **Copy** button |
| Insert into page | Focus a text field, then click **Insert** |
| Auto-paste mode | Toggle the switch in the popup footer -- text auto-inserts after transcription |
| Clear result | Click the **Clear** button |

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Chrome Extension Manifest V3 |
| Language | Vanilla JavaScript (ES Modules) |
| AI Model | [Xenova/whisper-tiny](https://huggingface.co/Xenova/whisper-tiny) (~40MB, quantized) |
| ML Runtime | [Transformers.js](https://huggingface.co/docs/transformers.js) v2.17 + ONNX Runtime Web (WASM) |
| Audio | `getUserMedia` + `MediaRecorder` + `AudioContext` (16kHz resampling) |
| State | `chrome.storage.local` |
| Build | None -- raw vanilla JS, no bundler required |

## File Structure

```
manifest.json          Extension manifest (MV3)
service-worker.js      Background orchestrator
offscreen.html/js      Hidden document for AI + audio processing
popup.html/js          Extension popup UI
content.js             Content script for text injection
permissions.html/js    Microphone permission grant page
lib/
  formatter.js         Regex text cleanup (capitalize, remove fillers)
  transformers.min.js  Transformers.js runtime (generated via npm)
  ort-wasm-*.wasm      ONNX WASM binaries (generated via npm)
icons/                 Extension icons (16, 48, 128px)
docs/                  Architecture docs, PRD, tech stack
```

## Privacy

- All audio capture and transcription happens **entirely on your device**
- No network requests are made except to download the Whisper model (first use only, cached after)
- No telemetry, no analytics, no cloud processing

## License

Private project.
