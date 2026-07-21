import { useState, useMemo, useCallback, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { fetchAvailability, createBooking } from '../lib/bookingApi'
import {
  computeTotals,
  selectionsToServices,
  isValidName,
  isValidEmail,
  isValidPhone,
} from '../lib/bookingUtils'

/**
 * State machine for the /book wizard: services → time → details → done.
 *
 * Selections are keyed by item key; items with options store the chosen
 * option (picking an option selects the item). Availability is fetched from
 * the Apps Script backend when the time step opens and re-fetched whenever
 * the total duration changed since the last fetch, so the offered slots are
 * always long enough for everything selected.
 */
export const useBookingFlow = () => {
  const { lang } = useLanguage()
  const [step, setStep] = useState('services')
  const [selections, setSelections] = useState({}) // item.key → { item, option }

  const [availability, setAvailability] = useState({ status: 'idle', days: [] })
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState(null)
  const fetchedDurationRef = useRef(null)
  const fetchSeqRef = useRef(0)

  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitState, setSubmitState] = useState('idle') // idle | submitting | error
  const [submitError, setSubmitError] = useState(null)

  const selectionList = useMemo(() => Object.values(selections), [selections])
  const totals = useMemo(() => computeTotals(selectionList), [selectionList])

  const loadAvailability = useCallback(async (durationMin) => {
    const seq = ++fetchSeqRef.current
    // recorded up front so a re-entry doesn't refetch mid-flight
    fetchedDurationRef.current = durationMin
    setAvailability({ status: 'loading', days: [] })
    setSlot(null)
    setDayIndex(0)
    const res = await fetchAvailability(durationMin)
    if (seq !== fetchSeqRef.current) return // a newer fetch superseded this one
    if (!res.ok) {
      setAvailability({ status: 'error', days: [] })
      return
    }
    setAvailability({ status: 'ready', days: res.days || [] })
    const first = res.days && res.days[0] && res.days[0].slots[0]
    if (first) setSlot(first) // suggested slot, preselected
  }, [])

  const goToStep = useCallback(
    (next) => {
      setStep(next)
      trackEvent('booking_step', { step: next })
      // entering the time step (re)loads slots when the duration changed
      if (next === 'time' && fetchedDurationRef.current !== totals.minutes) {
        loadAvailability(totals.minutes)
      }
    },
    [totals.minutes, loadAvailability]
  )

  // --- services step ---

  const toggleItem = useCallback((item) => {
    setSelections((prev) => {
      const next = { ...prev }
      if (next[item.key]) delete next[item.key]
      else next[item.key] = { item, option: null }
      return next
    })
  }, [])

  const selectOption = useCallback((item, option) => {
    setSelections((prev) => {
      const current = prev[item.key]
      const next = { ...prev }
      // clicking the already-chosen option deselects the whole item
      if (current && current.option && current.option.key === option.key) delete next[item.key]
      else next[item.key] = { item, option }
      return next
    })
  }, [])

  // --- time step ---

  const selectDay = useCallback(
    (index) => {
      setDayIndex(index)
      const day = availability.days[index]
      setSlot(day && day.slots[0] ? day.slots[0] : null)
    },
    [availability.days]
  )

  const selectSlot = useCallback((nextSlot) => {
    setSlot(nextSlot)
    trackEvent('select_content', { content_type: 'booking_slot', location: 'booking_page' })
  }, [])

  const retrySlots = useCallback(() => loadAvailability(totals.minutes), [loadAvailability, totals.minutes])

  // --- details step ---

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev))
  }, [])

  const submit = useCallback(async () => {
    if (submitState === 'submitting') return

    const errors = {
      name: !isValidName(form.name),
      email: !isValidEmail(form.email),
      phone: !isValidPhone(form.phone),
    }
    if (errors.name || errors.email || errors.phone) {
      setFieldErrors(errors)
      return
    }

    setSubmitState('submitting')
    setSubmitError(null)
    const res = await createBooking({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      start: slot.start,
      durationMin: totals.minutes,
      services: selectionsToServices(selectionList),
      lang,
      website: form.website, // honeypot — real users leave it empty
    })

    if (res.ok) {
      setSubmitState('idle')
      goToStep('done')
      trackEvent('generate_lead', { method: 'booking_form', location: 'booking_page', language: lang })
    } else {
      setSubmitState('error')
      setSubmitError(res.error || 'server_error')
      trackEvent('booking_error', { reason: res.error || 'server_error' })
    }
  }, [submitState, form, slot, totals.minutes, selectionList, lang, goToStep])

  /** After a slot_taken error: back to the time step with fresh slots. */
  const pickAnotherTime = useCallback(() => {
    setSubmitState('idle')
    setSubmitError(null)
    goToStep('time')
    loadAvailability(totals.minutes)
  }, [goToStep, loadAvailability, totals.minutes])

  return {
    step,
    goToStep,
    selections,
    selectionList,
    totals,
    toggleItem,
    selectOption,
    availability,
    dayIndex,
    selectDay,
    slot,
    selectSlot,
    retrySlots,
    form,
    setField,
    fieldErrors,
    submitState,
    submitError,
    submit,
    pickAnotherTime,
  }
}
