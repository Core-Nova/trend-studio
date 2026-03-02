---
name: presenter-container-refactor
description: Refactor mixed components into container (logic) and view (presentation) following TREND patterns.
---

# Presenter / Container Refactor Skill

## When to Use

- A component mixes:
  - Data fetching
  - Hooks and side effects
  - Complex JSX
- The component is long or hard to test

## Refactor Steps

1. Identify the feature component (for example `Feature.jsx`)
2. Create a `FeatureView.jsx` file in the same folder
3. Move JSX and layout into `FeatureView`
4. Keep state, hooks, and event handlers in `Feature`
5. Pass only the data and callbacks needed by the view

## Example Pattern

```jsx
// Feature.jsx (container)
import { useFeature } from '../../hooks/useFeature'
import { FeatureView } from './FeatureView'

export const Feature = () => {
  const { data, isLoading, onAction } = useFeature()

  if (isLoading) return null

  return (
    <FeatureView
      data={data}
      onAction={onAction}
    />
  )
}
```

```jsx
// FeatureView.jsx (presentational)
import './Feature.css'

export const FeatureView = ({ data, onAction }) => {
  return (
    <section className="feature">
      {/* render data */}
      <button className="btn btn-primary" onClick={onAction}>
        Action
      </button>
    </section>
  )
}
```

