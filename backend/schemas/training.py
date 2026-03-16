"""Pydantic schemas for training operations."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Architecture(str, Enum):
    Dense = "Dense"
    LSTM = "LSTM"
    GRU = "GRU"
    TCN = "TCN"
    Transformer = "Transformer"


class Optimizer(str, Enum):
    adam = "adam"
    sgd = "sgd"
    rmsprop = "rmsprop"


class TrainingStatus(str, Enum):
    idle = "idle"
    running = "running"
    paused = "paused"
    finished = "finished"
    error = "error"


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class TrainingConfig(BaseModel):
    """Configuration for a single training run (Genetic Algorithm session)."""

    population_size: int = Field(default=10, ge=2, le=100, description="Number of individuals per generation")
    generations: int = Field(default=5, ge=1, le=50, description="Number of generations to run")
    max_epoch_time: float = Field(default=60.0, ge=5.0, le=600.0, description="Max seconds allowed per epoch")


class IndividualConfig(BaseModel):
    """Hyper-parameter configuration for one individual in the population."""

    layer_sizes: list[int] = Field(..., description="Neurons per hidden layer")
    activation: str = Field(default="relu")
    optimizer: Optimizer = Field(default=Optimizer.adam)
    lr: float = Field(default=1e-3, ge=1e-5, le=5e-2)
    batch_size: int = Field(default=32)
    architecture: Architecture = Field(default=Architecture.Dense)
    epochs: int = Field(default=80, ge=10, le=300)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class IndividualResult(BaseModel):
    """Result of training one individual."""

    model_id: str
    generation: int
    architecture: str
    optimizer: str
    epochs: int
    layer_sizes: list[int]
    lr: float
    batch_size: int
    fitness: float
    direction_accuracy: float
    sl_avg: float
    tp_avg: float
    pe_avg: float
    model_path: str
    emoji: str


class GenerationResult(BaseModel):
    """Summary for one completed generation."""

    generation: int
    individuals: list[IndividualResult]
    best_fitness: float
    best_id: str


class SessionStatus(BaseModel):
    """Current status of the training session."""

    status: TrainingStatus
    current_generation: int | None = None
    total_generations: int | None = None
    current_individual: int | None = None
    total_individuals: int | None = None
    message: str = ""
    results: list[IndividualResult] = []


class SavedModel(BaseModel):
    """A saved model entry."""

    model_name: str
    score: str
    accuracy: str
    path: str


class Configuration(BaseModel):
    """A configuration entry from the CSV."""

    id: str
    generation: int
    architecture: str
    optimizer: str
    epochs: int
    layer_sizes: str
    lr: float
    batch: int


class LossEntry(BaseModel):
    """Single row of a loss history."""

    epoch: int
    mae: float


class TrainingProgressEvent(BaseModel):
    """WebSocket push event."""

    event: str  # "individual_done" | "generation_done" | "session_done" | "error" | "log"
    data: Any


class DatasetInfo(BaseModel):
    """Info about the loaded dataset."""

    rows: int
    feature_count: int
    train_size: int
    test_size: int
    columns: list[str]
