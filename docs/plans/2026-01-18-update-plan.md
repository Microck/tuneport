# Update Plan

## 1. Documentation Updates
- [ ] Update `tuneport-extension/README.md` to reflect latest installation steps (drag and drop zip vs load unpacked).
- [ ] Update `package.json` URLs to ensure consistency (some point to `tuneport.git`, some to `tuneport-extension`).
- [ ] Update `website/src/app/page.tsx` metadata if needed to match current branding.
- [ ] Verify `tuneport-extension/manifest.json` version matches `package.json`.

## 2. Code Text Updates
- [ ] Update `website/src/app/docs/page.tsx` links to point to valid locations (check 404s).
- [ ] Check `tuneport-extension/src/popup/index.tsx` for outdated links.
- [ ] Check `tuneport-extension/src/settings/index.tsx` for outdated links.
- [ ] Check `website/src/app/bridge/[token]/route.ts` for raw.githubusercontent links.

## 3. Functionality Verification
- [ ] Verify bridge functionality described in `HANDOFF.md` matches implementation in `tuneport-extension`.
- [ ] Confirm `tuneport-extension` build scripts in `package.json` work as expected.
