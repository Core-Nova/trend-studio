import { SectionHeader } from '../atoms/SectionHeader'

export const ContactView = ({
  sectionTag, title, addressLabel, addressLines, phoneLabel, phone, phoneHref,
  viberUrl, viberText, emailLabel, email, emailHref, hoursLabel, hoursLines,
  bookBtn, bookUrl, mapLink, mapEmbedUrl, mapSearchUrl
}) => (
  <section id="contact" className="contact">
    <div className="container">
      <SectionHeader tag={sectionTag} title={title} />
      <div className="contact-content">
        <div className="contact-info">
          <div className="contact-item">
            <div className="contact-icon" aria-hidden="true">&#128205;</div>
            <div className="contact-details">
              <h3>{addressLabel}</h3>
              <p>{addressLines.map((line, i) => (
                <span key={i}>{line}{i < addressLines.length - 1 && <br />}</span>
              ))}</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon" aria-hidden="true">&#128222;</div>
            <div className="contact-details">
              <h3>{phoneLabel}</h3>
              <p>
                <a href={phoneHref}>{phone}</a>
              </p>
              {viberUrl && (
                <a href={viberUrl} className="contact-viber-link">
                  {viberText}
                </a>
              )}
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon" aria-hidden="true">&#9993;</div>
            <div className="contact-details">
              <h3>{emailLabel}</h3>
              <p><a href={emailHref}>{email}</a></p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon" aria-hidden="true">&#128336;</div>
            <div className="contact-details">
              <h3>{hoursLabel}</h3>
              <p>{hoursLines.map((line, i) => (
                <span key={i}>{line}{i < hoursLines.length - 1 && <br />}</span>
              ))}</p>
            </div>
          </div>
          <div className="contact-actions">
            <a
              href={bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary booking-btn"
            >
              {bookBtn}
            </a>
            <a href={phoneHref} className="btn btn-secondary contact-call-btn">
              &#9742; {phone}
            </a>
          </div>
        </div>
        <div className="contact-map">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="TREND Boutique Studio Location"
          ></iframe>
          <a
            href={mapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="map-link"
          >
            {mapLink} &rarr;
          </a>
        </div>
      </div>
    </div>
  </section>
)
