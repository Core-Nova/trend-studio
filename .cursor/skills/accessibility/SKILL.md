---
name: accessibility
description: Ensure accessibility (a11y) compliance for all components. Use when creating interactive elements, dialogs, forms, or any user-facing UI.
---

# Accessibility (a11y) Skill

## When to Use

- Creating or modifying interactive elements (buttons, links, toggles)
- Building dialogs, modals, or overlays
- Adding images, icons, or decorative elements
- Implementing keyboard navigation

## Semantic HTML First

Use the correct HTML element before reaching for ARIA:

```jsx
// Good - semantic
<button onClick={handleClick}>Book Now</button>
<nav><ul><li><a href="/gallery">Gallery</a></li></ul></nav>

// Bad - div soup
<div onClick={handleClick} role="button">Book Now</div>
<div><div><div><span onClick={go}>Gallery</span></div></div></div>
```

## Interactive Elements

### Buttons

Every button needs either visible text or `aria-label`:

```jsx
// Text button - accessible by default
<button onClick={toggle}>Toggle Menu</button>

// Icon-only button - needs aria-label
<button onClick={close} aria-label="Close">
  &times;
</button>
```

### Expandable Sections

```jsx
<button
  aria-expanded={isOpen}
  aria-controls="section-content"
  onClick={toggle}
>
  {title}
</button>
<div id="section-content" hidden={!isOpen}>
  {content}
</div>
```

The price expand/collapse in `PricesView` follows this pattern.

### Links vs Buttons

- `<a>` for navigation (goes to a URL or anchor)
- `<button>` for actions (toggles, submits, opens modals)

## Dialogs and Modals

The app has two dialog patterns: StoriesViewer and Lightbox.

### Required Attributes

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="Image viewer"
  tabIndex={-1}
  ref={dialogRef}
>
```

### Required Behavior

1. Auto-focus the dialog on open (`ref.current.focus()` in `useEffect`)
2. Trap focus inside (or at minimum, handle keyboard)
3. Close on Escape key
4. Restore focus to trigger element on close
5. Lock body scroll (`document.body.style.overflow = 'hidden'`)

### Keyboard Navigation

```jsx
const handleKeyDown = (e) => {
  if (e.key === 'Escape') onClose()
  else if (e.key === 'ArrowLeft') onPrev()
  else if (e.key === 'ArrowRight') onNext()
}
```

## Images

### Meaningful Images

```jsx
<img src={photo} alt="TREND salon balayage result" />
```

### Decorative Images

```jsx
<img src={ornament} alt="" role="presentation" />
```

### Decorative Icons

```jsx
<div className="contact-icon" aria-hidden="true">&#128222;</div>
```

The Contact section uses `aria-hidden="true"` on emoji icons so screen readers skip them.

## Navigation

### Skip Link

The app has a skip-to-content link as the first element in `<nav>`:

```jsx
<a href="#main-content" className="skip-link">Skip to content</a>
```

### Hamburger Menu

```jsx
<button
  aria-label="Toggle menu"
  aria-expanded={menuOpen}
  onClick={toggleMenu}
>
```

### Active Page Indicator

Use `aria-current="page"` on the active nav link:

```jsx
<Link to="/gallery" aria-current={isActive ? 'page' : undefined}>
  Gallery
</Link>
```

## Focus Management

### Focus Visible (keyboard only)

```css
a:focus-visible,
button:focus-visible {
    outline: 2px solid var(--gold-primary);
    outline-offset: 2px;
}
```

This shows focus rings only for keyboard users, not mouse clicks.

### Tab Order

Interactive elements should follow visual reading order. Use `tabIndex={0}` to make non-interactive elements focusable when needed (e.g., gallery grid items that act as buttons).

Never use `tabIndex` values greater than 0.

## Touch Targets

Minimum 48x48px for all interactive elements on mobile:

```css
.btn {
    min-height: 48px;
    padding: 12px 24px;
}
```

## Color Contrast

- Normal text: minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): minimum 3:1
- The gold-on-dark theme (#C9A227 on #1A1A1A) passes WCAG AA for large text

## Reduced Motion

Always wrap animations:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms;
        transition-duration: 0.01ms;
    }
}
```

The app already has this at the end of `index.css`.

## Testing Checklist

1. Navigate the entire page using only Tab and Enter keys
2. Open and close all dialogs (stories, lightbox) with Escape
3. Verify all images have meaningful `alt` text
4. Check hamburger menu announces state change
5. Run Lighthouse accessibility audit (target 90+)
6. Test with browser zoom at 200%
7. Verify color contrast with DevTools
