import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'

const ExpandIcon = ({ expanded }) => (
  <svg
    className={`svc-item__chevron ${expanded ? 'svc-item__chevron--open' : ''}`}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ServiceOption = memo(({ name, duration, eur }) => (
  <li className="svc-option">
    <span className="svc-option__name">{name}</span>
    <span className="svc-option__meta">
      <span className="svc-option__duration">{duration}</span>
      <span className="svc-option__price">{eur.toFixed(2)} EUR</span>
    </span>
  </li>
))

const ServiceItem = memo(({ name, duration, priceEur, note, options }) => {
  const [expanded, setExpanded] = useState(false)
  const hasOptions = options && options.length > 0

  return (
    <div className={`svc-item ${expanded ? 'svc-item--expanded' : ''}`}>
      <div
        className="svc-item__row"
        onClick={hasOptions ? () => setExpanded(p => !p) : undefined}
        role={hasOptions ? 'button' : undefined}
        tabIndex={hasOptions ? 0 : undefined}
        onKeyDown={hasOptions ? (e) => e.key === 'Enter' && setExpanded(p => !p) : undefined}
        aria-expanded={hasOptions ? expanded : undefined}
      >
        <div className="svc-item__info">
          <span className="svc-item__name">{name}</span>
          <span className="svc-item__duration">{duration}</span>
        </div>
        <div className="svc-item__trailing">
          <span className="svc-item__price">
            {note && <span className="svc-item__note">{note} </span>}
            {priceEur.toFixed(2)} EUR
          </span>
          {hasOptions && <ExpandIcon expanded={expanded} />}
        </div>
      </div>
      {hasOptions && (
        <div className={`svc-item__options ${expanded ? 'svc-item__options--visible' : ''}`}>
          <ul className="svc-options-list">
            {options.map((opt, i) => (
              <ServiceOption key={i} {...opt} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

const PreviewPills = memo(({ preview, hasMore }) => (
  <ul className="svc-pills">
    {preview.map((item, i) => (
      <li key={i} className="svc-pill">{item}</li>
    ))}
    {hasMore && <li className="svc-pill svc-pill--more">+ more</li>}
  </ul>
))

const CategoryCard = memo(({ icon, name, count, description, items, preview, hasMore }) => (
  <div className="svc-card">
    <div className="svc-card__head">
      <span className="svc-card__icon">{icon}</span>
      <div className="svc-card__titles">
        <h3 className="svc-card__name">{name}</h3>
        <span className="svc-card__count">{count} services</span>
      </div>
    </div>
    <p className="svc-card__desc">{description}</p>
    {items ? (
      <>
        <div className="svc-card__divider" />
        <div className="svc-card__items">
          {items.map((item, i) => (
            <ServiceItem key={i} {...item} />
          ))}
        </div>
      </>
    ) : (
      <PreviewPills preview={preview} hasMore={hasMore} />
    )}
  </div>
))

export const ServicesView = ({
  sectionTag, title, categories, note, ctaText, ctaUrl,
  showSeeAll, seeAllBtn
}) => (
  <section id="services" className="services-section">
    <div className="container">
      <SectionHeader tag={sectionTag} title={title} />
      <div className="svc-grid">
        {categories.map(category => (
          <CategoryCard key={category.id} {...category} />
        ))}
      </div>
      {note && <p className="svc-note">{note}</p>}
      {ctaUrl && (
        <div className="svc-cta">
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            {ctaText}
          </a>
        </div>
      )}
      {showSeeAll && (
        <div className="section-see-all">
          <Link to="/services" className="btn btn-secondary">{seeAllBtn}</Link>
        </div>
      )}
    </div>
  </section>
)
