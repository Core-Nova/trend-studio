import { memo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { instagramPosts } from '../../data/imageImports'
import { SectionHeader } from '../atoms/SectionHeader'
import { ResponsiveImage } from '../atoms/ResponsiveImage'
import { SITE } from '../../lib/constants'
import { trackEvent } from '../../lib/analytics'
import { trackInstagramClick } from '../../lib/ctaTracking'
import monogramSrc from '../../assets/brand/trend-monogram.png?w=128&format=webp'

/** Tiles loaded eagerly — roughly the first row; the rest are lazy. */
const EAGER_POSTS = 4
// Column width: 4 / 3 / 2 columns at >992 / >768 / phone (instagram-feed.css).
const TILE_SIZES = '(max-width: 768px) 50vw, (max-width: 992px) 33vw, 320px'

const InstagramIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
)

const ArrowIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
)

const TypeBadge = ({ type }) => (
  <span className="ig-post__badge" aria-hidden="true">
    {type === 'reel' ? (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M8 5.5v13l10.5-6.5z" />
      </svg>
    ) : (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8" y="8" width="13" height="13" rx="2" />
        <path d="M4 16V5a1 1 0 0 1 1-1h11" />
      </svg>
    )}
  </span>
)

const PostTile = memo(({ post, index, label, caption, viewLabel, alt, onOpen }) => {
  const eager = index < EAGER_POSTS
  return (
    <li className="ig-post">
      <a
        className="ig-post__link"
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick={() => onOpen(post)}
      >
        {/* The link's aria-label is what assistive tech reads; the alt is for
            search engines (Google Images reads <img alt>, not the link label).
            width/height give each tile its photo's own shape — nothing is cropped. */}
        <ResponsiveImage
          src={post.src}
          srcSetWebp={post.srcSetWebp}
          srcSetAvif={post.srcSetAvif}
          sizes={TILE_SIZES}
          width={post.width}
          height={post.height}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
        />
        {post.type !== 'photo' && <TypeBadge type={post.type} />}
        <span className="ig-post__overlay" aria-hidden="true">
          <span className="ig-post__caption">{caption}</span>
          <span className="ig-post__view">
            {viewLabel}
            <ArrowIcon />
          </span>
        </span>
      </a>
    </li>
  )
})

/**
 * The salon's Instagram feed in TREND's own design (the gallery page): a
 * snapshot of the latest posts bundled with the site (instagramPosts — photos
 * stored under src/assets/images/instagram/, listed in src/data/photos.json),
 * so it needs no backend and renders instantly. Tiles keep each photo's own
 * aspect ratio in a masonry layout, and each links to its post on Instagram.
 */
export const InstagramFeed = ({ tag, title, as = 'h2', location = 'gallery_page' }) => {
  const { t, lang } = useLanguage()
  const ig = translations.instagram

  const labelFor = (post) => {
    const kind = post.type === 'photo' ? '' : ` (${t(ig[post.type])})`
    return `${t(ig.openPost)}${kind}: ${post.description[lang]}`
  }
  const openPost = (post) =>
    trackEvent('select_content', {
      content_type: 'instagram_post',
      item_id: post.id,
      location
    })
  const follow = (link) => trackInstagramClick(`${location}_${link}`)

  return (
    <section className="ig-feed">
      <div className="ig-feed__inner">
        <div className="ig-feed__header">
          <SectionHeader tag={tag} title={title} as={as} />
          <p className="ig-feed__intro">{t(ig.intro)}</p>
        </div>

        <div className="ig-feed__profile">
          <div className="ig-feed__identity">
            <img className="ig-feed__avatar" src={monogramSrc} alt="" width="64" height="64" />
            <div className="ig-feed__names">
              <span className="ig-feed__name">TREND Hair Boutique Studio</span>
              <span className="ig-feed__handle">@{SITE.instagramHandle}</span>
            </div>
          </div>
          <a
            className="btn btn-primary ig-feed__follow"
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => follow('follow_button')}
          >
            <InstagramIcon />
            <span>{t(ig.followBtn)}</span>
          </a>
        </div>

        <ul className="ig-feed__grid">
          {instagramPosts.map((post, i) => (
            <PostTile
              key={post.id}
              post={post}
              index={i}
              label={labelFor(post)}
              caption={post.description[lang]}
              alt={post.alts[lang]}
              viewLabel={t(ig.viewPost)}
              onOpen={openPost}
            />
          ))}
        </ul>

        <a
          className="ig-feed__more"
          href={SITE.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => follow('see_all')}
        >
          {t(ig.seeAll)}
          <ArrowIcon />
        </a>
      </div>
    </section>
  )
}
