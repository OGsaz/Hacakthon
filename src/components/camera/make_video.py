# make_video_looped.py
# Generates a seamless-looping 15-second CCTV-style wobble video

import moviepy.editor as mpy
import numpy as np
from PIL import Image
import cv2

# === CONFIG ===
image_path = "parking_image.png"       # Input image (same folder)
output_path = "parking_lot_wobble_effect_looped.mp4"
fps = 20                               # Frames per second
duration = 15                          # Seconds
resolution_height = 720                # Output video height
grain_strength = 3                     # Adjust noise intensity
flicker_strength = 0.02                # Brightness flicker intensity
wobble_pixels = 1                      # Camera shake magnitude
# ==============

# Load and prepare image
base_image = Image.open(image_path).convert("RGB")
frame = np.array(base_image)

# Remove "CH-4" text area (top-right corner)
h, w, _ = frame.shape
frame[:, int(w * 0.85):] = cv2.blur(frame[:, int(w * 0.85):], (25, 25))

# Prepare frames
n_frames = fps * duration
frames = []

print("🎞️ Generating loopable frames...")

# Pre-generate smooth looping parameters
# Sine wave motion ensures seamless looping of wobble and flicker
for i in range(n_frames):
    t = i / n_frames * 2 * np.pi

    # Wobble follows smooth sine waves
    dx = int(np.sin(t * 2) * wobble_pixels)
    dy = int(np.cos(t * 2) * wobble_pixels)
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    wobble_frame = cv2.warpAffine(frame, M, (w, h), borderMode=cv2.BORDER_REFLECT)

    # Flicker also loops smoothly using sine wave
    flicker = 1 + np.sin(t * 3) * flicker_strength
    flicker_frame = np.clip(wobble_frame * flicker, 0, 255).astype(np.uint8)

    # Looping grain pattern using two pre-generated textures crossfaded over time
    np.random.seed(0)
    grain_a = np.random.normal(0, grain_strength, (h, w, 3))
    np.random.seed(1)
    grain_b = np.random.normal(0, grain_strength, (h, w, 3))
    mix = (1 + np.sin(t)) / 2
    grain = (grain_a * mix + grain_b * (1 - mix)).astype(np.int16)

    noisy_frame = np.clip(flicker_frame + grain, 0, 255).astype(np.uint8)
    frames.append(noisy_frame)

# Create and save video
print("💾 Rendering looped video...")
clip = mpy.ImageSequenceClip(frames, fps=fps).resize(height=resolution_height)
clip.write_videofile(output_path, codec='libx264', audio=False, fps=fps, preset='ultrafast')

print(f"✅ Done! Saved as: {output_path}")
print("🎬 Tip: Enable looping in your media player for a perfect continuous effect.")
