# Moot Spiral (Hult Animation)

Moot Spiral turns a collection of images into a hypnotic, infinite Fibonacci spiral animation. Originally conceived by **[5bitcube](https://github.com/5bitcube)** as an interactive desktop experiment in C, this repository evolves the project into a complete **Python MP4 video production engine** featuring background music synchronization, automatic square-cropping, dynamic reverse-zoom motion, and broadcast-ready 60 FPS video export.

## Preview

![Moot Spiral Preview](assets/preview.gif)

---

## 📖 Background: Why & How We Modified It

### The Limitations of the Original C Implementation
The upstream [moot-spiral](https://github.com/5bitcube/moot-spiral) project by 5bitcube is written in C using the Raylib graphics library. While visually captivating, it was designed strictly as an interactive desktop window and posed several challenges:
1. **No Video Export**: You could only watch it live on screen; producing a shareable video required third-party screen-recording tools (OBS/Game Bar) that suffered from frame stutters, resolution mismatches, and UI clutter.
2. **No Audio Integration**: There was no way to attach music tracks or sync transitions with audio beats.
3. **Strict 1:1 Image Requirement**: Photos had to be pre-cropped manually; rectangular camera photos would appear distorted or stretched.
4. **Heavy Compiler Toolchain**: Running it required installing MinGW-w64 GCC and linking Raylib C libraries on Windows, leading to setup friction.

### 🚀 What Was Built in This Version
We preserved the mathematical elegance of the original Fibonacci geometry and ported it into a standalone **Python video rendering engine**:

- **Offline Deterministic Rendering**: Calculates every frame mathematically offline and encodes directly to H.264 at a rock-solid 60 FPS with zero dropped frames.
- **Audio Muxing & Fading**: Automatically detects your audio track (`.m4a`, `.mp3`, `.wav`), trims to custom start offsets (e.g., jumping straight to the beat drop), and applies smooth audio fade-outs.
- **Dynamic Reverse Motion**: Introduces an easing sequence that zooms inward, decelerates to a complete standstill, and accelerates in reverse (zoom-out).
- **Intelligent Auto-Crop**: Seamlessly handles arbitrary high-resolution camera pictures (e.g. 24MP 6000×4000 camera JPEGs) by automatically detecting EXIF orientation, center-cropping to a 1:1 square, and resizing with Lanczos antialiasing.
- **Zero C Compiler Dependencies**: Fully native Python + OpenCV + FFmpeg workflow that installs in seconds via `pip`.

---

## 🛠️ Quick Start

### 1. Installation
Make sure you have Python 3.8+ installed, then install the dependencies:
```bash
pip install -r requirements.txt
```

### 2. Prepare Photos & Music
- **Photos**: Drop your photos (`.jpg`, `.png`, `.webp`) into the `moots/` directory. They can be any orientation or resolution—the engine will auto-orient and center-crop them to squares.
- **Music (Optional)**: Place your audio file (`.m4a`, `.mp3`, `.wav`) directly in the project root directory.

### 3. Generate Video

```bash
# Standard 60-second video with continuous zoom
python export_spiral_video.py

# 60-second video with the stop-and-reverse animation starting at 32s in audio
python export_spiral_video.py --start 32 --duration 60 --reverse

# Full song duration starting at custom offset
python export_spiral_video.py --start 32

# 1080p Full HD render
python export_spiral_video.py --width 1920 --height 1080 --duration 60 --reverse
```

### CLI Reference

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--start` | `float` | `32.0` | Audio start offset in seconds |
| `--duration` | `float` | `60.0` | Output video length in seconds (defaults to full remaining track if omitted) |
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
