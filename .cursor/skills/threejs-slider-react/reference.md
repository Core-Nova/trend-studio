# Slider API Reference

## Exports from `src/lib/slider.js`

### `createImageSlider({ container, images, width, height, delay })`

Creates a single Three.js triangle slider in the given container.

**Parameters:**
- `container` (HTMLElement) -- DOM element to render into
- `images` (string[]) -- array of image URLs (external CDN)
- `width` (number) -- plane width in Three.js units
- `height` (number) -- plane height in Three.js units
- `delay` (number, default 0) -- milliseconds to wait before starting the first transition

**Returns:** `() => void` -- dispose function that stops animation and cleans up WebGL resources. Returns `null` if container is missing, images are empty, or Three.js globals are unavailable.

### `createGallerySliders({ containers, images, staggerDelay })`

Creates multiple sliders with staggered image arrays for the gallery section.

**Parameters:**
- `containers` (HTMLElement[]) -- array of DOM elements
- `images` (string[]) -- gallery image URLs
- `staggerDelay` (number, default 200) -- milliseconds between each container's start

**Returns:** `() => void` -- dispose function that cleans up all created sliders. Returns `null` if images are empty.

Each container gets a rotated view of the images array: container 0 starts at image 0, container 1 starts at image 1, etc.

## Internal Architecture

### Transition Cycle

1. Load image[0] into slideOut, image[1] into slideIn
2. Tween both slides' `uTime` uniform from 0 to `totalDuration` over 3 seconds
3. On complete: copy slideIn's loaded image reference to slideOut (no re-download), load the next image into slideIn
4. Wait 1 second, repeat

The image-copy optimization avoids re-downloading the current image on each cycle.

### Timing Constants

```
minDuration  = 0.8   -- shortest per-triangle animation
maxDuration  = 1.2   -- longest per-triangle animation
maxDelayX    = 0.9   -- horizontal stagger across the plane width
maxDelayY    = 0.125 -- vertical stagger
stretch      = 0.11  -- random variation per triangle
totalDuration = maxDuration + maxDelayX + maxDelayY + stretch = 2.235
```

To make transitions faster, reduce `maxDuration`. To make the sweep effect more dramatic, increase `maxDelayX`.

### GLSL Vertex Shader

Each triangle has its own animation via vertex attributes:

- `aAnimation.x` -- delay before this triangle starts animating
- `aAnimation.y` -- duration of this triangle's animation
- `aStartPosition` -- where the triangle starts (its centroid)
- `aControl0`, `aControl1` -- cubic bezier control points
- `aEndPosition` -- where the triangle ends (same as start for assembled state)

The shader computes progress per-triangle:
```glsl
float tTime = clamp(uTime - tDelay, 0.0, tDuration);
float tProgress = ease(tTime, 0.0, 1.0, tDuration);
```

For "in" phase: `transformed *= tProgress` (scales from 0 to 1, assembling).
For "out" phase: `transformed *= 1.0 - tProgress` (scales from 1 to 0, disassembling).

Both phases also move along the bezier curve.

### Classes (Internal)

**`Slide extends THREE.Mesh`** -- a mesh with SlideGeometry and BAS material. Has `time` getter/setter for the `uTime` uniform and `setImage()` for swapping textures.

**`SlideGeometry extends THREE.BAS.ModelBufferGeometry`** -- creates a subdivided plane, separates faces, and buffers per-triangle animation attributes. Overrides `bufferPositions()` to store positions relative to face centroids (required for per-triangle movement).

**`THREERoot`** -- manages WebGL renderer, camera, scene, and animation loop. Has `dispose()` method for cleanup.

These classes are NOT exported. Use `createImageSlider` and `createGallerySliders` instead.

## CDN Dependencies

| Library | Version | URL | Global |
|---------|---------|-----|--------|
| Three.js | r73 | `cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js` | `THREE` |
| BAS | custom | `s3-us-west-2.amazonaws.com/s.cdpn.io/175711/bas.js` | `THREE.BAS` |
| GSAP TweenMax | 1.18 | `cdnjs.cloudflare.com/ajax/libs/gsap/1.18.0/TweenMax.min.js` | `TweenMax`, `Power0` |

Three.js r73 is pinned. Newer versions removed `THREE.Geometry` which BAS depends on. Do NOT upgrade.

## Known Limitations

- Desktop only -- too heavy for mobile WebGL
- Requires CDN globals -- cannot be npm-installed due to BAS dependency
- `class extends THREE.Mesh` evaluated at module load -- Three.js CDN scripts must be in `<head>` before any module code runs
- Each slider creates one WebGL context -- browsers limit total contexts (typically 8-16)
