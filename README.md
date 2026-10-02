# Moot Spiral Studio

Turn your photos and music into a hypnotic, infinite Fibonacci spiral animation. Download HD 60 FPS videos directly from your browser or via the Python CLI.

![Moot Spiral Preview](assets/preview.gif)

---

## 🔒 100% Local & Private
All image processing, audio synchronization, and video recording happen **entirely on your device**. No photos, tracks, or data are ever uploaded to any server.

---

## ⚡ Features
- **🌐 In-Browser Web Studio**: Real-time 60 FPS interactive preview with zero setup.
- **🎬 Direct HD Video Export**: Generate smooth 60 FPS MP4 / WebM videos in 720p, 1080p, or 1:1 square.
- **🎵 Soundtrack Synchronization**: Drop in any song (`.mp3`, `.m4a`, `.wav`), pick your start offset, and sync the animation.
- **🔄 Dynamic Motion Modes**: Continuous zoom-in, instant reverse zoom-out, or hypnotic bounce cycle.
- **✂️ Smart Auto-Crop**: Automatically crops images of any orientation (portrait, landscape) to clean squares.

---

## 🛠️ Tech Stack

### Web Studio (In-Browser)
- **Core & Rendering**: Vanilla JavaScript (ES6+), HTML5 Canvas 2D API (60 FPS mathematical spiral geometry)
- **Audio Engine**: Web Audio API (`AudioContext`, `decodeAudioData`, beat-offset synchronization)
- **Video Recording**: `MediaRecorder` API + `canvas.captureStream(60)` (100% client-side HD MP4/WebM export)
- **UI & Design**: Pure Vanilla CSS with Glassmorphism, CSS Custom Properties, and mobile-first responsive layout (zero frameworks)

### Python CLI (Headless Engine)
- **Python 3**: Scriptable CLI for offline batch rendering
- **OpenCV & NumPy**: Matrix manipulation, orientation auto-detection, and smart square-cropping
- **FFmpeg (`imageio-ffmpeg`)**: Audio-video muxing and smooth volume fade-out filters

---

## 🚀 Live Demo & Quick Start

🌐 **Try the Web Studio live**: **[fibo-anim.vercel.app](https://fibo-anim.vercel.app/)**

### Option A: Run Locally (Browser)
Simply start a local server and open the page:
```bash
python -m http.server 8000 --bind 127.0.0.1
```
Open **`http://localhost:8000`** in your browser.

> You can also deploy to **GitHub Pages** or **Vercel** with one click (static HTML/CSS/JS with zero build steps).

---

### Option B: Python CLI Generator
For batch rendering or command-line scripting:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Add photos to moots/ folder (and optional audio in root)

# 3. Render video
python export_spiral_video.py

# 60s render starting at 32s into audio with reverse motion
python export_spiral_video.py --start 32 --duration 60 --reverse
```

#### CLI Options
| Flag | Default | Description |
| :--- | :--- | :--- |
| `--start` | `32.0` | Audio start time in seconds |
| `--duration` | `60.0` | Video length in seconds |
| `--reverse` | `False` | Enables stop-and-reverse animation |
| `--width` | `1280` | Video width |
| `--height` | `720` | Video height |

---

## 💡 Credits
- **Original Concept**: [5bitcube/moot-spiral](https://github.com/5bitcube/moot-spiral)
- **Web Studio & Video Engine**: [Coden-inja](https://github.com/Coden-inja)

## 📄 License
Released into the public domain under [The Unlicense](LICENSE).
