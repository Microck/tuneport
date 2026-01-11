# Self-Hosted Cobalt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace broken public Cobalt instances with self-hosted Cobalt behind Cloudflare, with origin checking and rate limiting.

**Architecture:** Docker Cobalt on VPS → Nginx reverse proxy with security → Cloudflare DNS (proxied) → Extension calls `https://cobalt.micr.dev`

**Tech Stack:** Docker, Nginx, Cloudflare, TypeScript (extension)

---

## Part 1: VPS Setup

### Task 1: Install Docker (if not installed)

**Server:** Your VPS (SSH in)

**Step 1: Check if Docker exists**

```bash
docker --version
```

Expected: Version number OR "command not found"

**Step 2: Install Docker (if needed)**

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group to take effect
```

**Step 3: Verify installation**

```bash
docker run hello-world
```

Expected: "Hello from Docker!" message

---

### Task 2: Run Cobalt Container

**Server:** Your VPS

**Step 1: Pull and run Cobalt**

```bash
docker run -d \
  --name cobalt \
  -p 127.0.0.1:9000:9000 \
  --restart unless-stopped \
  -e API_URL=https://cobalt.micr.dev \
  ghcr.io/imputnet/cobalt:10
```

Note: Binding to `127.0.0.1:9000` means only localhost can access directly. Nginx will proxy.

**Step 2: Verify Cobalt is running**

```bash
docker ps | grep cobalt
```

Expected: Container listed as "Up"

**Step 3: Test Cobalt locally**

```bash
curl -X POST http://127.0.0.1:9000/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","downloadMode":"audio","audioFormat":"best"}'
```

Expected: JSON with `"status": "tunnel"` or `"status": "redirect"` and a URL

---

### Task 3: Setup Watchtower for Auto-Updates

**Server:** Your VPS

**Step 1: Run Watchtower**

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  containrrr/watchtower \
  --interval 86400 \
  --cleanup \
  cobalt
```

This checks for Cobalt updates every 24 hours and auto-restarts with new image.

**Step 2: Verify Watchtower is running**

```bash
docker ps | grep watchtower
```

Expected: Container listed as "Up"

---

### Task 4: Install and Configure Nginx

**Server:** Your VPS

**Step 1: Install Nginx**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y nginx
```

**Step 2: Create rate limit zone config**

```bash
sudo tee /etc/nginx/conf.d/rate-limit.conf << 'EOF'
limit_req_zone $binary_remote_addr zone=cobalt:10m rate=5r/m;
EOF
```

**Step 3: Create Cobalt site config**

```bash
sudo tee /etc/nginx/sites-available/cobalt << 'EOF'
server {
    listen 80;
    server_name cobalt.micr.dev;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;

    location / {
        # Block non-extension requests
        # Allow: chrome-extension://, moz-extension://, safari-extension://
        set $allowed 0;
        
        if ($http_origin ~* "^(chrome|moz|safari)-extension://") {
            set $allowed 1;
        }
        
        # Also allow empty origin for direct Cloudflare health checks
        if ($http_origin = "") {
            set $allowed 1;
        }
        
        if ($allowed = 0) {
            return 403 '{"error": "forbidden"}';
        }

        # Rate limiting: 5 requests per minute per IP, burst of 3
        limit_req zone=cobalt burst=3 nodelay;
        limit_req_status 429;

        # CORS headers for extension
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Accept" always;

        # Handle preflight
        if ($request_method = OPTIONS) {
            return 204;
        }

        # Proxy to Cobalt
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for large audio files
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
    }
}
EOF
```

**Step 4: Enable the site**

```bash
sudo ln -sf /etc/nginx/sites-available/cobalt /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Optional: remove default site
```

**Step 5: Test and reload Nginx**

```bash
sudo nginx -t
```

Expected: "syntax is ok" and "test is successful"

```bash
sudo systemctl reload nginx
```

**Step 6: Verify Nginx is proxying**

```bash
curl -I http://localhost
```

Expected: HTTP response (may be 403 due to origin check - that's correct)

---

## Part 2: Cloudflare Setup

### Task 5: Configure Cloudflare DNS

**Location:** Cloudflare Dashboard → micr.dev → DNS

**Step 1: Add A record**

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | cobalt | YOUR_VPS_IP | Proxied (orange) | Auto |

**Step 2: Verify DNS propagation**

```bash
# From any machine
nslookup cobalt.micr.dev
```

Expected: Returns Cloudflare IPs (not your VPS IP) - confirms proxy is working

---

### Task 6: Configure Cloudflare SSL

**Location:** Cloudflare Dashboard → micr.dev → SSL/TLS

**Step 1: Set SSL mode**

- Go to SSL/TLS → Overview
- Set mode to: **Flexible**

(Flexible = HTTPS from browser to Cloudflare, HTTP from Cloudflare to your VPS. Simple, no certs needed on VPS.)

**Step 2: Enable Always Use HTTPS**

- Go to SSL/TLS → Edge Certificates
- Enable: "Always Use HTTPS"

---

### Task 7: Configure Cloudflare Rate Limiting (Optional Extra Layer)

**Location:** Cloudflare Dashboard → micr.dev → Security → WAF

**Step 1: Create rate limiting rule**

- Go to Security → WAF → Rate limiting rules
- Create rule:
  - Name: `Cobalt Rate Limit`
  - If: `Hostname equals cobalt.micr.dev`
  - Rate: `10 requests per 1 minute`
  - Action: `Block for 1 minute`

This adds Cloudflare-level protection before requests even hit your VPS.

---

### Task 8: Test Full Pipeline

**Step 1: Test from command line (should fail - no extension origin)**

```bash
curl -X POST https://cobalt.micr.dev/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","downloadMode":"audio","audioFormat":"best"}'
```

Expected: `{"error": "forbidden"}` or 403 status (origin check working)

**Step 2: Test with fake extension origin (should work)**

```bash
curl -X POST https://cobalt.micr.dev/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Origin: chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","downloadMode":"audio","audioFormat":"best"}'
```

Expected: JSON with `"status": "tunnel"` or `"redirect"` and download URL

---

## Part 3: Extension Update

### Task 9: Update CobaltService Default Instance

**Files:**
- Modify: `src/services/CobaltService.ts:44-51`

**Step 1: Update COBALT_INSTANCES array**

Open `src/services/CobaltService.ts` and change:

```typescript
// OLD
const COBALT_INSTANCES = [
  'https://cobalt-api.meowing.de',
  'https://cobalt-backend.canine.tools',
  'https://kityune.imput.net',
  'https://blossom.imput.net'
];

// NEW
const COBALT_INSTANCES = [
  'https://cobalt.micr.dev'  // Self-hosted, origin-checked
];
```

**Step 2: Save file**

---

### Task 10: Build and Test Extension

**Step 1: Build extension**

```bash
cd tuneport-extension
npm run build
```

Expected: Build completes without errors

**Step 2: Reload extension in Chrome**

1. Go to `chrome://extensions`
2. Find TunePort
3. Click reload button

**Step 3: Test download**

1. Go to any YouTube video
2. Right-click → TunePort → Add to playlist (with download enabled)
3. Check that audio downloads successfully

Expected: Download completes, file appears in TunePort folder

---

### Task 11: Add Settings UI for Custom Instance (Optional Enhancement)

**Files:**
- Modify: `src/popup/App.tsx` (or settings component)
- Modify: `src/services/CobaltService.ts`

**Step 1: Add storage for custom instance**

In `CobaltService.ts`, add method to load custom instance:

```typescript
static async loadCustomInstance(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get('cobalt_custom_instance');
    if (result.cobalt_custom_instance) {
      this.instance = result.cobalt_custom_instance;
    }
  } catch (e) {
    console.error('[CobaltService] Failed to load custom instance:', e);
  }
}

static async setCustomInstance(url: string | null): Promise<void> {
  if (url) {
    await chrome.storage.sync.set({ cobalt_custom_instance: url });
    this.instance = url;
  } else {
    await chrome.storage.sync.remove('cobalt_custom_instance');
    this.instance = COBALT_INSTANCES[0];
  }
}
```

**Step 2: Add UI in settings**

Add input field in settings panel:

```tsx
<div className="setting-item">
  <label>Custom Cobalt Instance (optional)</label>
  <input 
    type="url"
    placeholder="https://your-cobalt-instance.com"
    value={customInstance}
    onChange={(e) => setCustomInstance(e.target.value)}
  />
  <p className="hint">Leave empty to use default. Self-host for unlimited downloads.</p>
</div>
```

**Step 3: Call loadCustomInstance on extension startup**

In background script initialization:

```typescript
await CobaltService.loadCustomInstance();
```

---

### Task 12: Commit Changes

**Step 1: Stage and commit**

```bash
git add src/services/CobaltService.ts
git commit -m "fix: switch to self-hosted cobalt instance"
```

**Step 2: Tag release (optional)**

```bash
git tag v2.2.7
git push origin main --tags
```

---

## Part 4: Maintenance

### Ongoing: Manual Cobalt Update (if Watchtower fails)

If downloads stop working and Watchtower hasn't updated:

```bash
# SSH into VPS
docker pull ghcr.io/imputnet/cobalt:10
docker stop cobalt && docker rm cobalt
docker run -d \
  --name cobalt \
  -p 127.0.0.1:9000:9000 \
  --restart unless-stopped \
  -e API_URL=https://cobalt.micr.dev \
  ghcr.io/imputnet/cobalt:10
```

### Monitoring: Check Cobalt Health

```bash
# Check container status
docker ps | grep cobalt

# Check logs
docker logs cobalt --tail 50

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Summary Checklist

- [ ] Docker installed on VPS
- [ ] Cobalt container running on port 9000 (localhost only)
- [ ] Watchtower running for auto-updates
- [ ] Nginx configured with origin check + rate limiting
- [ ] Cloudflare DNS: `cobalt.micr.dev` → VPS IP (proxied)
- [ ] Cloudflare SSL: Flexible mode
- [ ] Cloudflare rate limiting rule (optional)
- [ ] Extension updated with new instance URL
- [ ] Tested end-to-end download works
- [ ] Committed and tagged release

---

## Troubleshooting

### Downloads fail with 403
- Check Nginx origin check regex
- Verify extension is sending Origin header (it should automatically)

### Downloads fail with 429
- Rate limit hit
- Wait 1 minute or increase rate in Nginx config

### Downloads fail with "tunnel" but no file
- Cobalt returned URL but download failed
- Check if URL is accessible (may be geo-blocked)
- Try different audioFormat (mp3 instead of best)

### Cobalt container keeps restarting
- Check logs: `docker logs cobalt`
- Usually memory issue - VPS needs at least 512MB RAM

### Cloudflare 522 error
- VPS is down or Nginx crashed
- SSH in and check: `sudo systemctl status nginx`
