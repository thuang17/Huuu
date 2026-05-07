# Huuu Sprint 2: UI/UX Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all functional UX gaps and visual inconsistencies between Huuu and flow.rest's quality bar — mobile layout, focus mode, omnibar redesign, accessibility, and polish.

**Architecture:** Next.js App Router, Tailwind v4 (`@import "tailwindcss"`), Framer Motion, CSS custom properties, localStorage. All edits in `src/`.

**Tech Stack:** Next.js 16, TypeScript, Framer Motion 11, Vitest 4 + happy-dom, CSS custom properties.

---

## Sprint 1 Recap — What Was Built

| ✅ Done | Status |
|---|---|
| Thought stream with localStorage persistence | Complete |
| 5-minute auto-retire with blur effect | Complete |
| Dark / light / system theme toggle | Complete |
| Voice input (Web Speech API) | Complete |
| Omnibar search (full-screen modal) | Complete — needs redesign |
| Chinese onboarding (5 messages → button) | Complete |
| PWA (manifest + service worker) | Complete |
| Deployed to Vercel (huuu-mu.vercel.app) | Complete |
| `max-width: 960px`, `padding: 120px 32px` layout | Complete |
| Bottom gradient fade, `<hr>` divider | Complete |
| Hover-reveal timestamps (`left: -72px`, `top: 26px`) | Complete |
| Active thought highlight box (`#191919` rounded) | Complete |
| SVG hamburger menu icon | Complete |
| Section spacing (`48px` between sections) | Complete |

---

## Design Audit — What's Still Broken

### 🔴 Critical (functional / mobile broken)

1. **Timestamps are off-screen on mobile** — `left: -72px` sends them far outside the viewport on phones. Hover doesn't work on touch. On mobile they should appear at bottom-right with `backdrop-filter: blur(8px)`.
2. **Section `h2` styling wrong for Chinese** — `text-transform: uppercase` is no-op on Chinese; `letter-spacing: 0.1em` creates ugly gaps between 今/天 characters. Font-size `0.7rem` = 11.2px — below minimum for CJK text.
3. **Bottom gradient (z-index 1) can cover interactive elements** — The `::after` fixed gradient has `z-index: 1`. Interactive elements that scroll near it can be hidden behind it. Input row's voice button and the thought items near the bottom need to be at `z-index: 2+`.

### 🟡 High Priority (UX gaps vs flow.rest)

4. **No focus / flow mode** — flow.rest's header (logo + menu button) fades out when the user focuses on the input textarea. It returns when they blur. This is a key part of the distraction-free writing experience.
5. **Omnibar is a full-screen modal** — flow.rest uses a compact 296px fixed bar that slides in from the top (opacity + translateY). Ours is a full dark overlay with a results list. The UX pattern is completely different.
6. **No auto-scroll to new thought** — After submitting a thought, if the page is long the newest thought may be below the fold. The page should scroll to show it.
7. **`prefers-reduced-motion` not respected** — All Framer Motion animations play regardless of OS accessibility setting.

### 🔵 Medium Priority (visual polish)

8. **Empty state** — When no thoughts exist today, the area under the `<hr>` is completely blank. Should show a subtle faint prompt.
9. **Line-height mismatch between view and edit** — `<p class="thought-text">` uses `line-height: 1.5`; the `<textarea>` in globals.css uses `line-height: 1.7`. Switching between them causes a height jump.
10. **Retired thought has no affordance** — Clicking a blurred/retired thought does nothing visible. Users don't know why. A subtle cursor or tooltip would clarify.

---

## File Map

| File | Changes |
|---|---|
| `src/app/globals.css` | Section h2 CJK fix, mobile timestamps, bottom gradient z-index, focus mode, empty state, line-height unification, `prefers-reduced-motion` |
| `src/components/Header.tsx` | Focus mode: expose `isFocused` prop; animate logo + button offscreen when typing |
| `src/context/AppContext.tsx` | Add `isFocusMode: boolean`, `setFocusMode` to context |
| `src/components/ThoughtInput.tsx` | Call `setFocusMode(true/false)` on focus/blur |
| `src/components/HuuuApp.tsx` | Pass `isFocusMode` to `<Header>` |
| `src/components/Omnibar.tsx` | Full redesign: compact 296px slide-in bar |
| `src/components/ThoughtSection.tsx` | Add empty state below `<hr>` |
| `src/components/ThoughtStream.tsx` *(new)* | Wrapper that handles auto-scroll after ADD dispatch |
| `src/components/__tests__/Omnibar.test.tsx` | Update tests for new omnibar structure |

---

## Task 1: Fix Section `h2` for Chinese Text

**Files:**
- Modify: `src/app/globals.css` (`.thought-section h2` block)

- [ ] **Step 1: Update the CSS**

Remove `text-transform: uppercase` (no-op for CJK, makes sense only for Latin).
Remove `letter-spacing: 0.1em` (adds ugly gaps between Chinese characters).
Increase `font-size` to `0.75rem` (12px — minimum readable for CJK).
Keep `font-weight: 500` and `color: var(--text-secondary)`.

```css
.thought-section h2 {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  margin-bottom: 0;
  padding-bottom: 0;
}
```

- [ ] **Step 2: Verify visually** — run `npm run dev`, check that "今天", "昨天", "周一" headers look clean without gaps or weird letter spacing.

- [ ] **Step 3: Run tests** — `npm test -- --run` (all 56 tests must pass; this is CSS-only so no test changes needed).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: CJK-correct section h2 — remove uppercase/letter-spacing, min 12px"
```

---

## Task 2: Mobile Timestamps + Touch Layout

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add mobile media query for timestamps**

On mobile (`max-width: 640px`) timestamps can't go `left: -72px` — that's off-screen. flow.rest moves them to bottom-right of the thought with backdrop blur.

```css
@media (max-width: 640px) {
  .thought-timestamp {
    left: unset;
    right: 4px;
    top: unset;
    bottom: 4px;
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
  }
}
```

- [ ] **Step 2: Make timestamps visible on touch (mobile tap)**

On touch devices there's no hover. Make timestamps always visible on mobile:

```css
@media (max-width: 640px) {
  .thought-timestamp {
    opacity: 0.6;
  }
}
```

- [ ] **Step 3: Ensure voice button touch target is 44×44px**

In globals.css, `.voice-btn` currently has `padding: 0.25rem`. Add minimum size:

```css
.voice-btn {
  /* existing rules */
  min-width: 44px;
  min-height: 44px;
}
```

- [ ] **Step 4: Add overscroll-behavior to prevent pull-to-refresh**

```css
html, body {
  /* existing rules */
  overscroll-behavior: none;
}
```

- [ ] **Step 5: Mobile padding for thought-stream**

On mobile the `padding: 120px 2rem 4rem` top padding is too much. Reduce to 60px:

```css
@media (max-width: 640px) {
  .thought-stream {
    padding-top: 60px;
    padding-bottom: 80px;
  }
}
```

- [ ] **Step 6: Run tests and commit**

```bash
npm test -- --run
git add src/app/globals.css
git commit -m "fix: mobile timestamps at bottom-right, touch targets 44px, overscroll-none"
```

---

## Task 3: Fix Line-height Mismatch + Bottom Gradient Z-index

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Unify line-height between `<p>` and `<textarea>`**

Currently:
- `.thought-text` (`<p>`): `line-height: 1.5`
- `textarea` global rule: `line-height: 1.7`
- `.thought-input`: `line-height: 1.5`

This causes a height jump when switching between viewing and editing. Unify everything to `1.6`:

```css
/* Update textarea global */
textarea {
  /* existing */
  line-height: 1.6;
}

/* Update .thought-text */
.thought-text {
  /* existing */
  line-height: 1.6;
}

/* Update .thought-input */
.thought-input {
  /* existing */
  line-height: 1.6;
}
```

- [ ] **Step 2: Fix bottom gradient z-index so it doesn't trap clicks**

The gradient `z-index: 1` can visually cover thought items near the bottom. Add `z-index: 2` to the thought-input-row so the input row always floats above the gradient:

```css
.thought-input-row {
  /* existing */
  position: relative;
  z-index: 2;
}
```

Also ensure the `.app-header` (fixed top bar) is above the fade:

```css
.app-header {
  /* existing */
  z-index: 10; /* already exists, confirm it's set */
}
```

- [ ] **Step 3: Add `prefers-reduced-motion` global rule**

```css
@media (prefers-reduced-motion: reduce) {
  .thought-text {
    transition: none;
  }
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run tests and commit**

```bash
npm test -- --run
git add src/app/globals.css
git commit -m "fix: unify line-height 1.6, z-index layering, prefers-reduced-motion"
```

---

## Task 4: Focus / Flow Mode (Header Fades When Typing)

flow.rest's most distinctive micro-interaction: when you start typing, the header logo and menu button slide offscreen. The page feels like a blank canvas.

**Files:**
- Modify: `src/context/AppContext.tsx`
- Modify: `src/components/ThoughtInput.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/HuuuApp.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `isFocusMode` to AppContext**

Read `src/context/AppContext.tsx` first. Add `isFocusMode` boolean and `setFocusMode` to the context interface and value:

```typescript
interface AppContextValue {
  dispatch: React.Dispatch<ThoughtsAction>
  thoughts: Thought[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  isFocusMode: boolean                        // ADD
  setFocusMode: (mode: boolean) => void       // ADD
}
```

In `HuuuApp.tsx` where the context value is built, add:

```typescript
const [isFocusMode, setFocusMode] = useState(false)

const contextValue = useMemo(() => ({
  dispatch,
  thoughts,
  activeId,
  setActiveId,
  isSearchOpen,
  setIsSearchOpen,
  isFocusMode,       // ADD
  setFocusMode,      // ADD
}), [dispatch, thoughts, activeId, isSearchOpen, isFocusMode])
```

- [ ] **Step 2: Call `setFocusMode` from `ThoughtInput.tsx`**

Read `src/components/ThoughtInput.tsx`. Add `setFocusMode` from context. Call it on textarea focus/blur:

```typescript
const { dispatch, setFocusMode } = useAppContext()

// In the textarea JSX:
<textarea
  ...
  onFocus={() => setFocusMode(true)}
  onBlur={() => setFocusMode(false)}
/>
```

- [ ] **Step 3: Animate header in `Header.tsx`**

Read `src/components/Header.tsx`. Import `isFocusMode` from context. Use CSS class toggling (not Framer Motion — this should be CSS transitions for performance):

```tsx
const { isFocusMode } = useAppContext()

// On the logo element:
<span className={`logo${isFocusMode ? ' logo--hidden' : ''}`}>
  Huuu
</span>

// On the menu button:
<button
  className={`menu-btn${isFocusMode ? ' header-btn--hidden' : ''}`}
  ...
>
```

- [ ] **Step 4: Add CSS for focus mode transitions in globals.css**

```css
.logo {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.logo--hidden {
  transform: translateX(-40px);
  opacity: 0;
  pointer-events: none;
}

.menu-btn {
  /* existing */
  transition: transform 0.15s ease, opacity 0.15s ease, color 0.15s ease;
}
.header-btn--hidden {
  transform: translateX(40px);
  opacity: 0;
  pointer-events: none;
}
```

- [ ] **Step 5: Update mock in tests**

The `AppContext` mock in `ThoughtItem.test.tsx` and `Onboarding.test.tsx` must include the new fields:

```typescript
vi.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    dispatch: mockDispatch,
    thoughts: [],
    activeId: null,
    setActiveId: vi.fn(),
    isSearchOpen: false,
    setIsSearchOpen: vi.fn(),
    isFocusMode: false,        // ADD
    setFocusMode: vi.fn(),     // ADD
  }),
}))
```

Check all test files that mock `AppContext` and add these fields. Files to check:
- `src/components/__tests__/ThoughtItem.test.tsx`
- Any other test file that mocks `useAppContext`

- [ ] **Step 6: Run tests and commit**

```bash
npm test -- --run
git add src/context/AppContext.tsx src/components/ThoughtInput.tsx src/components/Header.tsx src/components/HuuuApp.tsx src/app/globals.css src/components/__tests__/ThoughtItem.test.tsx
git commit -m "feat: focus mode — header slides away when typing, returns on blur"
```

---

## Task 5: Auto-scroll to New Thought

After pressing Enter to submit a thought, the new thought appears at the bottom of the `今天` section. If the user has many thoughts and scrolled up, they won't see it. The page should smoothly scroll to show the new thought.

**Files:**
- Modify: `src/components/ThoughtSection.tsx`

- [ ] **Step 1: Track the last thought's DOM element**

Read `src/components/ThoughtSection.tsx`. The thought list is rendered via `AnimatePresence`. We need to scroll to the bottom of the list when a new thought is added.

Add a ref to the end of the thought list:

```tsx
const bottomRef = useRef<HTMLDivElement>(null)
const prevLengthRef = useRef(thoughts.length)

useEffect(() => {
  if (thoughts.length > prevLengthRef.current) {
    // A new thought was added
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  prevLengthRef.current = thoughts.length
}, [thoughts.length])
```

Add `<div ref={bottomRef} />` at the very end of the thought list (after `</AnimatePresence>`).

- [ ] **Step 2: Only scroll for the "今天" section**

This should only happen for the current-day section (where new thoughts are added):

```tsx
// Only set up scroll tracking for title === '今天'
const isToday = title === '今天'
```

Wrap the useEffect with `if (!isToday) return`.

- [ ] **Step 3: Run tests and commit**

```bash
npm test -- --run
git add src/components/ThoughtSection.tsx
git commit -m "feat: auto-scroll to new thought after submit"
```

---

## Task 6: Omnibar Redesign — Compact Slide-in Bar

Replace the full-screen modal overlay with flow.rest's compact 296px fixed bar. Key differences:
- No backdrop overlay (thoughts are still visible)
- Compact bar slides in from top (`translateY(-64px)` → `translateY(0)`)
- Shows search input + count (`X / Y`)
- No results list — highlighting is in-place (for now: just show count)
- Triggered by `Cmd+F` (keep existing `Cmd+K` as alias)

**Files:**
- Modify: `src/components/Omnibar.tsx`
- Modify: `src/app/globals.css` (replace `.omnibar-*` classes)
- Modify: `src/components/__tests__/Omnibar.test.tsx` (if exists)

- [ ] **Step 1: Read the existing Omnibar.tsx and its test file**

Understand the current structure before rewriting.

- [ ] **Step 2: Rewrite Omnibar.tsx**

The new omnibar is a compact fixed bar. It no longer renders a results list. Instead it shows:
- A search `<input>`
- A `<span>` showing `X / Y` (matching thoughts / total active thoughts)
- ESC to close

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import type { Thought } from '@/lib/types'

interface OmnibarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Omnibar({ isOpen, onClose }: OmnibarProps) {
  const { thoughts } = useAppContext()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Count matching thoughts
  const activeThoughts = thoughts.filter(t => !t.readOnly)
  const matchCount = query.trim()
    ? thoughts.filter(t =>
        t.value.toLowerCase().includes(query.toLowerCase())
      ).length
    : thoughts.length

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="omnibar"
      data-active={isOpen}
      role="search"
      aria-label="搜索想法"
    >
      <input
        ref={inputRef}
        className="omnibar-input"
        type="text"
        placeholder="搜索..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="搜索"
      />
      <span className="omnibar-count" aria-live="polite">
        {query.trim() ? `${matchCount} / ${thoughts.length}` : thoughts.length}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Update globals.css — replace omnibar styles**

Remove all `.omnibar-overlay`, `.omnibar-container`, `.omnibar-results`, `.omnibar-result-item`, `.omnibar-empty` classes. Replace with:

```css
.omnibar {
  width: 296px;
  position: fixed;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--menu-bg);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  height: 48px;
  border-radius: 8px;
  padding: 0 1rem;
  top: 48px;
  left: 50%;
  transform: translateX(-50%) translateY(-80px);
  opacity: 0;
  z-index: 20;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}

.omnibar[data-active="true"] {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.omnibar .omnibar-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  padding: 0;
  border-bottom: none;  /* override textarea global */
}

.omnibar-count {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
```

- [ ] **Step 4: Update HuuuApp.tsx to pass props correctly**

The Omnibar used to use a portal. Now it's a regular fixed element. Make sure `<Omnibar>` is rendered inside `HuuuApp` (not in a portal) and receives `isOpen` and `onClose`:

```tsx
<Omnibar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
```

- [ ] **Step 5: Update Omnibar tests**

The test file expects the old overlay structure. Rewrite the tests to match the new compact bar:

```typescript
describe('Omnibar', () => {
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
```

- [ ] **Step 6: Run tests and commit**

```bash
npm test -- --run
git add src/components/Omnibar.tsx src/app/globals.css src/components/HuuuApp.tsx src/components/__tests__/Omnibar.test.tsx
git commit -m "feat: omnibar redesign — compact 296px slide-in bar, removes full-screen overlay"
```

---

## Task 7: Empty State

When the user has no thoughts in today's section, the area under the `<hr>` divider is blank. Add a subtle prompt.

**Files:**
- Modify: `src/components/ThoughtSection.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Conditionally render empty state**

In `ThoughtSection.tsx`, after the `<AnimatePresence>` block, add:

```tsx
{title === '今天' && thoughts.length === 0 && (
  <p className="thought-empty">
    今天还没有想法
  </p>
)}
```

- [ ] **Step 2: Style it in globals.css**

```css
.thought-empty {
  font-size: 0.875rem;
  color: var(--text-placeholder);
  padding: 1.5rem 0;
  margin: 0;
}
```

- [ ] **Step 3: Run tests and commit**

```bash
npm test -- --run
git add src/components/ThoughtSection.tsx src/app/globals.css
git commit -m "feat: empty state — show prompt when no thoughts today"
```

---

## Task 8: Build Verification + Deploy

- [ ] **Step 1: Full test run**

```bash
npm test -- --run
```

Expected: all tests pass (count may increase from new Omnibar tests).

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: no TypeScript errors, no missing module errors, all pages generate successfully.

- [ ] **Step 3: Smoke test on mobile viewport**

```bash
npm run dev
```

Open Chrome DevTools → device toolbar → iPhone SE (375px). Check:
- Timestamps appear at bottom-right
- Touch targets are tap-able
- No horizontal scroll
- Header disappears when typing

- [ ] **Step 4: Push to GitHub (triggers Vercel deploy)**

```bash
git push
```

- [ ] **Step 5: Verify live on huuu-mu.vercel.app**

Check dark and light mode, mobile and desktop, onboarding flow, thought submission, omnibar.

---

## Design Notes for Implementers

### Aesthetic direction (from frontend-design skill)
Huuu's aesthetic is **brutally minimal** — no decoration, no color except grayscale, typography does all the work. Every addition must pass this test: *does this element earn its place, or does it add noise?*

### The flow.rest principles to internalize
1. **Content is the UI** — The thoughts ARE the page. Chrome (header, borders) is minimized.
2. **Focus is sacred** — Everything disappears when you write. Nothing competes with the text cursor.
3. **Time is the visual language** — Blur encodes age. The visual state of a thought tells its story without words.
4. **Reveal on demand** — Timestamps, menus, actions — hidden by default, revealed on hover/focus/active.

### What NOT to add
- No borders on thought items (unless active highlight counts, which is already done)
- No icons inside thought items
- No reaction buttons, like buttons, tag chips
- No color accents beyond grayscale
- No loading spinners (thoughts are local, instant)

---

## Execution Options

**Subagent-Driven (recommended):** Dispatch one fresh subagent per task with the full task text as context. Use spec + code-quality review between tasks.

**Inline Execution:** Execute tasks sequentially in a single session using executing-plans.
