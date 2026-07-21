import { renderHook, act, waitFor } from '@testing-library/react'
import { LanguageProvider } from '../contexts/LanguageContext'
import { useBookingFlow } from '../hooks/useBookingFlow'
import { getBookableCategories } from '../lib/bookingUtils'
import { fetchAvailability, createBooking } from '../lib/bookingApi'

vi.mock('../lib/bookingApi', () => ({
  bookingEnabled: true,
  fetchAvailability: vi.fn(),
  createBooking: vi.fn(),
  fetchLiveReviews: vi.fn(),
}))

const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>

const categories = getBookableCategories()
const bangsTrim = categories[0].items.find((i) => i.name.en === 'Bangs Trim') // 15 min, no options
const womensHaircut = categories[0].items.find((i) => i.name.en === "Women's Haircut")

const AVAILABILITY = {
  ok: true,
  timezone: 'Europe/Sofia',
  days: [
    {
      date: '2026-07-10',
      slots: [
        { start: '2026-07-10T09:00:00+03:00', label: '09:00' },
        { start: '2026-07-10T10:00:00+03:00', label: '10:00' },
      ],
    },
    { date: '2026-07-11', slots: [{ start: '2026-07-11T11:00:00+03:00', label: '11:00' }] },
  ],
}

const setup = () => renderHook(() => useBookingFlow(), { wrapper })

const fillValidForm = (result) => {
  act(() => {
    result.current.setField('name', 'Maria Ivanova')
    result.current.setField('email', 'maria@example.com')
    result.current.setField('phone', '0888 123 456')
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchAvailability.mockResolvedValue(AVAILABILITY)
})

describe('useBookingFlow', () => {
  it('starts at the services step with nothing selected', () => {
    const { result } = setup()
    expect(result.current.step).toBe('services')
    expect(result.current.selectionList).toHaveLength(0)
    expect(result.current.totals).toEqual({ minutes: 0, priceEur: 0 })
  })

  it('toggles option-less items and replaces option picks', () => {
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    expect(result.current.totals.minutes).toBe(15)

    act(() => result.current.selectOption(womensHaircut, womensHaircut.options[0])) // 45 min
    expect(result.current.totals.minutes).toBe(60)

    act(() => result.current.selectOption(womensHaircut, womensHaircut.options[2])) // 60 min
    expect(result.current.totals.minutes).toBe(75)

    // picking the chosen option again deselects the item
    act(() => result.current.selectOption(womensHaircut, womensHaircut.options[2]))
    expect(result.current.totals.minutes).toBe(15)

    act(() => result.current.toggleItem(bangsTrim))
    expect(result.current.selectionList).toHaveLength(0)
  })

  it('fetches availability for the selected duration and preselects the first slot', async () => {
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))

    await waitFor(() => expect(result.current.availability.status).toBe('ready'))
    expect(fetchAvailability).toHaveBeenCalledWith(15)
    expect(result.current.slot).toEqual(AVAILABILITY.days[0].slots[0])
    expect(result.current.availability.days).toHaveLength(2)
  })

  it('re-fetches when the total duration changed since the last fetch', async () => {
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))
    await waitFor(() => expect(result.current.availability.status).toBe('ready'))

    act(() => result.current.goToStep('services'))
    act(() => result.current.selectOption(womensHaircut, womensHaircut.options[0]))
    act(() => result.current.goToStep('time'))

    await waitFor(() => expect(fetchAvailability).toHaveBeenCalledTimes(2))
    expect(fetchAvailability).toHaveBeenLastCalledWith(60)
  })

  it('selecting a day auto-selects its first slot', async () => {
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))
    await waitFor(() => expect(result.current.availability.status).toBe('ready'))

    act(() => result.current.selectDay(1))
    expect(result.current.dayIndex).toBe(1)
    expect(result.current.slot).toEqual(AVAILABILITY.days[1].slots[0])
  })

  it('flags invalid fields and does not submit', async () => {
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))
    await waitFor(() => expect(result.current.availability.status).toBe('ready'))
    act(() => result.current.setField('name', 'M'))

    await act(() => result.current.submit())

    expect(createBooking).not.toHaveBeenCalled()
    expect(result.current.fieldErrors).toEqual({ name: true, email: true, phone: true })
  })

  it('submits the booking payload and reaches the done step', async () => {
    createBooking.mockResolvedValue({ ok: true, eventId: 'abc' })
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))
    await waitFor(() => expect(result.current.availability.status).toBe('ready'))
    act(() => result.current.goToStep('details'))
    fillValidForm(result)

    await act(() => result.current.submit())

    expect(createBooking).toHaveBeenCalledWith({
      name: 'Maria Ivanova',
      email: 'maria@example.com',
      phone: '0888 123 456',
      start: '2026-07-10T09:00:00+03:00',
      durationMin: 15,
      services: [{ name: 'Подстригване на бретон', minutes: 15, priceEur: 5.11 }],
      lang: expect.any(String),
      website: '',
    })
    expect(result.current.step).toBe('done')
  })

  it('surfaces backend errors like slot_taken', async () => {
    createBooking.mockResolvedValue({ ok: false, error: 'slot_taken' })
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))
    await waitFor(() => expect(result.current.availability.status).toBe('ready'))
    act(() => result.current.goToStep('details'))
    fillValidForm(result)

    await act(() => result.current.submit())

    expect(result.current.submitState).toBe('error')
    expect(result.current.submitError).toBe('slot_taken')
    expect(result.current.step).toBe('details')
  })

  it('ignores a second submit while one is in flight', async () => {
    let resolveBooking
    createBooking.mockReturnValue(new Promise((resolve) => { resolveBooking = resolve }))
    const { result } = setup()
    act(() => result.current.toggleItem(bangsTrim))
    act(() => result.current.goToStep('time'))
    await waitFor(() => expect(result.current.availability.status).toBe('ready'))
    fillValidForm(result)

    act(() => { result.current.submit() })
    await waitFor(() => expect(result.current.submitState).toBe('submitting'))
    act(() => { result.current.submit() })

    expect(createBooking).toHaveBeenCalledTimes(1)
    await act(async () => resolveBooking({ ok: true }))
  })
})
