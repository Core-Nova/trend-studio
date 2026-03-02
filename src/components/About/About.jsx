import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'

export const About = ({ showSeeAll = false }) => {
  const { t } = useLanguage()

  return (
    <section id="about" className="about">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{t(translations.about.sectionTag)}</span>
          <h2 className="section-title">TREND</h2>
          <div className="ornament"></div>
        </div>
        <div className="about-content">
          <div className="about-text">
            <p>{t(translations.about.paragraph1)}</p>
            <p>{t(translations.about.paragraph2)}</p>
          </div>
          <div className="about-features">
            <div className="feature">
              <div className="feature-icon">&#10022;</div>
              <h3>{t(translations.about.feature1)}</h3>
            </div>
            <div className="feature">
              <div className="feature-icon">&#10022;</div>
              <h3>{t(translations.about.feature2)}</h3>
            </div>
            <div className="feature">
              <div className="feature-icon">&#10022;</div>
              <h3>{t(translations.about.feature3)}</h3>
            </div>
          </div>
        </div>
        {showSeeAll && (
          <div className="section-see-all">
            <Link to="/about" className="btn btn-secondary">
              {t(translations.about.seeAllBtn)}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
