# Sprint 3: Thought Blur Aging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-minute-gated blur system with an immediate aging effect that starts at submission, with per-thought hover-to-reveal at 0.5s.

**Architecture:** Two files change. `ThoughtItem.tsx` gets new age-stage constants (`fresh`/`aging`/`old`/`retired`) starting at t=0 instead of t=60s, and a stronger final blur. `globals.css` gets a slower blur-in transition (2s) and a new per-thought hover rule that clears blur at 0.5s. No other files touch.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vitest 4 + Testing Library

---

## Files

- Modify: `src/components/ThoughtItem.tsx` — age-stage constants + `getAgeState` + `getAgeStyle`
- Modify: `src/app/globals.css` — `.thought-text` transition + `.thought-item:hover .thought-text` hover rule
- Modify: `src/components/__tests__/ThoughtItem.test.tsx` — add two new aging tests

---

### Task 1: Update aging stages in ThoughtItem.tsx (TDD)

**Files:**
- Modify: `src/components/__tests__/ThoughtItem.test.tsx`
- Modify: `src/components/ThoughtItem.tsx`

- [ ] **Step 1: Write two failing tests**

Open `src/components/__tests__/ThoughtItem.test.tsx`. Add these two tests inside the `describe('ThoughtItem', ...)` block, after the existing tests:

```typescript
it('applies aging blur to a thought older than 30 seconds', () => {
  const thought = makeThought({
    timestamp: new Date(Date.now() - 31_000).toISOString(),
  })
  render(<ThoughtItem thought={thought} {...defaultProps} />)
  const p = screen.getByText('test thought')
  expect(p).toHaveStyle({ filter: 'blur(2px)', opacity: '0.65' })
})

it('applies old blur to a thought older than 2 minutes', () => {
  const thought = makeThought({
    timestamp: new Date(Date.now() - 121_000).toISOString(),
  })
  render(<ThoughtItem thought={thought} {...defaultProps} />)
  const p = screen.getByText('test thought')
  expect(p).toHaveStyle({ filter: 'blur(4px)', opacity: '0.4' })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/ThoughtItem.test.tsx
```

Expected: 2 failures — the 31s-old thought currently renders with `filter: none` (old code treats anything under 60s as `fresh`), and the 121s-old thought renders with `filter: blur(1px)` (old `recent` style).

- [ ] **Step 3: Replace stage constants and functions in ThoughtItem.tsx**

Open `src/components/ThoughtItem.tsx`. Replace everything from `type AgeState` through the closing brace of `getAgeStyle` (lines 16–41 in the current file) with:

```typescript
type AgeState = 'fresh' | 'aging' | 'old' | 'retired'

const STAGE_FRESH_MS  =       30_000  // 30s
const STAGE_AGING_MS  =  2 * 60_000  // 2min
const STAGE_OLD_MS    =  4 * 60_000  // 4min
const RETIRE_DELAY_MS = STAGE_OLD_MS

function getAgeState(ageMs: number): AgeState {
  if (ageMs < STAGE_FRESH_MS) return 'fresh'
  if (ageMs < STAGE_AGING_MS) return 'aging'
  if (ageMs < STAGE_OLD_MS)   return 'old'
  return 'retired'
}

function getAgeStyle(state: AgeState): { filter: string; opacity: number } {
  switch (state) {
    case 'fresh':   return { filter: 'none',      opacity: 1.0  }
    case 'aging':   return { filter: 'blur(2px)', opacity: 0.65 }
    case 'old':     return { filter: 'blur(4px)', opacity: 0.4  }
    case 'retired': return { filter: 'blur(6px)', opacity: 0.2  }
  }
}
```

Also update the `renderTick` boundary scheduler (lines 68–93). The second `useEffect` calculates `msUntilNextBoundary` — replace the boundary values to match the new constants:

```typescript
useEffect(() => {
  const ageMs = Date.now() - new Date(thought.timestamp).getTime()

  let msUntilNextBoundary: number | null = null

  if (ageMs < STAGE_FRESH_MS) {
    msUntilNextBoundary = STAGE_FRESH_MS - ageMs
  } else if (ageMs < STAGE_AGING_MS) {
    msUntilNextBoundary = STAGE_AGING_MS - ageMs
  } else if (ageMs < STAGE_OLD_MS) {
    msUntilNextBoundary = STAGE_OLD_MS - ageMs
  }

  if (msUntilNextBoundary === null) return

  const timer = setTimeout(() => {
    setRenderTick(t => t + 1)
  }, msUntilNextBoundary)

  return () => clearTimeout(timer)
}, [thought.timestamp, renderTick])
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
npx vitest run
```

Expected: all tests pass. The two new tests now pass because 31s-old → `aging` (blur 2px / 0.65) and 121s-old → `old` (blur 4px / 0.4). The existing `'dispatches RETIRE when thought is old'` test uses a 6-minute-old thought — 6min > 4min = `RETIRE_DELAY_MS`, so RETIRE still fires, test still passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/ThoughtItem.tsx src/components/__tests__/ThoughtItem.test.tsx
git commit -m "feat: immediate blur aging — fresh 30s, aging 2min, old 4min"
```

---

### Task 2: Add hover-reveal CSS rule to globals.css

**Files:**
- Modify: `src/app/globals.css`

No unit test exists for CSS transitions — verify visually after this task.

- [ ] **Step 1: Update `.thought-text` transition and add hover rule**

Open `src/app/globals.css`. Find the existing `.thought-text` transition block (currently around line 39):

```css
/* Fade transition for thought blur — cannot use Tailwind for variable blur values */
.thought-text {
  transition: filter 2s ease, opacity 2s ease;
}
```

This block is already correct (2s ease). Leave it as-is.

Now find the `.thought-text` rule inside the main block (around line 163):

```css
.thought-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary);
  word-break: break-word;
  white-space: pre-wrap;
  margin: 0;
}
```

Add the hover-reveal rule immediately after this block:

```css
.thought-item:hover .thought-text {
  filter: none !important;
  opacity: 1 !important;
  transition: filter 0.5s ease, opacity 0.5s ease;
}
```

The `!important` is required because blur is applied as an inline `style` attribute from React, which outranks class-based CSS without it. The hover rule gives a faster (0.5s) transition than the aging transition (2s), so hovering feels intentional and distinct from passive aging.

- [ ] **Step 2: Verify visually**

Start the dev server if not running:

```bash
npm run dev
```

Open http://localhost:3001 (Huuu runs on 3001 — port 3000 is taken by another project).

1. Type a thought and submit. It should be fully clear immediately.
2. Wait 30 seconds. The thought should begin to blur.
3. Move the mouse over the blurred thought. It should clear over ~0.5s.
4. Move the mouse away. It should return to blurred over ~0.5s.
5. Repeat with a thought older than 2 minutes — verify it blurs more heavily.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: per-thought hover-reveal, 0.5s transition"
```

---

### Task 3: Build verification

**Files:** none

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (56 total — 54 existing + 2 new aging tests).

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build completes with no errors. Warnings about bundle size are acceptable; type errors are not.
