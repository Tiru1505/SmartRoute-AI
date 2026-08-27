"""
Load the cached Hyderabad graph and resolve named places to graph nodes.

Every algorithm gets its problem instance from here, so they all provably work
on the same graph — which is what makes the benchmark fair.
"""
import pickle
from functools import lru_cache
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_GRAPH = ROOT / "data/processed/hyderabad/hyderabad_drive.pkl"
PLACES_FILE = ROOT / "config/places.yaml"

# Edge fields that must be floats for the cost model to work. GraphML stringifies
# everything on save, so we coerce defensively regardless of the source format.
NUMERIC_EDGE_FIELDS = (
    "length_m", "free_flow_speed_kph", "free_flow_time_s", "capacity_pcu_h",
    "congestion", "current_speed_kph", "current_time_s",
)


def load_graph(path=None, verbose=True):
    """Load the routable graph. The .pkl loads ~6x faster than the .graphml."""
    path = Path(path) if path else DEFAULT_GRAPH
    if not path.exists():
        raise FileNotFoundError(
            f"Graph not found at {path}.\nBuild it first:\n"
            '  python preprocessing/osm_processor.py --city "Hyderabad, Telangana, India" --metro'
        )

    if path.suffix == ".pkl":
        with open(path, "rb") as fh:
            G = pickle.load(fh)
    else:
        import osmnx as ox
        G = ox.load_graphml(path)

    for _u, _v, _k, d in G.edges(keys=True, data=True):
        for f in NUMERIC_EDGE_FIELDS:
            if f in d:
                try:
                    d[f] = float(d[f])
                except (TypeError, ValueError):
                    d[f] = 0.0
        d.setdefault("congestion", 0.0)
        d.setdefault("road_status", "open")
        d.setdefault("current_time_s", d.get("free_flow_time_s", 0.0))

    if verbose:
        print(f"[graph] {G.number_of_nodes():,} nodes | {G.number_of_edges():,} edges")
    return G


@lru_cache(maxsize=1)
def load_places():
    return yaml.safe_load(PLACES_FILE.read_text())["places"]


def place_names():
    return {k: v["name"] for k, v in load_places().items()}


def resolve_place(G, key):
    """Named place -> nearest graph node. Raises if the place is off-graph."""
    import osmnx as ox

    places = load_places()
    if key not in places:
        raise KeyError(f"Unknown place '{key}'. Known: {', '.join(sorted(places))}")

    p = places[key]
    node = ox.nearest_nodes(G, p["lon"], p["lat"])
    snap_m = ox.distance.great_circle(
        p["lat"], p["lon"], float(G.nodes[node]["y"]), float(G.nodes[node]["x"])
    )
    # A large snap distance means the place lies outside the graph's extent and
    # any route to it would be silently wrong. Fail loudly instead.
    if snap_m > 1000:
        raise ValueError(
            f"'{p['name']}' is {snap_m:.0f} m from the nearest road node — "
            "it is probably outside the graph. Rebuild with --metro."
        )
    return node, p["name"], snap_m


def reset_traffic(G):
    """Return every edge to free-flow. Call between benchmark runs."""
    for _u, _v, _k, d in G.edges(keys=True, data=True):
        d["congestion"] = 0.0
        d["current_speed_kph"] = d.get("free_flow_speed_kph", 25.0)
        d["current_time_s"] = d.get("free_flow_time_s", 0.0)
        d["road_status"] = "open"
    return G
