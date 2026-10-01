# Moot Spiral (Hult Animation)

Moot Spiral turns a collection of images into a hypnotic, infinite Fibonacci spiral animation. Inspired by **[5bitcube](https://github.com/5bitcube)**'s original interactive desktop experiment, this repository elevates the concept into a complete **Python-powered HD video production engine** featuring background music synchronization, smart auto-cropping, dynamic reverse-zoom motion, and broadcast-ready 60 FPS video export.

## Preview

![Moot Spiral Preview](assets/preview.gif)

---

## 🌟 Evolution & Enhancements

Building upon the elegant Fibonacci geometry of the original project, this version expands the creative possibilities to make creating and sharing videos effortless:

- **Direct MP4 Video Export**: Renders frame-by-frame offline into a smooth, broadcast-quality 60 FPS H.264 video file ready for sharing on social media or messaging platforms.
- **Soundtrack Integration**: Automatically detects background music tracks (`.m4a`, `.mp3`, `.wav`), synchronizes video duration to the music, supports custom audio start offsets (e.g., dropping right on the beat), and applies smooth audio fade-outs.
- **Hypnotic Stop & Reverse Motion**: Introduces a dynamic easing motion that zooms inward, gently decelerates to a standstill, and accelerates in reverse (zoom-out).
- **Intelligent Auto-Crop**: Effortlessly handles high-resolution camera photos (portrait, landscape, or square) by auto-detecting orientation and center-cropping them with high-quality Lanczos antialiasing.
- **Lightweight, Pure-Python Setup**: Runs anywhere Python is installed with standard open-source tools (`opencv`, `imageio-ffmpeg`, `pillow`), requiring no complex compiler setups.

---

## 🌐 Web Studio (In-Browser Generator)

You can run Moot Spiral directly in your browser with zero installation:
- **Live 60 FPS Canvas**: Watch the Fibonacci spiral render in real-time.
- **Drag & Drop Upload**: Add any photos—they are automatically center-cropped to squares.
- **Audio Sync & Live Preview**: Upload your music track, adjust the start offset slider, and listen in sync.
- **Client-Side Video Export**: Record and download your HD video right inside the browser!

### Running Locally:
Simply open `index.html` in your browser, or start a local server:
```bash
python -m http.server 8080
```
Then visit: `http://localhost:8080`

### 🚀 1-Click Deployment (100% Free):
- **GitHub Pages**: Go to **Settings** → **Pages** → Source: **Deploy from a branch** (`main` / `/root`) → Click **Save**.
- **Vercel**: Import the repository on [vercel.com](https://vercel.com) and click **Deploy** (no build settings required).

---

## 🛠️ Python CLI Exporter

### 2. Add Photos & Music
- **Photos**: Drop your photos (`.jpg`, `.png`, `.webp`) into the `moots/` directory. Any orientation or resolution is supported—the engine will auto-orient and square-crop them.
- **Music (Optional)**: Place your audio file (`.m4a`, `.mp3`, `.wav`) directly in the project root directory.

### 3. Generate Your Video

```bash
# Standard 60-second video with continuous zoom
python export_spiral_video.py

# 60-second video with stop-and-reverse motion starting at 32s in audio
python export_spiral_video.py --start 32 --duration 60 --reverse

# Render to match the full song length
python export_spiral_video.py --start 32

# 1080p Full HD render
python export_spiral_video.py --width 1920 --height 1080 --duration 60 --reverse
```

### CLI Reference

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--start` | `float` | `32.0` | Audio start offset in seconds |
| `--duration` | `float` | `60.0` | Video length in seconds (defaults to remaining audio duration) |
| `--reverse` | `flag` | `False` | Enables hypnotic stop-and-reverse animation sequence |
| `--width` | `int` | `1280` | Video frame width in pixels |
| `--height` | `int` | `720` | Video frame height in pixels |

---

## 📁 Project Structure

```
├── assets/
│   └── preview.gif            # Lightweight animated preview for documentation
├── moots/                     # Source images directory (default sample avatars included)
├── export_spiral_video.py     # Main Python Fibonacci spiral video export engine
├── requirements.txt           # Python package dependencies
├── .gitignore                 # Excludes heavy MP4/audio media & private photos
├── LICENSE                    # The Unlicense (Public Domain)
└── README.md                  # Project documentation
```

---

## 💡 Credits & Acknowledgments

- **Original Creator & Concept**: Created by **[5bitcube](https://github.com/5bitcube)** ([5bitcube/moot-spiral](https://github.com/5bitcube/moot-spiral)).
- **Sample Avatars**: The default avatar files in `moots/` are sourced from the original upstream repository.
- **Python Video Engine & Enhancements**: Extended and maintained by [Coden-inja](https://github.com/Coden-inja).

---

## 📄 License

This project is released into the public domain under [The Unlicense](LICENSE).
