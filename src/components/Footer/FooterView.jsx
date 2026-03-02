export const FooterView = ({ tagline, copyright, year }) => (
  <footer className="footer">
    <div className="container">
      <div className="footer-content">
        <div className="footer-logo">TREND</div>
        <p className="footer-tagline">{tagline}</p>
        <div className="footer-divider"></div>
        <p className="footer-copyright">
          &copy; {year} TREND. {copyright}
        </p>
      </div>
    </div>
  </footer>
)
