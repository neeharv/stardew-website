/**
 * @fileoverview Main orchestration module - Application initialization and event handling
 * @module main
 * @exports None (entry point)
 * @imports {CONFIG} from config.js
 * @imports {initializeNightSkySize, isLowEndDevice, getStarCount, pauseAnimations, resumeAnimations, safeQuerySelector} from utils.js
 * @imports {initializeStars, generateStars, setPageVisible as setStarPageVisible, getCanvasState} from stars.js
 * @imports {initializeMeteorSystem, generateMeteorKeyframes, updateHeroDiagonal, startMeteors, stopMeteors, restartMeteors, setMeteorPageVisible} from meteors.js
 * @description Entry point that initializes all animation systems and coordinates global events.
 *   Handles application lifecycle, resize events, and visibility changes for pause/resume.
 *   Loaded by index.html as ES6 module: <script type="module" src="/js/main.js">
 */

// ============================================================
// MAIN - Application initialization and orchestration
// Purpose: Initialize all systems and handle global events
// Lines: 1-208
// ============================================================

import { CONFIG } from "./config.js";
import {
  initializeNightSkySize,
  isLowEndDevice,
  getStarCount,
  pauseAnimations,
  resumeAnimations,
  safeQuerySelector,
} from "./utils.js";
import {
  initializeStars,
  generateStars,
  setPageVisible as setStarPageVisible,
  getCanvasState,
} from "./stars.js";
import {
  initializeMeteorSystem,
  generateMeteorKeyframes,
  updateHeroDiagonal,
  startMeteors,
  stopMeteors,
  restartMeteors,
  setMeteorPageVisible,
} from "./meteors.js";

// ============================================================
// INITIALIZATION
// Lines: 45-79
// ============================================================

/**
 * Initialize all systems on page load
 * @returns {void}
 */
function initializeApp() {
  // Initialize night sky container size
  initializeNightSkySize();

  // Initialize CSS aurora (hide if disabled or on low-end devices)
  const auroraContainer = document.getElementById("auroraContainer");
  if (auroraContainer) {
    if (!CONFIG.aurora.enabled || isLowEndDevice()) {
      auroraContainer.style.display = "none";
    }
  }

  // Initialize stars with requestAnimationFrame to ensure layout is complete
  requestAnimationFrame(() => {
    initializeStars();
  });

  // Initialize and start meteor system
  if (initializeMeteorSystem()) {
    generateMeteorKeyframes();
    startMeteors();
    setupResizeHandler();
    setupVisibilityHandler();
  }
}

// ============================================================
// RESIZE HANDLER
// Lines: 80-138
// ============================================================

/**
 * Setup resize event handler with debouncing
 * @returns {void}
 */
function setupResizeHandler() {
  // Track current star count for breakpoint detection
  let currentStarCount = getStarCount();
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Update night sky size
      initializeNightSkySize();

      // Update canvas size with device pixel ratio
      const { canvas: starCanvas, ctx: starCtx } = getCanvasState();
      if (starCanvas && starCtx) {
        try {
          const nightSky = safeQuerySelector(
            "#nightSky",
            "Night sky element not found",
          );
          const rect = nightSky.getBoundingClientRect();

          if (CONFIG.canvas.devicePixelRatioEnabled) {
            starCanvas.width = rect.width * window.devicePixelRatio;
            starCanvas.height = rect.height * window.devicePixelRatio;
            starCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
          } else {
            starCanvas.width = rect.width;
            starCanvas.height = rect.height;
          }

          // Check if we crossed the mobile breakpoint
          const newStarCount = getStarCount();
          if (newStarCount !== currentStarCount) {
            currentStarCount = newStarCount;
          }

          // Regenerate stars with new canvas size
          generateStars(rect.width, rect.height);
        } catch (error) {
          console.error("Error handling resize for stars:", error);
        }
      }

      // Update meteor system
      updateHeroDiagonal();
      generateMeteorKeyframes();
    }, CONFIG.performance.resizeDebounceMs);
  });
}

// ============================================================
// VISIBILITY HANDLER
// Lines: 139-196
// ============================================================

/**
 * Setup visibility change handler for pause/resume
 *
 * When tab is hidden:
 * - Pause all CSS animations (.paused class)
 * - Stop canvas rendering (handled in stars.js)
 * - Clear all meteor timeouts to prevent memory leaks
 *
 * When tab becomes visible:
 * - Resume CSS animations
 * - Restart canvas rendering (handled in stars.js)
 * - Clean up any orphaned meteor DOM elements
 * - Recreate meteor/shower timers from scratch
 *
 * This prevents unnecessary CPU/GPU usage when tab is hidden
 * and ensures animations don't desync after long periods hidden.
 *
 * @returns {void}
 */
function setupVisibilityHandler() {
  document.addEventListener("visibilitychange", () => {
    try {
      const nightSky = document.getElementById("nightSky");
      const meteorsContainer = document.getElementById("meteorsContainer");
      const auroraContainer = document.getElementById("auroraContainer");

      if (document.hidden) {
        // Page is hidden - pause animations
        pauseAnimations(nightSky, meteorsContainer, auroraContainer);

        // Stop star canvas rendering
        setStarPageVisible(false);

        // Stop meteor system
        setMeteorPageVisible(false);
        stopMeteors();
      } else {
        // Page is visible - resume animations
        resumeAnimations(nightSky, meteorsContainer, auroraContainer);

        // Resume star canvas rendering
        setStarPageVisible(true);

        // Restart meteor system
        setMeteorPageVisible(true);
        restartMeteors();
      }
    } catch (error) {
      console.error("Error handling visibility change:", error);
    }
  });
}

// ============================================================
// START APPLICATION
// Lines: 197-208
// ============================================================

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // DOMContentLoaded already fired
  initializeApp();
}
