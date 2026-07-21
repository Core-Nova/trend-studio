import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { BookingLink } from '../atoms/BookingLink'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { trackEvent } from '../../lib/analytics'

const ConsultationCTA = memo(({ title, body, ctaText, handle, href }) => (
  <a
    href={href}
    className="svc-consult"
    onClick={() => trackEvent('contact', { method: 'viber', location: 'services_consultation_cta' })}
  >
    <span className="svc-consult__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M11.4 0C9.473.025 5.337.34 3.023 2.464 1.305 4.184.703 6.7.64 9.82.575 12.94.499 18.789 6.141 20.378v2.422s-.038.98.609 1.18c.782.244 1.243-.502 1.991-1.305.41-.44.978-1.087 1.405-1.58 3.86.325 6.828-.416 7.165-.526.78-.252 5.196-.818 5.913-6.68.74-6.044-.358-9.864-2.337-11.586l-.011-.005c-.599-.55-3.01-2.311-8.39-2.33 0 0-.395-.025-1.085-.025zm.058 1.708c.585 0 .945.022.945.022 4.554.014 6.74 1.385 7.247 1.846 1.674 1.435 2.532 4.876 1.905 9.911-.604 4.892-4.18 5.21-4.84 5.421-.282.09-2.892.733-6.182.522 0 0-2.45 2.954-3.216 3.722-.12.121-.262.17-.357.146-.133-.033-.168-.193-.168-.425l.022-4.022C2.005 17.473 2.077 12.483 2.13 9.864c.054-2.605.541-4.74 1.992-6.169 1.952-1.762 5.464-2.014 7.094-2.014l.242.013zm.398 3.044a.448.448 0 00-.448.45.45.45 0 00.45.45c1.385-.005 2.526.444 3.448 1.357.922.916 1.388 2.143 1.4 3.667a.45.45 0 10.9-.009c-.014-1.751-.566-3.215-1.661-4.299C14.853 5.288 13.38 4.75 11.857 4.752zm-3.3.024a1.05 1.05 0 00-.726.243h-.01c-.31.286-.873.99-1.05 1.226-.146.196-.246.428-.286.668-.06.45.083.892.18 1.22l.012.013c.561 1.755 1.41 3.382 2.514 4.823 1.099 1.426 2.416 2.66 3.92 3.65l.013.01.012.008c.135.087.282.16.435.218.32.124.625.092.953.092.04 0 .153-.001.299-.038.218-.057.42-.164.59-.32.246-.223.946-.83 1.234-1.122.013-.012.022-.025.029-.038.243-.236.243-.677-.02-.92-.475-.448-1.226-1.054-1.707-1.39-.477-.331-.953-.158-1.135.07l-.385.498c-.197.252-.557.227-.557.227l-.011.006c-2.706-.74-3.43-3.604-3.43-3.604s-.024-.36.235-.557l.495-.385c.218-.182.42-.658.062-1.136-.336-.479-.943-1.232-1.39-1.706a.726.726 0 00-.515-.241zm3.225 1.85a.45.45 0 00-.45.448.45.45 0 00.45.45c1.014.011 1.785.34 2.31.87.524.534.846 1.27.847 2.213a.448.448 0 00.448.451.453.453 0 00.453-.448c-.008-1.137-.413-2.121-1.107-2.826-.693-.706-1.682-1.151-2.94-1.158zm1.305 1.94a.45.45 0 100 .901c.405.011.582.183.594.604a.45.45 0 10.9-.013c-.015-.741-.443-1.486-1.486-1.491z"/>
      </svg>
    </span>
    <h3 className="svc-consult__title">{title}</h3>
    <p className="svc-consult__body">{body}</p>
    <span className="svc-consult__cta">{ctaText}</span>
    <span className="svc-consult__phone">{handle}</span>
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
  sectionTag, title, categories, note, ctaText, showBookCta,
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
      {showBookCta && (
        <div className="svc-cta">
          <BookingLink className="btn btn-secondary" location="services_page">
            {ctaText}
          </BookingLink>
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
