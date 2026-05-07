import { renderHook, act } from '@testing-library/react'
import { useTheme } from '@/hooks/useTheme'

vi.mock('@/lib/storage', () => ({
  getTheme: vi.fn(() => 'dark'),
  saveTheme: vi.fn(),
}))

describe('useTheme', () => {
  it('returns dark as default', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('updates theme state when setTheme is called', async () => {
    const { result } = renderHook(() => useTheme())
    await act(async () => { result.current.setTheme('light') })
    expect(result.current.theme).toBe('light')
  })

  it('saves theme to storage when setTheme is called', async () => {
    const { saveTheme } = await import('@/lib/storage')
    const { result } = renderHook(() => useTheme())
    await act(async () => { result.current.setTheme('light') })
    expect(saveTheme).toHaveBeenCalledWith('light')
  })
})
