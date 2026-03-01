# Audio Files Instructions

## Required Audio Files

To enable background music and sound effects in your game, you need to add the following audio files to the `assets/` folder:

### 1. Background Music
- **Filename**: `bg-music.mp3`
- **Type**: Looping background music
- **Recommended**: Upbeat, cheerful cafe or game music
- **Duration**: Any length (it will loop)
- **Volume**: Set to 30% by default

### 2. Boba Drop Sound
- **Filename**: `boba-drop.mp3`
- **Type**: Short sound effect
- **Plays**: When clicking to drop a boba ball
- **Recommended**: Pop, plop, or bubble sound
- **Duration**: 0.5-1 second
- **Volume**: Set to 50% by default

### 3. Tea Pouring Sound
- **Filename**: `tea-pour.mp3`
- **Type**: Looping sound effect
- **Plays**: While holding SPACE key or Tea button
- **Recommended**: Liquid pouring sound
- **Duration**: 2-3 seconds (will loop smoothly)
- **Volume**: Set to 40% by default

### 4. Milk Pouring Sound
- **Filename**: `milk-pour.mp3`
- **Type**: Looping sound effect
- **Plays**: While holding M key or Milk button
- **Recommended**: Liquid pouring sound (can be same as tea or slightly different)
- **Duration**: 2-3 seconds (will loop smoothly)
- **Volume**: Set to 40% by default

### 5. Serve Sound
- **Filename**: `serve.mp3`
- **Type**: Short sound effect
- **Plays**: When clicking the "Serve" button
- **Recommended**: Ding, bell, or success sound
- **Duration**: 0.5-1 second
- **Volume**: Set to 60% by default

### 6. Game End Sound
- **Filename**: `game-end.mp3`
- **Type**: Short sound effect
- **Plays**: When all customers have been served and game ends
- **Recommended**: Victory fanfare, achievement sound, or celebratory chime
- **Duration**: 2-4 seconds
- **Volume**: Set to 70% by default

## File Structure

After adding the audio files, your file structure should look like this:

```
cafe/
├── assets/
│   ├── bg-music.mp3         ← Add this
│   ├── boba-drop.mp3         ← Add this
│   ├── tea-pour.mp3          ← Add this
│   ├── milk-pour.mp3         ← Add this
│   ├── serve.mp3             ← Add this
│   ├── game-end.mp3          ← Add this
│   ├── opening-bg.png
│   ├── fox.png
│   ├── cat.png
│   └── ... (other images)
├── index.html
├── main.js
└── style.css
```

## When Sounds Play

- **Background Music**: Starts immediately when the page opens, loops throughout the game
- **Boba Drop**: Plays each time you click/tap to drop a boba ball
- **Tea Pouring**: Plays continuously while holding SPACE (PC) or Tea button (Mobile/PC), stops when released
- **Milk Pouring**: Plays continuously while holding M key (PC) or Milk button (Mobile/PC), stops when released
- **Serve**: Plays when clicking the "Serve" button to serve the drink
- **Game End**: Plays when all 5 customers have been served and the game ends

## Finding Free Audio

You can find free audio from:
- **Freesound.org** - Free sound effects
- **Incompetech.com** - Free background music
- **Pixabay Music** - Free music and sound effects
- **Zapsplat.com** - Free sound effects

## Note

All audio files should be in MP3 format for best browser compatibility. If you don't have the audio files yet, the game will still work - the sounds just won't play (errors are caught and logged to console).

**Important**: Most modern browsers block autoplay of audio until the user interacts with the page. If the background music doesn't start immediately, it will begin playing after the user clicks anywhere on the page (like clicking the "Start Game" button).
