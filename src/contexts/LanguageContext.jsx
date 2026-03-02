import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => 
    localStorage.getItem('trendLang') || 'en'
  )
  
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  
  const changeLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('trendLang', newLang)
  }
  
  const t = (translations) => {
    if (!translations) return ''
    return translations[lang] || translations.en || ''
  }
  
  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
