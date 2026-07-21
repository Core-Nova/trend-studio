import { trackEvent } from '../../lib/analytics'
import { SITE } from '../../lib/constants'
import logoWebp from '../../assets/brand/trend-logo.png?w=600&format=webp'
import logoAvif from '../../assets/brand/trend-logo.png?w=600&format=avif'

const trackIG = () => trackEvent('share', { method: 'instagram', location: 'footer' })
const trackPhone = () => trackEvent('contact', { method: 'phone', location: 'footer' })
const trackMap = () => trackEvent('select_content', { content_type: 'map', location: 'footer' })

export const FooterView = ({ tagline, copyright, year }) => (
  <footer className="footer">
    <div className="container">
      <div className="footer-content">
        <div className="footer-logo footer-logo--img">
          <picture>
            <source type="image/avif" srcSet={logoAvif} />
            <img src={logoWebp} alt="TREND Hair Boutique Studio" />
          </picture>
        </div>
        <p className="footer-tagline">{tagline}</p>
        <div className="footer-social">
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social__link"
            aria-label="Follow @trendbytedi on Instagram"
            onClick={trackIG}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="22" height="22">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href={SITE.phoneHref} className="footer-social__link" aria-label="Call TREND Studio" onClick={trackPhone}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="22" height="22">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1.01.46 1.01 1.01v3.49c0 .55-.46 1.01-1.01 1.01C10.07 21.02 2.98 13.93 2.98 5.02c0-.55.46-1.01 1.01-1.01H7.5c.55 0 1.01.46 1.01 1.01 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01l-2.22 2.19z"/>
            </svg>
          </a>
          <a
            href={SITE.mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social__link"
            aria-label="Find us on Google Maps"
            onClick={trackMap}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="22" height="22">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
            </svg>
          </a>
        </div>
        <div className="footer-divider"></div>
        <p className="footer-copyright">
          &copy; {year} TREND. {copyright}
        </p>
      </div>
    </div>
  </footer>
)
