# Claude Code Context - Stardew Labs Website

## Project Overview

Static single-page website with animated night sky hero section. Zero build process, vanilla JS with ES6 modules.

## Module Architecture

### Dependency Graph

```
main.js (entry point)
├── imports: config.js, utils.js, stars.js, meteors.js
├── initializes all systems
└── handles global events (resize, visibility)

stars.js
├── imports: config.js, utils.js
├── exports: initializeStars, generateStars, setPageVisible, renderStars, getCanvasState
└── manages canvas-based star field

meteors.js
├── imports: config.js, utils.js
├── exports: initializeMeteorSystem, generateMeteorKeyframes, updateHeroDiagonal, startMeteors, stopMeteors, restartMeteors, setMeteorPageVisible
└── manages DOM-based CSS meteor animations

utils.js
├── imports: config.js
├── exports: safeQuerySelector, getStarCount, isLowEndDevice, easeInOutSine, pauseAnimations, resumeAnimations, initializeNightSkySize
└── shared helper functions

config.js
├── imports: none
├── exports: CONFIG (single frozen object)
└── all configuration constants
```

## Import/Export Map

### config.js

- **Exports**: `CONFIG` (frozen configuration object)
- **Imports**: None
- **Used by**: All other modules

### utils.js

- **Exports**:
  - `safeQuerySelector(selector, errorMsg)` - Safe DOM query with error handling
  - `getStarCount()` - Returns star count based on viewport width
  - `isLowEndDevice()` - Device capability detection
  - `easeInOutSine(t)` - Easing function for animations
  - `pauseAnimations(nightSky, meteorsContainer, auroraContainer)` - Pause CSS animations
  - `resumeAnimations(nightSky, meteorsContainer, auroraContainer)` - Resume CSS animations
  - `initializeNightSkySize()` - Calculate and set night sky container dimensions
- **Imports**: `CONFIG` from config.js
- **Used by**: main.js, stars.js, meteors.js

### stars.js

- **Exports**:
  - `initializeStars()` - Initialize canvas and start rendering
  - `generateStars(canvasWidth, canvasHeight)` - Generate star data array
  - `renderStars()` - Canvas animation loop (60fps)
  - `setPageVisible(visible)` - Update visibility state for pause/resume
  - `getCanvasState()` - Returns {canvas, ctx} for external updates
- **Imports**:
  - `CONFIG` from config.js
  - `getStarCount, easeInOutSine, safeQuerySelector` from utils.js
- **Used by**: main.js
- **Internal state**: `starCanvas`, `starCtx`, `stars[]`, `planets[]`, `animationFrameId`, `isPageVisible`

### meteors.js

- **Exports**:
  - `initializeMeteorSystem()` - Initialize DOM references and cache dimensions
  - `generateMeteorKeyframes()` - Generate dynamic CSS @keyframes
  - `updateHeroDiagonal()` - Recalculate dimensions on resize
  - `startMeteors()` - Start meteor animation systems
  - `stopMeteors()` - Stop all timers and cleanup DOM
  - `restartMeteors()` - Clean restart after stop
  - `setMeteorPageVisible(visible)` - Update visibility state
- **Imports**:
  - `CONFIG` from config.js
  - `safeQuerySelector` from utils.js
- **Used by**: main.js
- **Internal state**: `meteorsContainer`, `heroElement`, `heroDiagonal`, `isShowerActive`, `isPageVisible`, `activeMeteorTimeouts[]`, `activeShowerTimeouts[]`

### main.js

- **Exports**: None (entry point)
- **Imports**:
  - `CONFIG` from config.js
  - `initializeNightSkySize, isLowEndDevice, getStarCount, pauseAnimations, resumeAnimations, safeQuerySelector` from utils.js
  - `initializeStars, generateStars, setPageVisible as setStarPageVisible, getCanvasState` from stars.js
  - `initializeMeteorSystem, generateMeteorKeyframes, updateHeroDiagonal, startMeteors, stopMeteors, restartMeteors, setMeteorPageVisible` from meteors.js
- **Loaded by**: index.html as `<script type="module" src="/js/main.js">`

## HTML Element References

### Required IDs (queried by JS)

- `#nightSky` - Rotating sky container (queried by: main.js, stars.js, utils.js)
- `#starCanvas` - Canvas element for stars (queried by: stars.js)
- `#auroraContainer` - Aurora effect container (queried by: main.js)
- `#meteorsContainer` - Meteor DOM container (queried by: main.js, meteors.js)

### Required Classes (queried by JS)

- `.hero` - Hero section container (queried by: meteors.js, utils.js)
- `.meteor` - Individual meteor elements (queried by: meteors.js for cleanup)

### Data Attributes (for clarity)

All major components have `data-component` attributes for easier querying and testing.

## Code Style Conventions

### Prettier Configuration

This project outputs code in Prettier-compatible format with these conventions:

- **Indent**: 2 spaces
- **Semicolons**: Always
- **Quotes**: Double quotes for strings
- **Trailing commas**: ES5 (objects, arrays)
- **Line width**: 80 characters where practical
- **Arrow function parens**: Always

If you add Prettier later, use this `.prettierrc.json`:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### File Structure Conventions

1. **Section markers**: Use `// ============================================================` for major sections
2. **Line range comments**: MUST be kept updated. Format: `// Lines: X-Y`
3. **JSDoc**: All exported functions have JSDoc with @param and @returns
4. **Error handling**: All DOM queries use try-catch, all functions have error boundaries
5. **Constants**: ALL magic numbers live in CONFIG object

### Naming Conventions

- **Functions**: camelCase, descriptive verbs (`generateStars`, `initializeMeteorSystem`)
- **Variables**: camelCase (`starCanvas`, `heroDiagonal`)
- **Constants**: SCREAMING_SNAKE_CASE (`METEOR_ANGLES`, `DISTANCE_TIERS`)
- **CSS classes**: kebab-case (`.night-sky`, `.meteor-head`)
- **File names**: kebab-case (`main.js`, `meteors.js`)

### Comment Style

- **Module headers**: JSDoc style with @module, @exports, @imports, @description
- **Function headers**: JSDoc with @param, @returns, @example where helpful
- **Inline comments**: Explain "why" not "what", especially for math and performance optimizations
- **Architecture notes**: Major architectural decisions documented inline

## Common Patterns

### Safe DOM Queries

Always use `safeQuerySelector()` instead of raw querySelector/getElementById:

```javascript
const element = safeQuerySelector("#myId", "Element not found");
```

### State Management

- **Global state**: Kept in module-scoped variables (not window)
- **Visibility tracking**: Each system has its own `isPageVisible` flag
- **Animation IDs**: Always tracked for cleanup (`animationFrameId`, timeout arrays)

### Performance Patterns

1. **Debouncing**: All resize handlers use debounced timeouts (250ms default)
2. **Pause on hidden**: All animations pause when `document.hidden === true`
3. **Device pixel ratio**: Canvas uses DPR scaling for retina displays
4. **GPU acceleration**: CSS animations use `translate3d`, `rotate` for GPU compositing

### Configuration Access

Always read from `CONFIG` object, never hardcode values:

```javascript
// Good
const count = CONFIG.stars.countDesktop;

// Bad
const count = 1200;
```

## Testing Approach

### Manual Testing Checklist

1. **Viewport resize**: Stars regenerate, meteors recalculate paths
2. **Tab visibility**: Animations pause when hidden, resume when visible
3. **Mobile breakpoint**: Star count changes at 768px width
4. **Low-end devices**: Aurora disabled on <4 CPU cores
5. **Browser console**: No errors or warnings

### Visual Regression Points

- Star colors match spectral distribution (blue, white, yellow, orange, red)
- Meteors travel diagonally from top-right to bottom-left
- Sky container covers viewport during full 360° rotation
- Horizon curve aligns with hero/content boundary

## Important Directives for Claude Code

### CRITICAL: Maintaining Line Range Comments

**ALWAYS update `// Lines: X-Y` comments when editing files.**

When you edit ANY JavaScript file:

1. **Before returning code**: Count the actual lines in each section
2. **Update line range comments**: Must match actual line numbers after your edits
3. **Account for Prettier**: If prettier will reformat, estimate line changes
4. **Verify sections**: Make sure all section markers are still accurate

Example of proper line range maintenance:

```javascript
// ============================================================
// STATE MANAGEMENT
// Lines: 10-25  ← UPDATE THIS when editing this section
// ============================================================
```

If you're unsure about line numbers after editing:

1. Output the code
2. Count lines in each section
3. Update comments before finalizing

### When Adding New Code

1. **Check CONFIG first**: Can this be configured? Add to config.js
2. **Check utils.js**: Is this a reusable helper? Add to utils.js
3. **Update module headers**: Add new exports to JSDoc @exports list
4. **Update this context.md**: Add new functions to import/export map
5. **Add JSDoc**: All exported functions need @param, @returns, @description
6. **Update line ranges**: Recalculate all affected `// Lines: X-Y` comments

### When Refactoring

1. **Update import/export map in context.md**
2. **Update module headers in affected files**
3. **Verify all line range comments**
4. **Update ARCHITECTURE.md if data flow changes**
5. **Check for orphaned DOM queries** (elements that no longer exist)

### Code Generation Preferences

- **Format for Prettier**: Use 2-space indent, semicolons, double quotes
- **Add JSDoc**: Don't wait to be asked
- **Error boundaries**: Wrap DOM operations in try-catch
- **Performance comments**: Explain optimizations inline
- **Line range comments**: Include in generated code

## Common Operations

### Adding a New Configuration Value

1. Add to `config.js` with JSDoc type definition
2. Update relevant module to import and use it
3. Document in comments why this is configurable

### Adding a New Module

1. Create file in `js/` directory
2. Add imports at top (config.js first, then utils.js)
3. Add module header JSDoc with @module, @exports, @imports
4. Export functions explicitly
5. Import in main.js if needed at startup
6. Update this context.md with dependency graph

### Debugging Tips

- **Star rendering**: Check browser DevTools Canvas inspector
- **Meteor timing**: Console.log timeout IDs to track lifecycle
- **Performance**: Chrome DevTools Performance tab, watch for dropped frames
- **Visibility issues**: Set breakpoints in visibility change handlers
- **Config changes**: All config is hot-reloadable (refresh page)

## Future Considerations

### If Adding Build Process

If you ever add a build tool:

- Keep module structure (Rollup/esbuild can bundle)
- Keep CONFIG as a single file (easy to externalize)
- Add prettier with pre-commit hook
- Update this document with build commands

### If Adding TypeScript

Convert in this order:

1. config.js → config.ts (types already documented in JSDoc)
2. utils.js → utils.ts
3. stars.js → stars.ts
4. meteors.js → meteors.ts
5. main.js → main.ts

### If Adding Testing

Recommended test structure:

- Unit tests: utils.js functions (pure functions)
- Integration tests: Mock canvas for stars.js
- E2E tests: Playwright for visual regression

## Project-Specific Quirks

### RGBA Color String Construction

Star/planet colors are intentionally incomplete strings in CONFIG:

```javascript
color: "rgba(155, 176, 255,"; // No closing opacity and paren
```

This is INTENTIONAL. Opacity is added at render time:

```javascript
starCtx.fillStyle = `${star.color}${opacity})`; // Completes the string
```

Don't "fix" this - it's a performance optimization to avoid string parsing.

### Meteor Angle Presets

Meteors use preset angles (130-165°) rather than random angles. This ensures consistent visual aesthetic and allows keyframe pre-generation. Don't change to fully random unless you refactor the keyframe system.

### Night Sky Rotation Math

The `diagonal * 2.2` multiplier is NOT arbitrary:

- Container must cover viewport corners during 360° rotation
- sqrt(2) ≈ 1.414 is minimum for square covering rotated square
- 2.2 provides margin to account for horizon positioning and prevent visible edges
- Changing this will cause visible canvas edges during rotation

### Binary Star Systems

2.5% of stars have companions. This is lower than reality (~50% for main sequence stars) for visual clarity. Companions are positioned in random directions, not orbital planes, because this is a static snapshot.
