---
name: responsive-mobile-first
description: Build responsive layouts following mobile-first principles. Use when creating new sections, fixing mobile layout bugs, or adapting desktop designs for small screens.
---

# Responsive & Mobile-First Design

## When to Use

- Creating new page sections or components
- Fixing layout issues on specific viewport sizes
- Adapting a desktop design for mobile
- Debugging touch interaction problems

## Mobile-First Approach

Write base styles for the smallest screen, then add breakpoints for larger screens:

```css
/* Base: mobile (320px+) */
.services-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
    .services-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    .services-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
```

## Breakpoints Used in TREND

| Name | Width | Usage |
|------|-------|-------|
| Mobile | 0-767px | Single column, full-screen nav overlay, sticky booking |
| Desktop | 768px+ | Multi-column, Three.js sliders, scroll-based nav |

The `useIsMobile(768)` hook matches this breakpoint in JavaScript.

## Common Mobile Patterns

### Full-Width Sections

```css
.section {
    padding: 40px 20px;
}

@media (min-width: 768px) {
    .section {
        padding: 80px 40px;
    }
}
```

### Stack to Row

```css
.contact-content {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

@media (min-width: 768px) {
    .contact-content {
        flex-direction: row;
    }
}
```

### Mobile Navigation Overlay

```css
@media (max-width: 767px) {
    .nav-links {
        position: fixed;
        inset: 0;
        background: rgba(26, 26, 26, 0.98);
        flex-direction: column;
        justify-content: center;
        align-items: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
    }
    .nav-links.active {
        opacity: 1;
        visibility: visible;
    }
}
```

### Sticky Bottom CTA

```css
.sticky-booking {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
    display: flex;
}
```

## Touch Optimization

### Minimum Tap Targets

All interactive elements must be at least 48x48px:

```css
.btn { min-height: 48px; }
.nav-links a { padding: 12px 16px; }
```

### Disable Hover Effects on Touch

```css
@media (hover: hover) {
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-gold);
    }
}
```

### Prevent Double-Tap Zoom

```css
button, a { touch-action: manipulation; }
```

### Scroll Snap for Carousels

```css
.carousel {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}
.carousel > * {
    scroll-snap-align: center;
    flex: 0 0 85%;
}
```

## Safe Areas (Notch Devices)

```css
.sticky-booking {
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.hero {
    padding-top: env(safe-area-inset-top, 0);
}
```

## Viewport Units

```css
.hero { min-height: 100svh; }    /* Small viewport (accounts for browser chrome) */
.modal { height: 100dvh; }       /* Dynamic viewport (changes as browser chrome shows/hides) */
.fallback { height: 100vh; }     /* Legacy viewport (includes browser chrome on mobile) */
```

Prefer `svh` for fixed-height sections and `dvh` for fullscreen overlays.

## Images

### Responsive Images

```jsx
<img
  src={image}
  alt="TREND salon"
  loading="lazy"
  width="600"
  height="800"
/>
```

Always set `width` and `height` to prevent CLS. Use `loading="lazy"` for below-the-fold images.

### Object Fit

```css
.gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

## Testing Mobile Views

### Device Sizes to Test

- iPhone SE: 375x667
- iPhone 14 Pro: 393x852
- Samsung Galaxy S21: 360x800
- iPad Mini: 768x1024

### Using DevTools

1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select a device preset or enter custom dimensions
4. Test touch interactions (DevTools simulates touch events)

### Using the Browser MCP

For automated testing, use the cursor-ide-browser MCP to navigate to `http://localhost:5173` and set viewport to mobile dimensions.

## Conditional Rendering Pattern

Use `useIsMobile()` for rendering different component trees:

```jsx
const isMobile = useIsMobile()

return isMobile ? <MobileGallery /> : <DesktopGallery />
```

Use CSS media queries for styling differences that don't require different DOM structures.
