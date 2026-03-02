import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'

export const NotFoundPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.notFoundTitle),
    description: t(translations.seo.notFoundDescription)
  })

  return (
    <div className="page-content not-found">
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px', paddingBottom: '100px' }}>
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__heading">{t(translations.notFound.heading)}</h2>
        <p className="not-found__message">{t(translations.notFound.message)}</p>
        <Link to="/" className="btn btn-primary not-found__btn">{t(translations.notFound.backBtn)}</Link>
      </div>
    </div>
  )
}

export default NotFoundPage
