import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Omnibar from '../Omnibar'

// Mock AppContext
vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

import { useAppContext } from '@/context/AppContext'

const mockUseAppContext = useAppContext as ReturnType<typeof vi.fn>

describe('Omnibar', () => {
  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      thoughts: [],
      dispatch: vi.fn(),
      activeId: null,
      setActiveId: vi.fn(),
      isSearchOpen: false,
      setIsSearchOpen: vi.fn(),
      isFocusMode: false,
      setFocusMode: vi.fn(),
    })
  })

  it('is hidden when closed', () => {
    render(<Omnibar isOpen={false} onClose={vi.fn()} />)
    const omnibar = document.querySelector('[data-active="false"]')
    expect(omnibar).toBeTruthy()
  })

  it('shows when open', () => {
    render(<Omnibar isOpen={true} onClose={vi.fn()} />)
    const omnibar = document.querySelector('[data-active="true"]')
    expect(omnibar).toBeTruthy()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<Omnibar isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows thought count', () => {
    render(<Omnibar isOpen={true} onClose={vi.fn()} />)
    // total thoughts from mock context = 0
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
