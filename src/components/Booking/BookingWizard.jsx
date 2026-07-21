import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { useBookingFlow } from '../../hooks/useBookingFlow'
import { bookingEnabled } from '../../lib/bookingApi'
import { SITE } from '../../lib/constants'
import { trackEvent } from '../../lib/analytics'
import { ServicesStep } from './ServicesStep'
import { TimeStep } from './TimeStep'
import { DetailsStep } from './DetailsStep'
import { SuccessStep } from './SuccessStep'

const STEPS = ['services', 'time', 'details']

/** Call + Studio24 fallback links, shared by error states and disabled mode. */
export const BookingFallbackLinks = ({ location }) => {
  const { t } = useLanguage()
  const b = translations.booking
  return (
    <div className="booking-fallback">
      <a
        href={SITE.phoneHref}
        className="btn btn-primary booking-btn--fluid"
        onClick={() => trackEvent('contact', { method: 'phone', location })}
      >
        {t(b.callBtn)}
      </a>
      <a
        href={SITE.studio24Url}
        target="_blank"
        rel="noopener noreferrer"
        className="booking-fallback__alt"
        onClick={() => trackEvent('generate_lead', { method: 'booking_link', location })}
      >
        {t(b.orStudio24)}
      </a>
    </div>
  )
}

const Unavailable = () => {
  const { t } = useLanguage()
  const b = translations.booking
  return (
    <div className="booking-card booking-card--center">
      <h3 className="booking-card__title">{t(b.unavailableTitle)}</h3>
      <p className="booking-card__body">{t(b.unavailableBody)}</p>
      <BookingFallbackLinks location="booking_unavailable" />
    </div>
  )
}

const StepsIndicator = ({ current, goToStep }) => {
  const { t } = useLanguage()
  const b = translations.booking
  const labels = { services: t(b.stepServices), time: t(b.stepTime), details: t(b.stepDetails) }
  const currentIdx = STEPS.indexOf(current)
  return (
    <ol className="booking-steps">
      {STEPS.map((step, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo'
        return (
          <li key={step} className={`booking-steps__item booking-steps__item--${state}`}>
            {state === 'done' ? (
              <button type="button" className="booking-steps__btn" onClick={() => goToStep(step)}>
                <span className="booking-steps__num" aria-hidden="true">✓</span>
                {labels[step]}
              </button>
            ) : (
              <span className="booking-steps__btn" aria-current={state === 'current' ? 'step' : undefined}>
                <span className="booking-steps__num" aria-hidden="true">{i + 1}</span>
                {labels[step]}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export const BookingWizard = () => {
  const flow = useBookingFlow()

  if (!bookingEnabled) return <Unavailable />
  if (flow.step === 'done') return <SuccessStep email={flow.form.email} />

  return (
    <div className="booking">
      <StepsIndicator current={flow.step} goToStep={flow.goToStep} />
      {flow.step === 'services' && <ServicesStep flow={flow} />}
      {flow.step === 'time' && <TimeStep flow={flow} />}
      {flow.step === 'details' && <DetailsStep flow={flow} />}
    </div>
  )
}
