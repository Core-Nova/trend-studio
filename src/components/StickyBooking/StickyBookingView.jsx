export const StickyBookingView = ({ text, url, phoneHref, callText }) => (
  <div className="sticky-booking">
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="sticky-booking__book"
    >
      {text}
    </a>
    {phoneHref && (
      <a href={phoneHref} className="sticky-booking__call" aria-label={callText}>
        &#9742;
      </a>
    )}
  </div>
)
