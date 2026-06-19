import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import logoWebp from '../../assets/brand/trend-logo.png?w=900&format=webp'
import logoAvif from '../../assets/brand/trend-logo.png?w=900&format=avif'

export const AboutView = ({ sectionTag, paragraph1, paragraph2, feature1, feature2, feature3, showSeeAll, seeAllBtn }) => (
  <section id="about" className="about">
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
      {showSeeAll && (
        <div className="section-see-all">
          <Link to="/about" className="btn btn-secondary">{seeAllBtn}</Link>
        </div>
      )}
    </div>
  </section>
)
