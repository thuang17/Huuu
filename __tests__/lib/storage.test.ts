import {
  getThoughts, saveThoughts,
  getDraft, saveDraft,
  isOnboarded, setOnboarded,
} from '@/lib/storage'
import type { Thought } from '@/lib/types'

const mockThought: Thought = {
  id: 'abc123',
  timestamp: new Date().toISOString(),
  value: '测试想法',
  readOnly: false,
}

beforeEach(() => localStorage.clear())

describe('thoughts storage', () => {
  it('returns empty array when nothing stored', () => {
    expect(getThoughts()).toEqual([])
  })

  it('saves and retrieves thoughts', () => {
    saveThoughts([mockThought])
    expect(getThoughts()).toEqual([mockThought])
  })

  it('returns empty array on malformed data', () => {
    localStorage.setItem('__HUUU_THOUGHTS__', 'not-json')
    expect(getThoughts()).toEqual([])
  })
})

describe('draft storage', () => {
  it('returns empty string when no draft', () => {
    expect(getDraft()).toBe('')
  })

  it('saves and retrieves draft', () => {
    saveDraft('今天感觉不错')
    expect(getDraft()).toBe('今天感觉不错')
  })
})

describe('onboarding flag', () => {
  it('returns false when not onboarded', () => {
    expect(isOnboarded()).toBe(false)
  })

  it('returns true after setOnboarded', () => {
    setOnboarded()
    expect(isOnboarded()).toBe(true)
  })
})
