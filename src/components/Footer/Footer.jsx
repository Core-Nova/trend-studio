import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'

const CURRENT_YEAR = new Date().getFullYear()

export const Footer = () => {
  const { t } = useLanguage()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">TREND</div>
          <p className="footer-tagline">{t(translations.footer.subtitle)}</p>
          <div className="footer-divider"></div>
          <p className="footer-copyright">
            &copy; {CURRENT_YEAR} TREND. {t(translations.footer.copyright)}
          </p>
        </div>
      </div>
    </footer>
  )
}
