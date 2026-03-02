---
name: react-architecture
description: Apply the TREND React architecture patterns when adding or modifying features (pages, components, hooks, and data).
---

# React Architecture Skill

## When to Use

- Adding a new page under `src/pages/**`
- Adding a new feature section
- Refactoring a component to extract logic into a hook

## Directory Layout

- Pages: `src/pages/**`
- Components: `src/components/**`
- Hooks: `src/hooks/**`
- Data: `src/data/**` (images, services, reviews)
- Translations: `src/translations/**`

## Adding a New Page

1. Create the page component in `src/pages/NewPage.jsx`
2. Call `usePageSEO` with translated title and description (required)
3. Add SEO translation keys under `translations.seo`
4. Compose existing components or create new ones
5. Register the route as a lazy-loaded route in `App.jsx`

Example:

```jsx
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'

export const NewPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.newPageTitle),
    description: t(translations.seo.newPageDescription)
  })

  return (
    <div className="page-content">
      {/* page content */}
    </div>
  )
}

export default NewPage
```

## Adding a New Feature

1. Create `src/hooks/useFeature.js` for logic and data
2. Create `src/components/Feature/Feature.jsx` for the component
3. Optionally create `FeatureView.jsx` if the component is large
4. Add translations and CSS

## Existing Hooks

- `useIsMobile` -- responsive breakpoint detection
- `usePageSEO` -- per-page meta tags (required for all pages)
- `useStories` -- Instagram-style stories viewer logic
- `useLightbox` -- desktop image lightbox state
- Feature hooks: `useHero`, `useGallery`, `useAbout`, `useServices`, `usePrices`, `useReviews`, `useContact`, `useFooter`, `useNavigation`, `useStickyBooking`
