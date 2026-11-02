import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { formatSlotDate, formatMinutes } from '../../lib/bookingUtils'

/** Confirmation — restates what was booked, so the screen is a usable receipt. */
export const SuccessStep = ({ email, slot, totals, selectionList }) => {
  const { lang, t } = useLanguage()
  const b = translations.booking
  return (
    <div className="booking-card booking-card--center booking-success" role="status">
      <span className="booking-success__icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="2" />
          <path d="M14 24l7 7 13-13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="booking-card__title">{t(b.successTitle)}</h3>
      {slot && (
        <div className="booking-success__recap">
          <p className="bk-recap__when">
            <strong>
              {formatSlotDate(slot.start, lang)}, {slot.label}
            </strong>
            {' · '}
            {formatMinutes(totals.minutes, t(b.hourShort), t(b.minShort))}
          </p>
          <p className="booking-card__body">
            {selectionList
              .map(({ item, option }) => (option ? `${t(item.name)} — ${t(option.name)}` : t(item.name)))
              .join(', ')}
          </p>
        </div>
      )}
      <p className="booking-card__body">
        {t(b.successInvite)} <strong>{email}</strong>.
        <br />
        {t(b.successSpam)}
      </p>
      <Link to="/" className="btn btn-secondary booking-btn--fluid">
        {t(b.successHome)}
      </Link>
    </div>
  )
}
