import { SectionHeader } from '../atoms/SectionHeader'
import { BookingButton } from '../atoms/BookingButton'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { trackEvent } from '../../lib/analytics'

const trackPhone = () => trackEvent('contact', { method: 'phone', location: 'contact_section' })
const trackViber = () => trackEvent('contact', { method: 'viber', location: 'contact_section' })
const trackEmail = () => trackEvent('contact', { method: 'email', location: 'contact_section' })
const trackMap = () => trackEvent('select_content', { content_type: 'map', location: 'contact_section' })

export const ContactView = ({
  sectionTag, title, addressLabel, addressLines, phoneLabel, phone, phoneHref,
  viberUrl, viberText, emailLabel, email, emailHref, hoursLabel, hoursLines,
  bookBtn, bookUrl, mapLink, mapEmbedUrl, mapSearchUrl
}) => {
  const { ref, revealed } = useScrollReveal()
  return (
  <section id="contact" className={`contact scroll-reveal ${revealed ? 'scroll-reveal--visible' : ''}`} ref={ref}>
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
                <a href={phoneHref} onClick={trackPhone}>{phone}</a>
              </p>
              {viberUrl && (
                <a href={viberUrl} className="contact-viber-link" onClick={trackViber}>
                  {viberText}
                </a>
              )}
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon" aria-hidden="true">&#9993;</div>
            <div className="contact-details">
              <h3>{emailLabel}</h3>
              <p><a href={emailHref} onClick={trackEmail}>{email}</a></p>
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
            <BookingButton translations={bookBtn} url={bookUrl} className="booking-btn" location="contact_section" />
            <a href={phoneHref} className="btn btn-secondary contact-call-btn" onClick={trackPhone}>
              &#9742; {phone}
            </a>
          </div>
        </div>
        <div className="contact-map">
          <iframe
            src={mapEmbedUrl}
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
            onClick={trackMap}
          >
            {mapLink} &rarr;
          </a>
        </div>
      </div>
    </div>
  </section>
  )
}
