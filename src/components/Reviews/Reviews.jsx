import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'

export const Reviews = () => {
  const { t } = useLanguage()

  return (
    <section id="reviews" className="reviews">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{t(translations.reviews.sectionTag)}</span>
          <h2 className="section-title">{t(translations.reviews.title)}</h2>
          <div className="ornament"></div>
        </div>
        <div className="google-reviews-link">
          <a
            href="https://www.google.com/search?q=TREND+Boutique+Studio+Sofia"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <span className="google-icon">G</span>
            <span>{t(translations.reviews.googleBtn)}</span>
          </a>
        </div>
        <p className="reviews-note">{t(translations.reviews.note)}</p>
      </div>
    </section>
  )
}
