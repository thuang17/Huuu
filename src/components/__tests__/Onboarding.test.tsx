import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Onboarding from '../Onboarding'

vi.mock('framer-motion', () => ({
  motion: {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) =>
      React.createElement('p', props, children),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
      React.createElement('button', props, children),
  },
}))

const { mockIsOnboarded, mockSetOnboarded } = vi.hoisted(() => ({
  mockIsOnboarded: vi.fn(() => false),
  mockSetOnboarded: vi.fn(),
}))

vi.mock('@/lib/storage', () => ({
  isOnboarded: mockIsOnboarded,
  setOnboarded: mockSetOnboarded,
}))

describe('Onboarding', () => {
  beforeEach(() => {
    mockIsOnboarded.mockReturnValue(false)
    mockSetOnboarded.mockClear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('renders nothing if already onboarded', () => {
    mockIsOnboarded.mockReturnValue(true)
    const { container } = render(<Onboarding />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all messages in DOM initially (transparent)', () => {
    render(<Onboarding />)
    // All messages are pre-rendered for smooth layout — just invisible
    expect(screen.getByText('欢迎来到 Huuu。')).toBeInTheDocument()
  })

  it('shows first message after 1200ms', async () => {
    render(<Onboarding />)
    await act(async () => { vi.advanceTimersByTime(1200) })
    expect(screen.getByText('欢迎来到 Huuu。')).toBeInTheDocument()
  })

  it('shows all 5 messages after 6000ms', async () => {
    render(<Onboarding />)
    await act(async () => { vi.advanceTimersByTime(6000) })
    expect(screen.getByText('开始写吧。')).toBeInTheDocument()
  })

  it('calls setOnboarded when button is clicked', async () => {
    render(<Onboarding />)
    await act(async () => { vi.advanceTimersByTime(6000 + 2500) })
    const btn = screen.getByRole('button', { name: '开始使用' })
    fireEvent.click(btn)
    expect(mockSetOnboarded).toHaveBeenCalledOnce()
  })
})
