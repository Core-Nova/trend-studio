---
name: trend-design-pass
description: Audit the current diff or specified files in the TREND Hair Boutique Studio repo through a luxury-salon design lens — token reuse (gold/burgundy/cream + Cormorant/Great Vibes/Montserrat fonts in `src/styles/tokens.css`), typographic hierarchy via existing `clamp()` scales, brand consistency, and the `BookingButton` `btn--stable` bilingual pattern. Use when the user says "design pass", "design review", "/trend-design-pass", or asks to check the look of a recent visual change. Flag hardcoded hex/px values, font choices outside the three system families, broken hierarchy, or layout that drifts from the existing spacing scale.
---

# TREND design pass

You are doing a focused design review of the TREND Hair Boutique Studio site. The full lens is in the user's memory at `lens-design.md`. The project context is in `CLAUDE.md`.

## Inputs

- If the user names files or a route, scope the pass to those.
- Otherwise scope to `git diff` against `main` (or working tree if no diff).

## Checklist

1. **Tokens.** Open `src/styles/tokens.css`. For every color/space/font in the diff, confirm it uses a CSS variable — alpha colors must use the `*-rgb` triplet tokens (`rgba(var(--gold-primary-rgb), 0.3)`). Flag literal hex (`#...`), raw `rgb()`/`rgba()` channel values, hardcoded `px` font sizes, hardcoded font-family declarations.
2. **Hierarchy.** Headings must follow `h1 → h2 → h3` per page. Section titles should go through `SectionHeader` (`src/components/atoms/SectionHeader.jsx`). Flag new headings that bypass it.
3. **Typography scale.** Font sizes should use existing `clamp(...)` patterns from `src/styles/` (e.g. hero `clamp(3rem, 10vw, 7rem)`, section `clamp(2.5rem, 5vw, 3.5rem)`). Flag new fixed sizes.
4. **Spacing.** Section padding 100px desktop / 70px mobile; container 20px; gaps in the established 16/24/30/50 scale. Flag values outside these.
5. **Brand voice.** Editorial fonts (Cormorant for display, Great Vibes for script accents, Montserrat for body). Generous whitespace. Gold-on-cream or gold-on-dark — never pure white backgrounds. Flag deviations.
6. **Bilingual stability.** New buttons should use `btn--stable` (`display: inline-grid` overlap trick) so EN/BG widths don't shift layout.
7. **Duplicate selectors.** Styles live in `src/styles/` with one owner file per component and a no-duplicate-selectors invariant (each selector defined exactly once; media queries co-located in the owner file). Grep the class name across `src/styles/` before adding a rule — new duplicates are a must-fix.

## Output

Report in three buckets: **Must fix** (broken hierarchy, hardcoded brand colors), **Should fix** (off-scale spacing, missing token), **Nit** (style choices). For each, give file:line and the proposed change.

Then ask: "Want me to apply the must-fix and should-fix items?" Do not apply without confirmation.
