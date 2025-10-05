/**
 * @fileoverview Utility functions module - Shared helpers
 * @module utils
 * @exports {safeQuerySelector, getStarCount, isLowEndDevice, easeInOutSine, pauseAnimations, resumeAnimations, initializeNightSkySize}
 * @imports {CONFIG} from config.js
 * @description Reusable helper functions used across multiple systems.
 *   Includes DOM utilities, device detection, easing functions, and layout calculations.
 */

// ============================================================
// UTILITY FUNCTIONS - Shared helpers
// Purpose: Reusable functions used across multiple systems
// Lines: 1-150
// ============================================================

import { CONFIG } from "./config.js";

/**
 * Safely query a DOM element with error handling
 * @param {string} selector - CSS selector or ID
 * @param {string} errorMsg - Error message if element not found
 * @returns {HTMLElement} The found element
 * @throws {Error} If element not found
 */
export function safeQuerySelector(selector, errorMsg) {
  // Handle both CSS selectors and IDs
  const element = selector.startsWith("#")
    ? document.getElementById(selector.slice(1))
    : document.querySelector(selector);

  if (!element) {
    throw new Error(errorMsg || `Element not found: ${selector}`);
  }
  return element;
}

/**
 * Get appropriate star count based on current viewport width
 * @returns {number} Star count (mobile or desktop)
 */
export function getStarCount() {
  return window.innerWidth < CONFIG.stars.mobileBreakpoint
    ? CONFIG.stars.countMobile
    : CONFIG.stars.countDesktop;
}

/**
 * Detect low-end devices based on hardware capabilities
 * Used to disable performance-intensive features like aurora
 * @returns {boolean} True if device is considered low-end
 */
export function isLowEndDevice() {
  // Check CPU cores (most reliable indicator)
  const cpuCores = navigator.hardwareConcurrency || 2;
  if (cpuCores < CONFIG.aurora.lowEndCpuCores) {
    return true;
  }

  // Check device memory if available (in GB)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    return true;
  }

  return false;
}

/**
 * Ease-in-out sine function for smooth animations
 * Matches CSS ease-in-out timing function
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Add CSS pause class to animation elements
 * Used when tab is hidden to save CPU/GPU
 * @param {HTMLElement} nightSky - Night sky container element
 * @param {HTMLElement} meteorsContainer - Meteors container element
 * @param {HTMLElement} auroraContainer - Aurora container element
 */
export function pauseAnimations(nightSky, meteorsContainer, auroraContainer) {
  if (nightSky) nightSky.classList.add("paused");
  if (meteorsContainer) meteorsContainer.classList.add("paused");
  if (auroraContainer) auroraContainer.classList.add("paused");
}

/**
 * Remove CSS pause class to resume animations
 * Used when tab becomes visible again
 * @param {HTMLElement} nightSky - Night sky container element
 * @param {HTMLElement} meteorsContainer - Meteors container element
 * @param {HTMLElement} auroraContainer - Aurora container element
 */
export function resumeAnimations(nightSky, meteorsContainer, auroraContainer) {
  if (nightSky) nightSky.classList.remove("paused");
  if (meteorsContainer) meteorsContainer.classList.remove("paused");
  if (auroraContainer) auroraContainer.classList.remove("paused");
}

// ============================================================
// NIGHT SKY UTILITIES
// Lines: 107-150
// ============================================================

/**
 * Calculate and set optimal night sky container size
 *
 * The .night-sky container must be large enough to cover the viewport
 * during 360° rotation. It's positioned at the horizon (bottom of .hero)
 * with transform-origin at center.
 *
 * Math: diagonal * CONFIG.nightSky.diagonalMultiplier ensures corners
 * stay offscreen during rotation
 * - diagonal = distance from horizon to top corners
 * - diagonalMultiplier (2.2) = safety margin (sqrt(2) ≈ 1.41, but we need extra coverage)
 * - Positioned with bottom: -containerSize/2 so center is at horizon
 *
 * @returns {void}
 */
export function initializeNightSkySize() {
  try {
    const hero = safeQuerySelector(".hero", "Hero element not found");
    const nightSky = safeQuerySelector(
      "#nightSky",
      "Night sky element not found",
    );

    const heroRect = hero.getBoundingClientRect();
    const heroWidth = heroRect.width;
    const heroHeight = heroRect.height;

    // Calculate diagonal from horizon (bottom-center) to top corners
    const diagonal = Math.sqrt((heroWidth / 2) ** 2 + heroHeight ** 2);

    // Container rotates from center, positioned at horizon
    const containerSize = Math.ceil(
      diagonal * CONFIG.nightSky.diagonalMultiplier,
    );

    // Apply dimensions and position center at horizon
    nightSky.style.width = `${containerSize}px`;
    nightSky.style.height = `${containerSize}px`;
    nightSky.style.bottom = `${-containerSize * CONFIG.nightSky.bottomOffsetFactor}px`;
  } catch (error) {
    console.error("Failed to initialize night sky size:", error);
  }
}
