import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { dateFromYMD, formatMinutes } from '../../lib/bookingUtils'
import { BookingFallbackLinks } from './BookingWizard'

const Field = ({ id, label, type, placeholder, value, onChange, error, errorText, autoComplete, inputMode }) => (
  <div className="bk-field">
    <label className="bk-field__label" htmlFor={id}>{label}</label>
    <input
      id={id}
      className={`bk-field__input ${error ? 'bk-field__input--error' : ''}`}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      autoComplete={autoComplete}
      inputMode={inputMode}
    />
    {error && (
      <span id={`${id}-error`} className="bk-field__error" role="alert">{errorText}</span>
    )}
  </div>
)

const ERROR_KEYS = {
  slot_taken: 'errSlotTaken',
  outside_hours: 'errSlotTaken',
  invalid_time: 'errSlotTaken',
  rate_limited: 'errRateLimited',
}

export const DetailsStep = ({ flow }) => {
  const { lang, t } = useLanguage()
  const b = translations.booking
  const {
    selectionList, totals, slot, form, setField, fieldErrors,
    submitState, submitError, submit, pickAnotherTime, goToStep,
  } = flow

  const startDate = slot ? new Date(slot.start) : null
  const dateLabel = startDate
    ? new Intl.DateTimeFormat(lang === 'bg' ? 'bg-BG' : 'en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(dateFromYMD(slot.start.slice(0, 10)))
    : ''
  const slotTakenError = ERROR_KEYS[submitError] === 'errSlotTaken'

  return (
    <div className="booking-step">
      <p className="booking-hint">{t(b.detailsHint)}</p>

      <div className="booking-card bk-recap">
        <h3 className="booking-card__title">{t(b.summaryTitle)}</h3>
        <ul className="bk-recap__services">
          {selectionList.map(({ item, option }) => (
            <li key={item.key} className="bk-recap__service">
              <span>{t(item.name)}{option ? ` — ${t(option.name)}` : ''}</span>
              <span>{(option || item).priceEur.toFixed(2)} EUR</span>
            </li>
          ))}
        </ul>
        <p className="bk-recap__when">
          <strong>{dateLabel}, {slot && slot.label}</strong>
          {' · '}
          {formatMinutes(totals.minutes, t(b.hourShort), t(b.minShort))}
          {' · '}
          {totals.priceEur.toFixed(2)} EUR
        </p>
      </div>

      <form
        className="bk-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        noValidate
      >
        <Field
          id="bk-name"
          label={t(b.nameLabel)}
          type="text"
          placeholder={t(b.namePlaceholder)}
          value={form.name}
          onChange={(v) => setField('name', v)}
          error={fieldErrors.name}
          errorText={t(b.errName)}
          autoComplete="name"
        />
        <Field
          id="bk-email"
          label={t(b.emailLabel)}
          type="email"
          placeholder={t(b.emailPlaceholder)}
          value={form.email}
          onChange={(v) => setField('email', v)}
          error={fieldErrors.email}
          errorText={t(b.errEmail)}
          autoComplete="email"
        />
        <Field
          id="bk-phone"
          label={t(b.phoneLabel)}
          type="tel"
          placeholder={t(b.phonePlaceholder)}
          value={form.phone}
          onChange={(v) => setField('phone', v)}
          error={fieldErrors.phone}
          errorText={t(b.errPhone)}
          autoComplete="tel"
          inputMode="tel"
        />
        {/* Honeypot — invisible to humans, bots fill it and get silently dropped */}
        <div className="bk-hp" aria-hidden="true">
          <label htmlFor="bk-website">Website</label>
          <input
            id="bk-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setField('website', e.target.value)}
          />
        </div>

        {submitState === 'error' && (
          <div className="booking-error" role="alert">
            <h3 className="booking-error__title">{t(b.errorTitle)}</h3>
            <p className="booking-error__body">{t(b[ERROR_KEYS[submitError] || 'errGeneric'])}</p>
            {slotTakenError && (
              <button type="button" className="btn btn-secondary booking-btn--fluid" onClick={pickAnotherTime}>
                {t(b.pickAnotherBtn)}
              </button>
            )}
            <BookingFallbackLinks location="booking_error" />
          </div>
        )}

        <div className="booking-nav">
          <button type="button" className="btn btn-secondary booking-btn--fluid" onClick={() => goToStep('time')}>
            {t(b.backBtn)}
          </button>
          <button type="submit" className="btn btn-primary booking-btn--fluid" disabled={submitState === 'submitting'}>
            {submitState === 'submitting' ? t(b.submitting) : t(b.confirmBtn)}
          </button>
        </div>
      </form>
    </div>
  )
}
