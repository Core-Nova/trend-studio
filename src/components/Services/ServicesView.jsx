import { Link } from 'react-router-dom'

export const ServicesView = ({ sectionTag, title, categories, showSeeAll, seeAllBtn }) => (
  <section id="services" className="services">
    <div className="container">
      <div className="section-header">
        <span className="section-tag">{sectionTag}</span>
        <h2 className="section-title">{title}</h2>
        <div className="ornament"></div>
      </div>
      <div className="services-grid">
        {categories.map(category => (
          <div key={category.id} className="service-card">
            <div className="service-icon">{category.icon}</div>
            <h3>{category.name} <span className="service-count">({category.count})</span></h3>
            <p>{category.description}</p>
          </div>
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
