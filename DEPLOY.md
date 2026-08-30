# Deploying Q Route

Two services: the React app on **Vercel**, the FastAPI service on **Render**.

Read the constraint first — it decides what is actually possible.

---

## The constraint: the API needs 1.8 GB of RAM

The API keeps the entire Hyderabad road graph in memory — 286,603 nodes and
741,203 edges. Measured on the running service:

| | |
|---|---|
| Resident memory | **1.74 GB** |
| Peak during graph load | **1.80 GB** |

Render's **Free and Starter instances are 512 MB**. The process is killed
before it finishes starting. No configuration fixes this; it is a property of
the data structure, not a setting.

| Render plan | RAM | Fits? |
|---|---|---|
| Free | 512 MB | No |
| Starter | 512 MB | No |
| **Standard** | **2 GB** | **Yes** — the realistic minimum, with little headroom |
| Pro | 4 GB | Comfortable |

The graph is also **not in the repository** — 575 MB as GraphML, 214 MB as a
pickle, both past GitHub's limit. `render.yaml` therefore rebuilds it from
OpenStreetMap during the build and stores it on an attached disk so restarts
do not repeat the download.

### If you do not want to pay for Standard

Honest options, in order of how much they cost you:

1. **Deploy the frontend only, in mock mode.** Free, works today, and gives
   you a shareable link. Every page renders and every interaction works; the
   numbers are the built-in demo dataset, and the app says so on screen. Good
   enough to show the interface, not the engine.
2. **Run the API locally during the demo** and point the deployed frontend at
   it through a tunnel (`ngrok http 8010`). Free, real numbers, but only works
   while your laptop is on and the tunnel URL changes each session.
3. **Shrink the graph.** Rebuilding with only motorway→tertiary roads would cut
   node count substantially. Rough arithmetic still lands near 650 MB, so it
   likely does *not* reach 512 MB, and it degrades door-to-door accuracy on
   small streets. Mentioned for completeness, not recommended.

Do **not** switch to the `hyderabad-city` graph to save memory. It is half the
size because it stops at the municipal boundary, which excludes the airport,
Medchal and Patancheru — it returns routes shorter than the straight-line
distance between their endpoints. It is kept only as a counter-example.

---

## 1. Frontend on Vercel

The repo is already on GitHub, so connect it rather than uploading.

1. Go to **vercel.com → Add New → Project**, import `Tiru1505/SmartRoute-AI`.
2. Set **Root Directory** to `frontend`. This matters — the repo root is the
   Python project, and Vercel will not find a build without it.
3. Framework preset should auto-detect **Vite**. `frontend/vercel.json` supplies
   the build command, output directory and the SPA rewrite. Keep the rewrite:
   without it, refreshing on `/analytics` returns a 404, because those routes
   exist only in the browser.
4. Add environment variables:

| Variable | Value (mock mode) | Value (live backend) |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `false` |
| `VITE_API_BASE` | *(leave unset)* | `https://<your-render-service>.onrender.com/api` |

Start in mock mode. Flip both variables once the API is up, and redeploy —
Vite bakes env vars in at build time, so a redeploy is required for a change to
take effect.

---

## 2. Backend on Render

1. **render.com → New → Blueprint**, point it at the same repo. It reads
   `render.yaml`.
2. Confirm the plan is **Standard**. The blueprint requests it; the free tier
   will not work (see above).
3. Set the two secrets the blueprint leaves blank:

| Variable | Value |
|---|---|
| `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://qroute.vercel.app` |
| `MONGODB_URI` | A MongoDB Atlas connection string |

`MONGODB_URI` is optional. Without it the API still serves routes, traffic,
analytics and benchmarks; it only loses history persistence, and the History
page will be empty.

4. The **first build is slow** — it downloads the Hyderabad road network from
   OpenStreetMap and reprojects it. Expect tens of minutes. If it times out,
   build the graph locally, upload `hyderabad_drive.pkl` to any object store,
   and replace the build command with a `curl` of that file into
   `/var/data/graphs/hyderabad/`. `QRO_GRAPH_PATH` already points there.

5. Health check is `/api/health`. First request after a cold start pays the
   ~30 s graph load; `app/main.py` warms it during startup so this normally
   happens before traffic arrives.

### Why one worker

`--workers 1` is deliberate. Each worker loads its own copy of the graph, so a
second one would need another 1.7 GB. The expensive calls are CPU-bound and
already cached, so extra workers would cost memory without buying throughput.

---

## 3. Wiring them together

After both are live:

1. Copy the Render URL into Vercel as `VITE_API_BASE` (with the `/api` suffix),
   and set `VITE_USE_MOCK=false`. Redeploy.
2. Copy the Vercel URL into Render as `ALLOWED_ORIGINS`. Save — Render restarts
   automatically.

Getting CORS wrong is the usual failure here: the browser will report a network
error while the API looks healthy when you curl it. If that happens, check that
`ALLOWED_ORIGINS` exactly matches the origin the browser sends — scheme
included, no trailing slash.

Verify:

```bash
curl https://<your-render-service>.onrender.com/api/status
```

`adapters` should read `osm` for graph, optimization and traffic. `prediction`
correctly reads `mock` — no forecasting model is wired in.

---

## What is deployed vs what is real

In mock mode the deployed site is a faithful interface demo and labels itself
as one. Only with the Render backend connected are the routes, benchmarks,
traffic and rerouting computed from the real graph.
