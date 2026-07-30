import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './lib/analytics'

// Initialize before render so `mode` is set before the first route effect calls
// trackPageView — otherwise React runs the child (AppRoutes) effect before the
// parent (AppShell) effect and the landing page_view is dropped.
initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
