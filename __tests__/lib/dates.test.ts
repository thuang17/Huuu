import { getSectionTitle, formatTimestamp, groupThoughts } from '@/lib/dates'
import type { Thought } from '@/lib/types'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function makeThought(daysBack: number, id = 'x'): Thought {
  return {
    id,
    timestamp: daysAgo(daysBack).toISOString(),
    value: '想法',
    readOnly: false,
  }
}

describe('getSectionTitle', () => {
  it('returns 今天 for today', () => {
    expect(getSectionTitle(new Date())).toBe('今天')
  })

  it('returns 昨天 for yesterday', () => {
    expect(getSectionTitle(daysAgo(1))).toBe('昨天')
  })

  it('returns weekday name for 2-5 days ago', () => {
    const date = daysAgo(3)
    const expected = ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]
    expect(getSectionTitle(date)).toBe(expected)
  })

  it('returns month-day format for 6+ days ago', () => {
    const date = daysAgo(10)
    const title = getSectionTitle(date)
    expect(title).toMatch(/^\d+月\d+日$/)
  })

  it('returns weekday for exactly 5 days ago', () => {
    const date = daysAgo(5)
    const expected = ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]
    expect(getSectionTitle(date)).toBe(expected)
  })

  it('returns month-day for exactly 6 days ago', () => {
    const date = daysAgo(6)
    expect(getSectionTitle(date)).toMatch(/^\d+月\d+日$/)
  })
})

describe('formatTimestamp', () => {
  it('returns 刚刚 for very recent timestamps', () => {
    expect(formatTimestamp(new Date().toISOString())).toBe('刚刚')
  })

  it('returns HH:MM for timestamps within 12 hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const result = formatTimestamp(twoHoursAgo.toISOString())
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns X小时前 for timestamps over 12 hours old', () => {
    const fourteenHoursAgo = new Date(Date.now() - 14 * 60 * 60 * 1000)
    expect(formatTimestamp(fourteenHoursAgo.toISOString())).toBe('14小时前')
  })

  it('returns X天前 for timestamps over 24 hours old', () => {
    const twoDaysAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)
    expect(formatTimestamp(twoDaysAgo.toISOString())).toBe('1天前')
  })
})

describe('groupThoughts', () => {
  it('always includes 今天 as first section', () => {
    const groups = groupThoughts([])
    expect(groups[0][0]).toBe('今天')
  })

  it('groups today thoughts under 今天', () => {
    const groups = groupThoughts([makeThought(0, 'a')])
    const today = groups.find(([k]) => k === '今天')
    expect(today?.[1]).toHaveLength(1)
  })

  it('groups yesterday thoughts under 昨天', () => {
    const groups = groupThoughts([makeThought(1, 'b')])
    const yesterday = groups.find(([k]) => k === '昨天')
    expect(yesterday?.[1]).toHaveLength(1)
  })
})
