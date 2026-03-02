---
name: react-performance
description: Optimize React component performance, reduce bundle size, and improve Core Web Vitals. Use when investigating slow renders, large bundles, or poor Lighthouse scores.
---

# React Performance Optimization

## When to Use

- Investigating slow renders or janky interactions
- Reducing bundle size
- Improving Lighthouse / Core Web Vitals scores
- Adding lazy loading or code splitting

## Code Splitting

### Route-Level Splitting (already in place)

```jsx
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
```

All non-home pages are already lazy-loaded in `App.jsx`. HomePage is eagerly loaded since it's the landing page.

### Component-Level Splitting

For heavy components that aren't always visible:

```jsx
const HeavyChart = lazy(() => import('./components/HeavyChart'))

const Dashboard = () => (
  <Suspense fallback={<div className="skeleton" />}>
    <HeavyChart />
  </Suspense>
)
```

## Memoization (Use Sparingly)

### `React.memo` -- Prevent Re-renders

Only wrap components that:
- Receive complex props and render expensively
- Have parent components that re-render frequently

```jsx
export const ServiceCard = React.memo(({ icon, name, count }) => (
  <div className="service-card">
    <span>{icon}</span>
    <h3>{name} ({count})</h3>
  </div>
))
```

### `useMemo` -- Cache Expensive Computations

```jsx
const sortedItems = useMemo(
  () => items.sort((a, b) => a.price - b.price),
  [items]
)
```

### `useCallback` -- Stable Function References

Use when passing callbacks to memoized children or as effect dependencies:

```jsx
const handleClose = useCallback(() => setOpen(false), [])
```

### When NOT to Memoize

- Simple components with primitive props
- Components that always re-render anyway (parent state changes)
- Inline event handlers in non-list contexts

## Image Optimization

### Lazy Loading

```jsx
<img src={url} alt="description" loading="lazy" width="600" height="800" />
```

Always set `width` and `height` to prevent layout shifts.

### Preloading Critical Images

For above-the-fold images (hero):

```jsx
useEffect(() => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = heroImage
  document.head.appendChild(link)
}, [])
```

The hero already uses static `<img>` previews for instant display before Three.js initializes.

### Vite Image Optimization

The app uses `vite-plugin-image-optimizer` which compresses images at build time. No runtime optimization needed.

## Rendering Optimization

### Avoid Unnecessary State

Not everything needs `useState`. Derived values should be computed inline:

```jsx
const isExpanded = expandedId === item.id  // derived, not state
```

### Avoid Object/Array Literals in JSX

These create new references every render:

```jsx
// Bad - new object every render
<div style={{ color: 'red' }}>

// Good - stable reference
const errorStyle = { color: 'red' }
<div style={errorStyle}>
```

### Keys in Lists

Always use stable, unique keys. Never use array index as key if the list can reorder:

```jsx
{categories.map(cat => <ServiceCard key={cat.id} {...cat} />)}
```

## Bundle Size

### Check Bundle Size

```bash
npm run build
```

The build output shows file sizes. The main JS bundle should stay under 300KB gzipped.

### Tree Shaking

Import only what you need:

```jsx
// Good - tree-shakeable
import { useCallback, useState } from 'react'

// Bad - imports everything
import React from 'react'
const { useState } = React
```

### Analyze the Bundle

```bash
npx vite-bundle-visualizer
```

## Core Web Vitals Checklist

### LCP (Largest Contentful Paint)

- Hero images use static `<img>` previews for instant display
- Fonts use `display=swap` via Google Fonts
- Three.js CDN scripts use `async=false` for ordered non-blocking load

### CLS (Cumulative Layout Shift)

- All images have `width`/`height` or `aspect-ratio`
- Hero section uses `min-height: 100svh`
- Font loading uses `font-display: swap`

### INP (Interaction to Next Paint)

- Event handlers should complete in under 200ms
- Heavy computations should use `requestAnimationFrame` or `requestIdleCallback`
- The stories viewer timer uses `requestAnimationFrame` instead of `setInterval`

## Profiling

### React DevTools Profiler

1. Open React DevTools > Profiler tab
2. Record an interaction
3. Look for components that re-render unnecessarily
4. Apply `React.memo` or `useMemo` only where profiling shows a bottleneck

### Browser Performance Tab

1. Open DevTools > Performance
2. Record a page load or interaction
3. Look for long tasks (>50ms)
4. Check for layout thrashing (forced reflows)
