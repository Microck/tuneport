# Website Launch Checklist

## Basics

- [x] Favicon (favicon.ico, apple-touch-icon, mask-icon) - *Using /logo.png in layout.tsx metadata*
- [ ] Web app manifest (manifest.json) - *Optional: PWA support*
- [x] Theme color meta tag - *Added #10b981 in layout.tsx*
- [x] robots.txt - *Created public/robots.txt*
- [x] sitemap.xml - *Created public/sitemap.xml*
- [x] .well-known/security.txt - *Created public/.well-known/security.txt*

## Performance

- [ ] Loading skeletons or spinners - *Optional*
- [x] Lazy loading for images/iframes - *Next.js Image default*
- [x] Code splitting - *Next.js automatic*
- [x] Minified CSS/JS - *Next.js production build*
- [x] Gzip/Brotli compression - *Vercel handles automatically*
- [x] CDN for static assets - *Vercel Edge Network*
- [x] Cache headers (Cache-Control, ETag) - *Vercel default*
- [ ] Preload critical resources - *Optional*
- [ ] DNS prefetch/preconnect - *Optional*
- [x] Image optimization (WebP, srcset) - *Enabled AVIF/WebP in next.config.ts*
- [x] Font loading strategy - *next/font/google in layout.tsx*
- [x] Critical CSS inlined - *Next.js automatic*

## SEO

- [x] Unique title tags per page - *Set in layout.tsx and page.tsx*
- [x] Meta description
- [x] Canonical URLs - *Added in layout.tsx alternates*
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Structured data (JSON-LD) - *Added WebApplication schema in layout.tsx*
- [x] Semantic HTML (header, nav, main, footer)
- [x] Alt text for images - *Found on logo images*
- [x] Hreflang for multilingual - *Not applicable (single language)*

## Accessibility

- [x] ARIA labels and roles - *aria-current, aria-label on buttons*
- [x] Keyboard navigation support - *Native browser + focus styles*
- [x] Visible focus indicators - *Added focus-visible styles in globals.css*
- [ ] Color contrast (WCAG AA+) - *Manual testing needed*
- [ ] Screen reader testing - *Manual testing needed*
- [x] Skip links - *Added skip-to-content in layout.tsx*
- [x] Associated form labels
- [ ] ARIA-live for dynamic errors - *No dynamic forms*

## Security

- [x] HTTPS enforced - *Vercel provides automatically*
- [x] HSTS header - *Vercel default*
- [x] Content Security Policy - *Added in next.config.ts headers*
- [x] X-Frame-Options / frame-ancestors - *Added DENY in next.config.ts*
- [x] X-Content-Type-Options - *Added nosniff in next.config.ts*
- [x] Referrer-Policy - *Added strict-origin-when-cross-origin*
- [x] Permissions-Policy - *Added in next.config.ts*
- [x] Secure cookies (HttpOnly, SameSite) - *Not using cookies*
- [x] CSRF tokens - *Not applicable (no forms)*
- [x] Rate limiting - *Not applicable (static site)*
- [x] Input validation/sanitization - *No user inputs*

## UI/UX

- [x] Responsive design
- [x] Touch targets ≥44×44 px - *h-11 (44px) buttons*
- [x] Loading states - *Added global loading.tsx*
- [x] Custom 404/500 pages - *Both exist (not-found.tsx, error.tsx)*
- [x] Offline page - *Not applicable (not PWA)*
- [x] Print styles (if needed) - *Not needed*
- [x] Dark mode support - *Removed (light mode only)*
- [x] Consistent navigation
- [x] Breadcrumbs - *Not needed (simple structure)*
- [x] Back-to-top button (optional) - *Not needed*

## Legal & Privacy

- [x] Privacy policy
- [x] Terms of service - *Created /terms page*
- [x] Cookie consent banner - *Not needed (no tracking cookies)*
- [x] GDPR/CCPA compliance - *Documented in privacy policy (no data collection)*
- [x] Data deletion process - *Documented in privacy policy*
- [x] Contact information - *contact@micr.dev in footer*
- [x] Copyright notice - *In footer*

## Development & Deployment

- [ ] Environment variables documented - *No env vars used*
- [x] CI/CD pipeline - *Vercel auto-deploy from Git*
- [ ] Automated tests (unit, e2e) - *Optional*
- [x] Linting (ESLint, Prettier)
- [x] Build pipeline
- [x] Source maps (development) - *Next.js default in dev*
- [x] Error tracking - *Not needed*
- [ ] Analytics (Vercel Analytics or similar) - *Optional*
- [ ] Uptime monitoring - *Optional*
- [x] Backup strategy - *Not applicable (static site, Git is backup)*
- [x] Rollback plan - *Vercel git-based rollbacks*
