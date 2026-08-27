# Quantum-Inspired Traffic Route Optimization — Hyderabad

Dynamic traffic-aware route optimization using **Quantum Particle Swarm
Optimization (QPSO)**, benchmarked against Dijkstra, PSO and GA on an
OpenStreetMap graph of the Hyderabad metropolitan region.

The core contribution is the optimizer. Machine learning and computer vision are
supporting modules and never block the routing system.

## Status

| Phase | | |
|---|---|---|
| 1 | Dataset inspection | ✅ done — [`results/dataset_reports/PHASE1_REPORT.md`](results/dataset_reports/PHASE1_REPORT.md) |
| 2 | Hyderabad OSM road graph | ✅ done — 286,603 nodes / 741,203 edges |
| 3 | Dijkstra baseline | ✅ done — verified optimal vs NetworkX |
| 4 | Dynamic traffic model | ✅ done — 8 scenarios, Greenshields verified |
| 5a | QPSO (unconstrained) | ✅ done — 90% reach proven optimum |
| **5b** | **QPSO + congestion budget** | ⬅ **next** (Option A) |
| 6–8 | Benchmarking, convergence, scalability | — |
| 9–10 | Rerouting, alerts | — |
| 11 | Traffic prediction | blocked on TomTom collection |
| 12 | YOLO perception | blocked on DriveIndia/DATS_2022 download |
| 13 | Dashboard | ✅ done (mock data) — [`frontend/`](frontend/README.md) |
| 13b | FastAPI backend | next after the engine |

## Setup

```bash
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
```

## Reproduce

```bash
python scripts/inspect_datasets.py
```

```bash
python preprocessing/osm_processor.py --city "Hyderabad, Telangana, India" --metro
```

```bash
python scripts/collect_tomtom_hyderabad.py --once
```

Frontend:

```bash
npm --prefix frontend install && npm --prefix frontend run dev
```

`--metro` matters: `graph_from_place("Hyderabad")` returns the city polygon only
and silently excludes RGIA airport, Medchal and Patancheru. See the Phase 1
report for how that failure presents.

Other cities work unchanged — `--city "Bengaluru, Karnataka, India" --metro`
(presets for Bengaluru, Delhi, Chennai, Mumbai, Pune).

## Layout

```
config/datasets.yaml       registry: every source, its module, whether it is trainable
preprocessing/             osm_processor, dataset_inspector, traffic/vision processors
graph/                     graph_builder, edge_weights, constraints
traffic/                   congestion_model, simulator, predictor
optimization/              qpso, pso, genetic_algorithm, dijkstra
routing/                   route_validator, rerouting
benchmarking/              benchmark, convergence, scalability
alerts/                    alert_engine
vision/                    train_yolo, inference
results/                   dataset_reports, metrics, plots, routes
```

## Data

Full provenance, licensing and per-dataset verdicts in [`DATA.md`](DATA.md) and
the Phase 1 report. Two things worth knowing up front:

- **Do not train on Google Maps data.** Its ToS prohibits storing or deriving
  datasets from it — a real disqualification risk in a competition submission.
- **No open traffic time-series exists for any Indian city.** Real Hyderabad
  congestion has to be self-collected (`scripts/collect_tomtom_hyderabad.py`),
  and it accrues in wall-clock time, so start it early.

## Attribution

Road network © OpenStreetMap contributors (ODbL 1.0). METR-LA / PEMS-BAY from
Caltrans PeMS, cite Li et al. 2018 (DCRNN). IDD Lite © IIIT Hyderabad, research
licence. Ahmedabad flow analysis: Tsuboi & Yoshikawa (2019), Mendeley Data
`2dg8xgw622`.
