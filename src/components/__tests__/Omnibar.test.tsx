import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Omnibar from '../Omnibar'
import { useAppContext } from '@/context/AppContext'

// Mock createPortal to just render children directly
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom')
  return {
    ...actual,
    createPortal: (children: React.ReactNode, _container: Element) => children,
  }
})

const mockSetIsSearchOpen = vi.fn()
const mockThoughts = [
  { id: '1', timestamp: new Date().toISOString(), value: '今天很开心', readOnly: false },
  { id: '2', timestamp: new Date().toISOString(), value: 'hello world', readOnly: false },
]

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

describe('Omnibar', () => {
  beforeEach(() => {
    mockSetIsSearchOpen.mockClear()
    vi.mocked(useAppContext).mockReturnValue({
      thoughts: mockThoughts,
      isSearchOpen: true,
      setIsSearchOpen: mockSetIsSearchOpen,
      dispatch: vi.fn(),
      activeId: null,
      setActiveId: vi.fn(),
    })
  })

  it('renders search input when open', () => {
    render(<Omnibar />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows all thoughts when query is empty', () => {
    render(<Omnibar />)
    expect(screen.getByText('今天很开心')).toBeInTheDocument()
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('filters thoughts by query', async () => {
    render(<Omnibar />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '开心' } })
    expect(screen.getByText('今天很开心')).toBeInTheDocument()
    expect(screen.queryByText('hello world')).not.toBeInTheDocument()
  })

  it('shows empty state when no results', () => {
    render(<Omnibar />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText('没有找到相关想法')).toBeInTheDocument()
  })

  it('calls setIsSearchOpen(false) on Escape', () => {
    render(<Omnibar />)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(mockSetIsSearchOpen).toHaveBeenCalledWith(false)
  })

  it('renders nothing when closed', () => {
    vi.mocked(useAppContext).mockReturnValueOnce({
      thoughts: mockThoughts,
      isSearchOpen: false,
      setIsSearchOpen: mockSetIsSearchOpen,
      dispatch: vi.fn(),
      activeId: null,
      setActiveId: vi.fn(),
    })
    const { container } = render(<Omnibar />)
    expect(container.firstChild).toBeNull()
  })
})
