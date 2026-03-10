# ADH1 Knowledge Quiz — Dev Handoff

**Client:** BridgeBio Pharma
**Project type:** Interactive medical congress kiosk experience
**Status:** Functional prototype — needs cleanup before production/handoff to events team
**Figma source:** https://www.figma.com/design/TpgqF3fO4M5SXMSbIBBNOQ/Interactive-Medical-Congress-Experience

---

## What This Is

A touchscreen quiz app designed to run on a tablet or kiosk at a medical congress. Attendees tap to start, answer 6 multiple-choice questions about ADH1 (autosomal dominant hypocalcemia type 1), see their score, and can optionally add their initials to a local leaderboard. The leaderboard persists across sessions via localStorage.

The main visual hook is a **WebGL fog overlay** that progressively clears as the player answers questions, creating a "revealing knowledge" metaphor. The fog is fully opaque on the landing screen and fully cleared on the final results screen.

This was vibe-coded with AI (Claude Code) starting from a Figma Make export. The core experience is complete and working. It needs code cleanup, not new features.

---

## Tech Stack

| Tool | Version | Notes |
|------|---------|-------|
| React | 18.3.1 | |
| TypeScript | via Vite | No separate tsconfig strictness config |
| Vite | 6.3.5 | |
| Tailwind CSS | v4.1.12 | Via `@tailwindcss/vite` plugin — this is v4, NOT v3 syntax |
| Framer Motion | 12.x (`motion/react`) | Import path is `motion/react`, not `framer-motion` |
| WebGL | Raw (no library) | Used only for the fog overlay |
| Lucide React | 0.487.0 | Icons |
| shadcn/ui | Various | Mostly installed but unused — see cleanup notes |

**Font:** Plus Jakarta Sans, loaded via Google Fonts in `src/styles/fonts.css`

---

## Getting Started

```bash
npm install
npm run dev      # development server
npm run build    # production build → dist/
```

The `package.json` lists `react` and `react-dom` as `peerDependencies` (marked optional) — this is a Figma Make artifact. **Before deploying, move them to regular `dependencies`** or the build may fail in some environments.

---

## Canvas / Scaling Model

The entire app renders inside a fixed **748×1330px design canvas** (9:16 portrait aspect ratio, 1330px tall). This canvas is centered in the viewport and scaled uniformly via CSS `transform: scale()` to fit any screen size, with black letterbox bars filling the rest.

```
DESIGN_HEIGHT = 1330
DESIGN_WIDTH  = 748  (= 1330 × 9/16)
```

All pixel/rem values in child components are authored at this 748×1330 size. They do not need to be responsive — the uniform scale handles all screen sizes. Do not add media queries or try to make layouts fluid; the transform approach is intentional and correct for a kiosk app.

The scale factor is computed in `App.tsx` and passed down to `FogOverlay` so the fog can correctly map touch coordinates from viewport space to canvas space.

---

## App Structure

```
src/
├── app/
│   ├── App.tsx                    ← Root: screen state machine, fog density logic, transition flash
│   └── components/
│       ├── LandingScreen.tsx      ← Landing screen: hero + start button + leaderboard preview
│       ├── QuizScreen.tsx         ← Quiz: all 6 questions hardcoded here
│       ├── FinalScreen.tsx        ← Results: 3-phase flow (score → initials → leaderboard)
│       ├── Footer.tsx             ← References modal + optional Exit button
│       ├── FogOverlay.tsx         ← WebGL two-pass fog renderer
│       ├── FogDebugConsole.tsx    ← DEV ONLY — fog parameter sliders (remove for prod)
│       ├── PasswordGate.tsx       ← Simple password wall
│       ├── figma/
│       │   └── ImageWithFallback.tsx  ← Possibly unused, Figma Make artifact
│       └── ui/                    ← shadcn/ui component library (most unused)
├── imports/                       ← Figma-generated SVG/layer files (likely entirely unused)
├── assets/
│   ├── bg-v1.jpg                  ← Background: Landing + Quiz screens
│   ├── bg-v2.jpg                  ← Background: Final screen
│   └── tap-icon.svg               ← Probably unused (TapIcon is inline SVG in LandingScreen)
├── styles/
│   ├── fonts.css                  ← Google Fonts import
│   ├── index.css                  ← Main CSS entry point
│   ├── tailwind.css               ← Tailwind v4 import
│   └── theme.css                  ← shadcn/ui CSS variables (light + dark mode tokens)
└── main.tsx                       ← React entry point
```

---

## Screen Flow

```
PasswordGate
    └── App (state: 'landing' | 'quiz' | 'final')
            ├── LandingScreen  →  [Start Quiz]  →  QuizScreen
            ├── QuizScreen     →  [Next / See Results]  →  QuizScreen (next Q) | FinalScreen
            └── FinalScreen    →  [Back to Start]  →  LandingScreen
```

### Screen transitions
- **Landing → Quiz** and **Quiz → Final**: Black full-screen flash (300ms fade in/out via `isTransitioning` state + `AnimatePresence` in App.tsx). The flash covers the screen while the new content mounts.
- **Quiz question → next quiz question**: No flash. `QuizScreen` stays mounted; `questionNumber` prop changes, which drives an `AnimatePresence mode="wait"` inside `QuizScreen` to fade content in/out. This means `QuizScreen` is never unmounted mid-quiz.
- All screen mounts use `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`.

---

## Screen Details

### LandingScreen

**File:** `src/app/components/LandingScreen.tsx`

- Full-bleed background image (`bg-v1.jpg`)
- Heading, subhead, Start Quiz button with inline `TapIcon` SVG
- Leaderboard preview: top 10 entries in a 2-column grid, loaded from localStorage on mount
- Tapping Start Quiz calls `onTopicSelect('What Is ADH1?')` after a 400ms delay (for the button press animation to complete)
- The `TapIcon` SVG is defined inline in this file (not imported from `src/assets/tap-icon.svg`)

### QuizScreen

**File:** `src/app/components/QuizScreen.tsx`

All quiz content is a hardcoded `Record<string, QuizData>` called `quizDataMap`. The 6 questions are keyed by topic name:

1. `"What Is ADH1?"` — 3-option multiple choice
2. `"Mechanism of Disease"` — 3-option multiple choice
3. `"Clinical Presentation"` — 3-option multiple choice
4. `"Average Time to Diagnosis"` — True/False
5. `"Confirming Diagnosis"` — 3-option multiple choice
6. `"Limitations of Conventional Therapy"` — True/False

**Scoring:** 100 points per correct answer. Max score = 600. Score is tracked in App.tsx, not QuizScreen.

**Answer feedback flow:**
1. User taps an answer → selected answer is locked in, `onAnswerResult(correct)` fires immediately
2. 600ms later, the explanation panel slides up
3. Correct answer highlights gold (`#FFC358`), incorrect highlights red (`#d64545`)
4. Unselected wrong answers dim to 30% opacity
5. "Next Question" / "See Results" button appears in the explanation panel

**Markup rendering:** The `renderMarkup(text, showRefs)` function handles inline formatting tags:
- `[I]...[/I]` → `<em>` (italic, adds 0.15em right margin)
- `[SUP]...[/SUP]` → `<sup>` (superscript references, rendered at 0.65em)
- `[BR]` → `<br />`

Superscript reference numbers are **hidden until the user answers** (controlled by `showRefs = !!selectedAnswer`). This is intentional — references only appear after the answer is committed.

**Answer display text:** Some answers have both a `text` (plain, used as the unique key and for correct/incorrect logic) and `display` (markup version for rendering). The `display` field adds formatted gene names and reference superscripts that shouldn't show until after answering.

**Progress bar:** Animates from `(questionNumber-1)/6 * 100%` to `questionNumber/6 * 100%` when the question mounts, giving the visual of "this question completing the bar segment."

### FinalScreen

**File:** `src/app/components/FinalScreen.tsx`

Three internal phases controlled by `phase` state: `'reveal'` → `'initials'` → `'leaderboard'`

**Phase 1 — Score reveal:**
- Shows congratulatory message or encouragement fallback
- Peer percentile: computes what % of **real players** (non-seeded entries) the current score beats. Only shows "top X% of peers" if the player is in the top 50%+. Otherwise shows a generic encouragement message.
- "Add to Leaderboard" → Phase 2
- "Skip" → Phase 3 (without adding entry)

**Phase 2 — Initials entry:**
- 3 character boxes with on-screen QWERTY keyboard
- Characters typed left-to-right; backspace steps back
- Box can be tapped directly to change focus
- Submit saves to localStorage, sorts top 10, transitions to Phase 3
- Submit is disabled if all 3 boxes are empty (partial initials are allowed — blanks become `_`)

**Phase 3 — Leaderboard:**
- 2-column grid of top 10
- Player's own entry is highlighted in gold if they're in the top 10
- "The next era of ADH1 care starts with awareness" message
- "Learn more at ADH1.com"
- "Back to Start" returns to landing and resets all state

**Layout shift:** When Phase 3 enters, the layout switches from `justify-center` (vertically centered) to `justify-start pt-16` to accommodate the taller leaderboard content. This is controlled by `isLeaderboardLayout` state, which flips via `onExitComplete` on the `AnimatePresence`.

### Footer

**File:** `src/app/components/Footer.tsx`

Absolutely positioned to the bottom of every screen. Contains:
- Left: legal copy — `© 2026 BridgeBio Pharma, Inc. All rights reserved. MAT-US-ECLTX-0125`
- Right: References button (always shown) + Exit button (shown only when `onExit` prop is provided)

References button opens a modal overlay with 4 numbered references. The modal uses `fixed inset-0` so it covers the full viewport, not just the design canvas.

The `Footer` has its own copy of a simpler `renderMarkup` that only handles `[I]` tags (for italicizing journal names in references). This is separate from the one in QuizScreen.

### PasswordGate

**File:** `src/app/components/PasswordGate.tsx`

Wraps the entire app. Shows a centered password input before rendering children.

- **Password:** `bridge` (hardcoded plaintext — see Known Issues)
- **Persistence:** `sessionStorage` key `adh1_unlocked`. Unlocked state persists within a browser tab session but resets on tab close. This is appropriate for a kiosk where you want it locked per-session.
- Supports Enter key to submit

---

## Leaderboard (localStorage)

**Storage key:** `adh1-leaderboard`
**Format:** `JSON array of { initials: string, score: number }`, max 10 entries, sorted descending by score

**Seed data:** Both `LandingScreen.tsx` and `FinalScreen.tsx` define identical `SEED_ENTRIES` arrays with 10 placeholder entries (ACE=500, PRO=400, etc.). These are used when localStorage is empty. `FinalScreen.tsx` also defines `SEED_INITIALS` (a Set of those initials) to exclude seeds from the peer percentile calculation.

**To reset the leaderboard** during an event, run `localStorage.removeItem('adh1-leaderboard')` in the browser console. The seed data will repopulate automatically on next load.

---

## WebGL Fog Overlay

**File:** `src/app/components/FogOverlay.tsx`

The fog is a WebGL canvas (`z-index: 1`, `pointer-events: none`) that sits above all screen content. It uses two render passes per frame:

**Pass 1 — Trail texture update (374×665px, half-res FBO):**
Reads the previous frame's trail texture, applies per-frame exponential decay (`exp(-touchDecay * dt)`), then paints a Gaussian soft brush at the current pointer position. Uses ping-pong framebuffers. Trail values max out at 0.80 (fog is thinned, not fully punched out).

**Pass 2 — Fog render (748×1330px, to canvas):**
Generates animated fog using 5-octave fBm noise with two-pass domain warping for organic, non-repeating cloud shapes. Subtracts the trail texture multiplicatively to thin fog where the user has drawn. Fog color blends between `rgb(199, 207, 222)` and `rgb(237, 240, 247)` based on noise value.

**Fog density** is driven by `App.tsx` and passed as the `density` prop (0.0–1.0):
- Landing screen: `1.0` (maximum fog)
- Quiz, per question answered (fog clears one step ahead — on answer, not on Next):
  - Q1 unanswered: `1.0`
  - Q1 answered / Q2 unanswered: `~0.87`
  - Q2 answered / Q3 unanswered: `~0.74`
  - Q3 answered / Q4 unanswered: `~0.61`
  - Q4 answered / Q5 unanswered: `~0.48`
  - Q5 answered / Q6 unanswered: `~0.35` (MIN_QUIZ_DENSITY)
  - Q6 answered / heading to final: transitions to `0.0`
- Final screen: `0.0` (fully clear)

Density changes are smoothed with a lerp factor of `0.035` per frame — this gives a slow, cinematic fade rather than an instant jump.

**FogConfig parameters** (all tunable via the debug console, defaults in `DEFAULT_FOG_CONFIG`):

| Param | Default | Description |
|-------|---------|-------------|
| `speed` | 0.028 | Animation drift speed |
| `maxAlpha` | 0.78 | Maximum fog opacity |
| `touchRadius` | 0.14 | Brush clearing radius (0–1 normalized) |
| `touchDecay` | 1.4 | How fast fog fills back in (1/τ seconds) |
| `fogScale` | 0.7 | Texture zoom (lower = larger clouds) |
| `warpStrength` | 1.4 | Domain warp intensity (higher = more swirly) |
| `fogLo` | 0.22 | Smoothstep low threshold (contrast) |
| `fogHi` | 0.72 | Smoothstep high threshold (contrast) |

Touch/mouse events are listened on `window` (not the canvas). The component converts viewport coordinates to normalized canvas coordinates using the `scale` prop passed from App.tsx.

**On mobile/touch:** `touchmove` is passive (no `preventDefault`) — this means native scroll is not blocked. For a kiosk deployment in full-screen mode, this is fine. If scroll behavior becomes an issue, reconsider.

---

## Known Issues & Required Cleanup

These are things that were done the "fast AI way" and should be fixed before this is considered production-quality:

### 1. Remove the fog debug console (P0 — must fix)
`FogDebugConsole` is rendered in `App.tsx` unconditionally. It shows a visible overlay with sliders in the top-left corner. **Remove or gate behind an environment variable before any user-facing deployment.**

```tsx
// In App.tsx — remove this entire block:
<FogDebugConsole
  config={fogConfig}
  autoDensity={fogDensity}
  onChange={setFogConfig}
/>
```

Also remove the `fogConfig` state and `FogDebugConsole` import from App.tsx, and delete `FogDebugConsole.tsx` if you want. (Or conditionally render it with `import.meta.env.DEV`.)

### 2. Password is plaintext in source code (P1)
`PasswordGate.tsx` has `const SECRET = 'bridge'` hardcoded. Anyone with access to the source or the compiled JS bundle can read it. For a congress kiosk this may be acceptable (it's just protecting a prototype, not PII), but it should at minimum be moved to an environment variable:

```tsx
// .env
VITE_APP_PASSWORD=bridge

// PasswordGate.tsx
const SECRET = import.meta.env.VITE_APP_PASSWORD;
```

Note: Vite inlines env vars at build time, so this doesn't prevent someone from finding it in the bundle — it just removes it from source control. If real security is needed, implement server-side auth.

### 3. Duplicate code: leaderboard data and loadLeaderboard() (P2)
`SEED_ENTRIES`, `LeaderboardEntry` type, and `loadLeaderboard()` are copy-pasted identically into both `LandingScreen.tsx` and `FinalScreen.tsx`. Extract to a shared module, e.g., `src/lib/leaderboard.ts`:

```ts
export interface LeaderboardEntry { initials: string; score: number; }
export const SEED_ENTRIES: LeaderboardEntry[] = [...];
export const SEED_INITIALS = new Set([...]);
export function loadLeaderboard(): LeaderboardEntry[] {...}
```

### 4. handleBackToStart and handleRestart are identical (P3)
In `App.tsx`, both functions do exactly the same thing. Merge them into one and use it everywhere.

### 5. react and react-dom are peerDependencies (P2)
`package.json` lists them as optional peerDependencies — this is a Figma Make artifact. Move to regular `dependencies`:

```json
"dependencies": {
  "react": "18.3.1",
  "react-dom": "18.3.1",
  ...
}
```

Remove the `peerDependencies` and `peerDependenciesMeta` blocks entirely.

### 6. Massive unused dependency footprint (P3)
The project was scaffolded with the full shadcn/ui + Radix UI stack (accordion, calendar, chart, command, menubar, sidebar, etc.). The app uses almost none of these. Consider auditing and removing unused packages to reduce bundle size. At minimum, remove the installed-but-not-used shadcn components in `src/app/components/ui/` that were never referenced.

### 7. src/imports/ directory is likely dead code (P3)
`src/imports/` contains Figma Make-generated files (`Layer1.tsx`, `Layer1-14-66.tsx`, `Layer1-14-93.tsx`, and several `svg-*.ts` files). These do not appear to be imported anywhere. Verify and delete.

### 8. tap-icon.svg in assets is likely unused (P3)
The `TapIcon` component in `LandingScreen.tsx` is defined as an inline SVG, not an import from `src/assets/tap-icon.svg`. Verify the asset file is unused and delete it.

### 9. Quiz content hardcoded in component (P3 — nice to have)
The `quizDataMap` in `QuizScreen.tsx` is fine for a prototype but makes content edits error-prone. Consider extracting to `src/data/quiz.ts` so content editors can find it easily without understanding the component code.

### 10. FogOverlay z-index comment mismatch (P4)
The comment in `App.tsx` says the fog is at `z-[50]`, but the canvas in `FogOverlay.tsx` actually uses Tailwind class `z-[1]`. The fog is `pointer-events: none` so it doesn't block interaction regardless, but the comment is misleading. Fix the comment or reconcile the z-index.

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Brand gold | `#FFC358` | Primary CTAs, highlights, leaderboard accents |
| Dark background | `#1a1a1c` | Base screen background |
| Card surface | `#252528` | Answer buttons, leaderboard rows |
| Border subtle | `#3a3a3e` | Default button borders |
| Border mid | `#5a5a5e` | Exit/References button borders |
| Error red | `#d64545` | Incorrect answer feedback |
| Hover gold | `#ffce75` | Gold button hover state |

---

## Content / Copy

All user-facing content lives in these locations:

| Content | File | Location |
|---------|------|----------|
| Quiz questions & answers | `QuizScreen.tsx` | `quizDataMap` constant |
| Quiz explanations | `QuizScreen.tsx` | `quizDataMap[topic].explanation` |
| Landing screen copy | `LandingScreen.tsx` | JSX inline |
| Final screen copy | `FinalScreen.tsx` | JSX inline |
| Legal line & MLR code | `Footer.tsx` | JSX inline |
| References | `Footer.tsx` | `references` array constant |
| Leaderboard seed scores | `LandingScreen.tsx` + `FinalScreen.tsx` | `SEED_ENTRIES` (duplicated — see Known Issues #3) |

---

## Deployment Notes

This is a static React SPA — `npm run build` outputs to `dist/`. It can be served from any static host (Netlify, Vercel, S3+CloudFront, etc.) or a local web server on a kiosk device.

For a kiosk / congress tablet deployment:
- Run in a browser set to full-screen kiosk mode
- The app will scale to fill whatever the browser window is
- Disable browser UI, notifications, and gestures that could exit the kiosk
- localStorage persists across sessions on the same device — intentional (leaderboard data accumulates through the event)
- sessionStorage is used for the password gate — unlocked state resets when the tab/browser closes
- No backend, no network dependency at runtime (after initial load) — runs fully offline once cached
