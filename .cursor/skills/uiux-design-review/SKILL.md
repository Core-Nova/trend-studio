---
name: uiux-design-review
description: Perform critical UI/UX design reviews following professional design principles. Use when auditing visual design, reviewing mobile interactions, evaluating page transitions, checking touch behavior, or when the user asks for a design review.
---

# UI/UX Design Review

## When to Use

- Reviewing existing pages or components for design quality
- Auditing mobile touch interactions and feedback states
- Evaluating animations, transitions, and motion design
- Checking visual hierarchy, typography, and spacing
- Verifying responsive behavior across breakpoints

## Review Process

### Step 1: Open the Live Site

Use the browser MCP to navigate to the deployed site or local dev server. Resize to mobile (390x844) and desktop (1440x900) viewports. Take screenshots at each breakpoint.

### Step 2: Audit Each Category

Work through the checklist below. Flag each finding as:

- **Critical**: Broken interaction, inaccessible UI, layout failure
- **Important**: Degraded experience, inconsistent pattern, missing feedback state
- **Minor**: Polish opportunity, suboptimal spacing, aesthetic improvement

### Step 3: Report Findings

Structure the report by severity, with specific file paths and CSS selectors for each issue.

---

## Design Checklist

### Visual Hierarchy

- Page has a clear focal point (hero, heading, primary CTA)
- Heading sizes decrease consistently (h1 > h2 > h3)
- Primary actions are visually dominant (size, color, contrast)
- Secondary actions are visually subordinate
- Whitespace creates logical groupings (Gestalt proximity principle)
- No competing elements at the same visual weight

### Typography

- Display font used for headings, body font for text (no mixing)
- Font sizes use a consistent scale (clamp or rem steps)
- Line height: 1.2-1.3 for headings, 1.5-1.7 for body text
- Letter spacing: increased for uppercase, normal for mixed case
- No orphaned single words on a line at common viewport widths
- Text contrast meets WCAG AA (4.5:1 body, 3:1 large text)

### Color & Contrast

- Brand colors used consistently (gold for accents, dark for backgrounds)
- Interactive elements have distinct color from static text
- Sufficient contrast on all text against its background
- Color is not the sole indicator of state (also use shape, icon, or text)
- Dark sections have adequate contrast for gold text on dark backgrounds

### Layout & Spacing

- Content respects safe areas on notch devices (`env(safe-area-inset-*)`)
- No horizontal overflow causing unwanted horizontal scroll
- Grid gaps are consistent within a section
- Padding scales appropriately between mobile and desktop
- Images maintain aspect ratio (no stretching or distortion)
- Full-bleed sections actually reach viewport edges on mobile

### Touch & Mobile Interactions

- All tap targets are minimum 48x48px
- `-webkit-tap-highlight-color: transparent` on custom interactive elements
- `user-select: none` on buttons and interactive cards (not on text content)
- `touch-action: manipulation` on buttons and links (prevents 300ms delay)
- Active/press states provide immediate tactile feedback:
  - Buttons: slight scale down or color shift
  - Cards/images: opacity dim (0.7-0.8) on press (Instagram pattern)
  - Links: color change
- No accidental text selection when tapping interactive areas
- Scroll containers use `-webkit-overflow-scrolling: touch` and `scroll-snap-type`
- Long-press on images does not trigger unwanted callout (`-webkit-touch-callout: none`)

### Animation & Motion

**Timing guidelines:**

| Action | Duration | Easing |
|--------|----------|--------|
| Micro-interaction (button press) | 100-150ms | ease |
| UI feedback (hover, focus) | 200-300ms | ease or ease-out |
| Page transition | 350-500ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Modal/overlay enter | 250-350ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Content reveal (scroll) | 400-600ms | cubic-bezier(0.22, 1, 0.36, 1) |

**Principles:**

- Entrances use deceleration (ease-out / cubic-bezier with overshoot)
- Exits use acceleration (ease-in) and are faster than entrances
- All animations respect `prefers-reduced-motion: reduce`
- Only animate `transform` and `opacity` for GPU compositing
- Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`
- Loading states use shimmer/pulse, never a blank void
- Page transitions should feel continuous, not jarring

### Feedback States

Every interactive element needs these states defined:

| State | Required For | Pattern |
|-------|-------------|---------|
| Default | All elements | Base appearance |
| Hover | Desktop only (`@media (hover: hover)`) | Subtle color/shadow shift |
| Active/Press | Touch + click | Immediate feedback (opacity, scale, color) |
| Focus-visible | Keyboard nav | Outline (2px solid accent, 2px offset) |
| Disabled | When applicable | Reduced opacity (0.5), `cursor: not-allowed` |
| Loading | Async actions | Spinner or shimmer, disable re-click |
| Empty | Lists, grids | Helpful message, not blank space |
| Error | Forms, API calls | Red accent, descriptive message |

### Navigation & Wayfinding

- Current page is visually indicated in navigation
- Mobile menu overlay fully covers page content (no bleed-through)
- Menu open/close transitions are smooth (opacity + transform)
- Back navigation is intuitive and consistent
- Scroll position resets on route change

### Content & Media

- Images lazy-load below the fold (`loading="lazy"`)
- Images have explicit `width` and `height` to prevent CLS
- Gallery grids maintain consistent aspect ratios
- Instagram-like gallery: edge-to-edge images, minimal gap (2-4px), no border-radius on mobile
- Hero images/sliders have proper overlay for text readability

---

## TREND-Specific Checks

### Brand Consistency

- Gold (`--gold-primary`) used for accents, CTAs, and active states
- Dark theme (`--black`, `--charcoal`) for immersive sections (hero, gallery, footer)
- Cream theme (`--cream`) for content sections (services, about)
- Cormorant Garamond for display headings, Montserrat for body
- Ornament divider under section headers

### Mobile Patterns

- Homepage: hero with crossfade bg, 4 navigation tiles (2x2 grid), footer
- Gallery: stories highlights (circular buttons) + image grid opening stories viewer
- Stories viewer: fullscreen, progress bars, tap zones, CTA overlay
- Sticky bottom booking bar visible on all pages except home
- Hamburger menu with full-screen overlay

### Desktop Patterns

- Homepage: Three.js triangle sliders flanking hero content
- Gallery: 3-column grid with lightbox
- Navigation: horizontal links with underline hover animation
- Services: expandable price categories with price tables
