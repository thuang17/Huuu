import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ThoughtItem from '../ThoughtItem'
import type { Thought } from '@/lib/types'

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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

const makeThought = (overrides?: Partial<Thought>): Thought => ({
  id: 'test-id',
  timestamp: new Date().toISOString(),
  value: 'test thought',
  readOnly: false,
  ...overrides,
})

const defaultProps = {
  isActive: false,
  onActivate: vi.fn(),
  onDeactivate: vi.fn(),
}

describe('ThoughtItem', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
  })

  it('renders thought text', () => {
    const thought = makeThought()
    render(<ThoughtItem thought={thought} {...defaultProps} />)
    expect(screen.getByText('test thought')).toBeInTheDocument()
  })

  it('shows textarea when active', () => {
    const thought = makeThought()
    render(<ThoughtItem thought={thought} {...defaultProps} isActive={true} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('test thought')
  })

  it('dispatches UPDATE on textarea change', () => {
    const thought = makeThought()
    render(<ThoughtItem thought={thought} {...defaultProps} isActive={true} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'new text' } })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE',
      id: 'test-id',
      value: 'new text',
    })
  })

  it('dispatches REMOVE on Backspace when empty', () => {
    const thought = makeThought({ value: '' })
    render(<ThoughtItem thought={thought} {...defaultProps} isActive={true} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Backspace' })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE',
      id: 'test-id',
    })
  })

  it('dispatches RETIRE when thought is old', async () => {
    const thought = makeThought({
      timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    })
    render(<ThoughtItem thought={thought} {...defaultProps} />)
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RETIRE',
        id: 'test-id',
      })
    })
  })
})
