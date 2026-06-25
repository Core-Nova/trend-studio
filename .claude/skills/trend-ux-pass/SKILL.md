---
name: trend-ux-pass
description: Audit the TREND Hair Boutique Studio site for mobile-first UX and accessibility — tap target sizes (≥44px), `aria-label`/`aria-pressed`/`aria-expanded` on toggles and dialogs, `:focus-visible` reachability, `prefers-reduced-motion` handling, skip link, WCAG-AA color contrast (especially gold-on-cream small text), responsive breakpoints (1600/1200/992/768/480). Use when the user says "ux pass", "a11y review", "accessibility check", "/trend-ux-pass", or asks to verify a UI change holds mobile/a11y standards. Use Claude Preview tools (`preview_eval`, `preview_resize`, `preview_inspect`) to verify rather than asserting from code alone.
---

# TREND UX pass

Focused mobile-first + accessibility review. Full lens in memory `lens-ux.md`. Project context in `CLAUDE.md`.

## Inputs

- If user names a component/route, scope there.
- Otherwise: walk Home → Gallery → Services → About → Contact with the focus on changed components.

## Checklist

1. **Tap targets.** Every interactive element must have ≥44×44 CSS pixel hit area on mobile (`preview_resize` to 375×667). Use `preview_inspect` to read computed width/height including padding. Flag small icons, link text without padding.
2. **ARIA.**
   - Icon-only buttons need `aria-label`.
   - Stateful toggles (EN/BG language) need `aria-pressed`.
   - Disclosures (menu) need `aria-expanded` (already present on `NavigationView.jsx` menu).
   - Modals (`StoriesViewer`) need `role="dialog"` + `aria-modal="true"` (already present).
3. **Focus.** Tab through; every interactive element must reach and show the gold `:focus-visible` ring (`src/index.css` ~lines 57-61). Flag `outline: none` without replacement.
4. **Skip link.** First Tab on home should expose the skip-to-content link (`NavigationView.jsx:10`).
5. **Reduced motion.** Any new animation must be in the `@media (prefers-reduced-motion: reduce)` block in `src/index.css` (existing block at ~2841-2852).
6. **Contrast.** Use `preview_eval` to read computed colors, then check against WCAG AA (4.5:1 normal text, 3:1 large). Special attention: pale gold on cream small text, gold on dark.
7. **Responsive.** Resize through 1600 / 1200 / 992 / 768 / 480 — flag overflow, broken layout, illegible text. Avoid `preview_screenshot` on hero per memory `preview-screenshot-raf-timeout`; use `preview_eval` + `getBoundingClientRect()` for geometry.
8. **Loading.** Lazy routes should fall back to a skeleton sized like content, not just a spinner. Note current state: spinner only.

## Output

Bug table: **severity** (blocker/major/minor) × **issue** × **file:line** × **fix**. Then verification steps to confirm fix in preview.

Ask before applying.
