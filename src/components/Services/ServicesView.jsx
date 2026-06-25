import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { trackEvent } from '../../lib/analytics'

const ConsultationCTA = memo(({ title, body, ctaText, phone, phoneHref }) => (
  <a
    href={phoneHref}
    className="svc-consult"
    onClick={() => trackEvent('contact', { method: 'phone', location: 'services_consultation_cta' })}
  >
    <span className="svc-consult__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1.01.46 1.01 1.01v3.49c0 .55-.46 1.01-1.01 1.01C10.07 21.02 2.98 13.93 2.98 5.02c0-.55.46-1.01 1.01-1.01H7.5c.55 0 1.01.46 1.01 1.01 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01l-2.22 2.19z"/>
      </svg>
    </span>
    <h3 className="svc-consult__title">{title}</h3>
    <p className="svc-consult__body">{body}</p>
    <span className="svc-consult__cta">{ctaText}</span>
    <span className="svc-consult__phone">{phone}</span>
  </a>
))

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
  showSeeAll, seeAllBtn, consultCta
}) => {
  const { ref, revealed } = useScrollReveal()
  return (
  <section id="services" className={`services-section scroll-reveal ${revealed ? 'scroll-reveal--visible' : ''}`} ref={ref}>
    <div className="container">
      <SectionHeader tag={sectionTag} title={title} />
      <div className="svc-grid">
        {categories.map((category, i) => {
          if (consultCta && i === 1) {
            return (
              <div key={category.id} className="svc-col-stack">
                <CategoryCard {...category} />
                <ConsultationCTA {...consultCta} />
              </div>
            )
          }
          return <CategoryCard key={category.id} {...category} />
        })}
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
}
