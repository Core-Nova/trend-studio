import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { useIsMobile } from '../hooks/useIsMobile'
import { usePageSEO } from '../hooks/usePageSEO'
import { Hero } from '../components/Hero/Hero'
import { Gallery } from '../components/Gallery/Gallery'
import { About } from '../components/About/About'
import { Services } from '../components/Services/Services'
import { Prices } from '../components/Prices/Prices'
import { Reviews } from '../components/Reviews/Reviews'
import { Contact } from '../components/Contact/Contact'
import { imageData } from '../data/imageImports'

const PREVIEW_CARDS = [
  { to: '/gallery', titleKey: 'gallery', descKey: 'previewGallery', image: imageData.gallery[0] },
  { to: '/services', titleKey: 'services', descKey: 'previewServices', image: imageData.hero_left[0] },
  { to: '/about', titleKey: 'about', descKey: 'previewAbout', image: imageData.hero_right[0] },
  { to: '/contact', titleKey: 'contact', descKey: 'previewContact', image: imageData.hero_left[1] },
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
        <div className="mobile-previews">
          {PREVIEW_CARDS.map(card => (
            <Link key={card.to} to={card.to} className="mobile-preview-card">
              <div className="mobile-preview-card__image">
                <img src={card.image} alt="" loading="lazy" />
              </div>
              <div className="mobile-preview-card__content">
                <h3>{t(translations.nav[card.titleKey])}</h3>
                <p>{t(translations.mobile[card.descKey])}</p>
                <span className="mobile-preview-card__link">
                  {t(translations.mobile.seeMore)} &rarr;
                </span>
              </div>
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
      <Prices />
      <Reviews />
      <Contact />
    </>
  )
}
