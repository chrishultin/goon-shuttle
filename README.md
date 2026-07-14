# goon-shuttle

A live "next departure" board for the DEF CON Rio ⇄ LVCC shuttle. Shows the
next shuttle in each direction, what follows, and an upcoming feed — computed in
Las Vegas time and refreshed automatically.

Everything is one self-contained [`index.html`](index.html): open it in a browser
or host it anywhere static (GitHub Pages, S3, etc.). No build step, no
dependencies (fonts load from Google Fonts).

## Editing the schedule

Open `index.html` and edit the **`CONFIG`** block at the top of the `<script>` —
that's the only thing you normally touch. Reload the page to see changes.

The schedule is expressed as **frequency blocks**, not a list of every
departure:

```js
[ "07:00", "10:00", 30 ]      // a shuttle every 30 min from 07:00 to 10:00
[ "09:00", "19:00", 12, 6 ]   // every 12 min from 09:00 to 19:00, first one 6 min in
```

Each entry is `[from, to, every, phase?]`:

| field   | meaning                                                        |
| ------- | ------------------------------------------------------------- |
| `from`  | first departure window start, `"HH:MM"` (24h)                 |
| `to`    | window end, `"HH:MM"` — **exclusive**                          |
| `every` | minutes between departures                                    |
| `phase` | *(optional)* minutes to offset the start, so the return leg doesn't leave the same minute as the outbound |

List as many blocks per direction as you need (e.g. a wider gap early, tighter
during rush, wider late). Departures are generated and sorted automatically.

Config sections:

- `days` — the event days and their dates. `iso` is used to auto-select "today".
- `schedule` — per `day.key` → per direction (`r2l` / `l2r`) → list of blocks.
- `branding` / `directions` / `theme` — labels, colors, endpoint names.
- `display.feedCount` — how many upcoming rows to list per column.
- `display.showSimClock` — set `true` for a dev-only "time travel" slider to
  preview any time of day. Leave `false` for the published board.

## Preview locally

Any static server works, e.g.:

```sh
python3 -m http.server 8765
# then open http://localhost:8765/index.html
```
