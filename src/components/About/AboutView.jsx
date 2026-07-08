import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import logoWebp from '../../assets/brand/trend-logo.png?w=900&format=webp'
import logoAvif from '../../assets/brand/trend-logo.png?w=900&format=avif'

export const AboutView = ({ sectionTag, paragraph1, paragraph2, feature1, feature2, feature3, productsTitle, products, showSeeAll, showProducts, seeAllBtn }) => {
  const { ref, revealed } = useScrollReveal()
  return (
  <section id="about" className={`about scroll-reveal ${revealed ? 'scroll-reveal--visible' : ''}`} ref={ref}>
    <div className="container">
      <SectionHeader tag={sectionTag} title="TREND" logo={{ webp: logoWebp, avif: logoAvif, alt: 'TREND Hair Boutique Studio' }} />
      <div className="about-content">
        <div className="about-text">
          <p>{paragraph1}</p>
          <p>{paragraph2}</p>
        </div>
        <div className="about-features">
          <div className="feature">
            <div className="feature-icon">&#10022;</div>
            <h3>{feature1}</h3>
          </div>
          <div className="feature">
            <div className="feature-icon">&#10022;</div>
            <h3>{feature2}</h3>
          </div>
          <div className="feature">
            <div className="feature-icon">&#10022;</div>
            <h3>{feature3}</h3>
          </div>
        </div>
      </div>
      {showProducts && products && products.length > 0 && (
        <div className="about-products">
          <h3 className="about-products__title">{productsTitle}</h3>
          <div className="about-products__grid">
            {products.map(p => (
              <div key={p.name} className="about-products__card">
                {p.logo && (
                  <span
                    className="about-products__logo"
                    style={{ '--logo-src': `url(${p.logo})` }}
                    role="img"
                    aria-label={p.name}
                  />
                )}
                <span className="about-products__name sr-only">{p.name}</span>
                <p className="about-products__desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {showSeeAll && (
        <div className="section-see-all">
          <Link to="/about" className="btn btn-secondary">{seeAllBtn}</Link>
        </div>
      )}
    </div>
  </section>
  )
}
