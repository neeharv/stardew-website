# Claude Code Context - Stardew Labs Website

## Project Overview

Static single-page website with animated night sky hero section. Zero build process, vanilla JS with ES6 modules.

## Common Commands

No build process needed. Open `index.html` directly in browser or use a local server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (if http-server installed)
npx http-server
```

## File Locations

**Working directory**: `/Users/neeharvenugopal/Development/StardewLabs/website`

- `js/main.js` - Entry point, orchestrates all systems
- `js/config.js` - All configuration constants (frozen CONFIG object)
- `js/utils.js` - Shared helper functions
- `js/stars.js` - Canvas-based star rendering system
- `js/meteors.js` - DOM-based meteor animation system
- `index.html` - Main page
- `styles.css` - All styles

## Module Architecture

```
main.js (entry point)
├── imports: config.js, utils.js, stars.js, meteors.js
├── initializes all systems
└── handles global events (resize, visibility)

config.js → Frozen CONFIG object → Used by all modules

utils.js
├── exports: safeQuerySelector, getStarCount, isLowEndDevice, easeInOutSine,
│           pauseAnimations, resumeAnimations, initializeNightSkySize
└── used by: main.js, stars.js, meteors.js

stars.js
├── exports: initializeStars, generateStars, setPageVisible, renderStars, getCanvasState
└── manages canvas-based star field with 60fps animation loop

meteors.js
├── exports: initializeMeteorSystem, generateMeteorKeyframes, updateHeroDiagonal,
│           startMeteors, stopMeteors, restartMeteors, setMeteorPageVisible
└── manages DOM-based CSS meteor animations (single meteors + showers)
```

## HTML Element References

**Required IDs** (queried by JS):

- `#nightSky` - Rotating sky container
- `#starCanvas` - Canvas element for stars
- `#auroraContainer` - Aurora effect container
- `#meteorsContainer` - Meteor DOM container

**Required Classes**:

- `.hero` - Hero section container
- `.meteor` - Individual meteor elements (for cleanup)

## Code Style

**Prettier-compatible format**:

- 2 space indent, semicolons always, double quotes
- Trailing commas (ES5), 80 char line width, arrow parens always

**File structure conventions**:

- Section markers: `// ============================================================`
- JSDoc: All exported functions have @param and @returns
- Error handling: All DOM queries use try-catch
- Constants: ALL magic numbers live in CONFIG object

**Naming**:

- Functions: camelCase (`generateStars`, `initializeMeteorSystem`)
- Variables: camelCase (`starCanvas`, `heroDiagonal`)
- Constants: SCREAMING_SNAKE_CASE (`METEOR_ANGLES`, `DISTANCE_TIERS`)
- CSS classes: kebab-case (`.night-sky`, `.meteor-head`)

## Common Patterns

**Safe DOM queries**: Always use `safeQuerySelector()` instead of raw querySelector:

```javascript
const element = safeQuerySelector("#myId", "Element not found");
```

**Configuration access**: Always read from CONFIG, never hardcode:

```javascript
// Good
const count = CONFIG.stars.countDesktop;
// Bad
const count = 1200;
```

**Performance patterns**:

- Debouncing: All resize handlers use 250ms timeouts
- Pause on hidden: All animations pause when `document.hidden === true`
- GPU acceleration: CSS animations use `translate3d`, `rotate`

## CRITICAL Directives for Claude Code

### YOU MUST Maintain Line Range Comments

**IMPORTANT**: `// Lines: X-Y` comments MUST be updated when editing JavaScript files.

When you edit ANY JavaScript file:

1. Count the actual lines in each section after your edits
2. Update `// Lines: X-Y` comments to match
3. Verify all section markers are accurate

Example:

```javascript
// ============================================================
// STATE MANAGEMENT
// Lines: 10-25  ← YOU MUST UPDATE THIS when editing this section
// ============================================================
```

### When Adding New Code

1. Check CONFIG first - can this be configured?
2. Check utils.js - is this a reusable helper?
3. Update module headers - add new exports to JSDoc @exports
4. Add JSDoc to all exported functions
5. **YOU MUST update line range comments**

### Code Generation Requirements

- Format for Prettier (2-space indent, semicolons, double quotes)
- Add JSDoc automatically (don't wait to be asked)
- Wrap DOM operations in try-catch
- Explain performance optimizations inline
- Include line range comments in generated code

## Project-Specific Quirks

**RGBA color strings**: Intentionally incomplete in CONFIG for performance. Opacity added at render time:

```javascript
color: "rgba(155, 176, 255,"; // No closing paren - INTENTIONAL
starCtx.fillStyle = `${star.color}${opacity})`; // Completed here
```

**Meteor angle presets**: Use preset angles (130-165°) for consistent aesthetic and keyframe pre-generation. Don't change to random.

**Night sky rotation**: `diagonal * 2.2` multiplier prevents visible edges during 360° rotation. sqrt(2) ≈ 1.414 is minimum; 2.2 adds margin for horizon positioning.

**Binary stars**: 2.5% of stars have companions (lower than reality's ~50% for visual clarity). Positioned randomly as static snapshot.

## Testing Checklist

1. Viewport resize → stars regenerate, meteors recalculate paths
2. Tab visibility → animations pause/resume correctly
3. Mobile breakpoint → star count changes at 768px
4. Low-end devices → aurora disabled on <4 CPU cores
5. Browser console → no errors or warnings
