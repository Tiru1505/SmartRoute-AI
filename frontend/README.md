# QRO Frontend

React + Vite dashboard for the Quantum Route Optimizer. Runs entirely on mock
data today; the FastAPI backend drops in without touching any component.

## Run

```bash
npm install
```

```bash
npm run dev
```

Opens on http://localhost:5173.

## Sign-in

The app opens on a sign-in screen. For the SIH demo, press **Continue as guest** —
one click, no typing. Sign in / Sign up also work with any valid-looking email
and a 4+ character password.

⚠️ **This is demo authentication.** There is no auth backend. No credential is
checked, stored or transmitted — the password never leaves the component, and
only a name/email/initials object goes into `localStorage`. Before this is
deployed anywhere real, replace `signIn` in `src/store/AppContext.jsx` with a
call to a backend that hashes passwords server-side and returns a signed token.
The form says as much on its face; leave that notice in place.

The session survives reload. Sign out from the avatar menu, top right.

## The 2-minute demo

Press **Demo Mode** on the Dashboard. It plays a fixed, deterministic script:

| t | What happens |
|---|---|
| 0s | QPSO optimization sequence — 8 staged steps, particle swarm converging |
| ~3s | Three routes drawn; recommended route animates with a flowing dash |
| ~3.6s | Congestion spikes on the Mehdipatnam corridor (segments turn red) |
| ~6.6s | Predictive alert: 62% → 94%, expected in 15 min |
| ~9.6s | Rerouting runs |
| ~13s | New route: **24 min → 17 min, 7 min saved** |

Timings are fixed, so it plays identically every run — no surprises in front of
judges. Press **Reset** (the ↺ button) to run it again.

To drive it manually instead: pick endpoints → **Optimize Route** → **Simulate
Congestion Spike** → **Recalculate Route**.

## Structure

```
src/
  data/mockData.js      every mock value, in one place
  services/api.js       the ONLY file that talks to a backend
  store/AppContext.jsx  shared state: routes, traffic, alerts, demo script
  components/           17 reusable components
  pages/                8 pages
  index.css             design tokens (colours, radii, shadows)
  components.css        component styles
```

## Connecting the backend

Everything backend-facing lives in `src/services/api.js`. Each function already
returns the exact shape components expect, so wiring up FastAPI means flipping
one flag:

```bash
VITE_USE_MOCK=false
VITE_API_BASE=http://127.0.0.1:8000
```

Endpoints the frontend expects:

| Function | Endpoint |
|---|---|
| `getRouteOptimization()` | `POST /optimize-route` |
| `reroute()` | `POST /reroute` |
| `getTrafficData()` | `GET /traffic` |
| `getPrediction()` | `GET /prediction` |
| `getBenchmark()` | `GET /benchmark` |
| `getConvergence()` | `GET /convergence` |
| `getScalability()` | `GET /scalability` |

Vite proxies `/api` → `127.0.0.1:8000` in dev, so CORS is a non-issue.

## Two things to know before presenting

**The benchmark table is honest by design.** In `mockData.js` the demo figures
show **Dijkstra attaining the best objective value and the fastest runtime**,
with QPSO close behind. That is not a mistake. On single-pair routing with
additively combined weights Dijkstra is provably optimal, so any table claiming
QPSO beats it would be wrong and a judge may catch it. The defensible framing is
*"QPSO reaches within ~1.5% of the proven optimum"* — which validates the
implementation before applying it to constrained problems Dijkstra cannot solve.
Don't edit those numbers to make QPSO win.

**The QPSO particle visualisation is an illustration, not a computation.** It
shows what swarm convergence means; it is not running the algorithm. The card
says so on its face. Keep that caption.

Every page carrying demo figures shows a "Demo data" notice. Leave them until
real results from `benchmarking/benchmark.py` replace them.

## Design notes

- Dark-first, with a working light theme (navbar sun/moon toggle). OSM raster
  tiles are CSS-inverted in dark mode so they sit inside the UI.
- Purple is reserved for QPSO/quantum elements; green/yellow/orange/red is the
  traffic scale and is used for nothing else.
- Sidebar is a flex item, not a fixed overlay — below 900px it becomes an
  off-canvas drawer and bottom navigation takes over.
- `prefers-reduced-motion` disables all animation.
- Theme, sidebar state and settings persist in `localStorage`.
