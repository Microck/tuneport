# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files:**
- `kebab-case` for directories (`tuneport-extension`, `yt-dlp-service`)
- `PascalCase.tsx` for React components
- `camelCase.ts` for services and utilities

**Functions:**
- `camelCase` for all functions and service methods

**Variables:**
- `camelCase` for local variables and properties
- `UPPER_SNAKE_CASE` for global constants (e.g., `STORAGE_KEY`)

**Types:**
- `PascalCase` for Interfaces and Types

## Code Style

**Formatting:**
- Prettier - Configured in extension and website
- Indentation: 2 spaces
- Semicolons: Required

**Linting:**
- ESLint - Used across all JS/TS projects
- Rules: Default recommended with TypeScript specific plugins

## Import Organization

**Order:**
1. React / Core frameworks
2. External packages
3. Internal services/components
4. Relative utilities/types

**Path Aliases:**
- `@/*` - Maps to `src/` in Website and Extension

## Error Handling

**Patterns:**
- `try/catch` at service boundaries
- Explicit failure reporting via notifications (`notify()` helper)
- Fallback strategies for external API calls

## Logging

**Framework:**
- `console.log` with prefixes (e.g., `[tuneport]`)
- Python standard logging in `yt-dlp-service`

## Module Design

**Exports:**
- Named exports for services and utility classes
- Default exports for React components

---

*Convention analysis: 2026-01-18*
*Update when patterns change*
