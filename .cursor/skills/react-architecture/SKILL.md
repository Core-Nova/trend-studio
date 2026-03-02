---
name: react-architecture
description: Apply the TREND React architecture patterns when adding or modifying features (pages, containers, views, hooks, and data).
---

# React Architecture Skill

## When to Use

- Adding a new page under `src/pages/**`
- Adding a new feature section on an existing page
- Refactoring a mixed component into container + view

## Directory Layout

- Pages: `src/pages/**`
- Components: `src/components/**`
- Hooks: `src/hooks/**`
- Data: `src/data/**`
- Translations: `src/translations/**`

## Adding a New Page

1. Create the page component in `src/pages/NewPage.jsx`
2. Use `useLanguage` and `usePageSEO`
3. Compose existing containers or add new ones under `src/components/**`
4. Register the route in the router configuration (usually in `App.jsx` or a routes file)

Example:

```jsx
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { Services } from '../components/Services/Services'

export const ServicesPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.servicesTitle),
    description: t(translations.seo.servicesDescription)
  })

  return (
    <div className="page-content">
      <Services />
    </div>
  )
}
```

## Adding a New Feature (Container + View)

1. Under `src/components/FeatureName/` create:
   - `FeatureName.jsx` (container)
   - `FeatureNameView.jsx` (view)
   - `FeatureName.css` (styles)
2. Put hooks, state, and side effects in the container
3. Keep the view purely presentational (props in, JSX out)

## Hooks Usage

- Use existing hooks when possible:
  - `useIsMobile` for responsive logic
  - `usePageSEO` for metadata
  - Feature-specific hooks under `src/hooks/**`
- Create a new hook if logic is reused across multiple containers

