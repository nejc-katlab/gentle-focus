# Gentle Focus

A Chrome extension (Manifest V3) that puts **gentle friction** between you and distracting websites — instead of hard-blocking, it asks you to pass a small "gate" (a calm timer, a quick puzzle, or a one-minute fun fact), then grants a limited time budget on the page.

Built for people who struggle with focus, including ADHD brains. The tone is kind, never punitive: **you set this up, you're in charge.**

- 🌱 **Friction, not imprisonment** — there's always a way through; the goal is to break autopilot, not to police.
- 🔒 **100% local** — no accounts, no servers, no analytics, no external APIs. Everything is stored on your device.
- 💚 **Kind by default** — no shame, no red alarm screens; stats inform, never scold. Optional neutral/minimal tone.

## Features

- **Blocklist** — whole domains, subdomains, or path globs (e.g. `youtube.com/shorts/*`).
- **Friction gates** — a calm timer where the Continue button slowly fills like water, with a motivational quote, four seed-generated puzzles (Schulte table, word unscramble, sliding tiles, Lights Out), or a one-minute fun fact (150 curated).
- **Time budgets** — per-site unlock minutes, expiry warning toast, optional daily caps.
- **Focus sessions** — manual (25/50/90/custom) and scheduled (weekly), with three strictness levels (gentle / firm / strict).
- **Override & pause** — a time-boxed escape hatch and a global pause that always auto-resumes.
- **Stats** — gates passed, friction chosen, overrides, minutes per site, current streak — framed positively.
- **Three tones** — encouraging / neutral / minimal. Import/export all settings + stats. Light and dark.

## Install (development)

1. Clone this repo.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Visit a site on the starter blocklist (`reddit.com`, `youtube.com`) to see the gate.

## Permissions — and why

Gentle Focus asks for only what it needs, and nothing leaves your device.

| Permission | Why |
|---|---|
| `<all_urls>` (host access) | To notice when you navigate to a site *you* added to your blocklist, and redirect that tab to the gate. It's used only for blocklist matching — no page content is read, stored, or sent. |
| `webNavigation` | To intercept navigation *before the page renders* so the distracting content never loads. |
| `tabs` | To redirect the current tab to the gate and to redirect other tabs of the same site when time expires. |
| `scripting` | To inject the small "1 minute left" reminder toast into an unlocked blocked page, only near expiry. |
| `storage` | To save your settings, blocklist, and stats locally. |
| `alarms` | To expire unlocks, end sessions, and warn before time runs out — reliably, across browser restarts. |
| `notifications` | To show a friendly "session done" message when a focus session ends. |

**Data:** none is collected or transmitted. There are no servers and no analytics. Everything lives in `chrome.storage.local` on your machine.

## Incognito

Off by default. Chrome does not run extensions in incognito unless you explicitly allow it (`chrome://extensions` → Gentle Focus → **Allow in incognito**). If enabled, your blocklist and settings are shared with your normal profile.

## Development

Pure ES modules, no build step. Unit tests for the pure logic (URL matching, schedules, puzzle generators, stats) run on Node's built-in test runner:

```bash
node --test
```

## License

[MIT](LICENSE).

## Support

If Gentle Focus helped you, you can [buy me a coffee](https://buymeacoffee.com/YOUR_HANDLE) — it goes toward domain costs. No pressure. 💛
