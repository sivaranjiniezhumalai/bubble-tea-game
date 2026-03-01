const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const foxImg = new Image();
foxImg.src = 'assets/fox.png';
const catImg = new Image();
catImg.src = 'assets/cat.png';
const dogImg = new Image();
dogImg.src = 'assets/dog.png';
const crabImg = new Image();
crabImg.src = 'assets/crab.png';
const snakeImg = new Image();
snakeImg.src = 'assets/snake.png';
const pigImg = new Image();
pigImg.src = 'assets/pig.png';
const openingBgImg = new Image();
openingBgImg.src = 'assets/opening-bg.png';

// ===== AUDIO =====
const bgMusic = new Audio('assets/bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.preload = 'auto';
bgMusic.autoplay = true;

// Expose bgMusic to window for music toggle button
window.bgMusicElement = bgMusic;

// Try to start music immediately (works on desktop)
bgMusic.play().catch(() => {
  // Autoplay blocked, will retry on load events
});

const bobaSound = new Audio('assets/boba-drop.mp3');
bobaSound.volume = 0.5;
bobaSound.preload = 'auto';

const teaSound = new Audio('assets/tea-pour.mp3');
teaSound.loop = true;
teaSound.volume = 0.4;
teaSound.preload = 'auto';

const milkSound = new Audio('assets/milk-pour.mp3');
milkSound.loop = true;
milkSound.volume = 0.4;
milkSound.preload = 'auto';

const serveSound = new Audio('assets/serve.mp3');
serveSound.volume = 0.6;
serveSound.preload = 'auto';

const gameEndSound = new Audio('assets/game-end.mp3');
gameEndSound.volume = 0.7;
gameEndSound.preload = 'auto';

// ===== ANIMATION ENGINE =====
const Easing = {
  linear: t => t,
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: t => t * (2 - t),
  easeIn: t => t * t,
  elastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  bounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

class CharacterAnimator {
  constructor() {
    this.state = 'idle';
    this.stateTime = 0;
    this.blinkTimer = 0;
    this.blinkDuration = 0;
    this.nextBlinkTime = Math.random() * 120 + 60;
    this.breathePhase = 0;
    this.idlePhase = 0;
    this.earWiggle = 0;
    this.expression = 'neutral'; // neutral, happy, sad, excited
    this.transitionProgress = 0;
    this.bounceY = 0;
    this.squashStretch = { x: 1, y: 1 };
  }

  update(delta) {
    this.stateTime += delta;
    this.breathePhase += 0.02;
    this.idlePhase += 0.015;
    this.blinkTimer++;

    // Blink logic
    if (this.blinkTimer > this.nextBlinkTime) {
      this.blinkDuration = 8;
      this.nextBlinkTime = this.blinkTimer + Math.random() * 180 + 120;
    }
    if (this.blinkDuration > 0) this.blinkDuration--;

    // Ear wiggle
    if (Math.random() < 0.01) {
      this.earWiggle = 10;
    }
    if (this.earWiggle > 0) this.earWiggle -= 0.5;

    // Bounce decay
    if (this.bounceY > 0) {
      this.bounceY *= 0.9;
      if (this.bounceY < 0.1) this.bounceY = 0;
    }

    // Squash/stretch return to normal
    this.squashStretch.x += (1 - this.squashStretch.x) * 0.15;
    this.squashStretch.y += (1 - this.squashStretch.y) * 0.15;
  }

  setState(newState, expression = 'neutral') {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTime = 0;
      this.transitionProgress = 0;
    }
    this.expression = expression;
  }

  triggerBounce(strength = 10) {
    this.bounceY = strength;
  }

  triggerSquash(xScale, yScale) {
    this.squashStretch.x = xScale;
    this.squashStretch.y = yScale;
  }

  getIdleOffset() {
    return {
      x: Math.sin(this.idlePhase) * 2,
      y: Math.sin(this.idlePhase * 1.5) * 3
    };
  }

  getBreatheScale() {
    return 1 + Math.sin(this.breathePhase) * 0.03;
  }

  isBlinking() {
    return this.blinkDuration > 0;
  }

  getEarRotation() {
    return Math.sin(this.earWiggle * 0.5) * 0.3;
  }
}

// Create animators for characters
const foxAnimator = new CharacterAnimator();
const customerAnimator = new CharacterAnimator();

//
let money = 0;
let customerX = -100;
let customersServed = 0;
const MAX_CUSTOMERS = 5;

let customerMood = "neutral";
let customerType = "cat";
let customerQueue = []; // Queue to ensure all customers appear once

let currentRecipe = {
  bobas: 25,
  teaPercent: 40,
  milkPercent: 20
};

let comboStreak = 0;

let milkHeight = 0;
let pouringMilk = false;

let shakeTimer = 0;

let lidProgress = 0;
let lidClosing = false;

let strawProgress = 0;
let insertingStraw = false;

let mixingDrink = false;
let mixProgress = 0;

let drinkServeProgress = 0;
let drinkX = 0;
let drinkY = 0;
let drinkScale = 1;

let blinkTimer = 0;

let feedbackText = "";
let feedbackTimer = 0;

let gameState = "OPENING";
let stateTimer = 0;

let totalScore = 0; // Track total score for ending

let fillHeight = 0;
let pouring = false;

// Pouring animation variables
let teaPouringParticles = [];
let milkPouringParticles = [];

// Audio initialization flag for mobile
let audioInitialized = false;

// Helper function to handle pointer events (mouse or touch)
function handlePointerDown(mx, my) {
  // Initialize audio on first user interaction (required for mobile)
  if (!audioInitialized) {
    // Load and play background music (essential for mobile)
    bgMusic.load();
    bgMusic.currentTime = 0;
    bgMusic.play().then(() => {
      console.log('Background music started successfully');
    }).catch(e => {
      console.log('Background music failed to start:', e);
      // Retry after a short delay
      setTimeout(() => {
        bgMusic.play().catch(err => console.log('Retry failed:', err));
      }, 100);
    });
    audioInitialized = true;
  }
  
  // Handle Start button click in OPENING screen
  if (gameState === "OPENING" && stateTimer > 2000) {
    const isMobile = canvas.width < 768;
    const buttonWidth = isMobile ? 150 : 200;
    const buttonHeight = isMobile ? 50 : 60;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + (isMobile ? 50 : 80);
    
    if (mx > buttonX && mx < buttonX + buttonWidth &&
        my > buttonY && my < buttonY + buttonHeight) {
      // Hide the controls hint when starting the game
      const controlsHint = document.getElementById('controlsHint');
      if (controlsHint) {
        controlsHint.classList.add('hidden');
      }
      // Try to start music on button click (respects user mute preference)
      startBackgroundMusic();
      changeState("CUSTOMER_ENTER");
      return;
    }
  }

  if (gameState === "ORDERING") {
    changeState("MAKING_DRINK");
    return;
  }

  if (gameState !== "MAKING_DRINK") return;
  
  // Check if clicking on toggle button or controls area (don't drop boba)
  if (mx < 300 && my > canvas.height - 300) return;

  // Responsive button dimensions
  const isMobile = canvas.width < 768;
  const buttonWidth = isMobile ? 100 : 120;
  const buttonHeight = isMobile ? 38 : 42;
  const buttonX = canvas.width - (isMobile ? 110 : 135);
  const startY = isMobile ? 30 : 40;
  const spacing = isMobile ? 45 : 50;

  // ===== SERVE BUTTON =====
  if (
    mx > buttonX &&
    mx < buttonX + buttonWidth &&
    my > startY &&
    my < startY + buttonHeight
  ) {
    // Start straw insertion animation instead of immediately checking
    if (!insertingStraw && strawProgress === 0) {
      insertingStraw = true;
      strawProgress = 0;
      // Play serve sound
      serveSound.currentTime = 0;
      serveSound.play().catch(e => console.log('Audio play failed:', e));
    }
    return;
  }

  // ===== RESET BUTTON =====
  if (
    mx > buttonX &&
    mx < buttonX + buttonWidth &&
    my > startY + spacing &&
    my < startY + spacing + buttonHeight
  ) {
    resetDrink();
    return;
  }

  // ===== TEA BUTTON =====
  if (
    mx > buttonX &&
    mx < buttonX + buttonWidth &&
    my > startY + spacing * 2 &&
    my < startY + spacing * 2 + buttonHeight
  ) {
    pouring = true;
    teaSound.currentTime = 0;
    teaSound.play().catch(e => console.log('Audio play failed:', e));
    return;
  }

  // ===== MILK BUTTON =====
  if (
    mx > buttonX &&
    mx < buttonX + buttonWidth &&
    my > startY + spacing * 3 &&
    my < startY + spacing * 3 + buttonHeight
  ) {
    pouringMilk = true;
    milkSound.currentTime = 0;
    milkSound.play().catch(e => console.log('Audio play failed:', e));
    return;
  }

  // ===== OTHERWISE DROP BOBA =====
  dropBoba();
}

function handlePointerUp(mx, my) {
  // Stop pouring and stop sounds when releasing button
  if (pouring) {
    pouring = false;
    teaSound.pause();
    teaSound.currentTime = 0;
  }
  if (pouringMilk) {
    pouringMilk = false;
    milkSound.pause();
    milkSound.currentTime = 0;
  }
}

window.addEventListener("mousedown", (e) => {
  handlePointerDown(e.clientX, e.clientY);
});

window.addEventListener("mouseup", (e) => {
  handlePointerUp(e.clientX, e.clientY);
});

// Touch event support for mobile
window.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent default touch behavior
  const touch = e.touches[0];
  handlePointerDown(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener("touchend", (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  handlePointerUp(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (gameState === "MAKING_DRINK" && e.code === "Space" && !pouring) {
    pouring = true;
    teaSound.currentTime = 0;
    teaSound.play().catch(e => console.log('Audio play failed:', e));
  }
  else if (gameState === "MAKING_DRINK" && e.code === "KeyM" && !pouringMilk) {
    pouringMilk = true;
    milkSound.currentTime = 0;
    milkSound.play().catch(e => console.log('Audio play failed:', e));
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    pouring = false;
    teaSound.pause();
    teaSound.currentTime = 0;
  }
  else if (e.code === "KeyM") {
    pouringMilk = false;
    milkSound.pause();
    milkSound.currentTime = 0;
  }
});

function updateState(delta) {
  stateTimer += delta;

  // No automatic transition from OPENING - wait for user to click Start button
}

function changeState(newState) {
  gameState = newState;
  stateTimer = 0;

  if (newState === "SERVING_CUSTOMER") {
    // Initialize drink serving animation
    drinkServeProgress = 0;
    drinkX = cupX;
    drinkY = cupY;
    drinkScale = 1;
  }

  if (newState === "CUSTOMER_ENTER") {
    // Initialize customer queue if empty (ensures all 5 customers appear once)
    if (customerQueue.length === 0) {
      customerQueue = ["cat", "dog", "crab", "snake", "pig"];
      // Shuffle the queue for randomness
      for (let i = customerQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [customerQueue[i], customerQueue[j]] = [customerQueue[j], customerQueue[i]];
      }
    }
    
    // Pick the next customer from the queue
    customerType = customerQueue.shift();
    
    // Randomize the recipe levels the customer wants
    currentRecipe.bobas = Math.floor(Math.random() * 11) + 20;
    currentRecipe.teaPercent = Math.floor(Math.random() * 60) + 20;
    currentRecipe.milkPercent = Math.floor(Math.random() * 60) + 10;
    
    // Reset customer position to right side off-screen
    customerX = canvas.width + 100;
    customerAnimator.setState('walk', 'neutral');
  }
  
  if (newState === "MAKING_DRINK") {
    foxAnimator.setState('idle', 'neutral');
    customerAnimator.setState('waiting', 'neutral');
  }
  
  if (newState === "OPENING") {
    foxAnimator.setState('walk', 'happy');
    // Try to start music on opening screen (respects user mute preference)
    startBackgroundMusic();
  }
  
  if (newState === "GAME_END") {
    // Play game end sound
    gameEndSound.currentTime = 0;
    gameEndSound.play().catch(e => console.log('Audio play failed:', e));
  }
}

//
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create engine
const engine = Engine.create();
const world = engine.world;

engine.world.gravity.y = 1;

// Cup dimensions - responsive for mobile
const isMobileDevice = canvas.width < 768;
const cupWidth = isMobileDevice ? 160 : 200;
const cupHeight = isMobileDevice ? 280 : 350;
const cupX = canvas.width / 2;
const cupY = isMobileDevice ? canvas.height / 2 + 20 : canvas.height / 2 + 50;

// Cup walls (invisible physics bodies)
const thickness = 20;

const leftWall = Bodies.rectangle(
  cupX - cupWidth / 2,
  cupY,
  thickness,
  cupHeight,
  { isStatic: true }
);

const rightWall = Bodies.rectangle(
  cupX + cupWidth / 2,
  cupY,
  thickness,
  cupHeight,
  { isStatic: true }
);

const bottomWall = Bodies.rectangle(
  cupX,
  cupY + cupHeight / 2,
  cupWidth,
  thickness,
  { isStatic: true }
);

World.add(world, [leftWall, rightWall, bottomWall]);

// Boba array
let bobas = [];

// Drop boba
function dropBoba() {

  if (countBobasInCup() >= 35) return; // hard limit

  const radius = 12;

  const boba = Bodies.circle(
    cupX + (Math.random() * 100 - 50),
    cupY - cupHeight / 2 - 50,
    radius,
    {
      restitution: 0.5,
      friction: 0.3,
      density: 0.002
    }
  );

  bobas.push(boba);
  World.add(world, boba);
  
  // Play boba drop sound
  bobaSound.currentTime = 0;
  bobaSound.play().catch(e => console.log('Audio play failed:', e));
  
  // Trigger small reaction
  foxAnimator.triggerSquash(1.05, 0.95);
}



// Game loop
let lastTime = 0;

function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;

  Engine.update(engine);
  
  // Update animators
  foxAnimator.update(delta / 16.67); // Normalize to 60fps
  customerAnimator.update(delta / 16.67);
  
  // Update straw insertion animation
  if (insertingStraw && gameState === "MAKING_DRINK") {
    strawProgress += 0.02; // Smooth insertion
    if (strawProgress >= 1) {
      insertingStraw = false;
      strawProgress = 1; // Keep straw visible
      // After straw is fully inserted, start mixing animation
      mixingDrink = true;
      mixProgress = 0;
    }
  }
  
  // Update mixing animation
  if (mixingDrink && gameState === "MAKING_DRINK") {
    mixProgress += 0.015; // Smooth mixing animation
    if (mixProgress >= 1) {
      mixingDrink = false;
      mixProgress = 0;
      // After mixing is complete, check the drink
      checkDrink();
    }
  }
  
  // Continuous pouring when holding button
  if (gameState === "MAKING_DRINK" && pouring) {
    fillHeight += 0.3; // Very slow, precise pouring rate (~0.5-1% per second)
    foxAnimator.setState('pouring', 'neutral');
    if (fillHeight > cupHeight - 20) {
      fillHeight = cupHeight - 20;
    }
  }
  else if (gameState === "MAKING_DRINK" && pouringMilk) {
    milkHeight += 0.3; // Very slow, precise pouring rate (~0.5-1% per second)
    foxAnimator.setState('pouring', 'neutral');
    if (milkHeight > cupHeight - 20) {
      milkHeight = cupHeight - 20;
    }
  }
  else if (gameState === "MAKING_DRINK") {
    // Return to idle when not pouring
    if (foxAnimator.state === 'pouring') {
      foxAnimator.setState('idle', 'neutral');
    }
  }
  updateState(delta);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderGame();

  requestAnimationFrame(gameLoop);

}

requestAnimationFrame(gameLoop);

// Try to start background music on page load and restart on every refresh
function startBackgroundMusic() {
  // Check if user has muted music
  if (sessionStorage.getItem('bgMusicPlaying') === 'false') {
    console.log('Music muted by user - not starting');
    return;
  }
  
  bgMusic.currentTime = 0;
  bgMusic.play().then(() => {
    console.log('Background music started successfully');
    audioInitialized = true;
    sessionStorage.setItem('bgMusicPlaying', 'true');
  }).catch(e => {
    console.log('Autoplay blocked:', e.message);
    audioInitialized = false;
  });
}

// Detect if this is a page refresh (not first visit)
const isPageRefresh = performance.navigation && performance.navigation.type === 1 ||
  performance.getEntriesByType('navigation').map(nav => nav.type).includes('reload');

if (isPageRefresh) {
  console.log('Page refresh detected - starting music aggressively');
}

// Save that we want music to play (only if not already set by user preference)
if (!sessionStorage.getItem('bgMusicPlaying')) {
  sessionStorage.setItem('bgMusicPlaying', 'true');
}

// Aggressive autoplay strategy - try immediately
startBackgroundMusic();

// Try again after 50ms (very quick retry)
setTimeout(startBackgroundMusic, 50);

// Try again on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(startBackgroundMusic, 100);
    setTimeout(startBackgroundMusic, 300);
  });
} else {
  setTimeout(startBackgroundMusic, 100);
  setTimeout(startBackgroundMusic, 300);
}

// Try again on window load
window.addEventListener('load', () => {
  setTimeout(startBackgroundMusic, 150);
  setTimeout(startBackgroundMusic, 400);
  setTimeout(startBackgroundMusic, 700);
});

// Critical: pageshow event fires on page refresh and back/forward navigation
window.addEventListener('pageshow', (event) => {
  console.log('Page shown - starting music');
  if (sessionStorage.getItem('bgMusicPlaying') === 'true') {
    setTimeout(startBackgroundMusic, 50);
    setTimeout(startBackgroundMusic, 200);
  }
});

// Add multiple event listeners to ensure music starts on any user interaction
const startMusicOnInteraction = () => {
  if (!audioInitialized || bgMusic.paused) {
    startBackgroundMusic();
  }
};

// Try to start music on various user interactions (fallback for mobile)
document.addEventListener('click', startMusicOnInteraction, { once: true });
document.addEventListener('touchstart', startMusicOnInteraction, { once: true });
document.addEventListener('keydown', startMusicOnInteraction, { once: true });
document.addEventListener('touchend', startMusicOnInteraction, { once: true });

// Force restart music when page becomes visible (handles refresh/tab switch)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.isMusicPlaying !== false) {
    startBackgroundMusic();
  }
});

// Restart music when window regains focus
window.addEventListener('focus', () => {
  if (window.isMusicPlaying !== false && bgMusic.paused) {
    startBackgroundMusic();
  }
});

// Save music state before page unload/refresh
window.addEventListener('beforeunload', () => {
  if (window.isMusicPlaying !== false) {
    sessionStorage.setItem('bgMusicPlaying', 'true');
  } else {
    sessionStorage.setItem('bgMusicPlaying', 'false');
  }
});


function drawCup() {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(
    cupX - cupWidth / 2,
    cupY - cupHeight / 2,
    cupWidth,
    cupHeight,
    25
  );
  ctx.stroke();

  // Glass sheen
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(
    cupX - cupWidth / 2 + 10,
    cupY - cupHeight / 2 + 10,
    20,
    cupHeight - 20
  );
}


function renderGame() {
  if (gameState === "OPENING") {
    drawOpening();
  }
  else if (gameState === "CUSTOMER_ENTER") {
    drawCustomerEnter();
  }
  else if (gameState === "ORDERING") {
    drawOrdering();
  }
  else if (gameState === "MAKING_DRINK") {
    drawMakingDrink();
  }
  else if (gameState === "SERVING_CUSTOMER") {
    drawServingCustomer();
  }
  else if (gameState === "SERVE_DRINK") {
    drawServe();
  }
  else if (gameState === "GAME_END") {
    drawGameEnd();
  }
}

function drawMakingDrink() {

  ctx.save();
  ctx.textAlign = "left";

  if (shakeTimer > 0) {
    ctx.translate(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    shakeTimer--;
  }

  // Inside shop background - cozy cafe gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(0.5, '#fcb69f');
  gradient.addColorStop(1, '#fad0c4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative elements (shelves, lights)
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.fillRect(0, 100, canvas.width, 8); // shelf
  ctx.fillRect(0, 200, canvas.width, 8); // shelf
  
  // Hanging lights
  const time = Date.now() * 0.001;
  for (let i = 0; i < 5; i++) {
    const x = 100 + i * 220;
    const swing = Math.sin(time + i * 0.5) * 5;
    ctx.fillStyle = `rgba(255, 220, 100, ${0.6 + Math.sin(time + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x + swing, 60, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw fox on LEFT side of shop
  drawAnimatedFox();
  
  // Draw customer on RIGHT side watching and waiting
  const isMobile = canvas.width < 768;
  const customerX = isMobile ? canvas.width - 100 : canvas.width - 200;
  const customerY = isMobile ? canvas.height - 60 : 280;
  ctx.save();
  drawCustomer(customerX, customerY);
  ctx.restore();

  // Responsive font sizing for stats
  const statsFont = isMobile ? 20 : 28;
  const statsSmallFont = isMobile ? 18 : 24;
  const statsX = isMobile ? 15 : 30;
  const statsLineHeight = isMobile ? 35 : 40;

  // Display money and combo at top left corner
  ctx.fillStyle = "#2c3e50";
  ctx.font = `bold ${statsFont}px sans-serif`;
  ctx.fillText("💰 $" + money, statsX, statsLineHeight);
  ctx.fillText("🔥 x" + comboStreak, statsX, statsLineHeight * 2);
  
  // Display customer progress
  ctx.font = `bold ${statsSmallFont}px sans-serif`;
  ctx.fillStyle = "#6c5ce7";
  ctx.fillText(`Customer ${customersServed + 1}/${MAX_CUSTOMERS}`, statsX, statsLineHeight * 3);

  drawCup();
  drawLiquid();
  drawMilk();
  drawBobas();
  
  // Draw containers (always visible)
  drawTeapot();
  drawMilkPacket();
  
  // Draw pouring streams (only when buttons pressed)
  drawTeaPouringStream();
  drawMilkPouringStream();
  
  drawLid();
  drawStraw();
  
  // Show mixing animation if active
  if (mixingDrink && mixProgress > 0) {
    drawMixingAnimation();
  }

  drawButtons();
  drawStats();

  if (feedbackTimer > 0) {
    // Animated feedback with scale and fade
    const feedbackProgress = 1 - (feedbackTimer / 120);
    const scale = Easing.elastic(Math.min(feedbackProgress * 2, 1));
    const alpha = Math.min(feedbackTimer / 30, 1);
    
    // Responsive feedback text (reuse isMobile from function scope)
    const feedbackSize = isMobile ? 28 : 40;
    const feedbackY = isMobile ? 100 : 150;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, feedbackY);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -feedbackY);
    
    ctx.fillStyle = "#ff69b4";
    ctx.font = `bold ${feedbackSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(feedbackText, canvas.width / 2, feedbackY);
    ctx.textAlign = "left";
    
    ctx.restore();
    feedbackTimer--;
  }

  // Show "Adding straw..." indicator during straw insertion
  if (insertingStraw || (strawProgress > 0 && strawProgress < 1)) {
    const strawTextSize = isMobile ? 20 : 28;
    const strawTextY = cupY - cupHeight / 2 - (isMobile ? 40 : 60);
    const strawAlpha = Math.sin(Date.now() * 0.005) * 0.3 + 0.7; // Pulsing effect
    
    ctx.save();
    ctx.globalAlpha = strawAlpha;
    ctx.fillStyle = "#ff6b6b";
    ctx.font = `bold ${strawTextSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("🥤 Adding straw...", canvas.width / 2, strawTextY);
    ctx.textAlign = "left";
    ctx.restore();
  }

  ctx.restore();
}

function drawLiquid() {

  const liquidTop = cupY + cupHeight / 2 - fillHeight;

  ctx.save();

  ctx.beginPath();
  ctx.roundRect(
    cupX - cupWidth / 2 + 5,
    cupY - cupHeight / 2 + 5,
    cupWidth - 10,
    cupHeight - 10,
    20
  );
  ctx.clip();

  ctx.fillStyle = "rgba(181, 101, 29, 0.8)"; // milk tea color

  ctx.beginPath();
  ctx.moveTo(cupX - cupWidth / 2, cupY + cupHeight / 2);

  for (let x = -cupWidth / 2; x <= cupWidth / 2; x++) {
    let wave = Math.sin((x + Date.now() * 0.005)) * 5;
    
    // During mixing: add intense wave effect
    if (mixingDrink && mixProgress > 0) {
      wave += Math.sin((x * 0.1 + mixProgress * Math.PI * 8)) * 20 * Math.sin(mixProgress * Math.PI);
      wave += Math.cos((x * 0.15 + mixProgress * Math.PI * 12)) * 15 * Math.sin(mixProgress * Math.PI);
    }
    
    ctx.lineTo(cupX + x, liquidTop + wave);
  }

  ctx.lineTo(cupX + cupWidth / 2, cupY + cupHeight / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawOpening() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Opening background image (if loaded) or gradient fallback
  if (openingBgImg.complete && openingBgImg.naturalWidth > 0) {
    // Draw background image to cover entire canvas
    ctx.drawImage(openingBgImg, 0, 0, canvas.width, canvas.height);
  } else {
    // Fallback gradient background for opening scene
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff9a9e');
    gradient.addColorStop(0.33, '#fecfef');
    gradient.addColorStop(0.66, '#ffecd2');
    gradient.addColorStop(1, '#fcb69f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Add floating bubbles/circles
  const time = Date.now() * 0.001;
  for (let i = 0; i < 8; i++) {
    const x = (i * 150) + Math.sin(time + i) * 30;
    const y = 100 + Math.cos(time * 0.7 + i) * 60;
    const size = 30 + Math.sin(time + i * 0.5) * 10;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.sin(time + i) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smooth slide-in with easeOut (FOX ENTERS FROM LEFT)
  const progress = Math.min(stateTimer / 3000, 1);
  const easedProgress = Easing.easeOut(progress);
  const isMobile = canvas.width < 768;
  const foxWidth = isMobile ? 180 : 270;
  const foxHeight = isMobile ? 140 : 210;
  const foxStartY = isMobile ? 120 : 150;
  const foxTargetX = isMobile ? 100 : 150;
  let foxX = -foxWidth + easedProgress * (foxWidth + foxTargetX); // Moves from off-screen left to target position
  
  foxAnimator.setState('walk', 'happy');
  
  ctx.save();
  ctx.translate(foxX, foxStartY);
  
  if (foxImg.complete) {
    // Add slight bounce while walking
    const walkBounce = Math.sin(stateTimer * 0.01) * 5;
    ctx.drawImage(foxImg, 0, walkBounce, foxWidth, foxHeight);
  }
  ctx.restore();

  // Animated text with fade-in and glow effect
  const textAlpha = Math.min(stateTimer / 1000, 1);
  
  // Text glow
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(108, 92, 231, 0.6)';
  
  // Responsive font size
  const fontSize = isMobile ? 24 : 36;
  
  // Darker text color for better visibility
  const r = 44, g = 62, b = 80; // Dark blue-gray color (#2c3e50)
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${textAlpha})`;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  
  // Text with subtle pulse
  const pulse = 1 + Math.sin(stateTimer * 0.005) * 0.05;
  ctx.save();
  ctx.translate(canvas.width / 2, 100);
  ctx.scale(pulse, pulse);
  ctx.fillText("✨ Welcome To RANZ Shop... ✨", 0, 0);
  ctx.restore();
  
  ctx.shadowBlur = 0;
  ctx.textAlign = "left";

  // START BUTTON - appears after fox animation
  if (stateTimer > 2000) {
    const buttonWidth = isMobile ? 150 : 200;
    const buttonHeight = isMobile ? 50 : 60;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + (isMobile ? 50 : 80);
    const buttonFontSize = isMobile ? 20 : 28;
    
    // Button fade in
    const buttonAlpha = Math.min((stateTimer - 2000) / 500, 1);
    
    // Button glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(108, 92, 231, ${buttonAlpha * 0.6})`;
    
    // Button background with pulse
    const buttonPulse = 1 + Math.sin(stateTimer * 0.003) * 0.05;
    ctx.save();
    ctx.globalAlpha = buttonAlpha;
    ctx.translate(canvas.width / 2, buttonY + buttonHeight / 2);
    ctx.scale(buttonPulse, buttonPulse);
    ctx.translate(-canvas.width / 2, -(buttonY + buttonHeight / 2));
    
    ctx.fillStyle = "#6c5ce7";
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
    ctx.fill();
    
    // Button border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Button text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${buttonFontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("🎮 Start Game", canvas.width / 2, buttonY + buttonHeight / 2 + 8);
    
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  }
}

function drawCustomerEnter() {
  // Inside shop background (same as making drink)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(0.5, '#fcb69f');
  gradient.addColorStop(1, '#fad0c4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative elements
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.fillRect(0, 100, canvas.width, 8);
  ctx.fillRect(0, 200, canvas.width, 8);
  
  // Customer enters from RIGHT side (off-screen right to final position)
  const enterProgress = Math.min(stateTimer / 2000, 1);
  const easedProgress = Easing.easeOut(enterProgress);
  const isMobile = canvas.width < 768;
  const targetX = isMobile ? canvas.width - 100 : canvas.width - 200;
  const startX = canvas.width + 100;
  customerX = startX - easedProgress * (startX - targetX); // Start off-screen right, move to target position

  customerAnimator.setState('walk', 'neutral');
  foxAnimator.setState('idle', 'happy'); // Fox waits happily for customer
  
  // Draw fox on LEFT side waiting
  drawAnimatedFox();
  
  // Draw customer entering from right
  const customerY = isMobile ? canvas.height - 60 : 280;
  drawCustomer(customerX, customerY);

  if (enterProgress >= 1) {
    customerAnimator.triggerBounce(6);
    changeState("ORDERING");
  }
}

function drawOrdering() {
  // Responsive detection at the start of function
  const isMobile = canvas.width < 768;
  
  // Inside shop background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(0.5, '#fcb69f');
  gradient.addColorStop(1, '#fad0c4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative elements
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.fillRect(0, 100, canvas.width, 8);
  ctx.fillRect(0, 200, canvas.width, 8);

  // Set animator states
  if (stateTimer < 400) {
    foxAnimator.setState('talking', 'happy');
    customerAnimator.setState('listening', 'neutral');
  } else {
    foxAnimator.setState('listening', 'neutral');
    customerAnimator.setState('talking', 'neutral');
  }
  
  // Draw fox on LEFT side listening
  drawAnimatedFox();

  // Draw customer on RIGHT side (positioned at their final spot)
  const customerXPos = isMobile ? canvas.width - 100 : canvas.width - 200;
  const customerYPos = isMobile ? canvas.height - 60 : 280;
  ctx.fillStyle = "#6ab04c";
  drawCustomer(customerXPos, customerYPos);

  // FOX SPEECH BUBBLE - Welcoming customer (stays visible until user clicks)
  const foxBubbleWidth = isMobile ? 200 : 260;
  const foxBubbleHeight = isMobile ? 70 : 80;
  const foxBubbleX = isMobile ? 20 : 60;
  const foxBubbleY = isMobile ? canvas.height - 220 : 150;
  const foxFontSize = isMobile ? 14 : 18;
  
  const foxBubbleAlpha = Math.min(stateTimer / 300, 1); // Fade in only, stay visible
  
  ctx.fillStyle = `rgba(255, 248, 220, ${foxBubbleAlpha})`;
  ctx.beginPath();
  ctx.roundRect(foxBubbleX, foxBubbleY, foxBubbleWidth, foxBubbleHeight, isMobile ? 12 : 15);
  ctx.fill();

  // Fox speech bubble tail (triangle pointing to fox on left)
  ctx.fillStyle = `rgba(255, 248, 220, ${foxBubbleAlpha})`;
  ctx.beginPath();
  ctx.moveTo(foxBubbleX, foxBubbleY + foxBubbleHeight - 20);
  ctx.lineTo(foxBubbleX - 20, foxBubbleY + foxBubbleHeight);
  ctx.lineTo(foxBubbleX, foxBubbleY + foxBubbleHeight - 10);
  ctx.fill();

  ctx.globalAlpha = foxBubbleAlpha;
  ctx.fillStyle = "#e67e22";
  ctx.font = `bold ${foxFontSize}px sans-serif`;
  ctx.fillText("👋 Welcome!", foxBubbleX + 15, foxBubbleY + 28);
  ctx.fillStyle = "#2c3e50";
  ctx.font = `${foxFontSize}px sans-serif`;
  ctx.fillText("What would you like?", foxBubbleX + 15, foxBubbleY + 52);
  ctx.globalAlpha = 1;

  // CUSTOMER SPEECH BUBBLE - positioned near customer on RIGHT side
  const bubbleWidth = isMobile ? 240 : 300;
  const bubbleHeight = isMobile ? 110 : 130;
  const bubbleX = canvas.width - (isMobile ? bubbleWidth + 20 : 420);
  const bubbleY = isMobile ? 80 : 110;
  const fontSize = isMobile ? 14 : 18;
  const smallFont = isMobile ? 12 : 16;
  
  const bubbleAlpha = Math.min(stateTimer / 500, 1);
  ctx.fillStyle = `rgba(255, 255, 255, ${bubbleAlpha})`;
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, isMobile ? 15 : 20);
  ctx.fill();

  // Speech bubble tail (triangle pointing to customer on right)
  ctx.beginPath();
  ctx.moveTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - 30);
  ctx.lineTo(bubbleX + bubbleWidth + 30, bubbleY + bubbleHeight - 10);
  ctx.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - 10);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.font = `${fontSize}px sans-serif`;
  const textX = bubbleX + 20;
  if (stateTimer > 300) {
    ctx.fillText(`I'd like ${currentRecipe.bobas} Bobas`, textX, bubbleY + 30);
    ctx.fillText(`+ ${currentRecipe.teaPercent}% Tea!`, textX, bubbleY + 50);
  }
  if (stateTimer > 600) {
    ctx.fillText(`+ ${currentRecipe.milkPercent}% Milk please!`, textX, bubbleY + 70);
  }
  if (stateTimer > 900) {
    ctx.font = `bold ${smallFont}px sans-serif`;
    ctx.fillStyle = "#6c5ce7";
    ctx.fillText(isMobile ? "(Tap to start)" : "(Click to start)", textX, bubbleY + 95);
  }
}

function countBobasInCup() {

  let count = 0;

  const left = cupX - cupWidth / 2;
  const right = cupX + cupWidth / 2;
  const top = cupY - cupHeight / 2;
  const bottom = cupY + cupHeight / 2;

  bobas.forEach(b => {

    if (
      b.position.x > left + 10 &&
      b.position.x < right - 10 &&
      b.position.y > top &&
      b.position.y < bottom
    ) {
      count++;
    }

  });

  return count;
}

function getTeaPercent() {
  return (fillHeight / cupHeight) * 100;
}

function checkDrink() {

  const bobaCount = countBobasInCup();
  const teaPercent = getTeaPercent();
  const milkPercent = getMilkPercent();

  const bobaDiff = Math.abs(bobaCount - currentRecipe.bobas);
  const teaDiff = Math.abs(teaPercent - currentRecipe.teaPercent);
  const milkDiff = Math.abs(milkPercent - currentRecipe.milkPercent);

  let score = 0;

  if (bobaDiff === 0) score++;
  if (teaDiff <= 5) score++;
  if (milkDiff <= 5) score++;

  if (score === 3) {
    feedbackText = "⭐⭐⭐ Perfect!";
    comboStreak++;
    money += 20 + comboStreak * 3;
    totalScore += 100;
    
    // Trigger happy animations
    foxAnimator.setState('celebrating', 'excited');
    foxAnimator.triggerBounce(15);
    foxAnimator.triggerSquash(1.2, 0.8);
    customerAnimator.setState('happy', 'excited');
    customerAnimator.triggerBounce(12);
    customerAnimator.triggerSquash(1.15, 0.85);
    
  } else if (score === 2) {
    feedbackText = "⭐⭐ Good!";
    comboStreak = 0;
    money += 10;
    totalScore += 50;
    
    foxAnimator.setState('idle', 'happy');
    foxAnimator.triggerBounce(8);
    customerAnimator.setState('satisfied', 'happy');
    customerAnimator.triggerSquash(1.1, 0.9);
    
  } else if (score === 1) {
    feedbackText = "⭐ Okay";
    comboStreak = 0;
    money += 5;
    totalScore += 20;
    
    foxAnimator.setState('idle', 'neutral');
    customerAnimator.setState('neutral', 'neutral');
    
  } else {
    feedbackText = "❌ Try Again!";
    comboStreak = 0;
    totalScore += 0;
    
    foxAnimator.setState('disappointed', 'sad');
    foxAnimator.triggerSquash(0.9, 1.1);
    customerAnimator.setState('upset', 'sad');
    customerAnimator.triggerSquash(0.85, 1.15);
  }

  feedbackTimer = 120;
  customersServed++;
  
  // Transition to serving animation state
  setTimeout(() => {
    changeState("SERVING_CUSTOMER");
  }, 1500);
}

function drawServe() {

  ctx.fillStyle = "#ffe6f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCup();
  drawLiquid();
  drawBobas();
  drawStraw();

  if (feedbackTimer > 0) {
    ctx.fillStyle = "#ff69b4";
    ctx.font = "50px sans-serif";
    ctx.fillText(feedbackText, canvas.width / 2 - 100, 150);
    feedbackTimer--;
  }
}

function drawServingCustomer() {
  // Inside shop background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(0.5, '#fcb69f');
  gradient.addColorStop(1, '#fad0c4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative elements
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.fillRect(0, 100, canvas.width, 8);
  ctx.fillRect(0, 200, canvas.width, 8);

  const isMobile = canvas.width < 768;
  const customerXPos = isMobile ? canvas.width - 100 : canvas.width - 200;
  const customerYPos = isMobile ? canvas.height - 60 : 280;
  
  // Animate drink serving: shrink, move to customer, customer walks away
  drinkServeProgress += 0.008; // Slower animation for better visibility
  
  // Phase 1 (0-0.3): Drink shrinks and moves towards customer
  if (drinkServeProgress < 0.3) {
    const phase1Progress = drinkServeProgress / 0.3;
    const eased = Easing.easeInOut(phase1Progress);
    
    // Shrink drink
    drinkScale = 1 - (0.7 * eased); // Scale from 1.0 to 0.3
    
    // Move drink towards customer
    drinkX = cupX + (customerXPos - cupX - 40) * eased;
    drinkY = cupY + (customerYPos - cupY - 40) * eased;
    
    // Draw fox waving goodbye
    foxAnimator.setState('celebrating', 'happy');
    drawAnimatedFox();
    
    // Draw customer waiting
    customerAnimator.setState('idle', 'happy');
    drawCustomer(customerXPos, customerYPos);
    
    // Draw shrinking drink moving to customer
    drawMovingDrink(drinkX, drinkY, drinkScale);
    
  } 
  // Phase 2 (0.3-0.5): Customer picks up drink
  else if (drinkServeProgress < 0.5) {
    drinkScale = 0.3;
    drinkX = customerXPos - 40;
    drinkY = customerYPos - 40;
    
    // Fox waving
    foxAnimator.setState('celebrating', 'happy');
    drawAnimatedFox();
    
    // Customer holding drink
    customerAnimator.setState('happy', 'excited');
    customerAnimator.triggerBounce(5);
    drawCustomer(customerXPos, customerYPos);
    
    // Draw drink near customer
    drawMovingDrink(drinkX, drinkY, drinkScale);
  }
  // Phase 3 (0.5-1.0): Customer walks away with drink
  else if (drinkServeProgress < 1.0) {
    const phase3Progress = (drinkServeProgress - 0.5) / 0.5;
    const eased = Easing.easeIn(phase3Progress);
    
    // Customer walks off screen to the right
    const walkDistance = canvas.width + 150;
    const currentX = customerXPos + (walkDistance - customerXPos) * eased;
    
    customerAnimator.setState('walk', 'happy');
    drawAnimatedFox();
    drawCustomer(currentX, customerYPos);
    
    // Drink moves with customer
    drinkX = currentX - 40;
    drinkY = customerYPos - 40;
    drawMovingDrink(drinkX, drinkY, drinkScale);
  }
  // Animation complete
  else {
    drinkServeProgress = 0;
    resetDrink();
    
    // Check if we served all customers
    if (customersServed >= MAX_CUSTOMERS) {
      changeState("GAME_END");
    } else {
      changeState("CUSTOMER_ENTER");
    }
  }
  
  // Show feedback during animation
  if (feedbackTimer > 0) {
    const feedbackProgress = 1 - (feedbackTimer / 120);
    const scale = Easing.elastic(Math.min(feedbackProgress * 2, 1));
    const alpha = Math.min(feedbackTimer / 30, 1);
    const feedbackSize = isMobile ? 28 : 40;
    const feedbackY = isMobile ? 100 : 150;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, feedbackY);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -feedbackY);
    
    ctx.fillStyle = "#ff69b4";
    ctx.font = `bold ${feedbackSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(feedbackText, canvas.width / 2, feedbackY);
    ctx.textAlign = "left";
    
    ctx.restore();
    feedbackTimer--;
  }
  
  // Display stats during serving animation
  const statsFont = isMobile ? 20 : 28;
  const statsSmallFont = isMobile ? 18 : 24;
  const statsX = isMobile ? 15 : 30;
  const statsLineHeight = isMobile ? 35 : 40;

  ctx.fillStyle = "#2c3e50";
  ctx.font = `bold ${statsFont}px sans-serif`;
  ctx.fillText("💰 $" + money, statsX, statsLineHeight);
  ctx.fillText("🔥 x" + comboStreak, statsX, statsLineHeight * 2);
  
  ctx.font = `bold ${statsSmallFont}px sans-serif`;
  ctx.fillStyle = "#6c5ce7";
  ctx.fillText(`Customer ${customersServed}/${MAX_CUSTOMERS}`, statsX, statsLineHeight * 3);
}

function drawMovingDrink(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  
  // Draw cup
  const scaledWidth = cupWidth * scale;
  const scaledHeight = cupHeight * scale;
  
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(
    x - scaledWidth / 2,
    y - scaledHeight / 2,
    scaledWidth,
    scaledHeight,
    25 * scale
  );
  ctx.stroke();
  
  // Draw tea liquid
  const liquidHeight = (fillHeight / cupHeight) * scaledHeight;
  ctx.fillStyle = "rgba(181, 101, 29, 0.8)";
  ctx.fillRect(
    x - scaledWidth / 2 + 3,
    y + scaledHeight / 2 - liquidHeight,
    scaledWidth - 6,
    liquidHeight
  );
  
  // Draw milk
  if (milkHeight > 0) {
    const milkScaledHeight = (milkHeight / cupHeight) * scaledHeight;
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillRect(
      x - scaledWidth / 2 + 3,
      y + scaledHeight / 2 - milkScaledHeight,
      scaledWidth - 6,
      milkScaledHeight
    );
  }
  
  // Draw simplified bobas
  ctx.fillStyle = "#3b1c32";
  bobas.forEach(b => {
    const bobaInCup = (
      b.position.x > cupX - cupWidth / 2 &&
      b.position.x < cupX + cupWidth / 2 &&
      b.position.y > cupY - cupHeight / 2 &&
      b.position.y < cupY + cupHeight / 2
    );
    if (bobaInCup) {
      const relX = ((b.position.x - cupX) / cupWidth) * scaledWidth;
      const relY = ((b.position.y - cupY) / cupHeight) * scaledHeight;
      ctx.beginPath();
      ctx.arc(x + relX, y + relY, 12 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Draw straw
  if (strawProgress > 0) {
    const strawWidth = 10 * scale;
    const strawHeight = scaledHeight * 0.8;
    const strawX = x + 15 * scale;
    const strawY = y - scaledHeight / 2;
    
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(strawX - strawWidth / 2, strawY, strawWidth, strawHeight);
    
    // Stripes
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < strawHeight / (10 * scale); i++) {
      ctx.fillRect(strawX - strawWidth / 2, strawY + i * 10 * scale, strawWidth, 3 * scale);
    }
  }
  
  ctx.restore();
}

function resetDrink() {
  fillHeight = 0;
  milkHeight = 0;
  lidClosing = false;
  strawProgress = 0;
  insertingStraw = false;
  mixingDrink = false;
  mixProgress = 0;
  drinkServeProgress = 0;
  drinkX = 0;
  drinkY = 0;
  drinkScale = 1;

  bobas.forEach(b => World.remove(world, b));
  bobas = [];
  
  // Clear pouring particles
  teaPouringParticles = [];
  milkPouringParticles = [];
  
  // Quick squash animation on reset
  foxAnimator.triggerSquash(0.95, 1.05);
}

function generateRecipe() {

  const animals = ["cat", "dog", "bunny"];
  customerType = animals[Math.floor(Math.random() * animals.length)];

  const tea = Math.floor(Math.random() * 30) + 30;
  const milk = Math.floor(Math.random() * (80 - tea));

  currentRecipe = {
    bobas: Math.floor(Math.random() * 11) + 20,
    teaPercent: tea,
    milkPercent: milk
  };
}
function getMilkPercent() {
  return (milkHeight / cupHeight) * 100;
}

function dropIce() {
  const ice = Bodies.rectangle(
    cupX + (Math.random() * 100 - 50),
    cupY - cupHeight / 2 - 50,
    20,
    20,
    {
      restitution: 0.3,
      friction: 0.1
    }
  );

  bobas.push(ice);
  World.add(world, ice);
}

function drawMilk() {

  if (milkHeight <= 0) return;

  const milkTop = cupY + cupHeight / 2 - milkHeight;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(
    cupX - cupWidth / 2 + 5,
    cupY - cupHeight / 2 + 5,
    cupWidth - 10,
    cupHeight - 10,
    20
  );
  ctx.clip();

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  
  // During mixing: draw milk with wave pattern instead of solid rectangle
  if (mixingDrink && mixProgress > 0) {
    ctx.beginPath();
    ctx.moveTo(cupX - cupWidth / 2, cupY + cupHeight / 2);
    
    for (let x = -cupWidth / 2; x <= cupWidth / 2; x += 2) {
      const wave = Math.sin((x * 0.08 + mixProgress * Math.PI * 10)) * 18 * Math.sin(mixProgress * Math.PI);
      const wave2 = Math.cos((x * 0.12 + mixProgress * Math.PI * 15)) * 12 * Math.sin(mixProgress * Math.PI);
      ctx.lineTo(cupX + x, milkTop + wave + wave2);
    }
    
    ctx.lineTo(cupX + cupWidth / 2, milkTop + milkHeight);
    ctx.lineTo(cupX + cupWidth / 2, cupY + cupHeight / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    // Normal milk display
    ctx.fillRect(
      cupX - cupWidth / 2,
      milkTop,
      cupWidth,
      milkHeight
    );
  }

  ctx.restore();
}

function drawBobas() {

  bobas.forEach((b, index) => {
    let x = b.position.x;
    let y = b.position.y;
    
    // During mixing: make bobas float and shake dramatically
    if (mixingDrink && mixProgress > 0) {
      const floatStrength = 15;
      const shakeStrength = 10;
      const rotationSpeed = mixProgress * Math.PI * 10;
      
      // Circular floating motion
      x += Math.cos(rotationSpeed + index * 0.5) * floatStrength * Math.sin(mixProgress * Math.PI);
      y += Math.sin(rotationSpeed + index * 0.7) * floatStrength * Math.sin(mixProgress * Math.PI);
      
      // Additional shake
      x += Math.sin(mixProgress * Math.PI * 20 + index) * shakeStrength;
      y += Math.cos(mixProgress * Math.PI * 20 + index * 1.3) * shakeStrength;
    }

    if (b.circleRadius) {
      ctx.fillStyle = "#3b1c32";
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect during mixing
      if (mixingDrink && mixProgress > 0) {
        const glowAlpha = 0.3 * Math.sin(mixProgress * Math.PI * 5 + index);
        ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#dff9fb";
      ctx.fillRect(
        x - 10,
        y - 10,
        20,
        20
      );
    }

  });
}

function drawTeapot() {
  if (gameState !== "MAKING_DRINK") return;
  
  ctx.save();
  
  // Mobile responsiveness
  const isMobile = canvas.width < 768;
  const scale = isMobile ? 0.5 : 1;
  const horizontalOffset = isMobile ? 60 : 100;
  const verticalOffset = isMobile ? 60 : 150;
  
  const teapotX = cupX - horizontalOffset;
  const teapotY = cupY - cupHeight / 2 - verticalOffset;
  const tiltAngle = pouring ? (Math.sin(Date.now() * 0.003) * 0.15 + 0.3) : 0; // Only tilt when pouring
  
  // Draw teapot with optional tilt
  ctx.translate(teapotX, teapotY);
  ctx.rotate(tiltAngle);
  ctx.scale(scale, scale);
  
  // Teapot body (rounded pot shape)
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#654321";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Teapot lid
  ctx.fillStyle = "#A0522D";
  ctx.beginPath();
  ctx.ellipse(0, -35, 25, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Lid knob
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(0, -42, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Teapot handle
  ctx.strokeStyle = "#654321";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(-35, 0, 20, -Math.PI/2, Math.PI/2);
  ctx.stroke();
  
  // Teapot spout (where tea pours from)
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.moveTo(45, -10);
  ctx.quadraticCurveTo(65, -5, 70, 5);
  ctx.lineTo(65, 10);
  ctx.quadraticCurveTo(60, 0, 45, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Decorative pattern on teapot
  ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(-10, -10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, 5, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Steam coming from teapot
  for (let i = 0; i < 3; i++) {
    const steamX = -5 + i * 5;
    const steamY = -50 + Math.sin(Date.now() * 0.005 + i) * 5;
    ctx.fillStyle = `rgba(200, 200, 200, ${0.3 - i * 0.1})`;
    ctx.beginPath();
    ctx.arc(steamX, steamY, 5 - i, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawMilkPacket() {
  if (gameState !== "MAKING_DRINK") return;
  
  ctx.save();
  
  // Mobile responsiveness
  const isMobile = canvas.width < 768;
  const scale = isMobile ? 0.5 : 1;
  const horizontalOffset = isMobile ? 60 : 100;
  const verticalOffset = isMobile ? 60 : 150;
  
  const milkPacketX = cupX + horizontalOffset;
  const milkPacketY = cupY - cupHeight / 2 - verticalOffset;
  const tiltAngle = pouringMilk ? (Math.sin(Date.now() * 0.003) * 0.1 + 0.7) : 0; // Tilt more when pouring
  
  // Draw milk packet/carton with optional tilt
  ctx.translate(milkPacketX, milkPacketY);
  ctx.rotate(tiltAngle);
  ctx.scale(scale, scale);
  
  // Milk carton body (rectangular carton)
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#4A90E2";
  ctx.lineWidth = 3;
  
  // Main carton box
  ctx.fillRect(-30, -40, 60, 80);
  ctx.strokeRect(-30, -40, 60, 80);
  
  // Carton top (folded flaps)
  ctx.fillStyle = "#E6F3FF";
  ctx.beginPath();
  ctx.moveTo(-30, -40);
  ctx.lineTo(-15, -55);
  ctx.lineTo(15, -55);
  ctx.lineTo(30, -40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Opening flap on top
  ctx.fillStyle = "#FFE6E6";
  ctx.beginPath();
  ctx.moveTo(-15, -55);
  ctx.lineTo(-5, -65);
  ctx.lineTo(5, -65);
  ctx.lineTo(15, -55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Milk carton label/text
  ctx.fillStyle = "#4A90E2";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MILK", 0, -10);
  
  // Draw milk drop pattern on carton
  ctx.fillStyle = "rgba(74, 144, 226, 0.3)";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-10 + i * 10, 5, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Blue stripe decoration
  ctx.fillStyle = "#4A90E2";
  ctx.fillRect(-30, 10, 60, 8);
  ctx.fillRect(-30, 25, 60, 8);
  
  // Freshness indicator
  ctx.fillStyle = "#27AE60";
  ctx.beginPath();
  ctx.arc(18, -25, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawTeaPouringStream() {
  if (!pouring || gameState !== "MAKING_DRINK") return;

  // Mobile responsiveness
  const isMobile = canvas.width < 768;
  const scale = isMobile ? 0.5 : 1;
  const horizontalOffset = isMobile ? 60 : 100;
  const verticalOffset = isMobile ? 60 : 150;
  
  const teapotX = cupX - horizontalOffset;
  const teapotY = cupY - cupHeight / 2 - verticalOffset;
  const tiltAngle = Math.sin(Date.now() * 0.003) * 0.15 + 0.3; // Tilting animation
  
  // Calculate pour point (from spout) - adjust for scale
  const spoutTipX = teapotX + Math.cos(tiltAngle) * 70 * scale - Math.sin(tiltAngle) * 5 * scale;
  const spoutTipY = teapotY + Math.sin(tiltAngle) * 70 * scale + Math.cos(tiltAngle) * 5 * scale;
  const pourTargetX = cupX;
  const pourTargetY = cupY - cupHeight / 2 + 10;
  const liquidLevelY = cupY + cupHeight / 2 - fillHeight;
  
  // Draw continuous viscous stream (waterfall effect)
  ctx.save();
  const baseStreamWidth = isMobile ? 12 : 18;
  const streamWidth = baseStreamWidth + Math.sin(Date.now() * 0.005) * 3; // Thick stream with slight pulsing
  const waveTime = Date.now() * 0.003;
  
  // Create gradient for depth
  const gradient = ctx.createLinearGradient(spoutTipX, spoutTipY, pourTargetX, liquidLevelY);
  gradient.addColorStop(0, 'rgba(181, 101, 29, 0.5)');
  gradient.addColorStop(0.3, 'rgba(181, 101, 29, 0.85)');
  gradient.addColorStop(0.7, 'rgba(181, 101, 29, 0.95)');
  gradient.addColorStop(1, 'rgba(181, 101, 29, 0.7)');
  
  ctx.fillStyle = gradient;
  
  // Draw stream path with curves
  ctx.beginPath();
  const segments = 25;
  const streamPoints = [];
  
  // Calculate smooth stream path
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = spoutTipX + (pourTargetX - spoutTipX) * t;
    const y = spoutTipY + (liquidLevelY - spoutTipY) * t;
    
    // Add flowing wave motion
    const wave = Math.sin(t * Math.PI * 2 + waveTime) * 4 * (1 - t * 0.5);
    const curve = t * t * 8; // Natural curve from gravity
    
    streamPoints.push({ x: x + wave + curve, y: y });
  }
  
  // Draw left edge of stream
  ctx.moveTo(streamPoints[0].x - streamWidth / 2, streamPoints[0].y);
  for (let i = 0; i < streamPoints.length; i++) {
    const width = streamWidth * (1 + i / segments * 0.2); // Slightly widen as it falls
    ctx.lineTo(streamPoints[i].x - width / 2, streamPoints[i].y);
  }
  
  // Draw right edge of stream (reverse)
  for (let i = streamPoints.length - 1; i >= 0; i--) {
    const width = streamWidth * (1 + i / segments * 0.2);
    ctx.lineTo(streamPoints[i].x + width / 2, streamPoints[i].y);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Add glossy highlight on stream
  const highlightGradient = ctx.createLinearGradient(
    streamPoints[0].x - streamWidth / 4, streamPoints[0].y,
    streamPoints[0].x + streamWidth / 4, streamPoints[0].y
  );
  highlightGradient.addColorStop(0, 'rgba(220, 180, 140, 0)');
  highlightGradient.addColorStop(0.5, 'rgba(220, 180, 140, 0.4)');
  highlightGradient.addColorStop(1, 'rgba(220, 180, 140, 0)');
  
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.moveTo(streamPoints[0].x - streamWidth / 6, streamPoints[0].y);
  for (let i = 0; i < streamPoints.length; i++) {
    const width = streamWidth / 3;
    ctx.lineTo(streamPoints[i].x - width / 2, streamPoints[i].y);
  }
  for (let i = streamPoints.length - 1; i >= 0; i--) {
    const width = streamWidth / 3;
    ctx.lineTo(streamPoints[i].x + width / 2, streamPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawMilkPouringStream() {
  if (!pouringMilk || gameState !== "MAKING_DRINK") return;

  // Mobile responsiveness
  const isMobile = canvas.width < 768;
  const scale = isMobile ? 0.5 : 1;
  const horizontalOffset = isMobile ? 60 : 100;
  const verticalOffset = isMobile ? 60 : 150;
  
  const milkPacketX = cupX + horizontalOffset;
  const milkPacketY = cupY - cupHeight / 2 - verticalOffset;
  const tiltAngle = Math.sin(Date.now() * 0.003) * 0.1 + 0.7; // Tilting animation
  
  // Calculate pour point from upper corner of tilted packet - adjust for scale
  // Upper right corner is at (30, -40) before rotation
  const cornerX = 30 * scale;
  const cornerY = -40 * scale;
  const openingX = milkPacketX + Math.cos(tiltAngle) * cornerX - Math.sin(tiltAngle) * cornerY;
  const openingY = milkPacketY + Math.sin(tiltAngle) * cornerX + Math.cos(tiltAngle) * cornerY;
  const pourTargetX = cupX;
  const pourTargetY = cupY - cupHeight / 2 + 10;
  const liquidLevelY = cupY + cupHeight / 2 - milkHeight;
  
  // Draw continuous viscous stream (waterfall effect)
  ctx.save();
  const baseStreamWidth = isMobile ? 10 : 16;
  const streamWidth = baseStreamWidth + Math.sin(Date.now() * 0.005) * 2; // Thick stream with slight pulsing
  const waveTime = Date.now() * 0.003;
  
  // Create gradient for depth
  const gradient = ctx.createLinearGradient(openingX, openingY, pourTargetX, liquidLevelY);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.75)');
  
  ctx.fillStyle = gradient;
  
  // Draw stream path with curves
  ctx.beginPath();
  const segments = 25;
  const streamPoints = [];
  
  // Calculate smooth stream path
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = openingX + (pourTargetX - openingX) * t;
    const y = openingY + (liquidLevelY - openingY) * t;
    
    // Add flowing wave motion
    const wave = Math.sin(t * Math.PI * 2 + waveTime + Math.PI) * 4 * (1 - t * 0.5);
    const curve = -t * t * 6; // Natural curve from trajectory
    
    streamPoints.push({ x: x + wave + curve, y: y });
  }
  
  // Draw left edge of stream
  ctx.moveTo(streamPoints[0].x - streamWidth / 2, streamPoints[0].y);
  for (let i = 0; i < streamPoints.length; i++) {
    const width = streamWidth * (1 + i / segments * 0.2); // Slightly widen as it falls
    ctx.lineTo(streamPoints[i].x - width / 2, streamPoints[i].y);
  }
  
  // Draw right edge of stream (reverse)
  for (let i = streamPoints.length - 1; i >= 0; i--) {
    const width = streamWidth * (1 + i / segments * 0.2);
    ctx.lineTo(streamPoints[i].x + width / 2, streamPoints[i].y);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Add glossy highlight on stream
  const highlightGradient = ctx.createLinearGradient(
    streamPoints[0].x - streamWidth / 4, streamPoints[0].y,
    streamPoints[0].x + streamWidth / 4, streamPoints[0].y
  );
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.moveTo(streamPoints[0].x - streamWidth / 6, streamPoints[0].y);
  for (let i = 0; i < streamPoints.length; i++) {
    const width = streamWidth / 3;
    ctx.lineTo(streamPoints[i].x - width / 2, streamPoints[i].y);
  }
  for (let i = streamPoints.length - 1; i >= 0; i--) {
    const width = streamWidth / 3;
    ctx.lineTo(streamPoints[i].x + width / 2, streamPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawLid() {

  if (!lidClosing) return;

  lidProgress += 0.05;

  ctx.fillStyle = "#6c5ce7";
  ctx.fillRect(
    cupX - cupWidth / 2,
    cupY - cupHeight / 2 - 30 + lidProgress * 30,
    cupWidth,
    20
  );

  if (lidProgress >= 1) {
    lidClosing = false;
    resetDrink();
  }
}

function drawStraw() {
  if (strawProgress === 0) return;

  const isMobile = canvas.width < 768;
  const strawWidth = isMobile ? 8 : 10;
  const strawColor = "#ff6b6b";
  const strawStripeColor = "#ffffff";
  
  // Straw insertion animation - drops from top
  const strawStartY = cupY - cupHeight / 2 - 100;
  const strawEndY = cupY + cupHeight / 2 - 20;
  const currentStrawY = strawStartY + (strawEndY - strawStartY) * Easing.easeOut(strawProgress);
  const strawHeight = currentStrawY - strawStartY;
  
  // Position straw slightly off-center for better visibility
  const strawX = cupX + 15;
  
  ctx.save();
  
  // Main straw body - vertical part
  ctx.fillStyle = strawColor;
  ctx.fillRect(strawX - strawWidth / 2, strawStartY, strawWidth, strawHeight);
  
  // Straw stripes (diagonal pattern)
  ctx.fillStyle = strawStripeColor;
  const stripeSpacing = 15;
  for (let i = 0; i < strawHeight / stripeSpacing; i++) {
    const stripeY = strawStartY + i * stripeSpacing;
    ctx.fillRect(strawX - strawWidth / 2, stripeY, strawWidth, 5);
  }
  
  // Bent part at top (appears when straw is 30% inserted)
  if (strawProgress > 0.3) {
    const bendProgress = Math.min((strawProgress - 0.3) / 0.7, 1);
    const bendWidth = 30 * bendProgress;
    const bendY = strawStartY;
    
    // Horizontal bent section
    ctx.fillStyle = strawColor;
    ctx.fillRect(strawX - strawWidth / 2, bendY - strawWidth, bendWidth, strawWidth);
    
    // Stripes on bent section
    ctx.fillStyle = strawStripeColor;
    for (let i = 0; i < bendWidth / 10; i++) {
      ctx.fillRect(strawX - strawWidth / 2 + i * 10, bendY - strawWidth, 4, strawWidth);
    }
  }
  
  // Straw outline for better visibility
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(strawX - strawWidth / 2, strawStartY, strawWidth, strawHeight);
  
  ctx.restore();
}

function drawMixingAnimation() {
  // Optimized mixing animation - less computationally intensive but still dramatic
  ctx.save();
  
  // Shake intensity that increases then decreases
  const shakeIntensity = Math.sin(mixProgress * Math.PI) * 15;
  const shakeX = Math.sin(mixProgress * Math.PI * 20) * shakeIntensity;
  const shakeY = Math.cos(mixProgress * Math.PI * 20) * shakeIntensity;
  
  // Apply shake to entire drawing
  ctx.translate(shakeX, shakeY);
  
  // Two layers of spinning swirls - reduced for performance
  const swirlLayers = 2;
  for (let layer = 0; layer < swirlLayers; layer++) {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (mixProgress * Math.PI * (10 + layer * 4)) + (i * Math.PI * 2 / particleCount) + (layer * Math.PI / 3);
      const radius = 30 + layer * 15 + Math.sin(mixProgress * Math.PI * 4 + i) * 12;
      const px = cupX + Math.cos(angle) * radius;
      const py = cupY + Math.sin(angle) * radius * 0.6;
      
      // Swirl particles with varying colors and sizes
      const size = 4 + Math.sin(mixProgress * Math.PI * 3 + i) * 2;
      const alpha = 0.6 * Math.sin(mixProgress * Math.PI);
      
      // Mix of white and tea-colored particles
      const colorMix = i % 3;
      if (colorMix === 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      } else if (colorMix === 1) {
        ctx.fillStyle = `rgba(181, 101, 29, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(200, 150, 100, ${alpha})`;
      }
      
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Bubbles shooting up - reduced for performance
  const bubbleCount = 10;
  for (let i = 0; i < bubbleCount; i++) {
    const bubbleProgress = (mixProgress * 3 + i * 0.1) % 1;
    const spiralAngle = bubbleProgress * Math.PI * 4 + i * 0.5;
    const spiralRadius = Math.sin(bubbleProgress * Math.PI) * 25;
    
    const bx = cupX + Math.cos(spiralAngle) * spiralRadius;
    const by = cupY + cupHeight / 2 - (bubbleProgress * cupHeight * 1.2);
    const bubbleSize = 3 + Math.sin(bubbleProgress * Math.PI) * 4;
    
    if (bubbleProgress < 1) {
      const bubbleAlpha = (0.6 * (1 - bubbleProgress)) * Math.sin(mixProgress * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${bubbleAlpha})`;
      ctx.beginPath();
      ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Sparkle effects - reduced for performance
  const sparkleCount = 12;
  for (let i = 0; i < sparkleCount; i++) {
    const sparkleAngle = (mixProgress * Math.PI * 10) + (i * Math.PI * 2 / sparkleCount);
    const sparkleRadius = 60 + Math.sin(mixProgress * Math.PI * 6 + i) * 20;
    const sx = cupX + Math.cos(sparkleAngle) * sparkleRadius;
    const sy = cupY + Math.sin(sparkleAngle) * sparkleRadius;
    
    const sparkleAlpha = 0.7 * Math.sin(mixProgress * Math.PI);
    const sparkleSize = 2 + Math.sin(mixProgress * Math.PI * 8 + i * 2) * 2;
    
    // Golden sparkles
    ctx.fillStyle = `rgba(255, 220, 100, ${sparkleAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Animated "MIXING!" text with shake
  const textShake = Math.sin(mixProgress * Math.PI * 20) * 6;
  const mixTextAlpha = 0.85 * Math.sin(mixProgress * Math.PI);
  const textScale = 1 + Math.sin(mixProgress * Math.PI * 6) * 0.15;
  
  ctx.save();
  ctx.translate(cupX + textShake, cupY - cupHeight / 2 - 50);
  ctx.scale(textScale, textScale);
  
  // Text shadow
  ctx.fillStyle = `rgba(0, 0, 0, ${mixTextAlpha * 0.3})`;
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✨ MIXING! ✨", 2, 2);
  
  // Main text - simplified to solid color
  ctx.fillStyle = `rgba(108, 92, 231, ${mixTextAlpha})`;
  ctx.fillText("✨ MIXING! ✨", 0, 0);
  
  ctx.restore();
  
  ctx.restore();
}

function drawAnimatedFox() {
  const isMobile = canvas.width < 768;
  const characterWidth = isMobile ? 170 : 230;
  const characterHeight = isMobile ? 130 : 180;
  const baseX = isMobile ? 100 : 150;
  const baseY = isMobile ? canvas.height - 60 : 280;
  
  // Apply idle offset and breathing
  const idleOffset = foxAnimator.getIdleOffset();
  const breatheScale = foxAnimator.getBreatheScale();
  const bounceOffset = -Math.abs(foxAnimator.bounceY);
  
  const x = baseX + idleOffset.x;
  const y = baseY + idleOffset.y + bounceOffset;

  ctx.save();
  ctx.translate(x, y);
  
  // Apply squash and stretch
  ctx.scale(
    foxAnimator.squashStretch.x * breatheScale,
    foxAnimator.squashStretch.y * breatheScale
  );
  
  ctx.translate(-x, -y);

  // Draw fox image if available, otherwise fallback to shapes
  if (foxImg.complete) {
    ctx.drawImage(foxImg, x - characterWidth/2, y - characterHeight/2, characterWidth, characterHeight);
    
    // Add expression overlays if needed
    if (foxAnimator.isBlinking()) {
      // Draw closed eyes over the image
      const eyeScale = isMobile ? 0.7 : 1;
      ctx.fillStyle = "rgba(255, 159, 67, 0.9)";
      ctx.fillRect(x - 20 * eyeScale, y - 10 * eyeScale, 15 * eyeScale, 4 * eyeScale);
      ctx.fillRect(x + 5 * eyeScale, y - 10 * eyeScale, 15 * eyeScale, 4 * eyeScale);
    }
    
    // Add sparkle for happy/excited
    if (foxAnimator.expression === 'happy' || foxAnimator.expression === 'excited') {
      const sparkleSize = isMobile ? 16 : 20;
      ctx.fillStyle = "white";
      ctx.font = `${sparkleSize}px sans-serif`;
      ctx.fillText("✨", x - 35, y - 15);
      ctx.fillText("✨", x + 25, y - 15);
    }
    
    // Add sad indicator
    if (foxAnimator.expression === 'sad') {
      const emojiSize = isMobile ? 16 : 20;
      ctx.fillStyle = "#95a5a6";
      ctx.font = `${emojiSize}px sans-serif`;
      ctx.fillText("😢", x + 25, y + 35);
    }
  } else {
    // Fallback: drawn fox
    // Face
    ctx.fillStyle = "#ff9f43";
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();

    // Ears with rotation
    const earRotation = foxAnimator.getEarRotation();
    
    ctx.save();
    ctx.translate(x - 30, y - 20);
    ctx.rotate(earRotation);
    ctx.translate(-(x - 30), -(y - 20));
    
    ctx.fillStyle = "#ff9f43";
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 20);
    ctx.lineTo(x - 50, y - 60);
    ctx.lineTo(x - 10, y - 40);
    ctx.fill();

    ctx.fillStyle = "#ffeaa7";
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 25);
    ctx.lineTo(x - 45, y - 55);
    ctx.lineTo(x - 15, y - 38);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x + 30, y - 20);
    ctx.rotate(-earRotation);
    ctx.translate(-(x + 30), -(y - 20));
    
    ctx.fillStyle = "#ff9f43";
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 20);
    ctx.lineTo(x + 50, y - 60);
    ctx.lineTo(x + 10, y - 40);
    ctx.fill();

    ctx.fillStyle = "#ffeaa7";
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 25);
    ctx.lineTo(x + 45, y - 55);
    ctx.lineTo(x + 15, y - 38);
    ctx.fill();
    ctx.restore();

    // Eyes with blink
    ctx.fillStyle = "black";
    if (foxAnimator.isBlinking()) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 5);
      ctx.lineTo(x - 8, y - 5);
      ctx.moveTo(x + 8, y - 5);
      ctx.lineTo(x + 16, y - 5);
      ctx.stroke();
    } else {
      const eyeSize = foxAnimator.expression === 'happy' ? 4 : 
                     foxAnimator.expression === 'excited' ? 6 : 5;
      ctx.beginPath();
      ctx.arc(x - 12, y - 5, eyeSize, 0, Math.PI * 2);
      ctx.arc(x + 12, y - 5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      if (foxAnimator.expression === 'happy' || foxAnimator.expression === 'excited') {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x - 10, y - 7, 2, 0, Math.PI * 2);
        ctx.arc(x + 14, y - 7, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (foxAnimator.expression === 'happy' || foxAnimator.expression === 'excited') {
      ctx.arc(x, y + 15, 12, 0.2, Math.PI - 0.2);
    } else if (foxAnimator.expression === 'sad') {
      ctx.arc(x, y + 25, 12, Math.PI + 0.2, Math.PI * 2 - 0.2);
    }
    ctx.stroke();
  }

  ctx.restore();

  // Effects
  if (comboStreak > 0) {
    const sparklePhase = Date.now() * 0.01;
    ctx.fillStyle = "#ffd700";
    ctx.font = "24px sans-serif";
    ctx.fillText("✨", x - 30 + Math.sin(sparklePhase) * 5, y - 80);
    ctx.fillText("✨", x + 20 + Math.cos(sparklePhase) * 5, y - 85);
  }
}

function drawButtons() {
  // Responsive button sizing
  const isMobile = canvas.width < 768;
  const buttonWidth = isMobile ? 100 : 120;
  const buttonHeight = isMobile ? 38 : 42;
  const buttonX = canvas.width - (isMobile ? 110 : 135);
  const startY = isMobile ? 30 : 40;
  const spacing = isMobile ? 45 : 50;
  const fontSize = isMobile ? 14 : 16;
  const smallFont = isMobile ? 9 : 10;
  const borderRadius = 8;

  ctx.textAlign = "center";

  // SERVE BUTTON - shows different state during straw insertion
  const isServing = insertingStraw || mixingDrink || (strawProgress > 0 && strawProgress < 1);
  ctx.fillStyle = isServing ? "#95a5a6" : "#6c5ce7";
  ctx.beginPath();
  ctx.roundRect(buttonX, startY, buttonWidth, buttonHeight, borderRadius);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold ${fontSize}px sans-serif`;
  const serveText = isServing ? "Serving..." : "Serve";
  ctx.fillText(serveText, buttonX + buttonWidth/2, startY + buttonHeight/2 + 5);

  // RESET BUTTON
  ctx.fillStyle = "#e17055";
  ctx.beginPath();
  ctx.roundRect(buttonX, startY + spacing, buttonWidth, buttonHeight, borderRadius);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.fillText("Reset", buttonX + buttonWidth/2, startY + spacing + buttonHeight/2 + 5);

  // TEA BUTTON (Hold to Pour)
  const teaActive = pouring;
  ctx.fillStyle = teaActive ? "#d63031" : "#ff7675";
  ctx.beginPath();
  ctx.roundRect(buttonX, startY + spacing * 2, buttonWidth, buttonHeight, borderRadius);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillText("🍵 Tea", buttonX + buttonWidth/2, startY + spacing * 2 + buttonHeight/2);
  if (!isMobile) {
    ctx.font = `${smallFont}px sans-serif`;
    ctx.fillText("Hold/Space", buttonX + buttonWidth/2, startY + spacing * 2 + buttonHeight/2 + 13);
  }

  // MILK BUTTON (Hold to Pour)
  const milkActive = pouringMilk;
  ctx.fillStyle = milkActive ? "#0984e3" : "#74b9ff";
  ctx.beginPath();
  ctx.roundRect(buttonX, startY + spacing * 3, buttonWidth, buttonHeight, borderRadius);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillText("🥛 Milk", buttonX + buttonWidth/2, startY + spacing * 3 + buttonHeight/2);
  if (!isMobile) {
    ctx.font = `${smallFont}px sans-serif`;
    ctx.fillText("Hold/M", buttonX + buttonWidth/2, startY + spacing * 3 + buttonHeight/2 + 13);
  }

  ctx.textAlign = "left"; // restore
}

function drawStats() {

  const bobaCount = countBobasInCup();
  const teaPercent = Math.floor(getTeaPercent());
  const milkPercent = Math.floor(getMilkPercent());

  // Responsive stats positioning
  const isMobile = canvas.width < 768;
  const statsFont = isMobile ? 14 : 18;
  const barWidth = isMobile ? 150 : 200;
  const barHeight = isMobile ? 16 : 20;
  const spacing = isMobile ? 40 : 50;
  
  ctx.font = `${statsFont}px sans-serif`;
  ctx.textAlign = "left";

  // Position stats to the left of the cup
  const statsX = isMobile ? 15 : cupX - cupWidth / 2 - 230;
  const statsY = isMobile ? canvas.height - 230 : cupY - cupHeight / 2 + 50;
  
  drawProgressBar(statsX, statsY, "Bobas", bobaCount, currentRecipe.bobas, 35, barWidth, barHeight);
  drawProgressBar(statsX, statsY + spacing, "Tea %", teaPercent, currentRecipe.teaPercent, 100, barWidth, barHeight);
  drawProgressBar(statsX, statsY + spacing * 2, "Milk %", milkPercent, currentRecipe.milkPercent, 100, barWidth, barHeight);
}

function drawProgressBar(x, y, label, value, target, max, width = 200, height = 20) {

  const diff = Math.abs(value - target);
  const exceeds = value > target; // Check if value exceeds the customer's requirement by any amount
  const isClose = value >= target - 5 && value <= target; // Within acceptable range (at or slightly below target)

  // Label
  ctx.fillStyle = "#2d3436";
  ctx.fillText(label + ": " + value + " / " + target, x, y - 6);

  // Background
  ctx.fillStyle = "#dfe6e9";
  ctx.fillRect(x, y, width, height);

  // Fill - Red when exceeds limit, Green when close, Orange/Yellow when below
  let barColor;
  if (exceeds) {
    barColor = "#e74c3c"; // Red when exceeding customer's requirement
  } else if (isClose) {
    barColor = "#2ecc71"; // Green when within target range
  } else {
    barColor = "#f39c12"; // Orange/Yellow when below target
  }
  ctx.fillStyle = barColor;

  const fillWidth = Math.min(value / max, 1) * width;
  ctx.fillRect(x, y, fillWidth, height);

  // Border
  ctx.strokeStyle = "#636e72";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);
}

function drawCustomer(x, y) {
  const isMobile = canvas.width < 768;
  const characterSize = isMobile ? 90 : 120;
  
  let imgToDraw;
  if (customerType === "cat") imgToDraw = catImg;
  else if (customerType === "dog") imgToDraw = dogImg;
  else if (customerType === "crab") imgToDraw = crabImg;
  else if (customerType === "snake") imgToDraw = snakeImg;
  else if (customerType === "pig") imgToDraw = pigImg;

  // Apply customer animator effects
  const idleOffset = customerAnimator.getIdleOffset();
  const breatheScale = customerAnimator.getBreatheScale();
  const bounceOffset = -Math.abs(customerAnimator.bounceY);
  
  const finalX = x + idleOffset.x;
  const finalY = y + idleOffset.y + bounceOffset;

  ctx.save();
  ctx.translate(finalX, finalY);
  ctx.scale(
    customerAnimator.squashStretch.x * breatheScale,
    customerAnimator.squashStretch.y * breatheScale
  );
  ctx.translate(-finalX, -finalY);

  if (imgToDraw && imgToDraw.complete) {
    // This centers the 2D image at the customer's position
    ctx.drawImage(imgToDraw, finalX - characterSize/2, finalY - characterSize/2, characterSize, characterSize);
  } else {
    // Fallback circle if image is missing
    ctx.fillStyle = "#fd79a8";
    ctx.beginPath();
    ctx.arc(finalX, finalY, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Add simple face
    ctx.fillStyle = "black";
    if (customerAnimator.isBlinking()) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(finalX - 15, finalY - 5);
      ctx.lineTo(finalX - 8, finalY - 5);
      ctx.moveTo(finalX + 8, finalY - 5);
      ctx.lineTo(finalX + 15, finalY - 5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(finalX - 10, finalY - 5, 3, 0, Math.PI * 2);
      ctx.arc(finalX + 10, finalY - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Smile or frown based on expression
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (customerAnimator.expression === 'happy') {
      ctx.arc(finalX, finalY + 10, 12, 0.2, Math.PI - 0.2);
    } else if (customerAnimator.expression === 'sad') {
      ctx.arc(finalX, finalY + 20, 12, Math.PI + 0.2, Math.PI * 2 - 0.2);
    }
    ctx.stroke();
  }
  
  ctx.restore();

  // Reaction effects
  if (customerAnimator.expression === 'happy' || customerAnimator.expression === 'excited') {
    const heartSize = isMobile ? 24 : 30;
    ctx.fillStyle = "#ff69b4";
    ctx.font = `${heartSize}px sans-serif`;
    const heartPhase = Date.now() * 0.005;
    ctx.fillText("💖", finalX - 40, finalY - 50 - Math.sin(heartPhase) * 10);
  } else if (customerAnimator.expression === 'sad') {
    const sadSize = isMobile ? 20 : 25;
    ctx.fillStyle = "#95a5a6";
    ctx.font = `${sadSize}px sans-serif`;
    ctx.fillText("😞", finalX + 30, finalY - 40);
  }
}

function drawGameEnd() {
  // Beautiful gradient background
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width
  );
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(0.5, '#fcb69f');
  gradient.addColorStop(1, '#ff9a9e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Falling papers animation
  const time = Date.now() * 0.001;
  for (let i = 0; i < 25; i++) {
    const fallSpeed = (i % 3 + 1) * 50;
    const x = (i * 60) % canvas.width + Math.sin(time * 2 + i) * 30;
    const y = ((time * fallSpeed + i * 100) % (canvas.height + 200)) - 100;
    const rotation = (time * 2 + i) % (Math.PI * 2);
    const paperSize = 15 + (i % 3) * 8;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Different paper colors
    const colors = ['#ffeaa7', '#fff', '#74b9ff', '#fd79a8', '#a29bfe', '#55efc4'];
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-paperSize/2, -paperSize/2, paperSize, paperSize * 1.4);
    
    // Paper outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-paperSize/2, -paperSize/2, paperSize, paperSize * 1.4);
    
    ctx.restore();
  }
  
  // Animated floating particles (background)
  for (let i = 0; i < 15; i++) {
    const x = (i * 100) + Math.sin(time + i) * 50;
    const y = 100 + Math.cos(time * 0.5 + i) * 80;
    const size = 20 + Math.sin(time * 2 + i) * 10;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Main title with glow - DARK COLOR
  ctx.shadowBlur = 30;
  ctx.shadowColor = 'rgba(44, 62, 80, 0.5)';
  ctx.fillStyle = "#2c3e50"; // Dark blue-gray
  
  // Responsive font sizes
  const isMobile = canvas.width < 768;
  const titleSize = isMobile ? 32 : 56;
  const subtitleSize = isMobile ? 20 : 28;
  const labelSize = isMobile ? 20 : 32;
  const textSize = isMobile ? 18 : 28;
  const perfSize = isMobile ? 16 : 24;
  const refreshSize = isMobile ? 14 : 20;
  
  ctx.font = `bold ${titleSize}px Arial`;
  ctx.textAlign = "center";
  const titlePulse = 1 + Math.sin(time * 2) * 0.05;
  ctx.save();
  ctx.translate(canvas.width / 2, isMobile ? 80 : 120);
  ctx.scale(titlePulse, titlePulse);
  ctx.fillText("🎉 Shop Closed! 🎉", 0, 0);
  ctx.restore();
  
  ctx.shadowBlur = 0;
  
  // Subtitle - DARK COLOR
  ctx.fillStyle = "#34495e"; // Dark gray
  ctx.font = `${subtitleSize}px Arial`;
  ctx.fillText("Ohh that is so heavy!", canvas.width / 2, isMobile ? 120 : 180);
  
  // Stats container
  const boxWidth = isMobile ? Math.min(canvas.width - 40, 400) : 500;
  const boxHeight = isMobile ? 280 : 350;
  const boxX = canvas.width / 2 - boxWidth / 2;
  const boxY = isMobile ? 150 : 230;
  
  // Stats box with gradient
  const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
  boxGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  boxGradient.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
  ctx.fillStyle = boxGradient;
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, isMobile ? 15 : 25);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Box border
  ctx.strokeStyle = "#ff9a9e";
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Stats content
  ctx.fillStyle = "#2c3e50";
  ctx.textAlign = "center";
  
  // Customers served
  ctx.font = `bold ${labelSize}px Arial`;
  ctx.fillText("Yes, We did it!", canvas.width / 2, boxY + (isMobile ? 40 : 60));
  
  ctx.font = `${textSize}px Arial`;
  ctx.fillText(`Customers Served: ${customersServed}/${MAX_CUSTOMERS}`, canvas.width / 2, boxY + (isMobile ? 80 : 120));
  
  // Divider line
  ctx.strokeStyle = "#dfe6e9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(boxX + 30, boxY + (isMobile ? 95 : 145));
  ctx.lineTo(boxX + boxWidth - 30, boxY + (isMobile ? 95 : 145));
  ctx.stroke();
  
  // Total score with icon
  ctx.font = `bold ${labelSize}px Arial`;
  ctx.fillStyle = "#6c5ce7";
  ctx.fillText(`⭐ Total Score: ${totalScore}`, canvas.width / 2, boxY + (isMobile ? 135 : 200));
  
  // Total money with icon
  ctx.fillStyle = "#27ae60";
  ctx.fillText(`💰 Total Earned: $${money}`, canvas.width / 2, boxY + (isMobile ? 175 : 260));
  
  // Performance message
  ctx.font = `${perfSize}px Arial`;
  ctx.fillStyle = "#e17055";
  let performanceMsg = "";
  if (totalScore >= 450) {
    performanceMsg = isMobile ? "🏆 Master Chef!" : "🏆 Outstanding Performance! Master Chef!";
  } else if (totalScore >= 350) {
    performanceMsg = isMobile ? "🌟 Top Barista!" : "🌟 Excellent Work! Top Barista!";
  } else if (totalScore >= 250) {
    performanceMsg = isMobile ? "👍 Keep Improving!" : "👍 Good Job! Keep Improving!";
  } else if (totalScore >= 150) {
    performanceMsg = isMobile ? "😊 Practice More!" : "😊 Nice Try! Practice Makes Perfect!";
  } else {
    performanceMsg = isMobile ? "💪 Keep Practicing!" : "💪 Keep Practicing! You'll Get Better!";
  }
  ctx.fillText(performanceMsg, canvas.width / 2, boxY + (isMobile ? 220 : 315));
  
  // Restart instruction
  ctx.font = `${refreshSize}px Arial`;
  ctx.fillStyle = "#636e72";
  const refreshPulse = 0.8 + Math.sin(time * 3) * 0.2;
  ctx.globalAlpha = refreshPulse;
  ctx.fillText(isMobile ? "Refresh to play again" : "Press F5 to play again", canvas.width / 2, canvas.height - (isMobile ? 30 : 40));
  ctx.globalAlpha = 1;
  
  ctx.textAlign = "left";
}


