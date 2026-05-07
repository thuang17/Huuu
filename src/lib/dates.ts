import type { Thought } from './types'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const JUST_NOW_MS = 44_000
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getSectionTitle(date: Date): string {
  const today = startOfDay(new Date())
  const target = startOfDay(date)
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000
  )

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays <= 5) return WEEKDAYS[date.getDay()]
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const diff = Date.now() - date.getTime()

  if (diff < JUST_NOW_MS) return '刚刚'

  if (diff < TWELVE_HOURS_MS) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

export function groupThoughts(thoughts: Thought[]): Array<[string, Thought[]]> {
  const sorted = [...thoughts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const map = new Map<string, Thought[]>([['今天', []]])
  const order: string[] = ['今天']

  for (const thought of sorted) {
    const section = getSectionTitle(new Date(thought.timestamp))
    if (!map.has(section)) {
      map.set(section, [])
      order.push(section)
    }
    map.get(section)!.push(thought)
  }

  return order.map(key => [key, map.get(key)!])
}
