# Moot Spiral (Hult Animation)

Moot Spiral renders a selection of images into a hypnotic, infinite Fibonacci spiral animation. Originally designed to showcase profile pictures of mutuals, it now includes both an interactive Raylib viewer and a Python-powered **HD MP4 video exporter** with background music synchronization, auto-cropping, and reverse zoom animations.

## Preview
https://github.com/user-attachments/assets/aceced9f-c9aa-48db-a9ff-17507ddc064b

---

## Features

- **Fibonacci Geometry**: Mathematically replicates logarithmic Fibonacci growth with 4-direction orientation cycling and modulo texture shifting.
- **Direct MP4 Video Export**: Renders broadcast-quality 60 FPS H.264 video with AAC stereo audio—no screen recorder required.
- **Audio Synchronization**: Automatically detects audio tracks (`.m4a`, `.mp3`, `.wav`), trims to custom start offsets, and adds smooth ending fade-outs.
- **Stop & Reverse Motion Mode**: Dynamic easing that zooms in, decelerates to a standstill, and reverses outward.
- **Auto Center-Crop**: Handles arbitrary rectangular photos (including high-resolution camera shots) by automatically cropping them to 1:1 squares without distortion.
- **Interactive C Viewer**: Native C + Raylib desktop application for real-time interactive zooming.

---

## Quick Start (Python Video Exporter)

### 1. Requirements
Ensure Python 3.8+ is installed, then install the dependencies:
```bash
pip install -r requirements.txt
```

### 2. Add Photos & Music
- **Photos**: Place your images (`.jpg`, `.png`, `.webp`) in the `moots/` directory.
- **Music (Optional)**: Place your audio file (`.m4a`, `.mp3`, `.wav`) in the project root directory.

### 3. Generate Video
Run the export script:

```bash
# Basic export (default 60s, continuous zoom)
python export_spiral_video.py

# Custom duration and audio start offset (e.g. 60s video starting at 32s in audio)
python export_spiral_video.py --start 32 --duration 60

# With stop-and-reverse animation
python export_spiral_video.py --start 32 --duration 60 --reverse

# 1080p Full HD render
python export_spiral_video.py --width 1920 --height 1080 --duration 30
```

### CLI Options

| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--start` | `float` | `32.0` | Audio start offset in seconds |
| `--duration` | `float` | `60.0` | Video duration in seconds (defaults to remaining audio duration) |
| `--reverse` | `flag` | `False` | Enables stop-and-reverse animation sequence |
| `--width` | `int` | `1280` | Video resolution width |
| `--height` | `int` | `720` | Video resolution height |

---

## Interactive C Application (Raylib)

### Requirements
- C compiler (GCC / MinGW-w64)
- Raylib graphics library installed and in PATH

### Building & Running
- **Windows**: Run `build.bat`
- **Linux / macOS**: Run `./build.sh`

### Controls
- **ESC**: Exit the application
- **Right Arrow**: Increase zoom speed
- **Left Arrow**: Reduce zoom speed

### C Customization
Modify parameters in `spiral.c`:
- `FULLSCREEN`: Set to `1` for full-screen mode.
- `MAX_TEXTURES`: Increase if you have more than 1,024 images.

---

## License

The Unlicense
