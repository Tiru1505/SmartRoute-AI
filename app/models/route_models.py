"""Pydantic models for route requests and responses."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")


class Algorithm(str, Enum):
    qpso = "qpso"
    pso = "pso"
    ga = "ga"
    dijkstra = "dijkstra"


class RouteConstraints(BaseModel):
    avoid_tolls: bool = False
    avoid_highways: bool = False
    max_distance_km: float | None = Field(default=None, gt=0)


class RouteRequest(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    source: Coordinate
    destination: Coordinate
    algorithm: Algorithm = Algorithm.qpso
    constraints: RouteConstraints | None = None
    departure_time: str | None = Field(
        default=None, description="ISO-8601 departure time for ETA calculation"
    )
    # What the user actually typed. Routing works purely on coordinates, but
    # without these the history page can only show a pair of lat/lons — and
    # since endpoints are now free text rather than a fixed list of landmarks,
    # there is no lookup table to recover the name from afterwards.
    source_name: str | None = Field(default=None, max_length=200)
    destination_name: str | None = Field(default=None, max_length=200)
    user_id: str | None = None

    @model_validator(mode="after")
    def locations_must_differ(self) -> "RouteRequest":
        if self.source == self.destination:
            raise ValueError("source and destination must be different")
        return self


class RouteSummary(BaseModel):
    coordinates: list[Coordinate]
    nodes: list[str]
    distance_km: float
    travel_time_minutes: float


class RouteResponse(BaseModel):
    success: bool = True
    request_id: str
    algorithm: str
    route: RouteSummary
    congestion: float | None = None
    fitness: float | None = None
    execution_time_ms: float | None = None
    eta: str | None = Field(default=None, description="Estimated time of arrival (ISO-8601)")
    alternative_routes: list[RouteSummary] | None = None
    prediction: dict[str, Any] | None = Field(
        default=None, description="Traffic prediction attached to this route"
    )
    alerts: list[dict[str, Any]] | None = Field(
        default=None, description="Active alerts along this route"
    )
    metadata: dict[str, Any] = Field(default_factory=dict)
