// ============================================================
// STAR SYSTEM - Canvas-based star and planet rendering
// Purpose: Realistic night sky with twinkling stars and planets
// Lines: 1-300
// ============================================================

import { CONFIG } from "./config.js";
import { getStarCount, easeInOutSine, safeQuerySelector } from "./utils.js";

// ============================================================
// STATE MANAGEMENT
// Lines: 10-25
// ============================================================

// Canvas and rendering state
let starCanvas = null;
let starCtx = null;
let stars = [];
let planets = [];
let animationFrameId = null;
let isPageVisible = !document.hidden;
const startTime = performance.now();

// ============================================================
// STAR GENERATION
// Lines: 26-150
// ============================================================

/**
 * Select spectral class color based on realistic distribution
 * @returns {string} RGBA color string (incomplete, opacity added at render)
 */
function getSpectralColor() {
  const rand = Math.random();
  let cumulative = 0;
  for (const spectralClass of CONFIG.stars.spectralClasses) {
    cumulative += spectralClass.percentage;
    if (rand <= cumulative) {
      return spectralClass.color;
    }
  }
  return CONFIG.stars.spectralClasses[2].color; // Default to F-G
}

/**
 * Generate star data array with realistic distribution
 * @param {number} canvasWidth - Canvas width in logical pixels
 * @param {number} canvasHeight - Canvas height in logical pixels
 * @returns {void} - Updates global stars and planets arrays
 */
export function generateStars(canvasWidth, canvasHeight) {
  // Validate canvas dimensions
  if (!canvasWidth || !canvasHeight || canvasWidth <= 0 || canvasHeight <= 0) {
    console.warn(
      `Invalid canvas dimensions for star generation: ${canvasWidth}x${canvasHeight}`,
    );
    stars = [];
    return;
  }

  const numStars = getStarCount();
  stars = [];

  for (let i = 0; i < numStars; i++) {
    // Random position with bias toward top half (visible area)
    const x = Math.random() * canvasWidth;
    // Math.pow(random, 1.5) biases toward 0, concentrating stars at top
    // where they're more visible (bottom half is partially below horizon)
    const y = Math.pow(Math.random(), 1.5) * canvasHeight;

    // Varied sizes
    const size =
      CONFIG.stars.minSize +
      Math.random() * (CONFIG.stars.maxSize - CONFIG.stars.minSize);

    // Assign spectral color
    const color = getSpectralColor();

    // Make some stars static (non-twinkling)
    const isStatic = Math.random() < CONFIG.stars.staticPercentage;

    if (isStatic) {
      stars.push({
        x,
        y,
        size,
        color,
        isStatic: true,
        opacity:
          CONFIG.stars.staticOpacityMin +
          Math.random() *
            (CONFIG.stars.staticOpacityMax - CONFIG.stars.staticOpacityMin),
      });
    } else {
      stars.push({
        x,
        y,
        size,
        color,
        isStatic: false,
        twinkleDelay: Math.random() * CONFIG.stars.animationDelayMax * 1000,
        twinkleDuration:
          (CONFIG.stars.animationDurationMin +
            Math.random() *
              (CONFIG.stars.animationDurationMax -
                CONFIG.stars.animationDurationMin)) *
          1000,
      });
    }

    // Generate binary companion star (2.5% chance)
    // Binary pairs are positioned near each other in random direction
    if (Math.random() < CONFIG.stars.binaryPercentage) {
      const angle = Math.random() * Math.PI * 2; // Random direction
      const separation =
        CONFIG.stars.binarySeparationMin +
        Math.random() *
          (CONFIG.stars.binarySeparationMax - CONFIG.stars.binarySeparationMin);
      const companionX = x + Math.cos(angle) * separation;
      const companionY = y + Math.sin(angle) * separation;
      // Companion is typically smaller than primary (60-90%)
      const companionSize = size * (0.6 + Math.random() * 0.3);

      if (isStatic) {
        stars.push({
          x: companionX,
          y: companionY,
          size: companionSize,
          color,
          isStatic: true,
          opacity:
            CONFIG.stars.staticOpacityMin +
            Math.random() *
              (CONFIG.stars.staticOpacityMax - CONFIG.stars.staticOpacityMin),
        });
      } else {
        stars.push({
          x: companionX,
          y: companionY,
          size: companionSize,
          color,
          isStatic: false,
          twinkleDelay: Math.random() * CONFIG.stars.animationDelayMax * 1000,
          twinkleDuration:
            (CONFIG.stars.animationDurationMin +
              Math.random() *
                (CONFIG.stars.animationDurationMax -
                  CONFIG.stars.animationDurationMin)) *
            1000,
        });
      }
    }
  }

  // Generate planets (static bright objects)
  // Planets don't twinkle and are brighter than stars
  planets = [];
  CONFIG.planets.forEach((planet, index) => {
    // Position planets at aesthetically pleasing locations
    // Evenly spaced horizontally with vertical randomness
    // Formula: divide canvas into (n+1) sections, place in section centers
    const baseX = (canvasWidth / (CONFIG.planets.length + 1)) * (index + 1);
    const baseY = canvasHeight * (0.2 + Math.random() * 0.4); // Top 60% of sky
    // Add 15% random offset for natural appearance
    const offsetX = (Math.random() - 0.5) * canvasWidth * 0.15;
    const offsetY = (Math.random() - 0.5) * canvasHeight * 0.15;

    planets.push({
      x: baseX + offsetX,
      y: baseY + offsetY,
      size: planet.size,
      color: planet.color,
      opacity: planet.opacity,
      name: planet.name,
    });
  });
}

// ============================================================
// RENDERING
// Lines: 151-250
// ============================================================

/**
 * Calculate current opacity for twinkling star
 * @param {Object} star - Star object with twinkle properties
 * @param {number} currentTime - Current performance timestamp
 * @returns {number} Opacity value between 0 and 1
 */
function getTwinkleOpacity(star, currentTime) {
  const elapsed = currentTime - startTime - star.twinkleDelay;
  if (elapsed < 0) return CONFIG.stars.twinkleOpacityMin;

  const cyclePosition = (elapsed % star.twinkleDuration) / star.twinkleDuration;
  const easedPosition = easeInOutSine(cyclePosition);

  return (
    CONFIG.stars.twinkleOpacityMin +
    easedPosition *
      (CONFIG.stars.twinkleOpacityMax - CONFIG.stars.twinkleOpacityMin)
  );
}

/**
 * Render all stars and planets on canvas (60fps loop)
 * @returns {void}
 */
export function renderStars() {
  if (!starCtx || !starCanvas || !isPageVisible) {
    // Cancel any pending animation frame on early return
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    return;
  }

  try {
    const currentTime = performance.now();
    const canvasWidth = starCanvas.width / window.devicePixelRatio;
    const canvasHeight = starCanvas.height / window.devicePixelRatio;

    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);

    // Render stars with spectral colors
    stars.forEach((star) => {
      const opacity = star.isStatic
        ? star.opacity
        : getTwinkleOpacity(star, currentTime);

      starCtx.fillStyle = `${star.color} ${opacity})`;
      starCtx.beginPath();
      starCtx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
      starCtx.fill();
    });

    // Render planets (bright, non-twinkling)
    planets.forEach((planet) => {
      starCtx.fillStyle = `${planet.color} ${planet.opacity})`;
      starCtx.beginPath();
      starCtx.arc(planet.x, planet.y, planet.size / 2, 0, Math.PI * 2);
      starCtx.fill();
    });

    if (isPageVisible) {
      animationFrameId = requestAnimationFrame(renderStars);
    }
  } catch (error) {
    console.error("Error in renderStars:", error);
    // Cancel animation loop on error to prevent infinite error spam
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
}

// ============================================================
// INITIALIZATION
// Lines: 251-300
// ============================================================

/**
 * Initialize canvas and start star rendering
 * @returns {void}
 */
export function initializeStars() {
  try {
    starCanvas = safeQuerySelector(
      "#starCanvas",
      "Star canvas element not found",
    );
    starCtx = starCanvas.getContext(CONFIG.canvas.contextType);

    if (!starCtx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas size with device pixel ratio for sharp rendering on retina
    // We scale the canvas buffer (width/height) by DPR, then scale context back
    // This gives us more pixels to work with without changing coordinate system
    const nightSky = safeQuerySelector(
      "#nightSky",
      "Night sky element not found",
    );
    const rect = nightSky.getBoundingClientRect();

    if (CONFIG.canvas.devicePixelRatioEnabled) {
      starCanvas.width = rect.width * window.devicePixelRatio;
      starCanvas.height = rect.height * window.devicePixelRatio;
      // Scale context so we can use logical pixels in drawing code
      starCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    } else {
      starCanvas.width = rect.width;
      starCanvas.height = rect.height;
    }

    generateStars(rect.width, rect.height);
    renderStars();
  } catch (error) {
    console.error("Failed to initialize stars:", error);
  }
}

// ============================================================
// STATE ACCESSORS
// Lines: 301-320
// ============================================================

/**
 * Update page visibility state (for pause/resume)
 * @param {boolean} visible - Is page currently visible
 * @returns {void}
 */
export function setPageVisible(visible) {
  isPageVisible = visible;
  if (!visible && animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  } else if (visible && !animationFrameId) {
    renderStars();
  }
}

/**
 * Get current canvas and context for external updates (e.g., resize)
 * @returns {{canvas: HTMLCanvasElement|null, ctx: CanvasRenderingContext2D|null}}
 */
export function getCanvasState() {
  return { canvas: starCanvas, ctx: starCtx };
}
