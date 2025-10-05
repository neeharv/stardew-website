/**
 * @fileoverview Meteor system module - DOM-based meteor trails with CSS animations
 * @module meteors
 * @exports {initializeMeteorSystem, generateMeteorKeyframes, updateHeroDiagonal, startMeteors, stopMeteors, restartMeteors, setMeteorPageVisible}
 * @imports {CONFIG} from config.js
 * @imports {safeQuerySelector} from utils.js
 * @description Manages shooting star effects using DOM elements with GPU-accelerated CSS animations.
 *   Features two parallel systems: continuous random meteors and periodic meteor showers.
 *   Dynamically generates CSS @keyframes based on viewport dimensions for responsive behavior.
 * @performance GPU-accelerated CSS transforms, dynamic keyframe generation, timeout tracking for cleanup
 */

// ============================================================
// METEOR SYSTEM - DOM-based meteor trails with CSS animations
// Purpose: Random meteors and periodic showers with dynamic keyframes
// Lines: 1-434
// ============================================================

import { CONFIG } from "./config.js";
import { safeQuerySelector } from "./utils.js";

// ============================================================
// STATE MANAGEMENT
// Lines: 22-46
// ============================================================

// DOM elements
let meteorsContainer = null;
let heroElement = null;
let heroDiagonal = 0;

// Shower state
let isShowerActive = false;
let isPageVisible = !document.hidden;

// Preset angles for consistent meteor trajectories (degrees, CSS rotation)
// Range: 130-165° = diagonal movement from top-right to bottom-left
const METEOR_ANGLES = [130, 135, 140, 145, 150, 155, 160, 165];

// Distance tiers create depth by varying travel distance
const DISTANCE_TIERS = ["short", "med", "long"];

// Meteor timeout tracking for pause/resume
let activeMeteorTimeouts = [];
let activeShowerTimeouts = [];

// ============================================================
// INITIALIZATION
// Lines: 47-76
// ============================================================

/**
 * Initialize meteor system DOM references and cache hero dimensions
 * @returns {boolean} True if initialization successful
 */
export function initializeMeteorSystem() {
  try {
    meteorsContainer = safeQuerySelector(
      "#meteorsContainer",
      "Meteors container not found",
    );
    heroElement = safeQuerySelector(".hero", "Hero element not found");

    // Cache hero dimensions
    const heroRect = heroElement.getBoundingClientRect();
    const heroWidth = heroRect.width;
    const heroHeight = heroRect.height;
    heroDiagonal = Math.sqrt(heroWidth ** 2 + heroHeight ** 2);

    return true;
  } catch (error) {
    console.error("Failed to initialize meteor system:", error);
    return false;
  }
}

// ============================================================
// KEYFRAME GENERATION
// Lines: 77-164
// ============================================================

/**
 * Generate CSS @keyframes dynamically based on viewport size
 *
 * Why dynamic? Meteor travel distance depends on viewport diagonal,
 * which varies with window size. We generate keyframes for each
 * angle × distance combination (8 angles × 3 distances = 24 keyframes).
 *
 * This approach uses GPU-accelerated CSS animations instead of JS,
 * while still being responsive to window size.
 *
 * @returns {void}
 */
export function generateMeteorKeyframes() {
  try {
    if (!heroDiagonal) {
      console.warn("heroDiagonal not initialized");
      return;
    }

    // Three distance tiers for visual depth (±25px from diagonal)
    const distances = {
      short: heroDiagonal - 25,
      med: heroDiagonal,
      long: heroDiagonal + 25,
    };

    let keyframesCSS = "";

    METEOR_ANGLES.forEach((angle) => {
      const radians = (angle * Math.PI) / 180;

      DISTANCE_TIERS.forEach((tier) => {
        const distance = distances[tier];
        const endX = Math.cos(radians) * distance;
        const endY = Math.sin(radians) * distance;

        keyframesCSS += `
          @keyframes meteor-${angle}-${tier} {
            0% {
              opacity: 0;
              transform: translate3d(0, 0, 0) rotate(${angle}deg);
            }
            5% {
              opacity: 1;
            }
            95% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translate3d(${endX}px, ${endY}px, 0) rotate(${angle}deg);
            }
          }
        `;
      });
    });

    // Remove old keyframes if they exist
    const oldStyle = document.getElementById("meteor-keyframes");
    if (oldStyle) oldStyle.remove();

    // Add new keyframes
    const style = document.createElement("style");
    style.id = "meteor-keyframes";
    style.textContent = keyframesCSS;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Failed to generate meteor keyframes:", error);
  }
}

/**
 * Update hero diagonal (called on resize)
 * @returns {void}
 */
export function updateHeroDiagonal() {
  if (!heroElement) return;
  const heroRect = heroElement.getBoundingClientRect();
  const heroWidth = heroRect.width;
  const heroHeight = heroRect.height;
  heroDiagonal = Math.sqrt(heroWidth ** 2 + heroHeight ** 2);
}

// ============================================================
// METEOR CREATION
// Lines: 165-284
// ============================================================

/**
 * Calculate random start position for meteor
 * @returns {{x: number, y: number}} Start position in percentage
 */
function calculateMeteorStartPosition() {
  const startX =
    CONFIG.meteors.startXMax -
    Math.random() * (CONFIG.meteors.startXMax - CONFIG.meteors.startXMin);
  let startY;
  if (startX < 100) {
    startY =
      CONFIG.meteors.startYMin.whenXInBounds +
      Math.random() *
        (CONFIG.meteors.startYMax - CONFIG.meteors.startYMin.whenXInBounds);
  } else {
    startY =
      CONFIG.meteors.startYMin.whenXOutOfBounds +
      Math.random() *
        (CONFIG.meteors.startYMax - CONFIG.meteors.startYMin.whenXOutOfBounds);
  }
  return { x: startX, y: startY };
}

/**
 * Select meteor angle from preset pool
 * @param {number|null} baseAngle - Base angle for shower (null for random)
 * @returns {number} Selected angle in degrees
 */
function selectMeteorAngle(baseAngle = null) {
  if (baseAngle !== null) {
    // For meteor showers, find closest preset angle to baseAngle
    return METEOR_ANGLES.reduce((prev, curr) =>
      Math.abs(curr - baseAngle) < Math.abs(prev - baseAngle) ? curr : prev,
    );
  } else {
    // Random angle from preset pool
    return METEOR_ANGLES[Math.floor(Math.random() * METEOR_ANGLES.length)];
  }
}

/**
 * Create meteor DOM elements (head + tail)
 * @returns {HTMLDivElement} Meteor container element
 */
function createMeteorElements() {
  const meteor = document.createElement("div");
  meteor.className = "meteor";

  const head = document.createElement("div");
  head.className = "meteor-head";
  const tail = document.createElement("div");
  tail.className = "meteor-tail";
  meteor.appendChild(head);
  meteor.appendChild(tail);

  return meteor;
}

/**
 * Select animation name based on angle and random distance tier
 * @param {number} angle - Meteor angle in degrees
 * @returns {string} CSS animation name
 */
function selectMeteorAnimation(angle) {
  const distanceTier =
    DISTANCE_TIERS[Math.floor(Math.random() * DISTANCE_TIERS.length)];
  return `meteor-${angle}-${distanceTier}`;
}

/**
 * Create and animate a single meteor
 * @param {number|null} baseAngle - Base angle for shower (null for random)
 * @returns {void}
 */
function createMeteor(baseAngle = null) {
  try {
    if (!meteorsContainer || !heroDiagonal) {
      console.warn("Meteor system not properly initialized");
      return;
    }

    const meteor = createMeteorElements();
    const startPos = calculateMeteorStartPosition();

    meteor.style.left = startPos.x + "%";
    meteor.style.top = startPos.y + "%";

    const angle = selectMeteorAngle(baseAngle);
    const animationName = selectMeteorAnimation(angle);

    const duration =
      CONFIG.meteors.durationMin +
      Math.random() * (CONFIG.meteors.durationMax - CONFIG.meteors.durationMin);
    meteor.style.animation = `${animationName} ${duration}s linear forwards`;

    meteorsContainer.appendChild(meteor);

    // Track cleanup timeout so it can be cleared when page is hidden
    const cleanupTimeoutId = setTimeout(() => {
      try {
        // Only cleanup if page is still visible
        // If hidden, meteors will be cleaned up on visibility change
        if (isPageVisible && meteor.parentNode) {
          meteor.remove();
        }
      } catch (cleanupError) {
        console.warn("Error during meteor cleanup:", cleanupError);
      }
    }, duration * 1000);
    activeMeteorTimeouts.push(cleanupTimeoutId);
  } catch (error) {
    console.error("Error creating meteor:", error);
  }
}

// ============================================================
// SHOWER SYSTEM
// Lines: 285-346
// ============================================================

/**
 * Trigger a meteor shower with multiple meteors at similar angles
 * @returns {void}
 */
function triggerMeteorShower() {
  if (isShowerActive || !isPageVisible) return;

  isShowerActive = true;
  const showerAngle =
    CONFIG.meteors.angleMin +
    Math.random() * (CONFIG.meteors.angleMax - CONFIG.meteors.angleMin);
  const numMeteors =
    CONFIG.meteors.showerCountMin +
    Math.floor(
      Math.random() *
        (CONFIG.meteors.showerCountMax - CONFIG.meteors.showerCountMin + 1),
    );

  for (let i = 0; i < numMeteors; i++) {
    const timeoutId = setTimeout(
      () => {
        if (isPageVisible) createMeteor(showerAngle);
      },
      i *
        (CONFIG.meteors.showerIntervalMin +
          Math.random() *
            (CONFIG.meteors.showerIntervalMax -
              CONFIG.meteors.showerIntervalMin)),
    );
    activeShowerTimeouts.push(timeoutId);
  }

  const cleanupTimeoutId = setTimeout(
    () => {
      isShowerActive = false;
      scheduleNextShower();
    },
    numMeteors * CONFIG.meteors.showerCleanupDelayPerMeteor +
      CONFIG.meteors.showerCleanupDelayBase,
  );
  activeShowerTimeouts.push(cleanupTimeoutId);
}

/**
 * Schedule the next meteor shower
 * @returns {void}
 */
function scheduleNextShower() {
  if (!isPageVisible) return;
  const nextShowerIn =
    CONFIG.meteors.nextShowerMin +
    Math.random() *
      (CONFIG.meteors.nextShowerMax - CONFIG.meteors.nextShowerMin);
  const timeoutId = setTimeout(triggerMeteorShower, nextShowerIn);
  activeShowerTimeouts.push(timeoutId);
}

// ============================================================
// SINGLE METEOR SYSTEM
// Lines: 347-367
// ============================================================

/**
 * Create single random meteor and schedule next one
 * @returns {void}
 */
function createSingleMeteor() {
  if (!isPageVisible) return;
  createMeteor();
  const nextMeteorIn =
    CONFIG.meteors.singleMeteorIntervalMin +
    Math.random() *
      (CONFIG.meteors.singleMeteorIntervalMax -
        CONFIG.meteors.singleMeteorIntervalMin);
  const timeoutId = setTimeout(createSingleMeteor, nextMeteorIn);
  activeMeteorTimeouts.push(timeoutId);
}

// ============================================================
// PUBLIC CONTROL FUNCTIONS
// Lines: 368-434
// ============================================================

/**
 * Start meteor animation system (single meteors + showers)
 * @returns {void}
 */
export function startMeteors() {
  // Start scattered single meteors
  for (let i = 0; i < CONFIG.meteors.singleMeteorStreamCount; i++) {
    setTimeout(
      createSingleMeteor,
      Math.random() * CONFIG.meteors.initialMeteorDelayMax,
    );
  }

  // Start first meteor shower
  setTimeout(
    triggerMeteorShower,
    CONFIG.meteors.initialShowerDelayMin +
      Math.random() *
        (CONFIG.meteors.initialShowerDelayMax -
          CONFIG.meteors.initialShowerDelayMin),
  );
}

/**
 * Stop all meteor timers and clean up DOM
 * @returns {void}
 */
export function stopMeteors() {
  // Clear all pending timeouts
  activeMeteorTimeouts.forEach(clearTimeout);
  activeShowerTimeouts.forEach(clearTimeout);
  activeMeteorTimeouts = [];
  activeShowerTimeouts = [];

  // Reset shower state
  isShowerActive = false;

  // Clean up meteor DOM elements
  if (meteorsContainer) {
    const oldMeteors = meteorsContainer.querySelectorAll(".meteor");
    oldMeteors.forEach((meteor) => meteor.remove());
  }
}

/**
 * Set page visibility state (for tab visibility handling)
 * @param {boolean} visible - Is page currently visible
 * @returns {void}
 */
export function setMeteorPageVisible(visible) {
  isPageVisible = visible;
}

/**
 * Restart meteor system after being stopped
 * @returns {void}
 */
export function restartMeteors() {
  isShowerActive = false;
  stopMeteors(); // Clean up any existing state
  startMeteors(); // Start fresh
}
