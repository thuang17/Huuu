# Sprint 3: Thought Blur Aging — Design Spec

**Goal:** Replace the current 5-minute-gated blur system with an immediate aging effect that starts the moment a thought is written, with per-thought hover-to-reveal behavior.

**Reference:** flow.rest — thoughts begin fading immediately after submission.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Blur onset | Immediately (t=0) | Reinforces "this moment" — the most recent thought is always the clearest |
| Blur intensity | Strong (up to blur 6px / opacity 0.2) | Older thoughts almost disappear, strong visual hierarchy |
| Hover reveal | Per-thought, 0.5s transition | Intentional — feels like "recalling" a thought, not instant lookup |
| Timestamps | Hover-only (no change) | Current behavior is correct |
| Layout spacing | Keep 120px top padding (no change) | Current spacing is preferred |
| Keyboard shortcut | Cmd+F / Ctrl+F (no change) | Current implementation already handles both platforms |

---

## Aging Stages

Four discrete stages starting from t=0:

| Stage | Age Range | filter | opacity |
|-------|-----------|--------|---------|
| `fresh` | 0 – 30s | none | 1.0 |
| `aging` | 30s – 2min | blur(2px) | 0.65 |
| `old` | 2min – 4min | blur(4px) | 0.4 |
| `retired` | 4min+ | blur(6px) | 0.2 + readOnly |

Stage transitions are animated smoothly via CSS `transition: filter 2s ease, opacity 2s ease`.

---

## Hover Behavior

- Hovering a single `.thought-item` reveals only that thought's text
- Transition: `filter 0.5s ease, opacity 0.5s ease` (medium speed — intentional, like recalling)
- Mouse-out restores the aged state with the same 0.5s transition
- Implemented entirely in CSS — no JS needed

```css
.thought-item:hover .thought-text {
  filter: none !important;
  opacity: 1 !important;
  transition: filter 0.5s ease, opacity 0.5s ease;
}
```

The `!important` is needed because blur is applied via inline style from React.

---

## Files Changed

### `src/components/ThoughtItem.tsx`

Replace stage constants and `getAgeState` / `getAgeStyle`:

```typescript
type AgeState = 'fresh' | 'aging' | 'old' | 'retired'

const STAGE_FRESH_MS  =       30_000  // 30s
const STAGE_AGING_MS  =  2 * 60_000  // 2min
const STAGE_OLD_MS    =  4 * 60_000  // 4min
const RETIRE_DELAY_MS = STAGE_OLD_MS // readOnly locks at same point

function getAgeState(ageMs: number): AgeState {
  if (ageMs < STAGE_FRESH_MS) return 'fresh'
  if (ageMs < STAGE_AGING_MS) return 'aging'
  if (ageMs < STAGE_OLD_MS)   return 'old'
  return 'retired'
}

function getAgeStyle(state: AgeState): { filter: string; opacity: number } {
  switch (state) {
    case 'fresh':   return { filter: 'none',      opacity: 1.0 }
    case 'aging':   return { filter: 'blur(2px)', opacity: 0.65 }
    case 'old':     return { filter: 'blur(4px)', opacity: 0.4  }
    case 'retired': return { filter: 'blur(6px)', opacity: 0.2  }
  }
}
```

The `renderTick` re-render timer logic and RETIRE dispatch logic remain unchanged — only the constants and stage names change.

### `src/app/globals.css`

Replace the `.thought-text` transition block and add hover rule:

```css
.thought-text {
  transition: filter 2s ease, opacity 2s ease;
}

.thought-item:hover .thought-text {
  filter: none !important;
  opacity: 1 !important;
  transition: filter 0.5s ease, opacity 0.5s ease;
}
```

---

## What Does NOT Change

- Timestamp display (hover-only, current behavior)
- Layout spacing (120px top padding)
- Keyboard shortcuts (Cmd+F / Ctrl+F)
- Omnibar, focus mode, auto-scroll, empty state (all Sprint 2 work)
- `readOnly` still engages at 4min (same as `retired` stage)

---

## Testing

Existing test `'dispatches RETIRE when thought is old'` uses a 6-minute-old thought — still passes since `RETIRE_DELAY_MS` stays at 4min (less than 6min).

New manual test: submit a thought, wait 30s, verify blur begins. Hover a blurred thought, verify it clears in ~0.5s. Mouse out, verify it returns to blurred state.
