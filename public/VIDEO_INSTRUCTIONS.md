# Video Setup Instructions

To complete the parking lot wobble effect setup, please add the following files to this directory:

## Required Files:

1. **parking_lot_wobble_effect_looped.mp4** - Your main video file with the parking lot wobble effect
2. **parking_lot_wobble_effect_looped.webm** - WebM format for better browser compatibility (optional)
3. **parking-poster.jpg** - A poster image that shows before the video loads

## File Specifications:

### Video File (parking_lot_wobble_effect_looped.mp4):
- Format: MP4 (H.264 codec recommended)
- Resolution: 1920x1080 or 1280x720
- Duration: 10-30 seconds (will loop automatically)
- Content: Parking lot with wobble/shake effect
- File size: Keep under 10MB for web performance

### Poster Image (parking-poster.jpg):
- Format: JPG or PNG
- Resolution: Same as video or 16:9 aspect ratio
- Content: Static image of the parking lot
- File size: Under 1MB

## How to Add Files:

1. Copy your video file and rename it to `parking_lot_wobble_effect_looped.mp4`
2. Place it in the `Hacakthon/public/` directory
3. Optionally create a WebM version for better compatibility
4. Add a poster image named `parking-poster.jpg`

## Testing:

Once files are added:
1. Start your development server
2. Navigate to the Smart Parking page
3. Click "View Cameras" button
4. The video modal should open and play your wobble effect

## Fallback:

If no video file is found, the modal will show a "Video not found" message and the user can still interact with the controls.
