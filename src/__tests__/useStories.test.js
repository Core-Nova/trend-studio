import { renderHook, act } from '@testing-library/react'
import { useStories } from '../hooks/useStories'

const mockImages = ['img1.jpg', 'img2.jpg', 'img3.jpg']

describe('useStories', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    expect(result.current.isOpen).toBe(false)
    expect(result.current.currentIndex).toBeNull()
  })

  it('opens at specified index', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    act(() => result.current.open(1))
    expect(result.current.isOpen).toBe(true)
    expect(result.current.currentIndex).toBe(1)
  })

  it('closes', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    act(() => result.current.open(0))
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('navigates next', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    act(() => result.current.open(0))
    act(() => result.current.next())
    expect(result.current.currentIndex).toBe(1)
  })

  it('navigates prev', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    act(() => result.current.open(2))
    act(() => result.current.prev())
    expect(result.current.currentIndex).toBe(1)
  })

  it('does not go below 0 on prev', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    act(() => result.current.open(0))
    act(() => result.current.prev())
    expect(result.current.currentIndex).toBe(0)
  })

  it('closes on next at last image', () => {
    const { result } = renderHook(() => useStories({ images: mockImages }))
    act(() => result.current.open(2))
    act(() => result.current.next())
    expect(result.current.isOpen).toBe(false)
  })
})
