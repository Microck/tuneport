# Tailwind & Styles Porting Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port Tailwind configuration, custom colors/animations, and global styles from the Chrome Extension to the Next.js website, enforcing "New York" (Zinc) aesthetic and dark mode by default.

**Architecture:** 
- Migrate from Tailwind v3 (extension) to Tailwind v4 (website) while maintaining `tailwind.config.ts` for complex customizations.
- Use CSS variables for Shadcn colors (Zinc) but default them to dark mode values.
- Replace Geist font with Instrument Sans.

**Tech Stack:** Next.js 14, Tailwind CSS v4, Shadcn UI, TypeScript.

### Task 1: Update Layout & Font

**Files:**
- Modify: `.worktrees/landing-page-v2/website/src/app/layout.tsx`

**Step 1: Update Font Import**
- Remove `Geist`, `Geist_Mono` imports.
- Import `Instrument_Sans` from `next/font/google`.
- Configure `Instrument_Sans` (subsets: latin).

**Step 2: Apply Font**
- Update `body` className to use the new font variable.
- Ensure `antialiased` is present.

### Task 2: Create Tailwind Configuration

**Files:**
- Create: `.worktrees/landing-page-v2/website/tailwind.config.ts`

**Step 1: Scaffold Config**
- Create the file with standard `import type { Config } from "tailwindcss"` structure.
- Set `darkMode: ["class"]`.
- Set `content` paths:
  - `./src/pages/**/*.{js,ts,jsx,tsx,mdx}`
  - `./src/components/**/*.{js,ts,jsx,tsx,mdx}`
  - `./src/app/**/*.{js,ts,jsx,tsx,mdx}`

**Step 2: Port Colors**
- Add Shadcn semantic colors (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`) mapped to CSS variables (e.g., `hsl(var(--background))`).
- Port `tf-*` colors from extension (e.g., `tf-white`, `tf-emerald`, etc.).
- Port `spotify-*` legacy colors.

**Step 3: Port Animations**
- Add `keyframes` from extension (`shimmer-slide`, `spin-around`, `border-beam`, `fade-in`, `slide-up`).
- Add `animation` utilities from extension (`shimmer-slide`, `border-beam`, etc.).

### Task 3: Update Global Styles

**Files:**
- Modify: `.worktrees/landing-page-v2/website/src/app/globals.css`

**Step 1: Setup Tailwind v4**
- Use `@import "tailwindcss";`.
- Define `@plugin "tailwindcss-animate";` (if needed/supported in v4 config, otherwise relies on `tailwind.config.ts` plugin array).

**Step 2: Define CSS Variables (Zinc Dark Mode)**
- In `:root`, define the Shadcn variables using **Zinc Dark** values by default (forcing dark mode).
  - `--background`: `240 10% 3.9%` (Zinc 950)
  - `--foreground`: `0 0% 98%` (Zinc 50)
  - ...and so on for all Shadcn tokens.
- Add `--radius`.

**Step 3: Add Custom Utilities**
- Add `.glass` utility class from extension.
- Ensure `body` styles use the new font family and colors.

### Task 4: Cleanup & Verify

**Files:**
- Modify: `.worktrees/landing-page-v2/website/src/app/page.tsx` (optional, just to test)

**Step 1: Verify Build**
- Run `npm run build` to ensure config is valid.

**Step 2: Visual Check**
- (Manual) Check if `tf-emerald` or animations are available in a test component.
