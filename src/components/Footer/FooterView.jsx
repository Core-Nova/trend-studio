import logoWebp from '../../assets/brand/trend-logo.png?w=600&format=webp'
import logoAvif from '../../assets/brand/trend-logo.png?w=600&format=avif'

export const FooterView = ({ tagline, copyright, year }) => (
  <footer className="footer">
    <div className="container">
      <div className="footer-content">
        <div className="footer-logo footer-logo--img">
          <picture>
            <source type="image/avif" srcSet={logoAvif} />
            <img src={logoWebp} alt="TREND Hair Boutique Studio" />
          </picture>
        </div>
        <p className="footer-tagline">{tagline}</p>
        <div className="footer-divider"></div>
        <p className="footer-copyright">
          &copy; {year} TREND. {copyright}
        </p>
      </div>
    </div>
  </footer>
)
