# SmartRoute AI Backend

> **SIH26137** — Quantum-Inspired Dynamic Traffic Route Optimization Platform with Predictive Alerts and Intelligent Rerouting.

FastAPI integration backend that exposes route optimization, traffic data, prediction, benchmarking, and alert APIs for a React + Leaflet frontend.  All domain modules (QPSO, graph/routing, traffic, prediction, benchmarking) connect through **adapter interfaces** so team members can plug in their real implementations without changing the API layer.

---

## 1. Project Overview

| Item | Detail |
|---|---|
| **Hackathon** | Smart India Hackathon 2026 |
| **Problem ID** | SIH26137 |
| **Theme** | Sport & Fitness |
| **Objective** | Model transportation networks as weighted graphs and use QPSO to dynamically find near-optimal routes while minimising travel time, distance, and congestion |

---

## 2. Architecture

```
React Frontend (Vite + Leaflet)
          │  HTTP / JSON
          ▼
      FastAPI  ─── Swagger/OpenAPI at /docs
          │
    ┌─────┴──────────────────────┐
    │      Service Layer         │
    │  route · optimization ·    │
    │  traffic · prediction ·    │
    │  benchmark · alert         │
    └─────┬──────────────────────┘
          │
    ┌─────┴──────────────────────┐
    │    Adapter / Integration   │
    │  graph · qpso · traffic ·  │
    │  prediction · benchmark    │
    └─────┬──────────────────────┘
          │
    ┌─────┴──────────┐
    │   MongoDB      │
    └────────────────┘
```

Each adapter has an **ABC base class** and a **mock implementation**.  Replace the mock with the real module — the service layer and API stay untouched.

---

## 3. Backend Responsibilities (Person 5)

- FastAPI server, REST APIs, Swagger docs
- MongoDB connection, collections, indexes
- Pydantic request/response models
- Service layer orchestrating all domain modules
- Adapter interfaces for QPSO, Graph, Traffic, Prediction, Benchmark
- Error handling, logging, validation
- Testing (pytest)
- Docker, deployment preparation

---

## 4. Folder Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app with lifespan
│   ├── api/                     # Route handlers
│   │   ├── health.py
│   │   ├── routes.py
│   │   ├── optimization.py
│   │   ├── traffic.py
│   │   ├── prediction.py
│   │   ├── benchmark.py
│   │   └── alerts.py
│   ├── models/                  # Pydantic schemas
│   │   ├── route_models.py
│   │   ├── traffic_models.py
│   │   ├── optimization_models.py
│   │   ├── benchmark_models.py
│   │   └── alert_models.py
│   ├── services/                # Business logic
│   │   ├── route_service.py
│   │   ├── optimization_service.py
│   │   ├── traffic_service.py
│   │   ├── prediction_service.py
│   │   ├── benchmark_service.py
│   │   └── alert_service.py
│   ├── integrations/            # Adapter interfaces + mocks
│   │   ├── graph_adapter.py
│   │   ├── qpso_adapter.py
│   │   ├── traffic_adapter.py
│   │   ├── prediction_adapter.py
│   │   └── benchmark_adapter.py
│   ├── database/
│   │   ├── mongodb.py
│   │   └── collections.py
│   ├── core/
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── errors.py
│   └── utils/
│       ├── geo.py
│       └── time_helpers.py
├── data/
│   ├── loaders.py
│   ├── mock_provider.py
│   └── sample/
│       ├── sample_traffic.json
│       ├── sample_routes.json
│       └── sample_graph_nodes.json
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_routes.py
│   ├── test_optimization.py
│   ├── test_traffic.py
│   ├── test_benchmark.py
│   ├── test_alerts.py
│   ├── test_models.py
│   └── test_adapters.py
├── requirements.txt
├── .env.example
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 5. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/SmartRoute-AI-Backend.git
cd SmartRoute-AI-Backend
```

---

## 6. Python Environment

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows PowerShell
# source .venv/bin/activate     # Linux / macOS

pip install -r requirements.txt
```

---

## 7. Environment Variables

Copy the example file and edit as needed:

```powershell
Copy-Item .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | Database name | `smartroute` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `APP_ENV` | `development` or `production` | `development` |
| `LOG_LEVEL` | Python log level | `INFO` |
| `DEBUG` | Enable debug mode | `false` |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key (optional) | *(empty)* |

> **Never commit `.env` to version control.**

---

## 8. MongoDB Setup

**Option A — Docker (recommended for development):**

```bash
docker compose up mongodb -d
```

**Option B — Local install:**

Install MongoDB 8.x from https://www.mongodb.com/try/download/community and start `mongod`.

**Option C — MongoDB Atlas:**

Set `MONGODB_URI` in `.env` to your Atlas connection string.

Indexes are automatically created on application startup.

---

## 9. Running Locally

```powershell
uvicorn app.main:app --reload
```

The server starts at `http://localhost:8000`.

---

## 10. API Documentation

Interactive Swagger UI is available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

### API Summary

| Group | Method | Endpoint | Description |
|---|---|---|---|
| System | `GET` | `/api/health` | Liveness probe |
| System | `GET` | `/api/status` | Detailed status + DB check |
| Routes | `POST` | `/api/routes/optimize` | Optimize a route |
| Routes | `POST` | `/api/routes/alternatives` | Get alternative routes |
| Routes | `GET` | `/api/routes/{request_id}` | Get route by ID |
| Routes | `GET` | `/api/routes/history` | Route history |
| Optimization | `POST` | `/api/optimization/{algorithm}` | Run specific algorithm |
| Traffic | `GET` | `/api/traffic/current` | Current traffic data |
| Traffic | `POST` | `/api/traffic/update` | Push traffic records |
| Traffic | `GET` | `/api/traffic/predict` | Predict future congestion |
| Prediction | `GET` | `/api/prediction/status` | Module readiness |
| Benchmark | `POST` | `/api/benchmark/run` | Run algorithm benchmark |
| Benchmark | `GET` | `/api/benchmark/results` | Benchmark history |
| Benchmark | `GET` | `/api/benchmark/convergence` | Convergence data |
| Alerts | `GET` | `/api/alerts/` | Get alerts |
| Alerts | `POST` | `/api/alerts/subscribe` | Subscribe to alerts |

### Example Request

```bash
curl -X POST http://localhost:8000/api/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "source": {"lat": 17.3850, "lon": 78.4867},
    "destination": {"lat": 17.4500, "lon": 78.3800},
    "algorithm": "qpso"
  }'
```

### Example Response

```json
{
  "success": true,
  "request_id": "abc123-...",
  "algorithm": "qpso",
  "route": {
    "coordinates": [{"lat": 17.385, "lon": 78.4867}, ...],
    "nodes": ["mock-0000", "mock-0001", ...],
    "distance_km": 12.4,
    "travel_time_minutes": 24.5
  },
  "congestion": 0.38,
  "fitness": 0.82,
  "execution_time_ms": 145,
  "eta": "2026-08-28T10:30:00+00:00",
  "metadata": {"data_source": "mock"}
}
```

---

## 11. Connecting React Frontend

The React frontend (Vite) should:

1. Set the API base URL to `http://localhost:8000/api`
2. Use standard `fetch` or `axios` for HTTP requests
3. CORS is pre-configured for `http://localhost:5173` (Vite default)
4. All responses are JSON — compatible with Leaflet map rendering

To allow additional origins, update `ALLOWED_ORIGINS` in `.env`:

```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 11b. The optimisation engine

The algorithms this backend serves live in this same repository, above `app/`:

| Module | What it does |
|---|---|
| `engine.py` | **`QROEngine`** — one object exposing plan / traffic / reroute / benchmark, already returning frontend-shaped JSON |
| `graph/` | Hyderabad OSM graph (286,603 nodes, 741,203 edges), multi-objective cost model |
| `traffic/` | Greenshields congestion model, 8 seeded traffic scenarios |
| `optimization/` | QPSO, PSO, GA, Dijkstra, multi-stop VRP encoding |
| `routing/`, `alerts/` | Dynamic rerouting, alert-suppression engine |
| `benchmarking/` | Fair-comparison harness, convergence and scalability |

Headline result: on multi-stop routing QPSO reaches the exact brute-force
optimum for 3–8 stops, beating PSO at every size. Dijkstra cannot express that
problem at all. See [`INTEGRATION.md`](INTEGRATION.md) for endpoint mapping and
live sample payloads in `results/api_samples/`.

Run the whole system end to end (also an integration test):

```bash
python scripts/run_demo.py --full
```

---

## 12. Connecting QPSO Module (Person 1)

**File:** `app/integrations/qpso_adapter.py`

1. Create a class that inherits from `BaseOptimizationAdapter`
2. Implement the `optimize()` and `get_convergence()` abstract methods
3. Update the `OPTIMIZATION_ADAPTERS` registry to map `"qpso"` to your class
4. Your `optimize()` receives a `RouteRequest` and a `GraphRoute` baseline
5. Return an `OptimizationResult` with the optimised route, fitness, and convergence data

```python
from app.integrations.qpso_adapter import BaseOptimizationAdapter, OptimizationResult

class RealQpsoAdapter(BaseOptimizationAdapter):
    algorithm = "qpso"

    def optimize(self, request, baseline, iterations=100, particles=30):
        # Your QPSO implementation here
        return OptimizationResult(route=..., fitness=..., convergence_history=[...])

    def get_convergence(self):
        return self._convergence
```

---

## 13. Connecting Graph Module (Person 2)

**File:** `app/integrations/graph_adapter.py`

1. Create a class that inherits from `BaseGraphAdapter`
2. Implement `calculate_route()`, `get_nearest_node()`, `get_graph_info()`
3. Use OSMnx / NetworkX internally
4. Return a `GraphRoute` dataclass

```python
from app.integrations.graph_adapter import BaseGraphAdapter, GraphRoute

class OsmGraphAdapter(BaseGraphAdapter):
    def calculate_route(self, request):
        # Load graph, find shortest path via OSMnx/NetworkX
        return GraphRoute(coordinates=[...], nodes=[...], distance_km=..., travel_time_minutes=...)
```

Then update `GraphAdapter = OsmGraphAdapter` at the bottom of the file.

---

## 14. Connecting Traffic Module (Person 3)

**Files:**
- `app/integrations/traffic_adapter.py` — implement `BaseTrafficAdapter`
- `app/integrations/prediction_adapter.py` — implement `BasePredictionAdapter`

```python
from app.integrations.traffic_adapter import BaseTrafficAdapter

class RealTrafficAdapter(BaseTrafficAdapter):
    def current(self):
        # Return real traffic records
    def update(self, records):
        # Ingest records
    def get_congestion(self, coord):
        # Return congestion for coord
```

---

## 15. Running Tests

```powershell
# Run all tests
pytest tests/ -v

# Run a specific test file
pytest tests/test_routes.py -v

# Run with coverage (if pytest-cov installed)
pytest tests/ --cov=app --cov-report=term-missing
```

---

## 16. Docker

```bash
# Build and run everything (backend + MongoDB)
docker compose up --build

# Run only MongoDB
docker compose up mongodb -d

# Stop all
docker compose down
```

The backend container includes a health check at `/api/health`.

---

## 17. Deployment

### Render

1. Connect your GitHub repo to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (`MONGODB_URI`, `MONGODB_DATABASE`, etc.)

### AWS (ECS / EC2)

1. Build the Docker image: `docker build -t smartroute-backend .`
2. Push to ECR or your container registry
3. Deploy as an ECS service or on EC2 with `docker compose`
4. Set environment variables via task definitions or `.env`

---

## Current Status

All domain modules (QPSO, graph, traffic, prediction, benchmarking) use **clearly labelled mock adapters**. These are integration boundaries — not implementations of the actual algorithms.  When a team member delivers their real module, replace the corresponding `Mock*Adapter` class and the API stays unchanged.

All API responses from mock adapters include `"data_source": "mock"` in their metadata.
