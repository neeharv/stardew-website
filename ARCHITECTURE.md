# Architecture Documentation - Stardew Labs Website

## System Overview

This page creates a rotating night sky effect with three main visual systems working in concert to create an immersive astronomical experience.

## Visual Systems

### 1. Rotating Sky Container (.night-sky)

**Purpose**: Simulate Earth's rotation by rotating the entire star field.

**Implementation**:

- Square container positioned at horizon line (bottom of `.hero`)
- CSS animation rotates 360° over 900 seconds (15 minutes)
- Sized to cover viewport even during rotation: `diagonal × 2.2`
- Contains canvas with stars and planets
- Transform origin at center, positioned with `bottom: -containerSize/2`

**Math Explanation**:

```
Viewport diagonal = sqrt(heroWidth² + heroHeight²)
Container size = diagonal × 2.2

Why 2.2?
- Minimum for rotated square coverage: sqrt(2) ≈ 1.414
- Additional margin needed because container is positioned at horizon, not centered
- 2.2 ensures corners never peek through during 360° rotation
```

**Related Code**:

- HTML: `<div class="night-sky" id="nightSky">` in index.html
- JS: `initializeNightSkySize()` in utils.js
- CSS: `.night-sky` animation in styles.css

---

### 2. Star Field System (Canvas-based)

**Purpose**: Render realistic night sky with stars and planets.

**Implementation**:

- Canvas-based rendering using `requestAnimationFrame` for 60fps
- Two types of celestial objects: stars (twinkling) and planets (static bright points)
- Device pixel ratio scaling for sharp rendering on retina displays
- Rendering pauses when tab is hidden to save CPU/GPU

**Star Generation**:

```
Distribution:
- 70% twinkling stars (dynamic opacity)
- 30% static stars (fixed opacity)
- 2.5% stars have binary companions

Spectral Classes (realistic distribution):
- O-B (blue-white): 5% - Hot, rare stars
- A (white): 15% - Sirius-like stars
- F-G (yellow-white): 30% - Sun-like stars
- K (orange): 30% - Cooler stars
- M (red): 20% - Red dwarfs

Positioning:
- X: uniform distribution across width
- Y: biased toward top (Math.pow(random, 1.5))
  - Concentrates stars where visible (below horizon is clipped)
```

**Binary Star Systems**:

```
Frequency: 2.5% (lower than real ~50% for visual clarity)
Separation: 2-8 pixels in random direction
Companion size: 60-90% of primary star
Both stars share same spectral class
```

**Planet Generation**:

```
Count: 5 planets (Venus, Jupiter, Mars, Saturn, Mercury)
Positioning: Evenly spaced horizontally with vertical randomness
Size: Larger than stars (3-4.5px)
Opacity: Higher than stars (0.8-0.95)
Behavior: No twinkling (planets have steady light)
```

**Animation**:

```
Twinkling stars:
- Each star has random delay (0-6s)
- Random cycle duration (4-10s)
- Opacity oscillates using easeInOutSine
- Range: 0.4 to 1.0 opacity

Static stars:
- Fixed opacity (0.4-0.7)
- No animation overhead
- Provides visual depth
```

**Related Code**:

- HTML: `<canvas id="starCanvas">` in index.html
- JS: stars.js (entire module)
- Config: `CONFIG.stars` and `CONFIG.planets` in config.js

---

### 3. Meteor System (DOM-based CSS)

**Purpose**: Create shooting star effects with both random meteors and periodic showers.

**Implementation**:

- DOM-based elements animated with CSS (GPU accelerated)
- Dynamically generated `@keyframes` based on viewport diagonal
- Two parallel systems: single meteors + meteor showers
- Timeout tracking for proper pause/resume on visibility change

**Dual System Architecture**:

```
System 1: Single Random Meteors
- Continuous random meteor spawning
- 2 parallel timers (singleMeteorStreamCount)
- Interval: 1.5-5.5 seconds between meteors
- Random angles from preset pool

System 2: Meteor Showers
- Periodic bursts of 6-12 meteors
- All meteors in shower share similar angle
- Spawn interval: 80-230ms between shower meteors
- Next shower: 3-8 seconds after previous shower ends
```

**Meteor Trajectory**:

```
Start positions (percentage):
- X: 90-120% (can start beyond viewport edge)
- Y: -10% to 50% (varies with X)
  - If X > 100%: Y starts at -10% (just above viewport)
  - If X < 100%: Y starts at -40% (higher, longer visible arc)

Angles: Preset pool of [130°, 135°, 140°, 145°, 150°, 155°, 160°, 165°]
- Ensures consistent diagonal motion (top-right to bottom-left)
- Prevents awkward straight-down or horizontal meteors
- Allows keyframe pre-generation

Distance tiers (for depth):
- short: diagonal - 25px
- medium: diagonal
- long: diagonal + 25px

Duration: 4-6 seconds (randomized per meteor)
```

**Dynamic Keyframe Generation**:

```
Why dynamic?
- Meteor travel distance depends on viewport diagonal
- Diagonal varies with window size
- Can't use static CSS for responsive behavior

Generated keyframes:
- 8 angles × 3 distances = 24 unique @keyframes
- Example: @keyframes meteor-145-med { ... }
- Regenerated on window resize

Benefits:
- GPU-accelerated CSS animations (not JS-driven)
- Responsive to window size changes
- Smooth 60fps performance
```

**Meteor Structure**:

```html
<div class="meteor">
  <div class="meteor-head"></div>
  <!-- Bright point -->
  <div class="meteor-tail"></div>
  <!-- Trailing glow -->
</div>
```

**Related Code**:

- HTML: `<div class="meteors-container" id="meteorsContainer">` in index.html
- JS: meteors.js (entire module)
- CSS: `.meteor`, `.meteor-head`, `.meteor-tail` in styles.css
- Config: `CONFIG.meteors` in config.js

---

### 4. Aurora System (Pure CSS)

**Purpose**: Optional atmospheric effect (currently disabled).

**Implementation**:

- Three overlapping gradient bands with wave animations
- Pure CSS (no JS control beyond show/hide)
- Automatically hidden on low-end devices (<4 CPU cores)

**Current Status**: Disabled by default (`CONFIG.aurora.enabled = false`)

**Related Code**:

- HTML: `<div class="aurora-container" id="auroraContainer">` in index.html
- CSS: `.aurora-band` animations in styles.css
- Config: `CONFIG.aurora` in config.js

---

## Data Flow

### Application Initialization Flow

```
Browser loads index.html
  └─> Loads main.js as ES6 module
      └─> main.js imports all dependencies
          ├─> config.js (CONFIG object)
          ├─> utils.js (helper functions)
          ├─> stars.js (star system)
          └─> meteors.js (meteor system)

DOMContentLoaded event fires
  └─> initializeApp() called
      ├─> initializeNightSkySize()
      │   └─> Calculates and sets container dimensions
      │
      ├─> Aurora init (if enabled)
      │   └─> Hide if disabled or low-end device
      │
      ├─> requestAnimationFrame(() => initializeStars())
      │   ├─> Get canvas and context
      │   ├─> Set canvas size with DPR scaling
      │   ├─> generateStars(width, height)
      │   │   ├─> Create star data array
      │   │   └─> Create planet data array
      │   └─> renderStars() (starts animation loop)
      │       └─> requestAnimationFrame loop (60fps)
      │
      └─> Meteor init
          ├─> initializeMeteorSystem()
          │   └─> Cache DOM refs and dimensions
          ├─> generateMeteorKeyframes()
          │   └─> Inject dynamic CSS
          ├─> startMeteors()
          │   ├─> Start single meteor timers (2 parallel)
          │   └─> Schedule first shower
          ├─> setupResizeHandler()
          │   └─> Debounced resize with 250ms delay
          └─> setupVisibilityHandler()
              └─> Pause/resume on tab visibility change
```

### Resize Event Flow

```
Window resize event
  └─> Debounced timeout (250ms)
      ├─> initializeNightSkySize()
      │   └─> Recalculate container dimensions
      │
      ├─> Canvas resize
      │   ├─> Update canvas.width/height with DPR
      │   ├─> Re-apply context scaling
      │   ├─> Check for mobile breakpoint crossing
      │   └─> generateStars() with new dimensions
      │
      └─> Meteor resize
          ├─> updateHeroDiagonal()
          └─> generateMeteorKeyframes()
              └─> Regenerate CSS with new distances
```

### Visibility Change Flow

```
Tab becomes hidden (document.hidden = true)
  ├─> pauseAnimations() adds .paused class
  │   └─> CSS animation-play-state: paused
  │
  ├─> setStarPageVisible(false)
  │   └─> Cancels requestAnimationFrame
  │       └─> Stops canvas rendering
  │
  └─> setMeteorPageVisible(false) + stopMeteors()
      ├─> Clear all timeout IDs
      ├─> Reset shower state
      └─> Remove orphaned meteor DOM elements

Tab becomes visible (document.hidden = false)
  ├─> resumeAnimations() removes .paused class
  │
  ├─> setStarPageVisible(true)
  │   └─> Restarts renderStars() loop
  │
  └─> setMeteorPageVisible(true) + restartMeteors()
      ├─> Clean up any remaining state
      └─> Call startMeteors() fresh
```

### Star Rendering Loop Flow

```
renderStars() [60fps via requestAnimationFrame]
  ├─> Check isPageVisible (early return if hidden)
  ├─> Get current performance.now()
  ├─> Clear canvas
  │
  ├─> For each star:
  │   ├─> If static: use fixed opacity
  │   ├─> If twinkling:
  │   │   ├─> Calculate elapsed time since start + delay
  │   │   ├─> Calculate cycle position (modulo duration)
  │   │   ├─> Apply easeInOutSine easing
  │   │   └─> Map to opacity range (0.4 to 1.0)
  │   └─> Draw arc with fillStyle = rgba(R,G,B,opacity)
  │
  ├─> For each planet:
  │   └─> Draw arc with fixed high opacity
  │
  └─> requestAnimationFrame(renderStars) if still visible
```

### Meteor Creation Flow

```
Single Meteor:
createSingleMeteor()
  ├─> createMeteor(null) [null = random angle]
  │   ├─> calculateMeteorStartPosition()
  │   ├─> selectMeteorAngle(null) [picks random preset]
  │   ├─> selectMeteorAnimation(angle) [picks random distance tier]
  │   ├─> Create DOM elements (meteor + head + tail)
  │   ├─> Apply CSS animation
  │   ├─> Append to meteorsContainer
  │   └─> setTimeout to remove after duration
  └─> Schedule next single meteor (1.5-5.5s)

Meteor Shower:
triggerMeteorShower()
  ├─> Generate base angle (130-160°)
  ├─> Calculate meteor count (6-12)
  │
  ├─> For each meteor in shower:
  │   ├─> setTimeout with staggered delay (80-230ms)
  │   └─> createMeteor(baseAngle) [all share similar angle]
  │
  ├─> setTimeout for shower cleanup
  │   └─> scheduleNextShower() (3-8s wait)
  │
  └─> Track all timeout IDs for pause/resume
```

---

## Performance Characteristics

### Optimization Strategies

#### 1. Canvas Rendering

```
Device Pixel Ratio Scaling:
- Canvas buffer size: width × DPR, height × DPR
- Context scaled back by DPR
- Result: Sharp rendering on retina displays without performance hit

Animation Loop:
- requestAnimationFrame (browser-optimized timing)
- Automatic pause when tab hidden
- Early return if canvas/context missing

Star Count Adaptation:
- Desktop: 1200 stars
- Mobile (<768px): 800 stars
- Reduces overhead on smaller devices
```

#### 2. Meteor System

```
GPU Acceleration:
- CSS animations (not JS-driven position updates)
- transform: translate3d() forces GPU compositing
- will-change: transform hints to browser

Dynamic Keyframes:
- Generated once, used many times
- Regenerated only on resize (debounced)
- 24 keyframes total (8 angles × 3 distances)

DOM Cleanup:
- Meteors removed after animation completes
- Timeout tracking prevents memory leaks
- Orphaned elements cleaned on visibility change
```

#### 3. Event Handling

```
Resize Debouncing:
- 250ms delay (CONFIG.performance.resizeDebounceMs)
- Prevents excessive recalculations during drag-resize
- Batches updates for efficiency

Visibility Handling:
- Immediate pause on hidden (saves CPU/GPU)
- Clean restart on visible (prevents desync)
- Tracked timeouts allow proper cleanup
```

#### 4. Low-End Device Detection

```
Criteria:
- CPU cores < 4 (navigator.hardwareConcurrency)
- OR device memory < 4GB (navigator.deviceMemory)

Actions:
- Aurora automatically disabled
- Star counts already reduced on mobile
- Future: Could reduce meteor frequency
```

### Performance Metrics

**Target Performance**:

- 60fps canvas rendering
- <16ms per frame budget
- No dropped frames during resize
- Instant pause/resume on visibility change

**Resource Usage** (not yet profiled - needs validation):

- Canvas: Unknown CPU usage (requires profiling with Performance API)
- Meteors: Unknown CPU usage (GPU-accelerated CSS, likely minimal)
- Memory: Estimated ~5-10MB total (mostly canvas buffer, needs measurement)

**Optimization Trade-offs**:

- Binary star percentage (2.5% vs real 50%): Visual clarity over realism
- Preset meteor angles vs fully random: Aesthetic consistency
- Static stars (30%): Reduces animation overhead
- DOM meteors vs canvas meteors: GPU acceleration worth the DOM overhead

---

## State Management

### Module State Boundaries

Each module maintains its own state with no shared mutable state:

**stars.js state**:

```javascript
let starCanvas = null;
let starCtx = null;
let stars = []; // Generated star data
let planets = []; // Generated planet data
let animationFrameId = null;
let isPageVisible = !document.hidden;
const startTime = performance.now(); // Animation baseline
```

**meteors.js state**:

```javascript
let meteorsContainer = null;
let heroElement = null;
let heroDiagonal = 0;
let isShowerActive = false;
let isPageVisible = !document.hidden;
let activeMeteorTimeouts = []; // For cleanup
let activeShowerTimeouts = []; // For cleanup
```

**main.js state**:

```javascript
// No persistent state - orchestration only
// Uses closures for resize handler state (currentStarCount)
```

**utils.js state**:

```javascript
// Stateless utility functions only
```

**config.js state**:

```javascript
// Frozen configuration object (immutable)
export const CONFIG = {
  /* ... */
};
```

### Why This Architecture?

**Benefits**:

- Clear ownership of state
- Easy to reason about data flow
- Module can be reloaded/reinitialized independently
- No risk of state pollution across modules

**Trade-offs**:

- `isPageVisible` duplicated in stars.js and meteors.js
- Could be centralized, but that creates coupling
- Current approach: slight duplication for module independence

---

## Browser Compatibility

### Required APIs

- **Canvas API**: Stars and planet rendering
- **ES6 Modules**: Import/export system
- **requestAnimationFrame**: Canvas animation loop
- **CSS Animations**: Meteor and aurora effects
- **CSS Transforms**: Rotation and translation
- **CSS Grid/Flexbox**: Layout

### Graceful Degradation

- Older browsers: Static content visible, animations may not run
- No canvas support: Sky visible but no stars
- No CSS animations: Meteors/aurora hidden
- No ES6 modules: Script won't load (could add fallback)

### Tested Browsers

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Android

---

## Security Considerations

### Content Security Policy

Headers set in `_headers` file:

- No inline scripts (external JS only)
- No eval/Function constructors
- Style-src includes 'unsafe-inline' for dynamic keyframes

### Attack Surface

- **Minimal**: No user input, no forms, no API calls
- **Static content**: No server-side processing
- **No external resources**: All assets self-hosted
- **HTTPS only**: Cloudflare Pages enforces HTTPS

### Dynamic Code Generation

- Only dynamic code: CSS `@keyframes` injection
- Generated from mathematical calculations, not user input
- No XSS risk (no user-controlled content)

---

## Deployment Architecture

### Cloudflare Pages Pipeline

```
Git push to main
  └─> Cloudflare Pages webhook triggered
      ├─> Clone repository
      ├─> No build process (static files served as-is)
      ├─> Deploy to global CDN
      │   ├─> HTTP/2 multiplexing enabled
      │   ├─> Auto-minify HTML/CSS/JS
      │   ├─> Brotli compression
      │   └─> Cache assets at edge
      └─> Deploy complete (~30 seconds)
```

### File Serving Strategy

```
HTTP/2 Benefits:
- Parallel downloads (no waterfall penalty for multiple files)
- Header compression
- Server push potential (not currently used)

Caching Strategy:
- HTML: No cache (always fetch fresh)
- JS/CSS: Immutable (can cache forever with version bump)
- Images: Long cache (og-image.jpg, twitter-image.jpg)

Compression:
- Brotli (better than gzip for text files)
- ~60% reduction for JS files
- ~50% reduction for HTML/CSS
```

### Why No Build Process?

**Advantages**:

- Instant deploys (no compile time)
- Easy debugging (source = production)
- No toolchain maintenance
- Cloudflare handles minification

**Trade-offs**:

- No TypeScript (using JSDoc instead)
- No SCSS/LESS (vanilla CSS)
- No tree-shaking (but entire bundle is small ~30KB)

**When to Add Build**:

- If bundle exceeds 100KB
- If TypeScript becomes necessary
- If multiple developers need style preprocessing

---

## Extension Points

### Adding New Animation System

1. Create new module in `js/` (e.g., `comets.js`)
2. Import CONFIG and utils
3. Export init/start/stop/setVisible functions
4. Import in main.js and call in initializeApp()
5. Add config section to config.js
6. Add HTML container in index.html

### Adding New Configuration Category

1. Add to CONFIG in config.js
2. Document with JSDoc typedef
3. Use in relevant module
4. Document in .claude/context.md

### Adding User Interactivity

If adding click/touch interactivity:

1. Add event listeners in main.js (or dedicated module)
2. Consider performance impact on animation loops
3. Add pointer-events CSS where needed
4. Test on mobile (touch targets, gestures)

---

## Known Limitations

1. **Canvas size limit**: Very large viewports (>4K) may hit canvas size limits
2. **Meteor cleanup timing**: Small memory leak possible if many meteors created during pause
3. **Binary star clustering**: Random positioning can create visual clusters (not evenly distributed)
4. **Aurora performance**: Expensive on low-end GPUs (why it's disabled by default)
5. **Night sky rotation**: Slight edge visibility possible on ultra-wide monitors
6. **Mobile landscape**: May need specific handling for very wide/short viewports

---

## Immediate Optimization Opportunities

These optimizations provide significant benefit with minimal complexity, aligned with the "no build process" philosophy:

### 1. Layered Canvas for Static Stars (Priority: High)

**Problem**: Currently redraws all 1200 stars every frame, including 360 static stars (30%) that never change opacity (stars.js:238-246).

**Current overhead**:

```
1200 stars × 60fps = 72,000 arc draws per second
```

**Optimized approach**:

```
Layer 1 (static canvas): 360 stars drawn once on init/resize only
Layer 2 (twinkling canvas): 840 stars × 60fps = 50,400 draws/sec
= 30% reduction in renderStars() overhead
```

**Implementation**:

- Create two stacked `<canvas>` elements with z-index
- Render static stars (star.isStatic === true) to background canvas
- Only redraw background canvas on resize
- Keep twinkling stars on existing animation loop

**Complexity**: ~50 lines of code, no new dependencies

**Benefits**:

- 30-40% reduction in canvas rendering work
- No browser compatibility concerns
- Easy to debug (source inspection shows both layers)
- Maintains current architecture patterns

### 2. CSS Custom Properties for Meteor Keyframes (Priority: High)

**Problem**: Regenerating 24 `@keyframes` rules on every resize causes style recalculation (meteors.js:94-151).

**Current approach**:

```javascript
// Every resize: remove old <style>, generate new @keyframes
@keyframes meteor-145-med {
  100% { transform: translate3d(423px, 567px, 0) rotate(145deg); }
}
```

**Optimized approach**:

```css
/* Static keyframes defined once */
@keyframes meteor-145-med {
  100% {
    transform: translate3d(var(--meteor-145-med-x), var(--meteor-145-med-y), 0)
      rotate(145deg);
  }
}
```

```javascript
// On resize: just update CSS custom properties
document.documentElement.style.setProperty("--meteor-145-med-x", `${endX}px`);
document.documentElement.style.setProperty("--meteor-145-med-y", `${endY}px`);
```

**Benefits**:

- Eliminates DOM thrashing from removing/adding `<style>` tags
- Reduces resize handler complexity
- Faster resize response (no CSSOM rebuild)
- Cleaner separation of static definitions vs dynamic values

**Complexity**: Refactor existing function, add static CSS file

### 3. Add Performance Profiling (Priority: High)

**Problem**: Current "Resource Usage" metrics are unvalidated assumptions (ARCHITECTURE.md:447-451).

**Implementation**:

```javascript
// Add to stars.js renderStars()
if (performance.measure && CONFIG.debug?.enableProfiling) {
  performance.mark("render-stars-start");
  // ... rendering code ...
  performance.mark("render-stars-end");
  performance.measure("render-stars", "render-stars-start", "render-stars-end");
}
```

**Collect metrics for**:

- Canvas render time per frame (should be <16ms for 60fps)
- Memory usage (performance.memory API in Chrome)
- Actual CPU usage patterns under various loads
- Frame drops during resize events

**Benefits**:

- Data-driven optimization decisions
- Establishes baseline for measuring improvements
- Can expose unexpected bottlenecks
- Useful for debugging performance regressions

### 4. Image Asset Optimization (Priority: Medium)

**Current**:

- `og-image.jpg` (76KB) + `twitter-image.jpg` (75KB) = 151KB total

**Optimized**:

```html
<meta property="og:image" content="/og-image.webp" />
<meta property="twitter:image" content="/twitter-image.webp" />
```

**Benefits**:

- ~50KB reduction in total page weight
- Faster social media preview loads
- Better Lighthouse scores

**Complexity**: Convert images, update HTML

### 5. Batch Twinkle Opacity Calculations (Priority: Low)

**Current**: `getTwinkleOpacity()` called per-star per-frame with same `currentTime` (stars.js:202-214).

**Optimization**: Calculate time-dependent values once per frame:

```javascript
const frameTime = performance.now();
const elapsed = frameTime - startTime;

stars.forEach((star) => {
  if (star.isStatic) {
    // ... static rendering
  } else {
    // Use pre-calculated elapsed instead of recalculating
    const cyclePosition =
      ((elapsed - star.twinkleDelay) % star.twinkleDuration) /
      star.twinkleDuration;
    // ...
  }
});
```

**Benefits**: Minor reduction in redundant calculations (unlikely to be measurable)

---

## Future Optimization Opportunities

These optimizations are more complex and should only be pursued if profiling reveals specific bottlenecks or new requirements emerge:

### When to Consider These

- **Offscreen Canvas / Web Worker**: If main thread jank appears during heavy JS execution
- **WebGL**: If star count needs to exceed 5000+
- **Variable frame rate**: If profiling shows consistent >16ms frame times on target devices

### Optimizations List

1. **Offscreen Canvas**: Move star rendering to Web Worker
   - **Complexity**: High (message passing, OffscreenCanvas API, debugging)
   - **Benefit**: Complete main-thread isolation
   - **Trade-off**: 80% of benefit already achieved with layered canvas
   - **When**: Only if layered canvas + profiling shows main-thread contention

2. **Intersection Observer**: Pause animations when viewport scrolled away
   - **Complexity**: Low (simple observer setup)
   - **Benefit**: Saves resources when hero scrolled out of view
   - **When**: If page grows beyond single viewport

3. **WebGL**: Switch from 2D canvas to WebGL for thousands more stars
   - **Complexity**: High (complete rewrite of rendering)
   - **Benefit**: 10,000+ stars possible
   - **When**: Requirements change to need dramatically more stars

4. **Lazy load**: Delay meteor system init until hero in viewport
   - **Complexity**: Medium (intersection observer + deferred init)
   - **Benefit**: Slightly faster initial page load
   - **When**: JavaScript bundle grows significantly

5. **Prefers-reduced-motion**: Respect user's motion preferences
   - **Complexity**: Low (CSS media query)
   - **Benefit**: Accessibility improvement
   - **When**: Should be implemented regardless (accessibility best practice)

6. **Variable frame rate**: Reduce to 30fps on low-end devices
   - **Complexity**: Medium (device detection, frame skipping logic)
   - **Benefit**: Better performance on constrained devices
   - **When**: Profiling shows consistent frame drops on target devices

7. **Shooting star trails**: Add WebGL-based persistent trails
   - **Complexity**: High (WebGL implementation)
   - **Benefit**: Visual enhancement
   - **When**: Feature request with established performance baseline

---

## References

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [CSS Animations Performance](https://web.dev/animations-guide/)
- [Stellar Classification (O-B-A-F-G-K-M)](https://en.wikipedia.org/wiki/Stellar_classification)
- [Binary Star Systems](https://en.wikipedia.org/wiki/Binary_star)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
