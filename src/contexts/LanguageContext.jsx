import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEFAULT_LANG, pathLang, localePath } from '../lib/routes'

const LanguageContext = createContext()

const STORAGE_KEY = 'trendLang'

const remember = (lang) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* storage blocked — the URL still carries the language */
  }
}

const recall = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const Provider = ({ lang, changeLanguage, children }) => {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => {
    const t = (translations) => {
      if (!translations) return ''
      return translations[lang] || translations.en || ''
    }
    return { lang, changeLanguage, t }
  }, [lang, changeLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/**
 * The app's provider — must sit inside the Router. The URL is the only source
 * of the language: "/en/..." is English, everything else Bulgarian, matching
 * the two prerendered trees (scripts/seo-routes.mjs). A stored preference never
 * overrides it, otherwise a visitor could see English text on the URL Google
 * indexed as Bulgarian. Switching language navigates to the same page's other
 * URL; `state.langSwitch` tells App not to scroll to the top for it.
 */
export const RoutedLanguageProvider = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const lang = pathLang(location.pathname)

  const changeLanguage = useCallback(
    (newLang) => {
      remember(newLang)
      if (newLang === lang) return
      navigate(
        { pathname: localePath(location.pathname, newLang), search: location.search, hash: location.hash },
        { state: { langSwitch: true } }
      )
    },
    [lang, location.pathname, location.search, location.hash, navigate]
  )

  return (
    <Provider lang={lang} changeLanguage={changeLanguage}>
      {children}
    </Provider>
  )
}

/**
 * Router-less provider for tests and isolated components: language lives in
 * state, seeded from localStorage. The app itself uses RoutedLanguageProvider.
 */
export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => recall() || DEFAULT_LANG)

  const changeLanguage = useCallback((newLang) => {
    setLang(newLang)
    remember(newLang)
  }, [])

  return (
    <Provider lang={lang} changeLanguage={changeLanguage}>
      {children}
    </Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
