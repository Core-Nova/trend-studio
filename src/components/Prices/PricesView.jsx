import { useState } from 'react'
import { SectionHeader } from '../atoms/SectionHeader'

const PriceTag = ({ eur, note }) => (
  <span className="price-tag">
    {note && <span className="price-tag__note">{note} </span>}
    <span className="price-tag__eur">{eur.toFixed(2)} EUR</span>
  </span>
)

const ServiceItem = ({ name, duration, priceEur, note, options }) => {
  const [expanded, setExpanded] = useState(false)
  const toggle = () => setExpanded(prev => !prev)

  return (
    <div className={`price-service ${expanded ? 'price-service--expanded' : ''}`}>
      <div className="price-service__header">
        <div className="price-service__info">
          <span className="price-service__name">{name}</span>
          <span className="price-service__duration">{duration}</span>
        </div>
        <div className="price-service__price">
          <PriceTag eur={priceEur} note={note} />
          {options && (
            <button
              className="price-service__toggle"
              aria-label="Toggle options"
              aria-expanded={expanded}
              onClick={toggle}
            >
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
              <PriceTag eur={opt.eur} />
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
      <SectionHeader tag={sectionTag} title={title} />
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
