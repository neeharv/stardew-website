# Stardew Labs Website

Static single-page website with animated night sky hero section featuring stars, planets, meteors, and aurora effects.

## Tech Stack

- **Vanilla HTML/CSS/JS** - No frameworks or dependencies
- **Canvas API** - Star and planet rendering with realistic spectral colors
- **CSS Animations** - GPU-accelerated meteor trails and aurora effects
- **Zero build process** - Direct deployment, no compilation required

## Deployment

- **Platform**: Cloudflare Pages
- **Branch**: `main` → production
- **URL**: https://stardew.work/
- **Features**: HTTP/2 multiplexing, auto-minify, Brotli compression, global CDN

## Performance Characteristics

- **60fps** canvas animation with requestAnimationFrame
- **Responsive**: Mobile (800 stars) + Desktop (1200 stars)
- **Efficient**: Animations pause when tab hidden to save CPU/GPU
- **Retina-ready**: Device pixel ratio scaling for sharp rendering
- **Low-end detection**: Aurora disabled on devices with <4 CPU cores

## File Structure

```
/
├── index.html          # Main HTML structure (~80 lines)
├── css/
│   └── styles.css      # All styles (hero, content, animations)
├── js/
│   ├── config.js       # Configuration constants (tweakable values)
│   ├── utils.js        # Shared helper functions
│   ├── stars.js        # Star/planet generation & canvas rendering
│   ├── meteors.js      # Meteor system with CSS keyframe generation
│   └── main.js         # Initialization & orchestration
├── _headers            # Cloudflare security headers
├── og-image.jpg        # Open Graph preview image
└── twitter-image.jpg   # Twitter card preview image
```

## Architecture Overview

### 1. Rotating Sky Container

- Square container positioned at horizon line (bottom of hero section)
- Rotates 360° over 900s to simulate Earth's rotation
- Sized to cover viewport during rotation (diagonal × 2.2)
- Contains canvas with stars and planets

### 2. Star Field System (Canvas-based)

- **Stars**: Realistic spectral colors (O-B through M class stars)
- **Distribution**: 30% static, 70% twinkling
- **Binary systems**: 2.5% of stars have companion stars
- **Planets**: 5 bright non-twinkling objects positioned aesthetically
- **Performance**: Uses requestAnimationFrame for smooth rendering

### 3. Meteor System (DOM-based CSS)

- Two parallel systems: random single meteors + periodic showers
- Preset angles (130-165°) with dynamically generated keyframes
- Distance tiers (short/medium/long) for visual depth
- Timeouts tracked for proper pause/resume on visibility change

### 4. Aurora System (Pure CSS)

- Three overlapping gradient bands with wave animations
- Disabled by default (can be enabled via `CONFIG.aurora.enabled`)
- Automatically hidden on low-end devices for performance

## Configuration

All tweakable values are centralized in `js/config.js`:

- **Star counts**: Desktop vs mobile breakpoints
- **Meteor timing**: Intervals, shower frequency, durations
- **Animation speeds**: Rotation period, twinkle rates
- **Performance**: Debounce delays, device detection thresholds
- **Feature flags**: Aurora enable/disable

## Local Development

```bash
# Serve locally (any static server works)
python3 -m http.server 8000
# or
npx serve .

# Open browser
open http://localhost:8000
```

## Cloudflare Pages Deployment

Push to `main` branch - Cloudflare Pages auto-deploys with:

- Automatic HTTPS
- Global CDN distribution
- Auto-minification (HTML/CSS/JS)
- Brotli compression
- HTTP/2 multiplexing

## Browser Compatibility

- Modern browsers (Chrome/Firefox/Safari/Edge)
- Requires: Canvas API, CSS animations, requestAnimationFrame
- Graceful degradation for older browsers (animations may not run)

## Performance Notes

- **File splitting benefits** on Cloudflare Pages (HTTP/2):
  - Parallel downloads (no waterfall penalty)
  - Better caching (CSS/JS cached separately from HTML)
  - Efficient compression (Brotli works better on separate files)

- **Canvas optimization**:
  - Device pixel ratio scaling for retina displays
  - Animation pauses when tab hidden
  - Star count adapts to viewport size

- **CSS animation optimization**:
  - GPU-accelerated transforms (translate3d, rotate)
  - Dynamic keyframe generation (responsive to window size)
  - Will-change hints for animation properties

## Code Organization for Claude Code

Each JavaScript file includes:

- **Section markers**: `// ============================================================`
- **Line range comments**: Help AI assistant locate code quickly
- **Data attributes**: Semantic HTML queries (`data-component="hero"`)
- **JSDoc type hints**: Function signatures and config structure
- **Configuration consolidation**: All magic numbers in CONFIG object

This structure optimizes for AI-assisted development while maintaining zero build complexity.

## License

© 2025 Stardew Labs. All rights reserved.
