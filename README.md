# goon-shuttle

A live "next departure" board for the DEF CON Rio ⇄ LVCC shuttle. It shows the
next shuttle in each direction, what follows, and an upcoming feed — computed in
Las Vegas time and refreshed automatically.

Everything is one self-contained [`index.html`](index.html): open it in a
browser or host it anywhere static (GitHub Pages, S3, Netlify…). No build step,
no dependencies — fonts load from Google Fonts, everything else is inline.

- **Edit the schedule:** change the `CONFIG` block at the top of the `<script>`
  in [`index.html`](index.html), then reload. That's the whole workflow.
- **Full field reference:** [Configuration schema](#configuration-schema) below.
- **Publish it:** [Deploy to GitHub Pages](#deploy-to-github-pages) below.

---

## How it works

You don't list every departure. You describe the **cadence** in frequency
blocks, and the page expands them into concrete times:

```js
[ "09:00", "19:00", 10 ]   // a shuttle every 10 minutes from 09:00 to 19:00
```

At load and once a minute, the page reads the clock in your configured timezone,
finds the next departure at or after "now" for each direction, and renders the
board. Past times drop off; the next one is highlighted.

It opens on **today** when today is one of the configured `days` (otherwise the
first day), and keeps following the live day across midnight — until a viewer
taps a specific day tab, which pins their choice. The `UPCOMING / FULL` toggle
above the board switches between the next departures and the whole day's
timetable (`display.showFullSchedule` sets the default).

---

## Configuration schema

The entire `CONFIG` object, annotated:

```js
const CONFIG = {
  timezone: 'America/Los_Angeles',              // IANA tz — all times are computed in this zone

  branding: {
    title:    'DEF CON // SHUTTLE',              // big header line
    subtitle: 'RIO ⇄ LVCC · LAS VEGAS · PT',     // small line under the title
    left:     'RIO',                             // left endpoint label (schematic)
    right:    'LVCC',                            // right endpoint label (schematic)
    tzLabel:  'Las Vegas',                       // footer: "shown in <tzLabel> time"
  },

  directions: {                                  // exactly two, keys are fixed (see note)
    r2l: { label: 'Rio → LVCC', badge: 'R→L', color: '#ff2f86', tint: '#ff8fc0' },
    l2r: { label: 'LVCC → Rio', badge: 'L→R', color: '#25e6ff', tint: '#8fe9ff' },
  },

  days: [                                        // order = left-to-right tab order
    { key: 'thu', label: 'THU', date: 'AUG 6', iso: '2026-08-06' },
    { key: 'fri', label: 'FRI', date: 'AUG 7', iso: '2026-08-07' },
    { key: 'sat', label: 'SAT', date: 'AUG 8', iso: '2026-08-08' },
    { key: 'sun', label: 'SUN', date: 'AUG 9', iso: '2026-08-09' },
  ],

  schedule: {                                    // keyed by day.key -> per direction -> blocks
    thu: {
      r2l: [ ['07:00','10:00',30], ['10:00','18:00',20], ['18:00','23:30',30] ],
      l2r: [ ['07:00','10:00',30,6], ['10:00','18:00',20,6], ['18:00','23:30',30,6] ],
    },
    // fri, sat, sun …
  },

  theme: {
    bg:     '#08080e',   // page background
    text:   '#e9e9f5',   // primary text
    brand:  '#ff2f86',   // title glow
    accent: '#25e6ff',   // selected day tab + blinking cursor
  },

  display: {
    feedCount:        10,    // upcoming rows listed per column (Upcoming view)
    showSchematic:    true,  // the RIO ⇄ LVCC diagram under the header
    showFullSchedule: false, // default the board to the full day vs. just upcoming
    showSimClock:     false, // dev-only time-travel slider (keep false when published)
  },
};
```

### `timezone`

| field      | type   | required | notes |
| ---------- | ------ | -------- | ----- |
| `timezone` | string | yes      | An [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `America/Los_Angeles`). The live clock, "today" detection, and every countdown are computed in this zone regardless of the viewer's own timezone. Daylight saving is handled automatically. |

### `branding`

| field      | type   | notes |
| ---------- | ------ | ----- |
| `title`    | string | Large header line, rendered in the `brand` color with a glow. |
| `subtitle` | string | Small line beneath the title. |
| `left`     | string | Label for the left endpoint in the schematic. |
| `right`    | string | Label for the right endpoint in the schematic. |
| `tzLabel`  | string | Plain-English zone name shown in the footer: "shown in _tzLabel_ time". |

### `directions`

Two directions, `r2l` and `l2r`. **These two keys are fixed** — the engine
refers to them by name, so you customize their appearance, not their names:

- `r2l` is the **first** card (top) and the primary/`brand`-side color.
- `l2r` is the **second** card and the `accent`-side color.

Think of `r2l` as "left endpoint → right endpoint" and `l2r` as the return leg.

| field   | type   | required | notes |
| ------- | ------ | -------- | ----- |
| `label` | string | yes      | Full name shown on the card, e.g. `Rio → LVCC`. |
| `badge` | string | yes      | Short pill/label, e.g. `R→L`. Used on the card, the schematic, and the feed column header. |
| `color` | string | yes      | Primary neon color. **Must be 6-digit hex** (`#rrggbb`) — translucent shades are derived from it. |
| `tint`  | string | no       | Lighter shade used for the "in 12 min" text. Defaults to `color` if omitted. 6-digit hex. |

### `days`

An array; array order is the tab order.

| field   | type   | required | notes |
| ------- | ------ | -------- | ----- |
| `key`   | string | yes      | Unique id for the day. **Must match a key in `schedule`.** |
| `label` | string | yes      | Tab title, e.g. `THU`. |
| `date`  | string | yes      | Tab subtitle and "UPCOMING" heading, e.g. `AUG 6`. Free text. |
| `iso`   | string | yes      | `YYYY-MM-DD` in the configured timezone. On a matching real-world date the page auto-selects this tab and the clock reads `LIVE`; otherwise it reads `LIVE CLOCK`. |

### `schedule`

An object keyed by `day.key`. Each day has an `r2l` and an `l2r` array of
**frequency blocks**. A block is a 3- or 4-element array:

```js
[ from, to, every, phase? ]
```

| element | type   | required | notes |
| ------- | ------ | -------- | ----- |
| `from`  | string | yes      | First departure window start, `"HH:MM"` (24-hour). **Inclusive.** |
| `to`    | string | yes      | Window end, `"HH:MM"`. **Exclusive** — a departure exactly at `to` is not generated. |
| `every` | number | yes      | Minutes between departures. |
| `phase` | number | no       | Minutes to shift the first departure, so the return leg doesn't leave the same minute as the outbound. Defaults to `0`. |

Notes:

- Departures are `from + phase`, then `+ every`, `+ every`… while `< to`.
- List as many blocks per direction as you like (wider gaps early/late, tighter
  during rush). All blocks are merged and sorted.
- Because `to` is exclusive, adjacent blocks like `['07:00','09:00',20]` then
  `['09:00','19:00',10]` produce no duplicate at 09:00.
- If a `day.key` is missing from `schedule`, or a direction's array is empty,
  that direction shows **no service**.

### `theme`

All values are 6-digit hex (`#rrggbb`).

| field    | notes |
| -------- | ----- |
| `bg`     | Page background. (If you change this, also update `<meta name="theme-color">` and the `html,body` background in the `<head>` for a seamless load.) |
| `text`   | Primary text color. |
| `brand`  | Title glow / primary accent. |
| `accent` | Selected day tab, the schematic's right node, and the blinking footer cursor. |

### `display`

| field              | type    | default | notes |
| ------------------ | ------- | ------- | ----- |
| `feedCount`        | number  | `10`    | How many upcoming departures to list per column, in the **Upcoming** view (the **Full** view shows the entire day). |
| `showSchematic`    | boolean | `true`  | Toggles the little RIO ⇄ LVCC diagram under the header. |
| `showFullSchedule` | boolean | `false` | The board's default view. `false` starts on **Upcoming** (future departures only); `true` starts on **Full** (the whole day, past departures dimmed). Either way, an on-page `UPCOMING / FULL` toggle lets viewers switch. |
| `showSimClock`     | boolean | `false` | Shows a dev-only "time travel" slider to preview any time of day. Keep `false` for the published board. |

### Status messages (automatic)

The card status line and relative times are derived, not configured:

| situation                          | shows |
| ---------------------------------- | ----- |
| before the first departure         | `first shuttle 07:00` |
| in service                         | `every 10 min right now` (uses the current block's `every`) |
| after the last departure           | `last shuttle departed`, big `— last 23:20`, feed reads `no more today` |
| a departure's countdown            | `in 8 min`, or `in 1h 05m`, or `boarding` at T-0 |

---

## Preview locally

Any static server works:

```sh
python3 -m http.server 8765
# open http://localhost:8765/index.html
```

To sanity-check other times of day, set `display.showSimClock: true` and drag
the slider that appears at the bottom.

---

## Deploy to GitHub Pages

The repo is Pages-ready: `index.html` is at the root, [`.nojekyll`](.nojekyll)
tells Pages to serve it as-is, [`CNAME`](CNAME) binds the custom domain
`dc-shuttle.spedi.one`, and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
publishes on every push to `main`.

**1. Create the repo and push** (once):

```sh
gh auth login                 # if you haven't already
gh repo create chrishultin/goon-shuttle --public --source=. --remote=origin --push
```

<sub>No `gh`? Create an empty repo on github.com, then:
`git remote add origin git@github.com:chrishultin/goon-shuttle.git && git push -u origin main`</sub>

**2. Enable Pages:** Repo → **Settings → Pages → Build and deployment → Source:
GitHub Actions**. Every push to `main` then redeploys via the workflow.

**3. Point DNS at it.** At the DNS provider for `spedi.one`, add a subdomain record:

| Type  | Name         | Value                    |
| ----- | ------------ | ------------------------ |
| CNAME | `dc-shuttle` | `chrishultin.github.io.` |

Back in **Settings → Pages → Custom domain**, confirm `dc-shuttle.spedi.one` (the
[`CNAME`](CNAME) file already sets it), wait for the DNS check to pass, then tick
**Enforce HTTPS**.

Your board goes live at **https://dc-shuttle.spedi.one/**.

Updating the schedule after launch is just: edit `CONFIG`, commit, push.

---

## Brand assets (previews + icons)

Social crawlers and browsers don't run the page's JavaScript, so the preview
images and icons are pre-rendered static files, generated from sources in
[`tools/`](tools). If you rebrand, edit the source and re-render.

| File | Size | Source | Used for |
| ---- | ---- | ------ | -------- |
| [`og-image.png`](og-image.png) | 1200×630 | [`tools/og-image.html`](tools/og-image.html) | `og:image` (primary) + Twitter `summary_large_image` |
| [`og-image-square.png`](og-image-square.png) | 1200×1200 | [`tools/og-image-square.html`](tools/og-image-square.html) | secondary `og:image` for 1:1 contexts |
| [`favicon.svg`](favicon.svg) | vector | edit directly | modern browser tab icon |
| [`favicon.ico`](favicon.ico) | 16 / 32 / 48 | `favicon.svg` → [`tools/make-ico.mjs`](tools/make-ico.mjs) | fallback tab icon (`/favicon.ico`, older clients) |
| [`apple-touch-icon.png`](apple-touch-icon.png) | 180×180 | `favicon.svg` | iOS home-screen icon |

Regenerate everything from the repo root (needs Google Chrome + `sips`, macOS):

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot(){ "$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size="$2" --virtual-time-budget=6000 \
  --screenshot="$1" "file://$PWD/$3" >/dev/null 2>&1; }

# preview images (rendered at 2x, then downscaled to spec)
shot og-image.png        1200,630  tools/og-image.html        && sips -z 630 1200 og-image.png
shot og-image-square.png 1200,1200 tools/og-image-square.html && sips -z 1200 1200 og-image-square.png

# favicons (from favicon.svg, via the sizing wrapper)
shot /tmp/f.png 512,512 tools/favicon-render.html
for s in 16 32 48 180; do sips -z $s $s /tmp/f.png --out /tmp/favicon-$s.png; done
cp /tmp/favicon-180.png apple-touch-icon.png
node tools/make-ico.mjs favicon.ico /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png
```

The preview `<meta>` tags use absolute `https://dc-shuttle.spedi.one/…` URLs
(crawlers require absolute) — update them in `index.html` if the domain changes.
