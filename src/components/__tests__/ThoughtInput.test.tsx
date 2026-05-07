import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ThoughtInput from '../ThoughtInput'

const { mockDispatch, mockClearDraft } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockClearDraft: vi.fn(),
}))

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
  clearDraft: mockClearDraft,
}))

vi.mock('@/components/VoiceButton', () => ({
  default: () => null,
}))

describe('ThoughtInput', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
    mockClearDraft.mockClear()
  })

  it('renders textarea with placeholder', () => {
    render(<ThoughtInput />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
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
    expect(textarea).toHaveValue('')
    expect(mockClearDraft).toHaveBeenCalledOnce()
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
