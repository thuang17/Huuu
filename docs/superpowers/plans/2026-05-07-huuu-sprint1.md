# Huuu Sprint 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Huuu — a Chinese-localized expressive writing web app that faithfully replicates flow.rest's core UX using Next.js 14, Tailwind CSS, and localStorage.

**Architecture:** Single-page Next.js app (no routing). All state lives in a React Context backed by localStorage. Thoughts are stored as a flat array and grouped by date on render. Each thought auto-retires to read-only after 5 minutes based on its creation timestamp.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, date-fns, Jest + React Testing Library

---

## File Map

```
flow/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout: fonts, theme-injection script, metadata
│   │   ├── page.tsx            # Server shell — renders <HuuuApp />
│   │   ├── globals.css         # CSS variables, base resets, thought blur transitions
│   │   └── manifest.ts         # PWA manifest
│   ├── components/
│   │   ├── HuuuApp.tsx         # "use client" root — Context.Provider + section rendering
│   │   ├── Header.tsx          # Logo text + hamburger button, flow-mode hide
│   │   ├── Menu.tsx            # Dropdown: theme toggle + clear-all with confirm
│   │   ├── ThoughtInput.tsx    # Auto-expanding root textarea, placeholder rotation, draft
│   │   ├── VoiceButton.tsx     # zh-CN speech recognition button
│   │   ├── ThoughtSection.tsx  # Date section heading + animated thought list
│   │   ├── ThoughtItem.tsx     # Single thought: blur state, retire timer, delete on backspace
│   │   ├── Omnibar.tsx         # Cmd/Ctrl+F search overlay (portal)
│   │   └── Onboarding.tsx      # First-time sequential thought reveal
│   ├── hooks/
│   │   ├── useThoughts.ts      # Core reducer + localStorage sync + dispatch
│   │   └── useTheme.ts         # Theme read/write + system preference
│   ├── context/
│   │   └── AppContext.tsx      # createContext, useAppContext hook
│   └── lib/
│       ├── types.ts            # Thought, ThoughtsAction, Theme types
│       ├── ids.ts              # generateId()
│       ├── storage.ts          # localStorage helpers (getThoughts, saveDraft, etc.)
│       └── dates.ts            # getSectionTitle(), formatTimestamp(), groupThoughts()
├── __tests__/
│   ├── lib/
│   │   ├── ids.test.ts
│   │   ├── storage.test.ts
│   │   └── dates.test.ts
│   └── hooks/
│       └── useThoughts.test.ts
├── next.config.ts
├── tailwind.config.ts
└── jest.config.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `flow/` (project root, already exists)
- Create: `next.config.ts`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Scaffold Next.js project inside the flow/ folder**

```bash
cd /Users/h3art/Documents/github/flow
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

When prompted, accept all defaults. This creates the `src/app/` structure.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install framer-motion date-fns
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom ts-jest @types/jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Remove boilerplate**

```bash
rm -f src/app/page.module.css
```

Replace `src/app/page.tsx` with:
```typescript
export default function Home() {
  return <main>Huuu</main>
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000, page shows "Huuu".

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with Tailwind, Framer Motion, Jest"
```

---

## Task 2: Core Types and Utilities

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/ids.ts`
- Create: `src/lib/storage.ts`
- Create: `__tests__/lib/ids.test.ts`
- Create: `__tests__/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests for ids.ts**

Create `__tests__/lib/ids.test.ts`:
```typescript
import { generateId } from '@/lib/ids'

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = Array.from({ length: 100 }, generateId)
    expect(new Set(ids).size).toBe(100)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- --testPathPattern=ids
```

Expected: FAIL — `Cannot find module '@/lib/ids'`

- [ ] **Step 3: Implement types and ids**

Create `src/lib/types.ts`:
```typescript
export interface Thought {
  id: string
  timestamp: string // ISO 8601
  value: string
  readOnly: boolean
}

export type Theme = 'dark' | 'light' | 'system'

export type ThoughtsAction =
  | { type: 'ADD'; thought: Thought }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE'; id: string; value: string }
  | { type: 'RETIRE'; id: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; thoughts: Thought[] }
```

Create `src/lib/ids.ts`:
```typescript
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
```

- [ ] **Step 4: Run ids tests — confirm pass**

```bash
npm test -- --testPathPattern=ids
```

Expected: PASS

- [ ] **Step 5: Write failing tests for storage.ts**

Create `__tests__/lib/storage.test.ts`:
```typescript
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
```

- [ ] **Step 6: Run to confirm failure**

```bash
npm test -- --testPathPattern=storage
```

Expected: FAIL — `Cannot find module '@/lib/storage'`

- [ ] **Step 7: Implement storage.ts**

Create `src/lib/storage.ts`:
```typescript
import type { Thought } from './types'

const THOUGHTS_KEY = '__HUUU_THOUGHTS__'
const DRAFT_KEY = '__HUUU_DRAFT__'
const ONBOARDED_KEY = '__HUUU_HAS_ONBOARDED__'

export function getThoughts(): Thought[] {
  try {
    const raw = localStorage.getItem(THOUGHTS_KEY)
    return raw ? (JSON.parse(raw) as Thought[]) : []
  } catch {
    return []
  }
}

export function saveThoughts(thoughts: Thought[]): void {
  localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts))
}

export function getDraft(): string {
  return localStorage.getItem(DRAFT_KEY) ?? ''
}

export function saveDraft(draft: string): void {
  localStorage.setItem(DRAFT_KEY, draft)
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true'
}

export function setOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, 'true')
}

export function getTheme(): string {
  return localStorage.getItem('theme') ?? 'dark'
}

export function saveTheme(theme: string): void {
  localStorage.setItem('theme', theme)
}
```

- [ ] **Step 8: Run storage tests — confirm pass**

```bash
npm test -- --testPathPattern=storage
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add core types, id generation, and localStorage utilities"
```

---

## Task 3: Date and Time Utilities

**Files:**
- Create: `src/lib/dates.ts`
- Create: `__tests__/lib/dates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/dates.test.ts`:
```typescript
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
    const title = getSectionTitle(daysAgo(3))
    expect(['周一','周二','周三','周四','周五','周六','周日']).toContain(title)
  })

  it('returns month-day format for 6+ days ago', () => {
    const date = daysAgo(10)
    const title = getSectionTitle(date)
    expect(title).toMatch(/^\d+月\d+日$/)
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- --testPathPattern=dates
```

Expected: FAIL — `Cannot find module '@/lib/dates'`

- [ ] **Step 3: Implement dates.ts**

Create `src/lib/dates.ts`:
```typescript
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
```

- [ ] **Step 4: Run dates tests — confirm pass**

```bash
npm test -- --testPathPattern=dates
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add date grouping and zh-CN timestamp formatting"
```

---

## Task 4: Core State Hook

**Files:**
- Create: `src/lib/types.ts` (already exists, add reducer type)
- Create: `src/hooks/useThoughts.ts`
- Create: `src/context/AppContext.tsx`
- Create: `__tests__/hooks/useThoughts.test.ts`

- [ ] **Step 1: Write failing tests for the reducer**

Create `__tests__/hooks/useThoughts.test.ts`:
```typescript
import { thoughtsReducer } from '@/hooks/useThoughts'
import type { Thought, ThoughtsAction } from '@/lib/types'

const t1: Thought = { id: '1', timestamp: new Date().toISOString(), value: '想法一', readOnly: false }
const t2: Thought = { id: '2', timestamp: new Date().toISOString(), value: '想法二', readOnly: false }

describe('thoughtsReducer', () => {
  it('LOAD replaces state', () => {
    expect(thoughtsReducer([], { type: 'LOAD', thoughts: [t1] })).toEqual([t1])
  })

  it('ADD prepends thought', () => {
    const state = thoughtsReducer([t2], { type: 'ADD', thought: t1 })
    expect(state[0]).toEqual(t1)
    expect(state).toHaveLength(2)
  })

  it('REMOVE filters out thought by id', () => {
    expect(thoughtsReducer([t1, t2], { type: 'REMOVE', id: '1' })).toEqual([t2])
  })

  it('UPDATE changes value of matching thought', () => {
    const state = thoughtsReducer([t1], { type: 'UPDATE', id: '1', value: '新内容' })
    expect(state[0].value).toBe('新内容')
  })

  it('RETIRE sets readOnly to true', () => {
    const state = thoughtsReducer([t1], { type: 'RETIRE', id: '1' })
    expect(state[0].readOnly).toBe(true)
  })

  it('CLEAR returns empty array', () => {
    expect(thoughtsReducer([t1, t2], { type: 'CLEAR' })).toEqual([])
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- --testPathPattern=useThoughts
```

Expected: FAIL — `Cannot find module '@/hooks/useThoughts'`

- [ ] **Step 3: Implement useThoughts hook**

Create `src/hooks/useThoughts.ts`:
```typescript
'use client'

import { useReducer, useEffect } from 'react'
import { getThoughts, saveThoughts } from '@/lib/storage'
import { groupThoughts } from '@/lib/dates'
import type { Thought, ThoughtsAction } from '@/lib/types'

export function thoughtsReducer(state: Thought[], action: ThoughtsAction): Thought[] {
  switch (action.type) {
    case 'LOAD':   return action.thoughts
    case 'ADD':    return [action.thought, ...state]
    case 'REMOVE': return state.filter(t => t.id !== action.id)
    case 'UPDATE': return state.map(t => t.id === action.id ? { ...t, value: action.value } : t)
    case 'RETIRE': return state.map(t => t.id === action.id ? { ...t, readOnly: true } : t)
    case 'CLEAR':  return []
    default:       return state
  }
}

export function useThoughts() {
  const [thoughts, dispatch] = useReducer(thoughtsReducer, [])

  // Load from localStorage on mount
  useEffect(() => {
    dispatch({ type: 'LOAD', thoughts: getThoughts() })
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    saveThoughts(thoughts)
  }, [thoughts])

  const sections = groupThoughts(thoughts)

  return { thoughts, sections, dispatch }
}
```

- [ ] **Step 4: Create AppContext**

Create `src/context/AppContext.tsx`:
```typescript
'use client'

import { createContext, useContext, useState } from 'react'
import type { ThoughtsAction, Thought } from '@/lib/types'

interface AppContextValue {
  dispatch: React.Dispatch<ThoughtsAction>
  activeId: string | null
  setActiveId: (id: string | null) => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside HuuuApp')
  return ctx
}
```

- [ ] **Step 5: Run useThoughts tests — confirm pass**

```bash
npm test -- --testPathPattern=useThoughts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add useThoughts reducer hook and AppContext"
```

---

## Task 5: Global Styles and Root Layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace globals.css**

Replace `src/app/globals.css` entirely:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #000;
  --fg: #fff;
  --text-primary: #eaeaea;
  --text-secondary: #666;
  --text-placeholder: #444;
  --divider: #1e1e1e;
  --highlight: #191919;
  --menu-bg: #191919;
}

[data-theme="light"] {
  --bg: #fff;
  --fg: #000;
  --text-primary: #111;
  --text-secondary: #888;
  --text-placeholder: #bbb;
  --divider: #e8e8e8;
  --highlight: #f4f4f4;
  --menu-bg: #fff;
}

html, body {
  background: var(--bg);
  color: var(--text-primary);
  margin: 0;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* Fade transition for thought blur — cannot use Tailwind for variable blur values */
.thought-text {
  transition: filter 2s ease, opacity 2s ease;
}

textarea {
  font-family: inherit;
  background: transparent;
  border: none;
  color: var(--text-primary);
  resize: none;
  width: 100%;
  padding: 0;
  line-height: 1.7;
  font-size: 16px;
}

textarea:focus {
  outline: none;
}

textarea::placeholder {
  color: var(--text-placeholder);
}

textarea:read-only {
  cursor: default;
}

/* Bottom page fade */
.page-fade-bottom {
  background: linear-gradient(to bottom, transparent, var(--bg));
}

/* Scrollbar hidden */
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }
```

- [ ] **Step 2: Update layout.tsx with fonts and theme injection**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Noto_Sans_SC } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-noto',
})

export const metadata: Metadata = {
  title: 'Huuu — Write to breathe.',
  description: '通过写作，清空思绪。',
}

const THEME_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${notoSansSC.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Update tailwind.config.ts to use CSS font variables**

Replace the content of `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto)', '-apple-system', 'PingFang SC', 'sans-serif'],
      },
    },
  },
}
export default config
```

- [ ] **Step 4: Verify no build errors**

```bash
npm run build
```

Expected: Build succeeds (may show warnings, no errors).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add global CSS variables, dark/light theme, font configuration"
```

---

## Task 6: ThoughtInput Component

**Files:**
- Create: `src/components/ThoughtInput.tsx`
- Create: `src/components/VoiceButton.tsx`

- [ ] **Step 1: Implement auto-expanding textarea utility**

Create `src/components/ThoughtInput.tsx`:
```typescript
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppContext } from '@/context/AppContext'
import { generateId } from '@/lib/ids'
import { getDraft, saveDraft, clearDraft } from '@/lib/storage'
import VoiceButton from './VoiceButton'
import type { Thought } from '@/lib/types'

const PLACEHOLDERS = [
  '你在想什么？',
  '说吧，我在听。',
  '继续…',
  '写出来，会好很多。',
  '还有呢？',
  '就这样流淌，挺好的。',
  '表达自己。',
]

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = '0'
  el.style.height = `${el.scrollHeight}px`
}

export default function ThoughtInput() {
  const { dispatch, setActiveId } = useAppContext()
  const [value, setValue] = useState('')
  const [placeholder] = useState(() =>
    PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )
  const ref = useRef<HTMLTextAreaElement>(null)

  // Load draft on mount
  useEffect(() => {
    setValue(getDraft())
    if (ref.current) {
      ref.current.focus()
      autoResize(ref.current)
    }
  }, [])

  // Save draft on unload
  useEffect(() => {
    const handler = () => saveDraft(value)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    autoResize(e.target)
  }

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    const thought: Thought = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      value: trimmed,
      readOnly: false,
    }
    dispatch({ type: 'ADD', thought })
    setValue('')
    clearDraft()
    setTimeout(() => {
      if (ref.current) {
        ref.current.style.height = '0'
        ref.current.focus()
      }
    }, 0)
  }, [value, dispatch])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleVoiceResult = (transcript: string) => {
    setValue(prev => prev + transcript)
    if (ref.current) autoResize(ref.current)
  }

  return (
    <div className="relative mb-2">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setActiveId('root')}
        onBlur={() => setActiveId(null)}
        className="mt-6 pr-8"
        style={{ lineHeight: '24px' }}
      />
      <VoiceButton onResult={handleVoiceResult} />
    </div>
  )
}
```

- [ ] **Step 2: Implement VoiceButton**

Create `src/components/VoiceButton.tsx`:
```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onResult: (transcript: string) => void
}

export default function VoiceButton({ onResult }: Props) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setSupported(hasSupport)

    if (!hasSupport) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition: SpeechRecognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      onResult(transcript)
    }

    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
  }, [onResult])

  const toggle = () => {
    const r = recognitionRef.current
    if (!r) return
    if (listening) {
      r.stop()
      setListening(false)
    } else {
      r.start()
      setListening(true)
    }
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={toggle}
      aria-label={listening ? '停止录音' : '语音输入'}
      title={listening ? '停止录音' : '语音输入'}
      className="absolute right-0 top-6 w-8 h-8 flex items-center justify-center rounded opacity-40 hover:opacity-100 transition-opacity"
      style={{ color: listening ? '#ff4d4f' : 'var(--text-secondary)' }}
    >
      <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
      </svg>
    </button>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000. The page should show nothing visible yet (HuuuApp not wired up). No console errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add ThoughtInput with auto-resize, placeholder rotation, draft save, and VoiceButton"
```

---

## Task 7: ThoughtItem Component

**Files:**
- Create: `src/components/ThoughtItem.tsx`

- [ ] **Step 1: Implement ThoughtItem**

Create `src/components/ThoughtItem.tsx`:
```typescript
'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '@/context/AppContext'
import { formatTimestamp } from '@/lib/dates'
import type { Thought } from '@/lib/types'

const RETIRE_MS = 5 * 60 * 1000

interface Props {
  thought: Thought
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = '0'
  el.style.height = `${el.scrollHeight}px`
}

export default function ThoughtItem({ thought }: Props) {
  const { dispatch, activeId, setActiveId } = useAppContext()
  const ref = useRef<HTMLTextAreaElement>(null)
  const isActive = activeId === thought.id

  // Retirement timer — fires at the right remaining time
  useEffect(() => {
    if (thought.readOnly) return
    const elapsed = Date.now() - new Date(thought.timestamp).getTime()
    const remaining = RETIRE_MS - elapsed
    if (remaining <= 0) {
      dispatch({ type: 'RETIRE', id: thought.id })
      return
    }
    const timer = setTimeout(() => dispatch({ type: 'RETIRE', id: thought.id }), remaining)
    return () => clearTimeout(timer)
  }, [thought.id, thought.readOnly, thought.timestamp, dispatch])

  // Auto-resize on mount
  useEffect(() => {
    if (ref.current) autoResize(ref.current)
  }, [thought.value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE', id: thought.id, value: e.target.value })
    autoResize(e.target)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace' && !thought.value) {
      e.preventDefault()
      dispatch({ type: 'REMOVE', id: thought.id })
    }
  }

  // Blur/opacity based on state
  const blurStyle = thought.readOnly
    ? { filter: 'blur(4px)', opacity: 0.3 }
    : isActive
    ? { filter: 'none', opacity: 1 }
    : { filter: 'blur(2px)', opacity: 0.5 }

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -16, filter: 'blur(3px)' }}
      data-thought-id={thought.id}
      className="mb-5"
      onMouseEnter={() => !thought.readOnly && setActiveId(thought.id)}
      onMouseLeave={() => setActiveId(null)}
    >
      <div className="thought-text" style={blurStyle}>
        <textarea
          ref={ref}
          rows={1}
          value={thought.value}
          readOnly={thought.readOnly}
          spellCheck={false}
          data-thought-id={thought.id}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setActiveId(thought.id)}
          onBlur={() => setActiveId(null)}
          style={{ lineHeight: '24px', marginTop: 0 }}
          placeholder="按 Backspace ⌫ 删除"
        />
      </div>
      <span className="text-xs mt-1 block" style={{ color: 'var(--text-secondary)' }}>
        {formatTimestamp(thought.timestamp)}
      </span>
    </motion.li>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ThoughtItem with blur fade, retirement timer, and delete on backspace"
```

---

## Task 8: Main Page Assembly

**Files:**
- Create: `src/components/ThoughtSection.tsx`
- Create: `src/components/HuuuApp.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement ThoughtSection**

Create `src/components/ThoughtSection.tsx`:
```typescript
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import ThoughtItem from './ThoughtItem'
import ThoughtInput from './ThoughtInput'
import type { Thought } from '@/lib/types'

interface Props {
  title: string
  thoughts: Thought[]
}

export default function ThoughtSection({ title, thoughts }: Props) {
  const isToday = title === '今天'

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-12"
    >
      <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--fg)' }}>
        {title}
      </h2>

      {isToday && <ThoughtInput />}

      <hr className="border-none h-px my-4" style={{ background: 'var(--divider)' }} />

      <ul className="list-none p-0 m-0">
        <AnimatePresence>
          {thoughts.map(thought => (
            <ThoughtItem key={thought.id} thought={thought} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.article>
  )
}
```

- [ ] **Step 2: Implement HuuuApp (client root)**

Create `src/components/HuuuApp.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AppContext } from '@/context/AppContext'
import { useThoughts } from '@/hooks/useThoughts'
import { isOnboarded } from '@/lib/storage'
import ThoughtSection from './ThoughtSection'
import Header from './Header'
import Omnibar from './Omnibar'
import Onboarding from './Onboarding'

export default function HuuuApp() {
  const { sections, dispatch } = useThoughts()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded())

  return (
    <AppContext.Provider value={{ dispatch, activeId, setActiveId, isSearchOpen, setIsSearchOpen }}>
      <Header />
      <Omnibar />

      {/* Centered content column */}
      <main
        className="mx-auto px-8"
        style={{ maxWidth: '624px', paddingTop: '100px', paddingBottom: '120px', minHeight: '100vh' }}
      >
        <AnimatePresence mode="wait">
          {showOnboarding ? (
            <Onboarding key="onboarding" onDone={() => setShowOnboarding(false)} />
          ) : (
            <>
              {sections.map(([title, thoughts]) => (
                <ThoughtSection key={title} title={title} thoughts={thoughts} />
              ))}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom fade */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none page-fade-bottom"
        aria-hidden
      />
    </AppContext.Provider>
  )
}
```

- [ ] **Step 3: Wire up page.tsx**

Replace `src/app/page.tsx`:
```typescript
import HuuuApp from '@/components/HuuuApp'

export default function Home() {
  return <HuuuApp />
}
```

- [ ] **Step 4: Create placeholder stubs for missing components**

Create `src/components/Header.tsx`:
```typescript
export default function Header() { return null }
```

Create `src/components/Omnibar.tsx`:
```typescript
export default function Omnibar() { return null }
```

Create `src/components/Onboarding.tsx`:
```typescript
export default function Onboarding({ onDone }: { onDone: () => void }) {
  return <button onClick={onDone}>继续</button>
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000. You should see:
- A text input with a Chinese placeholder
- Typing and pressing Enter adds a thought below the divider
- Thought blurs after losing focus

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: assemble main page — sections, input, thoughts rendering"
```

---

## Task 9: Header and Menu

**Files:**
- Modify: `src/components/Header.tsx`
- Create: `src/components/Menu.tsx`
- Create: `src/hooks/useTheme.ts`

- [ ] **Step 1: Implement useTheme hook**

Create `src/hooks/useTheme.ts`:
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTheme, saveTheme } from '@/lib/storage'
import type { Theme } from '@/lib/types'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    setThemeState(getTheme() as Theme)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    saveTheme(next)
    const resolved =
      next === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : next
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  return { theme, setTheme }
}
```

- [ ] **Step 2: Implement Menu**

Create `src/components/Menu.tsx`:
```typescript
'use client'

import { useRef, useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { useTheme } from '@/hooks/useTheme'
import type { Theme } from '@/lib/types'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: '深色' },
  { value: 'light', label: '浅色' },
  { value: 'system', label: '跟随系统' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Menu({ open, onClose }: Props) {
  const { dispatch } = useAppContext()
  const { theme, setTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleClear = () => {
    if (window.confirm('确定要清空所有内容吗？此操作无法撤销。')) {
      dispatch({ type: 'CLEAR' })
    }
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute top-12 right-8 rounded-lg p-2 shadow-lg z-50 min-w-36"
      style={{ background: 'var(--menu-bg)', border: '1px solid var(--divider)' }}
    >
      <div className="px-2 py-1 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>主题</div>
      {THEMES.map(t => (
        <button
          key={t.value}
          onClick={() => { setTheme(t.value); onClose() }}
          className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-white/5"
          style={{ color: theme === t.value ? 'var(--fg)' : 'var(--text-secondary)' }}
        >
          {theme === t.value && <span>✓</span>}
          {theme !== t.value && <span className="w-4" />}
          {t.label}
        </button>
      ))}
      <hr className="my-2" style={{ borderColor: 'var(--divider)' }} />
      <button
        onClick={handleClear}
        className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-white/5"
        style={{ color: '#ff4d4f' }}
      >
        清空所有内容
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Implement Header**

Replace `src/components/Header.tsx`:
```typescript
'use client'

import { useState } from 'react'
import Menu from './Menu'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between"
      style={{ padding: '24px 32px' }}
    >
      <span className="font-semibold text-lg tracking-tight" style={{ color: 'var(--fg)' }}>
        Huuu
      </span>

      <div className="relative">
        <button
          type="button"
          aria-label="菜单"
          aria-haspopup="menu"
          onClick={() => setMenuOpen(v => !v)}
          className="w-10 h-10 flex items-center justify-center rounded-lg -mr-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000. Click the hamburger menu — theme switcher and clear button appear. Switch to light mode — page changes immediately.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Header, Menu with theme toggle and clear-all"
```

---

## Task 10: Omnibar Search

**Files:**
- Modify: `src/components/Omnibar.tsx`
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: Add thoughts to AppContext**

Update `src/context/AppContext.tsx` to include thoughts (needed for search):
```typescript
'use client'

import { createContext, useContext } from 'react'
import type { ThoughtsAction, Thought } from '@/lib/types'

interface AppContextValue {
  dispatch: React.Dispatch<ThoughtsAction>
  thoughts: Thought[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside HuuuApp')
  return ctx
}
```

- [ ] **Step 2: Pass thoughts into context in HuuuApp**

In `src/components/HuuuApp.tsx`, update the Provider:
```typescript
// change: const { sections, dispatch } = useThoughts()
const { thoughts, sections, dispatch } = useThoughts()

// change: <AppContext.Provider value={{ dispatch, activeId, setActiveId, isSearchOpen, setIsSearchOpen }}>
<AppContext.Provider value={{ dispatch, thoughts, activeId, setActiveId, isSearchOpen, setIsSearchOpen }}>
```

- [ ] **Step 3: Implement Omnibar**

Replace `src/components/Omnibar.tsx`:
```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAppContext } from '@/context/AppContext'

export default function Omnibar() {
  const { thoughts, isSearchOpen, setIsSearchOpen, setActiveId } = useAppContext()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Intercept Cmd/Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setIsSearchOpen])

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.select(), 0)
    } else {
      setQuery('')
      // Re-blur all thoughts when closing
      document.querySelectorAll<HTMLElement>('[data-thought-id]').forEach(el => {
        el.style.removeProperty('filter')
        el.style.removeProperty('opacity')
      })
    }
  }, [isSearchOpen])

  const matches = query
    ? thoughts.filter(t => t.value.toLowerCase().includes(query.toLowerCase()))
    : []

  // Highlight matching thoughts
  useEffect(() => {
    if (!query) return
    const matchIds = new Set(matches.map(t => t.id))
    document.querySelectorAll<HTMLElement>('[data-thought-id]').forEach(el => {
      const id = el.getAttribute('data-thought-id')
      if (matchIds.has(id!)) {
        el.style.filter = 'none'
        el.style.opacity = '1'
      } else {
        el.style.filter = 'blur(4px)'
        el.style.opacity = '0.2'
      }
    })
    if (matches[0]) setActiveId(matches[0].id)
  }, [query, matches, setActiveId])

  if (!isSearchOpen) return null

  return createPortal(
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-6 py-3"
        style={{ background: 'var(--menu-bg)', borderBottom: '1px solid var(--divider)' }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索想法…"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {query ? `${matches.length} 条` : ''}
        </span>
        <button
          onClick={() => setIsSearchOpen(false)}
          aria-label="关闭搜索"
          className="opacity-50 hover:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} aria-hidden />
    </>,
    document.body
  )
}
```

- [ ] **Step 5: Verify in browser**

Press Cmd+F (Mac) or Ctrl+F — search bar appears. Type a word — matching thoughts unblur. Press Escape — search closes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Omnibar search with Cmd/Ctrl+F, real-time thought filtering"
```

---

## Task 11: Onboarding

**Files:**
- Modify: `src/components/Onboarding.tsx`

- [ ] **Step 1: Implement Onboarding**

Replace `src/components/Onboarding.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setOnboarded } from '@/lib/storage'

const MESSAGES = [
  '欢迎来到 Huuu。',
  '通过不加修饰的写作，清空你的思绪。',
  '想法会慢慢淡出，给新的思绪腾出空间。',
  '你有5分钟来修改它，之后就让它静静留在那里。',
  '别担心，你随时可以回来读它。',
]

interface Props {
  onDone: () => void
}

export default function Onboarding({ onDone }: Props) {
  const [visible, setVisible] = useState<string[]>([])
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => {
    let i = 0
    const delays = [0, 1200, 2200, 3400, 4800]

    const timers = delays.map((delay, idx) =>
      setTimeout(() => {
        setVisible(prev => [...prev, MESSAGES[idx]])
      }, delay)
    )

    const continueTimer = setTimeout(() => setShowContinue(true), 7000)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(continueTimer)
    }
  }, [])

  const handleDone = () => {
    setOnboarded()
    onDone()
  }

  return (
    <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--fg)' }}>引导</h2>
      <hr className="border-none h-px mb-6" style={{ background: 'var(--divider)' }} />

      <ul className="list-none p-0 m-0 space-y-5">
        <AnimatePresence>
          {visible.map(msg => (
            <motion.li
              key={msg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base"
              style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}
            >
              {msg}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {showContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleDone}
            aria-label="开始使用"
            className="mt-8 flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            开始使用
            <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
```

- [ ] **Step 2: Test onboarding flow**

Clear localStorage in browser DevTools (Application → Storage → Clear), then refresh. You should see the 5 messages appear one by one with a "开始使用" button after ~7 seconds. Clicking it transitions to the writing page.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add first-time onboarding with sequential message reveal"
```

---

## Task 12: PWA Configuration and Deployment

**Files:**
- Modify: `next.config.ts`
- Create: `src/app/manifest.ts`
- Create: `public/icon-192.png`, `public/icon-512.png` (placeholder icons)

- [ ] **Step 1: Install next-pwa**

```bash
npm install next-pwa
npm install --save-dev @types/next-pwa
```

- [ ] **Step 2: Configure next.config.ts**

Replace `next.config.ts`:
```typescript
import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  // No special config needed for this project
}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 3: Add PWA manifest**

Create `src/app/manifest.ts`:
```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Huuu',
    short_name: 'Huuu',
    description: '通过写作，清空思绪。',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

- [ ] **Step 4: Add placeholder icons**

```bash
# Generate minimal placeholder icons using ImageMagick (if installed)
# or just create 1x1 black PNGs as placeholders
python3 -c "
import struct, zlib

def make_png(size):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    row = b'\\x00' + b'\\x00\\x00\\x00' * size
    idat = zlib.compress(row * size)
    return b'\\x89PNG\\r\\n\\x1a\\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')

open('public/icon-192.png', 'wb').write(make_png(192))
open('public/icon-512.png', 'wb').write(make_png(512))
print('Icons created')
"
```

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: Build succeeds. Check for any TypeScript or lint errors and fix them.

- [ ] **Step 6: Deploy to Vercel**

```bash
npm install -g vercel
vercel
```

Follow the prompts:
- Set up and deploy: Y
- Which scope: your account
- Link to existing project: N
- Project name: huuu
- In which directory: ./
- Override settings: N

Note the deployment URL from the output.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: add PWA manifest and Vercel deployment configuration"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| 碎片化想法流，Enter 提交 | Task 6 (ThoughtInput) |
| 模糊退场，5分钟变只读 | Task 7 (ThoughtItem) |
| 单页无路由 | Task 8 (HuuuApp) |
| 中文占位符（7条） | Task 6 |
| 时间戳 zh-CN 格式 | Task 3 (dates.ts) |
| 日期分组（今天/昨天/周X/月日） | Task 3 |
| Backspace 删除空想法 | Task 7 |
| Cmd+F 搜索 | Task 10 |
| 语音输入 zh-CN | Task 6 (VoiceButton) |
| 主题切换（深/浅/系统） | Task 9 |
| 清空所有（确认） | Task 9 (Menu) |
| Onboarding 首次引导 | Task 11 |
| localStorage 存储 | Task 2 (storage.ts) |
| PWA | Task 12 |
| Vercel 部署 | Task 12 |
| Framer Motion 动效 | Tasks 7, 8, 11 |

All spec requirements covered. ✅
