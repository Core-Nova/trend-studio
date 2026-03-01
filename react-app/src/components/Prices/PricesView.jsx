import { useState } from 'react'

const PriceTag = ({ eur, bgn, note }) => (
  <span className="price-tag">
    {note && <span className="price-tag__note">{note} </span>}
    <span className="price-tag__eur">{eur.toFixed(2)} EUR</span>
    <span className="price-tag__sep"> / </span>
    <span className="price-tag__bgn">{bgn.toFixed(2)} лв.</span>
  </span>
)

const ServiceItem = ({ name, duration, priceEur, priceBgn, note, options }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`price-service ${expanded ? 'price-service--expanded' : ''}`}>
      <div className="price-service__header" onClick={options ? () => setExpanded(!expanded) : undefined}>
        <div className="price-service__info">
          <span className="price-service__name">{name}</span>
          <span className="price-service__duration">{duration}</span>
        </div>
        <div className="price-service__price">
          <PriceTag eur={priceEur} bgn={priceBgn} note={note} />
          {options && (
            <button className="price-service__toggle" aria-label="Toggle options">
              {expanded ? '\u25B2' : '\u25BC'}
            </button>
          )}
        </div>
      </div>
      {expanded && options && (
        <ul className="price-service__options">
          {options.map((opt, i) => (
            <li key={i} className="price-option">
              <span className="price-option__name">{opt.name}</span>
              <span className="price-option__duration">{opt.duration}</span>
              <PriceTag eur={opt.eur} bgn={opt.bgn} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const PricesView = ({ sectionTag, title, categories, note, ctaText, ctaUrl }) => (
  <section id="prices" className="prices">
    <div className="container">
      <div className="section-header">
        <span className="section-tag">{sectionTag}</span>
        <h2 className="section-title">{title}</h2>
        <div className="ornament"></div>
      </div>
      <div className="price-categories">
        {categories.map(category => (
          <div key={category.id} className="price-category">
            <h3 className="category-title">
              {category.name}
              <span className="category-count">({category.items.length})</span>
            </h3>
            <div className="price-services">
              {category.items.map((item, i) => (
                <ServiceItem key={i} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="price-note">{note}</p>
      <div className="price-cta">
        <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          {ctaText}
        </a>
      </div>
    </div>
  </section>
)
