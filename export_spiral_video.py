import os
import glob
import math
import random
import subprocess
import argparse
import cv2
import numpy as np
import imageio_ffmpeg

# Exact constants from spiral.c
SQUARES = 32
DEFAULT_WIDTH = 1280
DEFAULT_HEIGHT = 720
FPS = 60
RAYWHITE = (245, 245, 245) # BGR: 245, 245, 245

def get_fibonacci_sequence(count=32):
    fib = [1, 1]
    for i in range(2, count):
        fib.append(fib[i - 1] + fib[i - 2])
    return fib

class Square:
    def __init__(self, position, fib_val):
        self.position = position
        self.fibonacci = fib_val
        self.size = 0.0
        self.x = 0.0
        self.y = 0.0

def update_sizes(squares, zoom):
    for sq in squares:
        sq.size = sq.fibonacci * zoom

def position_spiral(squares):
    x = 0.0
    y = 0.0
    direction = 0
    for i in range(len(squares) - 1):
        squares[i].x = x
        squares[i].y = y
        dir_mod = direction % 4
        direction += 1
        if dir_mod == 0:
            x += squares[i].size
        elif dir_mod == 1:
            x += squares[i].size - squares[i + 1].size
            y += squares[i].size
        elif dir_mod == 2:
            x -= squares[i + 1].size
            y += squares[i].size - squares[i + 1].size
        elif dir_mod == 3:
            y -= squares[i + 1].size
    squares[-1].x = x
    squares[-1].y = y

def center_spiral(squares, screen_w, screen_h):
    target_x = screen_w / 2.0
    target_y = screen_h / 2.0
    
    last = squares[-1]
    center_x = last.x + last.size / 2.0
    center_y = last.y + last.size / 2.0
    
    offset_x = target_x - center_x
    offset_y = target_y - center_y
    
    for sq in squares:
        sq.x += offset_x
        sq.y += offset_y

def shift_squares(squares, step=4):
    for sq in squares:
        sq.position += step

def paste_image(canvas, img, x, y, size):
    w, h = canvas.shape[1], canvas.shape[0]
    ix = int(round(x))
    iy = int(round(y))
    isize = int(round(size))
    if isize <= 0:
        return
    
    if ix + isize <= 0 or ix >= w or iy + isize <= 0 or iy >= h:
        return

    cx1 = max(0, ix)
    cy1 = max(0, iy)
    cx2 = min(w, ix + isize)
    cy2 = min(h, iy + isize)

    sx1 = cx1 - ix
    sy1 = cy1 - iy
    sx2 = sx1 + (cx2 - cx1)
    sy2 = sy1 + (cy2 - cy1)

    if isize != img.shape[1] or isize != img.shape[0]:
        resized = cv2.resize(
            img, (isize, isize),
            interpolation=cv2.INTER_LINEAR if isize > img.shape[1] else cv2.INTER_AREA
        )
    else:
        resized = img

    canvas[cy1:cy2, cx1:cx2] = resized[sy1:sy2, sx1:sx2]

def load_and_prepare_textures(moots_dir, square_size=600):
    extensions = ('*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG')
    files = []
    for ext in extensions:
        files.extend(glob.glob(os.path.join(moots_dir, ext)))
    
    files = sorted(list(set(files)))
    if not files:
        raise ValueError(f"No images found in {moots_dir}")
    
    print(f"Loading {len(files)} images from {moots_dir}...")
    textures = []
    for f in files:
        img = cv2.imread(f)
        if img is None:
            continue
        h, w = img.shape[:2]
        if h != w:
            min_dim = min(h, w)
            sy = (h - min_dim) // 2
            sx = (w - min_dim) // 2
            img = img[sy:sy + min_dim, sx:sx + min_dim]
        if img.shape[0] != square_size:
            img = cv2.resize(img, (square_size, square_size), interpolation=cv2.INTER_AREA)
        textures.append(img)
    
    if not textures:
        raise ValueError("Could not read any valid images!")
    
    random.seed(42)
    random.shuffle(textures)
    return textures

def find_audio_file(base_dir):
    audio_extensions = ('.m4a', '.mp3', '.wav', '.aac', '.ogg', '.flac')
    for f in os.listdir(base_dir):
        if any(f.lower().endswith(ext) for ext in audio_extensions):
            return os.path.join(base_dir, f)
    return None

def render_spiral_video(
    moots_dir="moots",
    output_video="moot_spiral.mp4",
    audio_file=None,
    audio_start_sec=32.0,
    width=DEFAULT_WIDTH,
    height=DEFAULT_HEIGHT,
    duration_sec=60.0,
    fps=FPS,
    reverse_mode=False
):
    textures = load_and_prepare_textures(moots_dir)
    num_textures = len(textures)
    print(f"Loaded and prepared {num_textures} textures.")

    fibonacci = get_fibonacci_sequence(SQUARES)
    squares = [
        Square(position=i, fib_val=fibonacci[SQUARES - i - 1])
        for i in range(SQUARES)
    ]

    # Exact constants from spiral.c
    zoom_start = 0.001
    zoom_max = 0.0067
    zoom = zoom_start
    dt = 1.0 / fps

    total_frames = int(round(duration_sec * fps))
    print(f"Rendering {total_frames} frames ({duration_sec:.2f}s @ {fps}fps) at {width}x{height}...")

    temp_raw_video = "temp_spiral_no_audio.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(temp_raw_video, fourcc, fps, (width, height))

    bg_color = np.array(RAYWHITE, dtype=np.uint8)

    for frame_idx in range(total_frames):
        current_time = frame_idx / fps

        if reverse_mode:
            # Reversing behavior:
            # 0 to 25s: zoom in (speed = 1.02)
            # 25s to 30s: decelerate to 1.0 (stop)
            # 30s to 35s: accelerate backwards to 0.98 (reverse)
            # 35s to 55s: zoom out (speed = 0.98)
            # 55s to 60s: decelerate and fade
            if current_time < 25.0:
                cur_speed = 1.02
            elif current_time < 30.0:
                t = (current_time - 25.0) / 5.0
                cur_speed = 1.02 - 0.02 * t # slows to 1.0 (stop)
            elif current_time < 35.0:
                t = (current_time - 30.0) / 5.0
                cur_speed = 1.0 - 0.02 * t # speeds up in reverse to 0.98
            elif current_time < 55.0:
                cur_speed = 0.98
            else:
                t = (current_time - 55.0) / 5.0
                cur_speed = 0.98 + 0.02 * t
        else:
            # Exact C code: zoom_speed = 1.02f
            cur_speed = 1.02

        # Check bounds and shifts
        if cur_speed >= 1.0:
            if zoom >= zoom_max:
                zoom = zoom_start
                shift_squares(squares, step=4)
        else:
            if zoom <= zoom_start:
                zoom = zoom_max
                shift_squares(squares, step=-4)

        # Apply frame-rate zoom growth: zoom *= powf(zoom_speed, dt * 60)
        zoom *= (cur_speed ** (dt * 60.0))

        update_sizes(squares, zoom)
        position_spiral(squares)
        center_spiral(squares, width, height)

        canvas = np.full((height, width, 3), bg_color, dtype=np.uint8)

        for sq in squares:
            tex = textures[sq.position % num_textures]
            paste_image(canvas, tex, sq.x, sq.y, sq.size)

        writer.write(canvas)
        if (frame_idx + 1) % 120 == 0 or frame_idx == total_frames - 1:
            pct = ((frame_idx + 1) / total_frames) * 100
            print(f"Rendered {frame_idx + 1}/{total_frames} frames ({pct:.1f}%)")

    writer.release()
    print("Video frame rendering complete!")

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    if audio_file and os.path.exists(audio_file):
        print(f"Adding audio from {audio_file} starting at {audio_start_sec}s for {duration_sec:.2f}s...")
        fade_duration = 2.0
        fade_start = max(0.0, duration_sec - fade_duration)
        audio_filter = f"afade=t=out:st={fade_start:.2f}:d={fade_duration:.2f}"

        cmd = [
            ffmpeg_exe, "-y",
            "-i", temp_raw_video,
            "-ss", str(audio_start_sec),
            "-i", audio_file,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-filter:a", audio_filter,
            "-c:a", "aac",
            "-b:a", "192k",
            "-t", str(duration_sec),
            output_video
        ]
        subprocess.run(cmd, check=True)
        if os.path.exists(temp_raw_video):
            os.remove(temp_raw_video)
        print(f"Successfully generated final video: {output_video}")
    else:
        cmd = [
            ffmpeg_exe, "-y",
            "-i", temp_raw_video,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            output_video
        ]
        subprocess.run(cmd, check=True)
        if os.path.exists(temp_raw_video):
            os.remove(temp_raw_video)
        print(f"Successfully generated final video: {output_video}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Render Moot Spiral MP4 video")
    parser.add_argument("--start", type=float, default=32.0, help="Audio start time in seconds (default: 32.0)")
    parser.add_argument("--duration", type=float, default=60.0, help="Duration in seconds (default: 60.0)")
    parser.add_argument("--reverse", action="store_true", help="Enable stop-and-reverse animation")
    parser.add_argument("--width", type=int, default=1280, help="Video width (default: 1280)")
    parser.add_argument("--height", type=int, default=720, help="Video height (default: 720)")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    
    audio = find_audio_file(".")
    print(f"Audio file: {audio}")
    print(f"Audio start offset: {args.start}s")
    print(f"Video duration: {args.duration}s")
    print(f"Reverse mode: {args.reverse}")

    render_spiral_video(
        moots_dir="moots",
        output_video="moot_spiral.mp4",
        audio_file=audio,
        audio_start_sec=args.start,
        width=args.width,
        height=args.height,
        duration_sec=args.duration,
        fps=60,
        reverse_mode=args.reverse
    )
