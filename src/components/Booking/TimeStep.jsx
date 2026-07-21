import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { dateFromYMD, formatMinutes } from '../../lib/bookingUtils'
import { BookingFallbackLinks } from './BookingWizard'

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** 'Today' / 'Tomorrow' / 'Thu 10 Jul' in the active language. */
const dayLabel = (ymd, lang, t, b) => {
  const date = dateFromYMD(ymd)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  if (isSameDay(date, today)) return t(b.today)
  if (isSameDay(date, tomorrow)) return t(b.tomorrow)
  return new Intl.DateTimeFormat(lang === 'bg' ? 'bg-BG' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export const TimeStep = ({ flow }) => {
  const { lang, t } = useLanguage()
  const b = translations.booking
  const { availability, dayIndex, selectDay, slot, selectSlot, retrySlots, totals, goToStep } = flow
  const day = availability.days[dayIndex]

  return (
    <div className="booking-step">
      <p className="booking-hint">
        {t(b.timeHint)} · {formatMinutes(totals.minutes, t(b.hourShort), t(b.minShort))}
      </p>

      {availability.status === 'loading' && (
        <p className="booking-status" role="status">{t(b.loadingSlots)}</p>
      )}

      {availability.status === 'error' && (
        <div className="booking-card booking-card--center">
          <p className="booking-card__body">{t(b.slotsError)}</p>
          <button type="button" className="btn btn-secondary booking-btn--fluid" onClick={retrySlots}>
            {t(b.retryBtn)}
          </button>
          <BookingFallbackLinks location="booking_slots_error" />
        </div>
      )}

      {availability.status === 'ready' && !availability.days.length && (
        <div className="booking-card booking-card--center">
          <p className="booking-card__body">{t(b.noSlots)}</p>
          <BookingFallbackLinks location="booking_no_slots" />
        </div>
      )}

      {availability.status === 'ready' && availability.days.length > 0 && (
        <>
          <div className="bk-days" role="tablist" aria-label={t(b.stepTime)}>
            {availability.days.map((d, i) => (
              <button
                key={d.date}
                type="button"
                role="tab"
                aria-selected={i === dayIndex}
                className={`bk-day ${i === dayIndex ? 'bk-day--selected' : ''}`}
                onClick={() => selectDay(i)}
              >
                {dayLabel(d.date, lang, t, b)}
              </button>
            ))}
          </div>
          {slot && (
            <p className="booking-suggested">
              {t(b.suggested)}: <strong>{day && dayLabel(day.date, lang, t, b)}, {slot.label}</strong>
            </p>
          )}
          <div className="bk-slots">
            {day &&
              day.slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  className={`bk-slot ${slot && slot.start === s.start ? 'bk-slot--selected' : ''}`}
                  aria-pressed={slot ? slot.start === s.start : false}
                  onClick={() => selectSlot(s)}
                >
                  {s.label}
                </button>
              ))}
          </div>
        </>
      )}

      <div className="booking-nav">
        <button type="button" className="btn btn-secondary booking-btn--fluid" onClick={() => goToStep('services')}>
          {t(b.backBtn)}
        </button>
        <button
          type="button"
          className="btn btn-primary booking-btn--fluid"
          disabled={!slot || availability.status !== 'ready'}
          onClick={() => goToStep('details')}
        >
          {t(b.detailsBtn)}
        </button>
      </div>
    </div>
  )
}
