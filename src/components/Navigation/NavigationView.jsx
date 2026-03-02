import { Link } from 'react-router-dom'

export const NavigationView = ({
  lang, changeLanguage, isMobile, scrolled, menuOpen, useScrollNav,
  toggleMenu, closeMenu, navItems, bookBtnText, callText, phoneHref, currentPath
}) => (
  <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <div className="nav-container">
      <Link to="/" className="logo">TREND</Link>
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
          <li key={item.href || item.to}>
            {useScrollNav ? (
              <a href={item.href} onClick={closeMenu}>{item.text}</a>
            ) : (
              <Link
                to={item.to}
                onClick={closeMenu}
                aria-current={currentPath === item.to ? 'page' : undefined}
              >
                {item.text}
              </Link>
            )}
          </li>
        ))}
        {menuOpen && isMobile && (
          <li className="nav-links__lang-mobile">
            <div className="lang-toggle">
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >EN</button>
              <span className="lang-divider">|</span>
              <button
                className={`lang-btn ${lang === 'bg' ? 'active' : ''}`}
                onClick={() => changeLanguage('bg')}
              >BG</button>
            </div>
          </li>
        )}
      </ul>
      <div className="lang-toggle lang-toggle--desktop">
        <button
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => changeLanguage('en')}
        >EN</button>
        <span className="lang-divider">|</span>
        <button
          className={`lang-btn ${lang === 'bg' ? 'active' : ''}`}
          onClick={() => changeLanguage('bg')}
        >BG</button>
      </div>
    </div>
  </nav>
)
