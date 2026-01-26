// PANIC + MISCHIEF p5.js PLATFORMER BLOB
// Emotion: Panic (twitchy movement, stronger falling, jitter, wind zones)
// Bonus: Mischief objects you can bump/steal on a small map (press E to steal)

// ---------------------- Globals ----------------------
// Simple mood + snack objects version (based on your original structure)
//
// Mood rules:
// - Happy when jumping (rising, vy < 0)
// - Angry when falling off a platform (was onGround, now not onGround and vy > 0)
// - Calm otherwise
//
// Mischief/snacks:
// - Small objects ("snacks") placed around the map
// - When blob touches a snack, it "eats" it (snack disappears + counter++)

let floorY3;
let restartBtn3;

// Player blob
let blob3 = {
  x: 80,
  y: 0,

  r: 26,
  points: 100,
  wobble: 7,
  wobbleFreq: 0.9,

  t: 0,
  tSpeed: 0.01,

  vx: 0,
  vy: 0,

  accel: 0.55,
  maxRun: 4.0,
  gravity: 0.65,
  jumpV: -15.0,

  onGround: false,

  frictionAir: 0.995,

  frictionGround: 0.88,

  // Mood visuals (blended)
  mood: { color: [20, 120, 255] },
};

let platforms = [];

// --- Mood system ---
let mood3 = "calm";
const moodLerp = 0.12;

const MOODS = {
  calm:  { wobble: 6,  wobbleFreq: 0.85, tSpeed: 0.010, color: [20, 120, 255] },
  happy: { wobble: 12,  wobbleFreq: 1.20, tSpeed: 0.015, color: [60, 200, 120] },
  angry: { wobble: 20, wobbleFreq: 1.60, tSpeed: 0.020, color: [240, 80, 60] },
};

let wasOnGround3 = false;

// --- Snacks ---
let snacks3 = [];
let eatenCount3 = 0;

function setup() {
  createCanvas(640, 480);

  floorY3 = height - 36;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  platforms = [
  { x: 0, y: floorY3, w: width, h: height - floorY3 }, // floor

  // Tall, spaced vertical platforms
  { x: 100, y: floorY3 - 100, w: 140, h: 12 },   // low
  { x: 260, y: floorY3 - 200, w: 110, h: 12 },   // mid
  { x: 420, y: floorY3 - 320, w: 100, h: 12 },   // high
  { x: 560, y: floorY3 - 160, w: 70,  h: 12 },   // side ledge
];


  blob3.y = floorY3 - blob3.r - 1;

  // Place snacks (simple circles) above platforms + around the map
  snacks3 = [
  { x: 170, y: floorY3 - 120, r: 7, alive: true },
  { x: 310, y: floorY3 - 220, r: 7, alive: true },
  { x: 460, y: floorY3 - 340, r: 7, alive: true },
  { x: 585, y: floorY3 - 180, r: 7, alive: true },
  { x: 70,  y: floorY3 - 10,  r: 7, alive: true },
  { x: 250, y: floorY3 - 10,  r: 7, alive: true },
  { x: 390, y: floorY3 - 10,  r: 7, alive: true },
];

  restartBtn3 = createButton("Restart");
restartBtn3.position(10, height + 10);
restartBtn3.mousePressed(restartGame3);
}

function draw() {
if (mood3 === "happy") background(220, 255, 230);
else if (mood3 === "angry") background(255, 220, 220);
else background(230, 240, 255); // calm


  // Draw platforms
  fill(200);
  for (const p of platforms) rect(p.x, p.y, p.w, p.h);

  // Draw snacks
  drawSnacks3();

  // Input: left/right
  let move = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1;
  blob3.vx += blob3.accel * move;

  // Friction and clamp
  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);

  // Gravity
  blob3.vy += blob3.gravity;

  // Collision box (AABB)
  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // Step 1: Horizontal collisions
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx > 0) box.x = s.x - box.w;
      else if (blob3.vx < 0) box.x = s.x + s.w;
      blob3.vx = 0;
    }
  }

  // Step 2: Vertical collisions
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        box.y = s.y - box.h;
        blob3.vy = 0;
        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        box.y = s.y + s.h;
        blob3.vy = 0;
      }
    }
  }

  // Convert back to center
  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  // --- Mood update (simple) ---
  // Happy when jumping (moving up)
  // Angry only when "falling off" (was grounded, now not grounded and falling)
  const fellOff = wasOnGround3 && !blob3.onGround && blob3.vy > 0.4;

  if (blob3.vy < -0.2) setMood3("happy");
  else if (fellOff && blob3.vy > 2.0) setMood3("angry");
  else setMood3("calm");

  wasOnGround3 = blob3.onGround;

  // Blend mood visuals into blob parameters
  applyMood3(blob3);

  // Eat snacks (after final position is known)
  eatSnacks3();

  // Draw blob
  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3);

  // HUD
  fill(0);
  text("Move: A/D or ←/→  •  Jump: Space/W/↑", 13, 18);
  text(`Mood: ${mood3}  •  Snacks eaten: ${eatenCount3}`, 10, 36);
}

// --- Snacks helpers ---
function drawSnacks3() {
  fill(60, 60, 60, 170);
  for (const s of snacks3) {
    if (!s.alive) continue;
    circle(s.x, s.y, s.r * 2);
  }
}

function eatSnacks3() {
  for (const s of snacks3) {
    if (!s.alive) continue;

    const dx = s.x - blob3.x;
    const dy = s.y - blob3.y;
    const d = sqrt(dx * dx + dy * dy);

    if (d < s.r + blob3.r) {
      s.alive = false;
      eatenCount3 += 1;
    }
  }
}

// --- Mood helpers ---
function setMood3(name) {
  mood3 = MOODS[name] ? name : "calm";
}

function applyMood3(b) {
  const m = MOODS[mood3];

  b.wobble = lerp(b.wobble, m.wobble, moodLerp);
  b.wobbleFreq = lerp(b.wobbleFreq, m.wobbleFreq, moodLerp);
  b.tSpeed = lerp(b.tSpeed, m.tSpeed, moodLerp);

  b.mood.color[0] = lerp(b.mood.color[0], m.color[0], moodLerp);
  b.mood.color[1] = lerp(b.mood.color[1], m.color[1], moodLerp);
  b.mood.color[2] = lerp(b.mood.color[2], m.color[2], moodLerp);
}

// AABB overlap
function overlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Draw blob with Perlin noise edge
function drawBlobCircle(b) {
  fill(b.mood.color[0], b.mood.color[1], b.mood.color[2]);
  beginShape();

  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;

    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t
    );

    const rr = b.r + map(n, 0, 1, -b.wobble, b.wobble);
    vertex(b.x + cos(a) * rr, b.y + sin(a) * rr);
  }

  endShape(CLOSE);
}
function restartGame3() {
  // Reset blob
  blob3.x = 80;
  blob3.y = floorY3 - blob3.r - 1;
  blob3.vx = 0;
  blob3.vy = 0;
  blob3.onGround = false;

  // Reset mood
  mood3 = "calm";
  blob3.mood.color = [20, 120, 255];

  // Reset snacks
  for (const s of snacks3) {
    s.alive = true;
  }

  eatenCount3 = 0;
  wasOnGround3 = false;
}


// Jump input
function keyPressed() {
  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob3.onGround
  ) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
  }
}
