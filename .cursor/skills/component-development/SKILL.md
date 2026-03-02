---
name: component-development
description: Create or modify components following the hooks + components pattern. Use when adding new sections, features, or UI elements.
---

# Component Development Workflow

## Adding a New Section

1. Create the hook in `src/hooks/useNewSection.js`:
   - Import `useLanguage` and translations
   - Return an object with all translated strings and data

2. Create the component in `src/components/NewSection/NewSection.jsx`:
   - Call the hook and render UI
   - Use `SectionHeader` atom from `../atoms/SectionHeader`
   - Optionally split into a separate View file if the component is large

3. If it needs a dedicated page, create `src/pages/NewSectionPage.jsx`:
   - Import `usePageSEO` for per-page meta tags (required)
   - Add SEO keys to `translations.seo` (EN/BG)
   - Compose the component(s)
   - Add lazy loading in `App.jsx`

4. Add translations to `src/translations/index.js`

5. Add CSS to `src/index.css` (keep all styles in one file)

## Modifying an Existing Section

1. Read the hook to understand the data shape
2. Make changes to the hook (logic) or component (UI)
3. Run `npm run build` to verify

## Accessibility Requirements

- Interactive elements need `role`, `tabIndex`, keyboard handlers
- Dialogs need `role="dialog"`, `aria-modal`, Escape to close
- Expandable elements need `aria-expanded`
- Decorative icons need `aria-hidden="true"`
- Icon-only buttons need `aria-label`

## Testing

- Test hooks with `renderHook` from `@testing-library/react`
- Test atoms with `render` + `screen` queries
- Run `npm test` or `npm run test:run`
