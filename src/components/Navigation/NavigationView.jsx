import { Link } from 'react-router-dom'
import logoSrc from '../../assets/brand/trend-logo.png?w=320&format=webp'
import logoSrcAvif from '../../assets/brand/trend-logo.png?w=320&format=avif'

export const NavigationView = ({
  lang, changeLanguage, isMobile, scrolled, menuOpen,
  toggleMenu, closeMenu, navItems, bookBtnText, callText, phoneHref, currentPath
}) => (
  <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <div className="nav-container">
      <Link to="/" className="logo" aria-label="TREND Hair Boutique Studio — home">
        <picture>
          <source type="image/avif" srcSet={logoSrcAvif} />
          <img src={logoSrc} alt="" className="logo__img" />
        </picture>
      </Link>
      <button
        className={`mobile-menu-btn ${menuOpen ? 'active' : ''}`}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        {menuOpen && isMobile && (
          <li className="nav-links__book-mobile">
            <a
              href="https://studio24.bg/hair-boutique-studio-trend-s4258"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              onClick={closeMenu}
            >
              {bookBtnText}
            </a>
            {phoneHref && (
              <a href={phoneHref} className="btn btn-secondary nav-call-btn" onClick={closeMenu}>
                &#9742; {callText}
              </a>
            )}
          </li>
        )}
        {navItems.map(item => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={closeMenu}
              aria-current={currentPath === item.to ? 'page' : undefined}
            >
              {item.text}
            </Link>
          </li>
        ))}
        {menuOpen && isMobile && (
          <li className="nav-links__lang-mobile">
            <div className="lang-toggle" role="group" aria-label="Language">
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
                aria-label="Switch to English"
                aria-pressed={lang === 'en'}
              >EN</button>
              <span className="lang-divider" aria-hidden="true">|</span>
              <button
                className={`lang-btn ${lang === 'bg' ? 'active' : ''}`}
                onClick={() => changeLanguage('bg')}
                aria-label="Превключи на български"
                aria-pressed={lang === 'bg'}
              >BG</button>
            </div>
          </li>
        )}
      </ul>
      <div className="nav-actions">
        <a href={phoneHref} className="nav-phone" aria-label={callText} title={callText}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1.01.46 1.01 1.01v3.49c0 .55-.46 1.01-1.01 1.01C10.07 21.02 2.98 13.93 2.98 5.02c0-.55.46-1.01 1.01-1.01H7.5c.55 0 1.01.46 1.01 1.01 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01l-2.22 2.19z"/>
          </svg>
        </a>
        <a
          href="https://instagram.com/trendbytedi"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-instagram"
          aria-label="Follow @trendbytedi on Instagram"
          title="@trendbytedi"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
        <div className="lang-toggle lang-toggle--desktop" role="group" aria-label="Language">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
            aria-label="Switch to English"
            aria-pressed={lang === 'en'}
          >EN</button>
          <span className="lang-divider" aria-hidden="true">|</span>
          <button
            className={`lang-btn ${lang === 'bg' ? 'active' : ''}`}
            onClick={() => changeLanguage('bg')}
            aria-label="Превключи на български"
            aria-pressed={lang === 'bg'}
          >BG</button>
        </div>
      </div>
    </div>
  </nav>
)
