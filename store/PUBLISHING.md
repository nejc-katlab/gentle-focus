# Publishing Gentle Focus to the Chrome Web Store

This is everything you need to submit. Copy the text straight into the Developer Dashboard.
Fields marked **⚠ TODO** need a value only you can supply.

---

## 0. One-time setup (you)

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with the Google account you want to own the listing.
3. Pay the **one-time $5 developer registration fee**.
4. Accept the developer agreement.

> I can't do steps 1–4 for you — they require your Google login, your payment, and your acceptance of Google's terms. Everything below, I've prepared.

---

## 1. The package

Build the distributable zip from the repo root:

```bash
bash store/package.sh
```

This produces `dist/gentle-focus.zip` containing only the runtime files (manifest, background, gate, content, options, popup, stats, shared, data, icons) — no tests, no `.claude/`, no README/dev files. Upload that zip.

---

## 2. Store listing copy

**Name** (≤ 45 chars)
```
Gentle Focus
```

**Summary / short description** (≤ 132 chars)
```
Kind, gentle friction between you and distracting sites — a calm gate, not a hard block. 100% local. Made for focus & ADHD.
```

**Category:** Productivity → Workflow & Planning

**Detailed description**
```
Gentle Focus puts a small, kind pause between you and the sites that pull you away — instead of hard-blocking them, it asks you to pass a calm "gate" first, then gives you a limited time budget on the page.

It's built for people who struggle with focus, including ADHD brains. The tone is never punitive: you set this up, and you're always the one in charge.

HOW IT WORKS
When you open a site on your blocklist, Gentle Focus catches it before the page loads and shows you a gentle gate. Choose how to pass it:
• Wait a calm timer as the Continue button slowly fills, with a quiet quote
• Solve a quick puzzle — a Schulte table, a word unscramble, sliding tiles, or Lights Out
• Read a one-minute fun fact (150 curated, no repeats until you've seen them all)

Pass the gate and the site unlocks for a time budget you set. A soft reminder appears a minute before it's up, then the gate returns.

FEATURES
• Blocklist by domain, subdomain, or path (e.g. block youtube.com/shorts without blocking YouTube)
• Per-site time budgets and optional daily caps
• Focus sessions — manual (25 / 50 / 90 min) or on a weekly schedule
• Three strictness levels, from gentle to strict
• A time-boxed override for when you truly need the page, and a global pause that always turns itself back on
• Positive stats: gates passed, minutes per site, a streak that's never shamed
• Three tones — encouraging, neutral, or minimal — and full light/dark support

PRIVACY
100% local. No accounts, no servers, no analytics, no tracking. Everything you do stays in your browser on your device. Nothing is ever sent anywhere. Export or wipe your data anytime.

Gentle Focus is free and open source (MIT).
```

**Single-purpose description** (required by Chrome)
```
Gentle Focus helps users limit their own time on distracting websites by showing a friction "gate" (timer, puzzle, or fact) before granting a time-boxed unlock. All matching and state is local to the device.
```

---

## 3. Permission justifications

Paste each into its box under Privacy practices → "Permission justification."

- **Host permission `<all_urls>`:**
```
The user chooses which sites to gate; those sites can be any domain, so the extension needs host access to arbitrary URLs to detect navigations to the user's own blocklist and redirect them to the gate. Page content is never read, stored, or transmitted — only the URL is matched against the local blocklist.
```

- **webNavigation:**
```
Used to detect navigation to a blocked site before the page renders, so the distracting content never loads, and to catch in-page (SPA) navigations such as youtube.com/shorts.
```

- **tabs:**
```
Used to redirect the current tab to the gate page, and to redirect other open tabs of the same site when the user's time budget expires.
```

- **scripting:**
```
Used to inject a small in-page reminder ("1 minute left") into an unlocked blocked page shortly before its time expires. Injected only into the user's own blocked sites, only near expiry.
```

- **storage:**
```
Stores the user's settings, blocklist, and usage stats locally on the device. No remote storage.
```

- **alarms:**
```
Schedules unlock expiry, session end, and expiry warnings reliably, including across service-worker restarts and browser restarts.
```

- **notifications:**
```
Shows a single friendly notification when a focus session ends.
```

---

## 4. Data-safety / privacy disclosures

On the "Data usage" form, declare:

- **Does this extension collect or use user data?** Yes (only local settings; Chrome's form counts this) — but declare **no data is transmitted**.
- **Data types collected:** None are sent off-device. If the form forces a selection, the only relevant category is "Website content" **and you do NOT collect it** — the extension reads URLs locally for matching but does not collect, store remotely, or transmit them. Select nothing for transmission.
- **Sold to third parties:** No.
- **Used for anything besides the single purpose:** No.
- Check the three certification boxes (no selling data, no unrelated use, no creditworthiness use) — all true.

**Privacy policy (required — host this and paste the URL).** The full policy now lives in [`PRIVACY.md`](../PRIVACY.md) at the repo root. It has been verified against the code: the only `fetch()` calls read bundled files via `chrome.runtime.getURL`, storage is `chrome.storage.local` only (no `storage.sync`), and there are no analytics or network egress calls.

To publish it: enable GitHub Pages on the repo (or paste the text into a public gist) and use that URL in the dashboard. The raw file also works: `https://raw.githubusercontent.com/<owner>/gentle-focus/main/PRIVACY.md`.

⚠ TODO: two placeholders remain in `PRIVACY.md`, both the `<owner>` GitHub slug (contact points to the repo's issues page, per decision — no personal email is exposed). Fill `<owner>` once the repo exists under your account.

---

## 5. Graphics you still need

- **Icon 128×128** — currently a placeholder in `icons/`. ⚠ TODO: drop in your own art at `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` (same filenames) and re-run the packager.
- **Screenshots** — at least one 1280×800 (or 640×400) PNG. I can generate these from the polished gate / options / popup — ask and I'll produce them.
- **Small promo tile 440×280** — optional but recommended.

---

## 6. Pre-submit checklist

- [ ] `icons/` replaced with real art (⚠ TODO)
- [ ] `manifest.json` version set for launch (currently `0.1.0` — consider `1.0.0`)
- [ ] `LICENSE` copyright holder filled in (⚠ TODO)
- [ ] README + privacy policy Buy-Me-a-Coffee / email / GitHub links filled in (⚠ TODO)
- [ ] `bash store/package.sh` produces `dist/gentle-focus.zip`
- [ ] Loaded the built zip's folder via "Load unpacked" and smoke-tested the gate once more
- [ ] `node --test` green
- [ ] Privacy policy hosted at a public URL
- [ ] Screenshots ready (1280×800)

---

## 7. Submit (you)

1. Dashboard → **Add new item** → upload `dist/gentle-focus.zip`.
2. Paste the copy from §2, permission justifications from §3.
3. Fill the data-safety form per §4, add the privacy-policy URL.
4. Upload icon + screenshots.
5. **Submit for review.** First reviews typically take a few days. Google signs the package and assigns a permanent extension ID automatically — you don't sign anything yourself.
