import { memo } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'

const ServiceCard = memo(({ icon, name, count, description, preview, hasMore }) => (
  <div className="service-card">
    <div className="service-card__header">
      <span className="service-icon">{icon}</span>
      <div>
        <h3>{name} <span className="service-count">({count})</span></h3>
        <p className="service-card__desc">{description}</p>
      </div>
    </div>
    <ul className="service-card__preview">
      {preview.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
      {hasMore && <li className="service-card__more">+ more</li>}
    </ul>
  </div>
))

export const ServicesView = ({ sectionTag, title, categories, showSeeAll, seeAllBtn }) => (
  <section id="services" className="services">
    <div className="container">
      <SectionHeader tag={sectionTag} title={title} />
      <div className="services-grid">
        {categories.map(category => (
          <ServiceCard key={category.id} {...category} />
        ))}
      </div>
      {showSeeAll && (
        <div className="section-see-all">
          <Link to="/services" className="btn btn-secondary">{seeAllBtn}</Link>
        </div>
      )}
    </div>
  </section>
)
