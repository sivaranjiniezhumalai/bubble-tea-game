# Opening Background Image Instructions

## What You Need

To display a custom background image on the opening/welcome screen, you need to add an image file.

## Steps

1. **Prepare your background image:**
   - Choose an image that will look good as a welcome screen background
   - Recommended size: At least 1920×1080 pixels for best quality
   - Supported formats: PNG, JPG, or JPEG

2. **Save the image:**
   - Name the file: `opening-bg.png` (or `.jpg`)
   - Place it in the `assets/` folder

3. **File location:**
   ```
   cafe/
   ├── assets/
   │   ├── opening-bg.png  ← Add your image here
   │   ├── fox.png
   │   ├── cat.png
   │   └── ... (other images)
   ├── index.html
   ├── main.js
   └── style.css
   ```

## How It Works

- When the game starts, it will display your custom background image on the opening screen
- When the user clicks "Start Game", it automatically switches to the normal shop background
- If the image is not found, a colorful gradient will be shown as a fallback

## Tips

- Use an image that matches your game's theme (cafe, bubble tea, etc.)
- Make sure the image is not too dark or busy so the welcome text and start button are clearly visible
- The image will automatically resize to fit the screen
