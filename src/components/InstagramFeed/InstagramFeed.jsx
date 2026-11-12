import { memo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { useInstagramFeed, MAX_POSTS, EAGER_POSTS } from '../../hooks/useInstagramFeed'
import { SectionHeader } from '../atoms/SectionHeader'
import { ResponsiveImage } from '../atoms/ResponsiveImage'
import { SITE } from '../../lib/constants'
import { trackEvent } from '../../lib/analytics'
import monogramSrc from '../../assets/brand/trend-monogram.png?w=128&format=webp'

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

const PostTile = memo(({ post, index, label, viewLabel, onOpen }) => {
  const eager = index < EAGER_POSTS
  const loading = eager ? 'eager' : 'lazy'
  const fetchPriority = eager ? 'high' : 'auto'
  // The link's aria-label is what assistive tech reads; the alt is for search
  // engines (Google Images reads <img alt>, not the label on the link around it).
  const alt = post.caption || post.alt || ''
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
        {post.srcSetWebp ? (
          <ResponsiveImage
            src={post.image}
            srcSetWebp={post.srcSetWebp}
            srcSetAvif={post.srcSetAvif}
            sizes={TILE_SIZES}
            width={post.width}
            height={post.height}
            alt={alt}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
          />
        ) : (
          <img
            src={post.image}
            alt={alt}
            width="1080"
            height="1350"
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            referrerPolicy="no-referrer"
          />
        )}
        {post.type !== 'photo' && <TypeBadge type={post.type} />}
        <span className="ig-post__overlay" aria-hidden="true">
          {post.caption && <span className="ig-post__caption">{post.caption}</span>}
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
 * The salon's Instagram feed in TREND's own design (the gallery page). Posts
 * come from useInstagramFeed(): the live feed via the Apps Script, or the
 * bundled photos when the feed is unavailable — the page is never empty.
 * Every tile links to its post on Instagram in a new tab.
 */
export const InstagramFeed = ({ tag, title, as = 'h2', location = 'gallery_page' }) => {
  const { t } = useLanguage()
  const ig = translations.instagram
  const { status, posts } = useInstagramFeed()

  const labelFor = (post) => {
    const kind = post.type === 'photo' ? '' : ` (${t(ig[post.type])})`
    const text = post.caption || post.alt
    return `${t(ig.openPost)}${kind}${text ? `: ${text}` : ''}`
  }
  const openPost = (post) =>
    trackEvent('select_content', {
      content_type: 'instagram_post',
      item_id: post.id,
      location,
      feed: status
    })
  const follow = (link) => trackEvent('share', { method: 'instagram', location, link })

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

        <p className="sr-only" role="status">
          {status === 'loading' ? t(ig.loading) : ''}
        </p>
        <ul className="ig-feed__grid" aria-busy={status === 'loading'}>
          {status === 'loading'
            ? Array.from({ length: MAX_POSTS }, (_, i) => (
                <li key={i} className="ig-post ig-post--placeholder" aria-hidden="true" />
              ))
            : posts.map((post, i) => (
                <PostTile
                  key={post.id}
                  post={post}
                  index={i}
                  label={labelFor(post)}
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
