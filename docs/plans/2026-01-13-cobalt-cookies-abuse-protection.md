# Cobalt Cookies + Abuse Protection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure cobalt instance with YouTube cookies and basic abuse protection.

**Architecture:** SSH into cobalt host, update runtime config/env, add cookie file and access controls, restart service. Verify with sample download and basic abuse checks.

**Tech Stack:** Cobalt (imputnet), systemd/docker (instance dependent), Linux shell

### Task 1: Gather access + runtime details

**Files:**
- Modify: `server env/config` (path depends on deployment)

**Step 1: Collect SSH details**
- Ask for host, user, auth method, port.

**Step 2: Identify deployment model**
- Check if cobalt runs via docker, systemd, or pm2.

**Step 3: Locate cobalt config**
- Find env file or systemd unit for cobalt.

### Task 2: Configure YouTube cookies

**Files:**
- Create: `cookie.txt` (path depends on deployment)
- Modify: `cobalt env/config` (add cookies path)

**Step 1: Obtain cookies file**
- Export YouTube cookies in Netscape format.

**Step 2: Upload cookies to server**
- Place at secure path with restricted perms.

**Step 3: Set cobalt cookies path**
- Update env/config to point to cookies file.

**Step 4: Restart cobalt**
- Restart service, confirm healthy.

**Step 5: Verify restricted video download**
- Test with known age-restricted URL.

### Task 3: Add abuse protection

**Files:**
- Modify: `cobalt env/config` (rate limiting/auth settings)
- Modify: `reverse proxy config` (nginx/caddy if present)

**Step 1: Enable token/auth**
- Set `API_KEY` or JWT auth in cobalt config.

**Step 2: Add rate limiting**
- Configure cobalt or proxy limits.

**Step 3: Restrict origins**
- Set CORS or proxy allowlist.

**Step 4: Verify protections**
- Test without token -> 401
- Test rate limit -> 429

### Task 4: Document + handoff

**Files:**
- Modify: `docs/ops/cobalt.md` (if exists)

**Step 1: Record config locations**
- Document env paths and restart steps.

**Step 2: Provide cookie refresh procedure**
- Steps to re-export cookies and redeploy.

**Step 3: Capture auth setup**
- Token generation and rotation notes.

## Unresolved questions
- ssh host?
- ssh user?
- auth method (key/pw)?
- port?
- cobalt runs via docker/systemd?
- existing reverse proxy?
- preferred auth (api key or jwt)?
- rate limit target (req/min)?
