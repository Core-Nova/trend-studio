---
name: debugging-frontend
description: Systematic approach to debugging frontend issues. Use when investigating render bugs, layout problems, state issues, or performance bottlenecks.
---

# Frontend Debugging

## When to Use

- Component not rendering as expected
- Layout or styling broken
- State not updating correctly
- Performance issues or jank
- Build errors or warnings

## Step 1: Reproduce and Isolate

1. Identify the exact steps to reproduce
2. Check if it's mobile-only, desktop-only, or both
3. Check if it's language-specific (EN vs BG)
4. Check if it's route-specific

## Step 2: Check the Console

Common errors in this app:

### WebGL Errors
```
WebGL: CONTEXT_LOST_WEBGL
```
Three.js slider context leaked. Check `dispose()` is called on unmount in `useHeroSliders`.

### THREE is not defined
CDN scripts haven't loaded yet. Check `index.html` script loader uses `s.async = false`.

### React Hook Errors
```
Cannot update a component while rendering a different component
```
State update is happening during render instead of in an effect or event handler.

## Step 3: Inspect the DOM

1. Right-click element > Inspect
2. Check computed styles for unexpected overrides
3. Check the box model for margin/padding issues
4. Use the Layout panel to debug flexbox/grid

### Common CSS Issues

**Element hidden**: Check for `display: none`, `visibility: hidden`, `opacity: 0`, or `overflow: hidden` on parent.

**Z-index not working**: z-index only works on positioned elements (`relative`, `absolute`, `fixed`, `sticky`). Check stacking context.

**Flex item not sizing correctly**: Check for `flex-shrink: 0` on items that shouldn't shrink, and `min-width: 0` on items that should allow text truncation.

## Step 4: Check React State

### Using React DevTools

1. Install React DevTools browser extension
2. Open Components tab
3. Select the component
4. Check props and state values
5. Click "Rendered by" to trace the component tree

### Adding Temporary Logging

```jsx
useEffect(() => {
  console.log('State changed:', { currentIndex, progress })
}, [currentIndex, progress])
```

Remove all `console.log` before committing.

## Common Issues in This App

### Images Not Loading

1. Check `src/data/imageImports.js` -- is the image imported?
2. Check the file exists in `src/assets/images/`
3. Check for typos in filename (hyphenated, no spaces)
4. Build and check `dist/assets/` for the processed image

### Three.js Slider Not Appearing

1. Is viewport > 768px? (sliders are desktop-only)
2. Are CDN scripts loaded? Check Network tab for three.min.js, bas.js, TweenMax.min.js
3. Is the container div present in DOM? Check `useRef` is attached
4. Check console for WebGL errors

### Route Not Working

1. Is the route in `App.jsx` `<Routes>`?
2. Is it lazy-loaded? Check the dynamic `import()` path
3. Try hard refresh (Ctrl+Shift+R) -- the browser may have cached old HTML
4. Check `404.html` exists in `dist/` (needed for SPA fallback on GitHub Pages)

### Styles Not Applying

1. Check class name matches between JSX and CSS
2. Check specificity -- another rule may override
3. Check media query -- the style may be in a breakpoint
4. Check the CSS order in `index.css` -- later rules win at same specificity

### Language Not Switching

1. Check `localStorage.getItem('trendLang')` in console
2. Check `document.documentElement.lang` matches
3. Check the translation key exists in `translations/index.js`
4. Check `t()` is called with the correct path: `t(translations.section.key)`

## Build Errors

### Vite Build Fails

```bash
npm run build 2>&1 | head -50
```

Common causes:
- Missing import (file doesn't exist)
- Circular dependency
- Syntax error in JSX

### ESLint Errors

```bash
npm run lint
```

Fix all errors before committing. The `no-unused-vars` rule ignores variables starting with uppercase (component imports for lazy loading).

## Performance Debugging

### Slow Initial Load

1. Check Network tab -- are images too large?
2. Check for render-blocking resources
3. Run Lighthouse > Performance

### Slow Interactions

1. Open Performance tab
2. Record the interaction
3. Look for long tasks (red bars > 50ms)
4. Check for forced reflows (layout recalculations)

### Memory Leaks

1. Open Memory tab
2. Take heap snapshot before and after navigation
3. Compare -- look for detached DOM nodes
4. Check Three.js resources are disposed on unmount
