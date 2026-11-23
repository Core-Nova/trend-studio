import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { salonPhotos } from '../../data/imageImports'
import { SectionHeader } from '../atoms/SectionHeader'
import { ResponsiveImage } from '../atoms/ResponsiveImage'

// Three columns inside the 1200px container; one full-width photo on phones.
const SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 384px'

/**
 * "Our Studio" on the About page: the salon itself, from the owner's photos on
 * the Google Maps listing (salonPhotos — src/assets/images/salon/, listed in
 * src/data/photos.json). The captions double as visible, crawlable text.
 */
export const StudioPhotos = () => {
  const { t, lang } = useLanguage()
  const s = translations.studio
  return (
    <section className="studio">
      <div className="container">
        <SectionHeader tag={t(s.sectionTag)} title={t(s.title)} />
        <p className="studio__intro">{t(s.intro)}</p>
        <div className="studio__grid">
          {salonPhotos.map((photo) => (
            <figure key={photo.file} className="studio__photo">
              <ResponsiveImage
                src={photo.src}
                srcSetWebp={photo.srcSetWebp}
                srcSetAvif={photo.srcSetAvif}
                sizes={SIZES}
                width={photo.width}
                height={photo.height}
                alt={photo.alts[lang]}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{photo.description[lang]}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
