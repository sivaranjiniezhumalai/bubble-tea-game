# 🖼️ Image Placement Guide

## Where to Add Customer Images

Place all customer PNG images in the **`assets/`** folder.

### Required Images:

Your game now needs these PNG files:

1. **fox.png** (Shopkeeper - already exists)
2. **cat.png** (Customer - already exists)
3. **dog.png** (Customer - already exists)
4. **crab.png** ⬅️ **NEW - Add this**
5. **snake.png** ⬅️ **NEW - Add this**
6. **pig.png** ⬅️ **NEW - Add this**

### Folder Structure:
```
cafe/
├── index.html
├── main.js
├── style.css
└── assets/
    ├── fox.png       ✅ (Shopkeeper only)
    ├── cat.png       ✅ (Customer)
    ├── dog.png       ✅ (Customer)
    ├── crab.png      🆕 ADD THIS
    ├── snake.png     🆕 ADD THIS
    └── pig.png       🆕 ADD THIS
```

### Image Specifications:

**Recommended size**: 120x120 pixels (or any square size)

**Format**: PNG with transparent background

**Style**: Match the style of your existing cat/dog images

### What Happens if Images Are Missing?

If you don't add the images yet, the game will still work! It will show:
- Colored circles as fallback
- Simple faces (eyes, mouth)
- All animations still work

But adding the actual PNG images will make it look much better!

---

## Game Changes Made:

### 🎮 5-Customer System
- Game now serves exactly **5 customers** then ends
- Customer counter shows progress (e.g., "Customer 3/5")

### 🦊 Fox = Shopkeeper Only
- Fox is **never** a customer anymore
- Only appears as the shopkeeper on the left side

### 🐾 New Customer Types
- **Cat** 🐱
- **Dog** 🐶
- **Crab** 🦀 (NEW)
- **Snake** 🐍 (NEW)
- **Pig** 🐷 (NEW)

### 🏆 Ending Screen
After serving 5 customers, you'll see:
- Beautiful animated ending screen
- Total customers served (5/5)
- Total score (based on performance)
- Total money earned
- Performance rating:
  - 450+ points: 🏆 Master Chef
  - 350-449: 🌟 Top Barista
  - 250-349: 👍 Good Job
  - 150-249: 😊 Nice Try
  - Below 150: 💪 Keep Practicing

### 💯 Scoring System
- **Perfect (⭐⭐⭐)**: +100 points
- **Good (⭐⭐)**: +50 points
- **Okay (⭐)**: +20 points
- **Failed (❌)**: +0 points

Max possible score: **500 points** (5 perfect drinks)

---

## Quick Setup:

1. Create PNG images for crab, snake, and pig (120x120px recommended)
2. Save them in the `assets/` folder
3. Name them exactly: `crab.png`, `snake.png`, `pig.png`
4. Refresh the game (F5)
5. Your images will appear automatically!

---

**Ready to play!** 🎉
