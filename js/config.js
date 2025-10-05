// ============================================================
// CONFIGURATION - All tweakable constants
// Purpose: Centralized configuration for easy tuning
// Lines: 1-200
// ============================================================

/**
 * @typedef {Object} StarConfig
 * @property {number} countDesktop - Number of stars on desktop viewports
 * @property {number} countMobile - Number of stars on mobile viewports
 * @property {number} mobileBreakpoint - Viewport width breakpoint in pixels
 * @property {number} maxSize - Maximum star size in pixels
 * @property {number} minSize - Minimum star size in pixels
 * @property {number} animationDelayMax - Maximum animation delay in seconds
 * @property {number} animationDurationMin - Minimum twinkle duration in seconds
 * @property {number} animationDurationMax - Maximum twinkle duration in seconds
 * @property {number} twinkleOpacityMin - Minimum opacity during twinkle
 * @property {number} twinkleOpacityMax - Maximum opacity during twinkle
 * @property {number} staticPercentage - Percentage of stars that don't twinkle (0-1)
 * @property {number} staticOpacityMin - Minimum opacity for static stars
 * @property {number} staticOpacityMax - Maximum opacity for static stars
 * @property {Array<SpectralClass>} spectralClasses - Star color distribution
 * @property {number} binaryPercentage - Percentage of stars with binary companions
 * @property {number} binarySeparationMin - Minimum pixel distance for binary pairs
 * @property {number} binarySeparationMax - Maximum pixel distance for binary pairs
 */

/**
 * @typedef {Object} SpectralClass
 * @property {string} type - Star classification (O-B, A, F-G, K, M)
 * @property {string} color - RGBA color string (incomplete, opacity added at render)
 * @property {number} percentage - Distribution percentage (0-1)
 */

/**
 * @typedef {Object} PlanetConfig
 * @property {string} name - Planet name (for reference only, not displayed)
 * @property {string} color - RGBA color string (incomplete, opacity added at render)
 * @property {number} size - Planet size in pixels
 * @property {number} opacity - Planet opacity (0-1)
 */

/**
 * @typedef {Object} MeteorConfig
 * @property {number} startXMin - Minimum start X position as percentage
 * @property {number} startXMax - Maximum start X position as percentage
 * @property {Object} startYMin - Start Y positions based on X bounds
 * @property {number} startYMax - Maximum start Y position as percentage
 * @property {number} angleMin - Minimum trajectory angle in degrees
 * @property {number} angleMax - Maximum trajectory angle in degrees
 * @property {number} angleVariation - Angle variation (currently unused)
 * @property {number} durationMin - Minimum animation duration in seconds
 * @property {number} durationMax - Maximum animation duration in seconds
 * @property {number} showerCountMin - Minimum meteors per shower
 * @property {number} showerCountMax - Maximum meteors per shower
 * @property {number} showerIntervalMin - Min milliseconds between shower meteors
 * @property {number} showerIntervalMax - Max milliseconds between shower meteors
 * @property {number} singleMeteorIntervalMin - Min ms between random meteors
 * @property {number} singleMeteorIntervalMax - Max ms between random meteors
 * @property {number} nextShowerMin - Min ms until next shower
 * @property {number} nextShowerMax - Max ms until next shower
 * @property {number} singleMeteorStreamCount - Number of parallel meteor timers
 * @property {number} initialMeteorDelayMax - Max delay before first meteor
 * @property {number} initialShowerDelayMin - Min delay before first shower
 * @property {number} initialShowerDelayMax - Max delay before first shower
 * @property {number} showerCleanupDelayPerMeteor - Grace period per meteor
 * @property {number} showerCleanupDelayBase - Base cleanup delay
 */

/**
 * @typedef {Object} AuroraConfig
 * @property {boolean} enabled - Aurora feature flag
 * @property {number} lowEndCpuCores - CPU cores threshold for disabling aurora
 */

/**
 * @typedef {Object} PerformanceConfig
 * @property {number} resizeDebounceMs - Debounce delay for resize events
 */

/**
 * @typedef {Object} NightSkyConfig
 * @property {number} diagonalMultiplier - Multiplier for container size calculation
 * @property {number} bottomOffsetFactor - Factor for positioning container
 */

/**
 * @typedef {Object} CanvasConfig
 * @property {boolean} devicePixelRatioEnabled - Use device pixel ratio for retina
 * @property {string} contextType - Canvas context type
 */

/**
 * @typedef {Object} Config
 * @property {StarConfig} stars - Star system configuration
 * @property {Array<PlanetConfig>} planets - Planet configuration
 * @property {MeteorConfig} meteors - Meteor system configuration
 * @property {AuroraConfig} aurora - Aurora effect configuration
 * @property {PerformanceConfig} performance - Performance tuning
 * @property {NightSkyConfig} nightSky - Night sky container configuration
 * @property {CanvasConfig} canvas - Canvas rendering configuration
 */

/** @type {Config} */
const CONFIG = {
  // ============================================================
  // STAR SYSTEM CONFIGURATION
  // Lines: 110-150
  // ============================================================
  stars: {
    // Star count based on device capabilities
    countDesktop: 1200,
    countMobile: 800,
    mobileBreakpoint: 768,

    // Star appearance
    maxSize: 3,
    minSize: 1,

    // Animation timing
    animationDelayMax: 6, // seconds
    animationDurationMin: 4, // seconds
    animationDurationMax: 10, // seconds

    // Opacity ranges
    twinkleOpacityMin: 0.4,
    twinkleOpacityMax: 1.0,
    staticPercentage: 0.3, // 30% of stars don't twinkle
    staticOpacityMin: 0.4,
    staticOpacityMax: 0.7,

    // Spectral classes follow real star distribution (OBAFGKM)
    // Color strings intentionally incomplete - opacity added in renderStars()
    spectralClasses: [
      {
        type: "O-B", // Hot blue-white stars (rare)
        color: "rgba(155, 176, 255,",
        percentage: 0.05,
      },
      {
        type: "A", // White stars
        color: "rgba(202, 215, 255,",
        percentage: 0.15,
      },
      {
        type: "F-G", // Yellow-white stars (like our Sun)
        color: "rgba(248, 247, 255,",
        percentage: 0.3,
      },
      {
        type: "K", // Orange stars
        color: "rgba(255, 210, 161,",
        percentage: 0.3,
      },
      {
        type: "M", // Red dwarfs (most common in reality)
        color: "rgba(255, 204, 111,",
        percentage: 0.2,
      },
    ],

    // Binary star systems
    binaryPercentage: 0.025, // 2.5% of stars have binary companions
    binarySeparationMin: 2, // Pixels between binary pair
    binarySeparationMax: 8,
  },

  // ============================================================
  // PLANET CONFIGURATION
  // Lines: 151-180
  // ============================================================
  // Planets are rendered as bright, non-twinkling points
  // Names are for reference only (not displayed to user)
  planets: [
    {
      name: "Venus",
      color: "rgba(255, 250, 235,",
      size: 4.5,
      opacity: 0.95,
    },
    {
      name: "Jupiter",
      color: "rgba(255, 244, 229,",
      size: 4.2,
      opacity: 0.9,
    },
    {
      name: "Mars",
      color: "rgba(255, 180, 140,",
      size: 3.5,
      opacity: 0.85,
    },
    {
      name: "Saturn",
      color: "rgba(255, 245, 220,",
      size: 3.8,
      opacity: 0.88,
    },
    {
      name: "Mercury",
      color: "rgba(230, 235, 255,",
      size: 3,
      opacity: 0.8,
    },
  ],

  // ============================================================
  // METEOR SYSTEM CONFIGURATION
  // Lines: 181-220
  // ============================================================
  meteors: {
    // Start positions in percentage (can be outside viewport)
    startXMin: 90, // Right edge
    startXMax: 120, // Beyond right edge

    // Y varies based on X to ensure meteors enter from top-right
    startYMin: {
      whenXOutOfBounds: -10, // Start just above viewport if X > 100%
      whenXInBounds: -40, // Start higher if X < 100%
    },
    startYMax: 50, // Can start partway down screen

    // Trajectory angles
    angleMin: 130, // Diagonal down-left (degrees)
    angleMax: 160, // Steeper down-left
    angleVariation: 15, // Not currently used

    // Animation durations
    durationMin: 4, // Seconds for meteor animation
    durationMax: 6,

    // Meteor shower parameters
    showerCountMin: 6, // Meteors per shower
    showerCountMax: 12,
    showerIntervalMin: 80, // Milliseconds between meteors in shower
    showerIntervalMax: 230,

    // Single meteor parameters
    singleMeteorIntervalMin: 1500, // Milliseconds between random meteors
    singleMeteorIntervalMax: 5500,

    // Shower scheduling
    nextShowerMin: 3000, // Milliseconds until next shower
    nextShowerMax: 8000,

    // System parameters
    singleMeteorStreamCount: 2, // Parallel random meteor timers
    initialMeteorDelayMax: 2000, // Stagger initial meteors (ms)
    initialShowerDelayMin: 2000, // Wait before first shower (ms)
    initialShowerDelayMax: 4000,
    showerCleanupDelayPerMeteor: 250, // Grace period before next shower (ms)
    showerCleanupDelayBase: 2000,
  },

  // ============================================================
  // AURORA CONFIGURATION
  // Lines: 221-230
  // ============================================================
  aurora: {
    enabled: false, // Disabled by default - CSS renderer ready to enable
    lowEndCpuCores: 4, // Hide aurora on devices with fewer CPU cores
  },

  // ============================================================
  // PERFORMANCE CONFIGURATION
  // Lines: 231-240
  // ============================================================
  performance: {
    resizeDebounceMs: 250, // Debounce delay for resize events
  },

  // ============================================================
  // NIGHT SKY CONTAINER CONFIGURATION
  // Lines: 241-250
  // ============================================================
  nightSky: {
    diagonalMultiplier: 2.2, // Multiplier for container size (covers rotation)
    bottomOffsetFactor: 0.5, // Factor for positioning (containerSize / 2)
  },

  // ============================================================
  // CANVAS RENDERING CONFIGURATION
  // Lines: 251-260
  // ============================================================
  canvas: {
    devicePixelRatioEnabled: true, // Use device pixel ratio for retina displays
    contextType: "2d", // Canvas context type
  },
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
