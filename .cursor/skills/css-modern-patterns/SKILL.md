---
name: css-modern-patterns
description: Modern CSS patterns and techniques for the TREND app. Use when writing new styles, debugging layout issues, improving responsive design, or optimizing CSS performance.
---

# CSS Modern Patterns

## When to Use

- Adding styles for new components or sections
- Fixing layout or responsive issues
- Improving animations or transitions
- Optimizing CSS for performance

## Layout Techniques

### Container Queries (when scoping to component width)

```css
.card-container {
    container-type: inline-size;
    container-name: card;
}

@container card (min-width: 400px) {
    .card { flex-direction: row; }
}
```

### Logical Properties (better i18n support)

```css
.element {
    margin-inline: auto;         /* left + right */
    padding-block: 20px;         /* top + bottom */
    border-inline-start: 2px solid var(--gold-primary);
}
```

### Modern Centering

```css
/* Grid centering (simplest) */
.center { display: grid; place-items: center; }

/* Flexbox centering */
.center { display: flex; align-items: center; justify-content: center; }
```

### Scroll Snap (used in gallery carousel)

```css
.carousel {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;          /* Firefox */
}
.carousel::-webkit-scrollbar { display: none; }
.carousel > * {
    flex: 0 0 85%;
    scroll-snap-align: center;
}
```

## Responsive Design

### Mobile-First with `min-width`

Write base styles for mobile, then add desktop overrides:

```css
.section { padding: 40px 20px; }

@media (min-width: 768px) {
    .section { padding: 80px 40px; }
}
```

### `clamp()` for Fluid Typography

```css
.hero-title {
    font-size: clamp(2.5rem, 8vw, 7rem);
    letter-spacing: clamp(4px, 1.5vw, 15px);
}
```

### Safe Viewport Units

```css
.hero { min-height: 100svh; }   /* accounts for mobile browser chrome */
.modal { height: 100dvh; }      /* dynamic viewport height */
```

### `aspect-ratio` (no padding hack needed)

```css
.gallery-item { aspect-ratio: 3 / 4; }
.hero-slider { aspect-ratio: 2 / 3; }
```

## Animation and Performance

### `will-change` (sparingly)

Only apply to elements that will actually animate:

```css
.stories-viewer__image { will-change: opacity; }
```

Remove it after animation completes if possible.

### GPU-Accelerated Properties

Prefer `transform` and `opacity` for animations. Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`.

```css
/* Good - composited */
.btn:hover { transform: translateY(-2px); }

/* Bad - triggers layout */
.btn:hover { margin-top: -2px; }
```

### `prefers-reduced-motion`

Always respect this media query:

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms;
        animation-iteration-count: 1;
        transition-duration: 0.01ms;
        scroll-behavior: auto;
    }
}
```

### Smooth Transitions

Standard transition for interactive elements:

```css
.interactive {
    transition: color 0.3s ease, background-color 0.3s ease, transform 0.3s ease;
}
```

## Selectors and Specificity

### `:where()` for Zero Specificity

```css
:where(.nav-links a) { color: var(--white); }
/* Easy to override without specificity wars */
```

### `:is()` for Grouping

```css
:is(h1, h2, h3) { font-family: var(--font-display); }
```

### `:has()` (parent selector)

```css
.price-service:has(.price-service__options) {
    cursor: pointer;
}
```

### `:focus-visible` (keyboard-only focus)

```css
a:focus-visible,
button:focus-visible {
    outline: 2px solid var(--gold-primary);
    outline-offset: 2px;
}
```

## TREND-Specific Patterns

### BEM Naming

```
.block
.block__element
.block--modifier
.block__element--modifier
```

### Single Stylesheet

All styles live in `src/index.css`. Do not create per-component CSS files.

### CSS Custom Properties

Use the existing design tokens in `:root`. Do not hardcode colors or fonts.

### Gold Theme Consistency

```css
.accent-border { border-color: var(--gold-primary); }
.accent-bg { background: var(--gold-primary); color: var(--black); }
.accent-text { color: var(--gold-primary); }
```

## Debugging Checklist

1. Check for layout shifts (CLS) -- set explicit `width`/`height` or `aspect-ratio` on images
2. Check for z-index stacking issues -- the app uses: nav (1000), sticky booking (999), stories viewer (2000)
3. Check mobile viewport -- test at 390x844 (iPhone 14 Pro)
4. Check `prefers-reduced-motion` -- disable animations for users who prefer it
5. Verify touch targets -- minimum 48px on interactive elements
