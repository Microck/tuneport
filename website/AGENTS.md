# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-18
**Context:** TunePort Website

## OVERVIEW
Marketing website and documentation for TunePort.
Built with Next.js (App Router), TypeScript, and Tailwind CSS.
Features heavy use of Framer Motion and GSAP for animations.

## STRUCTURE
```
website/
├── src/
│   ├── app/        # Next.js App Router pages
│   ├── components/ # UI components (ui/ = shadcn, sections/ = landing)
│   └── lib/        # Utilities
└── public/         # Static assets
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Landing Page** | `src/app/page.tsx` | Main entry |
| **Docs** | `src/app/docs/` | Documentation pages |
| **Animations** | `src/components/ui/` | Complex animated components |
| **Hero** | `src/components/sections/hero.tsx` | Main hero section |

## CONVENTIONS
- **Routing**: File-system based routing (App Router).
- **Styling**: Tailwind CSS. `cn()` utility for class merging.
- **Animations**: `framer-motion` for React components, `gsap` for complex sequences.
- **Components**: `shadcn/ui` base.

## ANTI-PATTERNS
- **Client Components**: Avoid 'use client' at page level if possible. Keep it at component level.
- **Heavy Libs**: Watch bundle size with heavy animation libraries.

## COMMANDS
```bash
npm run dev   # Start dev server
npm run build # Build for production
```
