---
name: trend-fe-pass
description: Audit the TREND Hair Boutique Studio React frontend for code health — lazy route splitting in `src/App.jsx`, ErrorBoundary at root, effect cleanup in custom hooks, memoization where it pays, JSDoc on non-obvious hook returns (`useSlider`, `useHeroSliders`, `useStories`), semantic HTML, no hardcoded env fallbacks, and Vite `manualChunks` strategy. Use when the user says "frontend pass", "fe review", "code health", "/trend-fe-pass", or asks for a hygiene pass over React patterns and build config. Flag missing cleanup, missing ErrorBoundary, hardcoded fallback IDs, and undocumented hook return shapes.
---

# TREND frontend pass

Focused React/Vite hygiene review. Full lens in memory `lens-frontend.md`. Project context in `CLAUDE.md`.

## Inputs

- Default: walk `src/App.jsx`, `src/hooks/`, `src/lib/`, `vite.config.js`.
- If user names files, scope there.

## Checklist

1. **Route splitting.** `src/App.jsx` should `React.lazy()` every non-Home page route. Flag eager imports of large pages.
2. **ErrorBoundary.** Confirm a `<ErrorBoundary>` wraps the route tree in `src/App.jsx`. If missing, flag and propose `src/components/ErrorBoundary.jsx` (small class component, no extra deps).
3. **Suspense fallback.** Current fallback is a spinner — flag if you've added a new lazy route with no skeleton.
4. **Effect cleanup.** For every `useEffect` in changed hooks/components: if it attaches a listener, observer, timer, subscription, or rAF, it must return a cleanup function. Walk `useIsMobile`, `useCarousel`, `useScrollReveal`, `useSlider`, `useStories` as references.
5. **Memoization.** `useMemo`/`useCallback` only when deps are stable AND passed to memoized children OR computation is heavy. Flag cargo-culted wrappers; flag missing wraps on heavy derivations.
6. **JSDoc.** Non-obvious return shapes — `useSlider`, `useHeroSliders`, `useStories`, `useGalleryImages` — should have `@returns` JSDoc. Flag undocumented complex returns.
7. **Semantic HTML.** Prefer `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` over `<div>` for interactive/structural roles.
8. **Env config.** No hardcoded fallback secrets/IDs. `src/lib/analytics.js` previously had a fallback measurement ID — flag any return.
9. **Vite config.** `vite.config.js` — note absence of `manualChunks`; recommend if vendor splitting becomes a perf issue. Verify image-tools/optimizer plugins still configured.
10. **Tests.** Note current sparse coverage (4 test files). For new tricky logic (state machines, ready-flag races), propose a vitest test colocated under the hook.

## Output

Findings in: **Blockers** (missing ErrorBoundary, missing cleanup), **Health** (memo, JSDoc, semantics), **Notes** (build config).

Ask before applying.
