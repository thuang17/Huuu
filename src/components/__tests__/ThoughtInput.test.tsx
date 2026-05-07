import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ThoughtInput from '../ThoughtInput'

const mockDispatch = vi.fn()

vi.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    dispatch: mockDispatch,
    thoughts: [],
    activeId: null,
    setActiveId: vi.fn(),
    isSearchOpen: false,
    setIsSearchOpen: vi.fn(),
  }),
}))

vi.mock('@/lib/storage', () => ({
  getDraft: () => '',
  saveDraft: vi.fn(),
  clearDraft: vi.fn(),
}))

vi.mock('@/components/VoiceButton', () => ({
  default: () => null,
}))

describe('ThoughtInput', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
  })

  it('renders textarea with placeholder', () => {
    render(<ThoughtInput />)
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('submits thought on Enter', () => {
    render(<ThoughtInput />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'test thought' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD',
      thought: expect.objectContaining({ value: 'test thought' }),
    })
  })

  it('does not submit on Shift+Enter', () => {
    render(<ThoughtInput />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'test thought' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not submit empty input', () => {
    render(<ThoughtInput />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
