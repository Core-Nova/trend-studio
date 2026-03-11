import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { useIsMobile } from '../hooks/useIsMobile'
import { usePageSEO } from '../hooks/usePageSEO'
import { Hero } from '../components/Hero/Hero'
import { Gallery } from '../components/Gallery/Gallery'
import { About } from '../components/About/About'
import { Services } from '../components/Services/Services'
import { Reviews } from '../components/Reviews/Reviews'
import { Contact } from '../components/Contact/Contact'

const NAV_TILES = [
  { to: '/gallery', titleKey: 'gallery', icon: '\u2606' },
  { to: '/services', titleKey: 'services', icon: '\u2702' },
  { to: '/about', titleKey: 'about', icon: '\u2726' },
  { to: '/contact', titleKey: 'contact', icon: '\u260E' },
]

export const HomePage = () => {
  const { t } = useLanguage()
  const isMobile = useIsMobile()

  usePageSEO({
    title: t(translations.seo.title),
    description: t(translations.seo.description)
  })

  if (isMobile) {
    return (
      <>
        <Hero />
        <div className="mobile-tiles">
          {NAV_TILES.map(tile => (
            <Link key={tile.to} to={tile.to} className="mobile-tile">
              <span className="mobile-tile__icon">{tile.icon}</span>
              <span className="mobile-tile__title">{t(translations.nav[tile.titleKey])}</span>
            </Link>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <Hero />
      <Gallery showSeeAll />
      <About showSeeAll />
      <Services showSeeAll />
      <Reviews />
      <Contact />
    </>
  )
}
