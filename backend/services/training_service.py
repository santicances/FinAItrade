"""Training service – headless port of 2_ia_train.py logic.

All Tkinter / matplotlib-GUI dependencies are removed.
Progress is published via an asyncio Queue so the WebSocket router
can stream events to the browser.
"""

from __future__ import annotations

import asyncio
import datetime
import os
import random
import threading
import time
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from core.config import settings
from schemas.training import (
    Architecture,
    IndividualResult,
    Optimizer,
    TrainingStatus,
)

# ---------------------------------------------------------------------------
# Lazy TensorFlow import (heavy – only load when needed)
# ---------------------------------------------------------------------------
_tf_loaded = False
_keras = None
_layers = None
_optimizers = None
_to_categorical = None


def _ensure_tf() -> None:
    """Import TensorFlow lazily to keep startup fast."""
    global _tf_loaded, _keras, _layers, _optimizers, _to_categorical
    if _tf_loaded:
        return
    import tensorflow as tf  # noqa: F401
    from tensorflow import keras
    from tensorflow.keras import layers, optimizers
    from tensorflow.keras.utils import to_categorical

    _keras = keras
    _layers = layers
    _optimizers = optimizers
    _to_categorical = to_categorical
    _tf_loaded = True


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
EMOJIS_ID = [
    "🤖", "👾", "🧠", "🚀", "💡", "🔬", "🧬", "📱", "💻", "🤔",
    "🤝", "🧑‍💻", "👀", "🔍", "🔎", "🏆", "⚙️", "⏳", "💾", "🏗️",
    "🌐", "☁️", "🚦", "🕹️", "🖥️", "📡", "🛰️", "📈", "📉", "📝",
    "⚡", "💥", "🌟", "💬", "🗣️", "📢", "🪄", "🏅", "🏭", "🪛",
    "🧩", "🤯", "🏷️", "🪫", "🪪", "🎛️", "🎚️", "🔗", "🔐", "🔓",
]

ARCHITECTURES = [a.value for a in Architecture]
ACTIVATION_FUNCTIONS = ["relu", "tanh", "sigmoid", "leaky_relu", "swish"]
OPTIMIZERS_MAP: dict[str, Any] = {}  # populated after TF is loaded
BATCH_SIZES = [8, 16, 32]
LEARNING_RATES = [1e-4, 5e-4, 1e-3, 5e-3]
EPOCH_RANGE = (60, 120)

CONFIG_COLS = ["ID", "Generation", "Arquitectura", "Optimizador", "Epochs", "Layer Sizes", "LR", "Batch"]


# ---------------------------------------------------------------------------
# Global session state (one training session at a time)
# ---------------------------------------------------------------------------
class _SessionState:
    status: TrainingStatus = TrainingStatus.idle
    pause_event: threading.Event = threading.Event()   # set = paused
    stop_event: threading.Event = threading.Event()    # set = stop requested
    thread: threading.Thread | None = None
    event_queue: asyncio.Queue | None = None           # async queue for WS
    loop: asyncio.AbstractEventLoop | None = None


_session = _SessionState()

# Loaded dataset (loaded once, reused)
_dataset: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Dataset helpers
# ---------------------------------------------------------------------------

def _base_dir() -> str:
    """Return the backend directory (location of the CSV files).
    
    This file lives at backend/services/training_service.py, so we go up
    one level from the services/ directory to reach backend/.
    """
    # __file__ = .../backend/services/training_service.py
    # parent   = .../backend/services/
    # grandparent = .../backend/  ← where the CSVs live
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_dataset() -> dict[str, Any]:
    """Load and preprocess the operaciones_ganadoras.csv dataset."""
    global _dataset
    if _dataset:
        return _dataset

    data_path = os.path.join(_base_dir(), settings.OPERACIONES_FILE)
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found: {data_path}")

    _ensure_tf()

    df = pd.read_csv(data_path)
    df = df.loc[:, ~df.columns.duplicated()]

    ohlc_cols: list[str] = []
    for i in range(1, 51):
        ohlc_cols.extend([f"open_t-{i}", f"high_t-{i}", f"low_t-{i}", f"close_t-{i}"])

    numeric_input_cols = ["precio_entrada", "sl_price", "tp_price"] + ohlc_cols
    df = df[["direccion"] + numeric_input_cols]

    le = LabelEncoder()
    df["direccion"] = le.fit_transform(df["direccion"])

    scaler_input = StandardScaler()
    X_numeric = scaler_input.fit_transform(df[numeric_input_cols])
    X_numeric = pd.DataFrame(X_numeric, columns=numeric_input_cols)
    X_final = pd.concat([X_numeric, df[["direccion"]].reset_index(drop=True)], axis=1)

    scaler_prices = StandardScaler()
    y_prices_scaled = scaler_prices.fit_transform(df[["sl_price", "tp_price"]])
    y_prices_scaled = pd.DataFrame(y_prices_scaled, columns=["sl_price", "tp_price"])

    scaler_entrada = StandardScaler()
    y_entrada_scaled = scaler_entrada.fit_transform(df[["precio_entrada"]])

    y_direccion = df["direccion"]
    y_direccion_cat = _to_categorical(y_direccion, num_classes=2)

    split = train_test_split(
        X_final, y_direccion, y_prices_scaled, y_entrada_scaled,
        test_size=0.3, random_state=42,
    )
    X_train, X_test, y_train_dir, y_test_dir, y_train_prices, y_test_prices, y_train_ent, y_test_ent = split
    y_train_dir_cat = _to_categorical(y_train_dir, num_classes=2)
    y_test_dir_cat = _to_categorical(y_test_dir, num_classes=2)

    _dataset = {
        "X_train": X_train,
        "X_test": X_test,
        "y_train_direccion": y_train_dir,
        "y_test_direccion": y_test_dir,
        "y_train_direccion_cat": y_train_dir_cat,
        "y_test_direccion_cat": y_test_dir_cat,
        "y_train_precios": y_train_prices,
        "y_test_precios": y_test_prices,
        "y_train_entrada": y_train_ent,
        "y_test_entrada": y_test_ent,
        "scaler_input": scaler_input,
        "scaler_prices": scaler_prices,
        "scaler_entrada": scaler_entrada,
        "label_encoder": le,
        "feature_count": X_final.shape[1],
        "columns": list(X_final.columns),
    }
    return _dataset


def get_dataset_info() -> dict[str, Any]:
    """Return metadata without triggering full TF load if dataset not yet loaded."""
    data_path = os.path.join(_base_dir(), settings.OPERACIONES_FILE)
    if not os.path.exists(data_path):
        return {"error": "Dataset file not found"}
    ds = load_dataset()
    return {
        "rows": len(ds["X_train"]) + len(ds["X_test"]),
        "feature_count": ds["feature_count"],
        "train_size": len(ds["X_train"]),
        "test_size": len(ds["X_test"]),
        "columns": ds["columns"],
    }


# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------

def _csv(name: str) -> str:
    return os.path.join(_base_dir(), name)


def load_configurations() -> pd.DataFrame:
    """Load configurations.csv."""
    path = _csv(settings.CONFIGS_FILE)
    if os.path.exists(path):
        df = pd.read_csv(path)
    else:
        df = pd.DataFrame(columns=CONFIG_COLS)
    for col in CONFIG_COLS:
        if col not in df.columns:
            df[col] = np.nan
    return df[CONFIG_COLS]


def save_configurations(df: pd.DataFrame) -> None:
    df.to_csv(_csv(settings.CONFIGS_FILE), index=False)


def add_or_update_configuration(config_dict: dict[str, Any]) -> None:
    df = load_configurations()
    row = pd.DataFrame([[config_dict.get(c, np.nan) for c in CONFIG_COLS]], columns=CONFIG_COLS)
    if config_dict["ID"] in df["ID"].values:
        mask = df["ID"] == config_dict["ID"]
        for col in CONFIG_COLS:
            df.loc[mask, col] = row.loc[0, col]
    else:
        df = pd.concat([df, row], ignore_index=True)
    save_configurations(df)


def load_saved_models() -> list[dict[str, Any]]:
    path = _csv(settings.SAVED_MODELS_FILE)
    if not os.path.exists(path):
        return []
    return pd.read_csv(path).to_dict(orient="records")


def add_saved_model(model_name: str, score: str, accuracy: str, path: str) -> None:
    existing_path = _csv(settings.SAVED_MODELS_FILE)
    if os.path.exists(existing_path):
        df = pd.read_csv(existing_path)
    else:
        df = pd.DataFrame(columns=["Modelo", "Score", "Accuracy", "Ruta"])
    new_row = pd.DataFrame([{"Modelo": model_name, "Score": score, "Accuracy": accuracy, "Ruta": path}])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(existing_path, index=False)


def load_loss_history(model_id: str) -> list[dict[str, Any]]:
    path = os.path.join(_base_dir(), settings.LOSS_HISTORY_DIR, f"{model_id}_loss.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


# ---------------------------------------------------------------------------
# Model building
# ---------------------------------------------------------------------------

def _get_optimizers_map() -> dict[str, Any]:
    global OPTIMIZERS_MAP
    if not OPTIMIZERS_MAP:
        _ensure_tf()
        OPTIMIZERS_MAP = {
            "adam": _optimizers.Adam,
            "sgd": _optimizers.SGD,
            "rmsprop": _optimizers.RMSprop,
        }
    return OPTIMIZERS_MAP


def create_model(
    layer_sizes: list[int],
    activation: str,
    optimizer_name: str,
    learning_rate: float,
    architecture: str,
    feature_count: int,
) -> Any:
    """Build and compile a Keras multi-output model."""
    _ensure_tf()
    opt_map = _get_optimizers_map()

    if architecture == "Dense":
        inputs = _keras.Input(shape=(feature_count,))
        x = inputs
        for size in layer_sizes:
            x = _layers.Dense(size, activation=activation)(x)

    elif architecture in ("LSTM", "GRU", "TCN", "Transformer"):
        inputs = _keras.Input(shape=(feature_count, 1))
        x = inputs
        if architecture == "LSTM":
            for size in layer_sizes:
                x = _layers.LSTM(size, activation=activation, return_sequences=True)(x)
            x = _layers.Attention()([x, x])
        elif architecture == "GRU":
            for size in layer_sizes:
                x = _layers.GRU(size, activation=activation, return_sequences=True)(x)
            x = _layers.Attention()([x, x])
        elif architecture == "TCN":
            for size in layer_sizes:
                x = _layers.Conv1D(filters=size, kernel_size=2, activation=activation, padding="causal")(x)
            x = _layers.Attention()([x, x])
        elif architecture == "Transformer":
            x = _layers.Dense(64)(x)
            attn = _layers.MultiHeadAttention(num_heads=2, key_dim=32)(x, x)
            x = _layers.Add()([x, attn])
            x = _layers.LayerNormalization()(x)
            for size in layer_sizes:
                x = _layers.Dense(size, activation=activation)(x)
        x = _layers.Flatten()(x)
    else:
        inputs = _keras.Input(shape=(feature_count,))
        x = inputs
        for size in layer_sizes:
            x = _layers.Dense(size, activation=activation)(x)

    direccion_bin = _layers.Dense(1, activation="sigmoid", name="direccion_bin")(x)
    direccion_cat = _layers.Dense(2, activation="softmax", name="direccion_cat")(x)
    precios = _layers.Dense(2, activation="linear", name="precios")(x)
    precio_entrada = _layers.Dense(1, activation="linear", name="precio_entrada")(x)

    model = _keras.Model(inputs=inputs, outputs=[direccion_bin, direccion_cat, precios, precio_entrada])
    optimizer = opt_map[optimizer_name](learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss={
            "direccion_bin": "binary_crossentropy",
            "direccion_cat": "categorical_crossentropy",
            "precios": "mse",
            "precio_entrada": "mse",
        },
        metrics={
            "direccion_bin": "accuracy",
            "precios": ["mse", "mae"],
            "precio_entrada": "mae",
        },
    )
    return model


# ---------------------------------------------------------------------------
# Random config generation + GA operators
# ---------------------------------------------------------------------------

def random_config(index: int | None = None) -> dict[str, Any]:
    """Generate a random hyper-parameter configuration."""
    num_layers = random.randint(1, 5)
    layer_sizes = [random.randint(10, 128) for _ in range(num_layers)]
    arch = random.choice(ARCHITECTURES) if index is None else ARCHITECTURES[index % len(ARCHITECTURES)]
    return {
        "layer_sizes": layer_sizes,
        "activation": random.choice(ACTIVATION_FUNCTIONS),
        "optimizer": random.choice(list(_get_optimizers_map().keys())),
        "lr": random.choice(LEARNING_RATES),
        "batch_size": random.choice(BATCH_SIZES),
        "architecture": arch,
        "epochs": random.randint(*EPOCH_RANGE),
        "my_fitness": 999999.0,
    }


def _crossover(p1: dict, p2: dict) -> dict:
    child = {
        "layer_sizes": random.choice([p1["layer_sizes"], p2["layer_sizes"]]),
        "activation": random.choice([p1["activation"], p2["activation"]]),
        "optimizer": random.choice([p1["optimizer"], p2["optimizer"]]),
        "lr": random.choice([p1["lr"], p2["lr"]]),
        "batch_size": random.choice([p1["batch_size"], p2["batch_size"]]),
        "architecture": random.choice([p1["architecture"], p2["architecture"]]),
        "epochs": random.choice([p1["epochs"], p2["epochs"]]),
        "my_fitness": 999999.0,
    }
    return child


def _mutate(ind: dict, rate: float = 0.2) -> dict:
    if random.random() < rate:
        ind["lr"] *= random.uniform(0.5, 1.5)
        ind["lr"] = max(min(ind["lr"], 5e-2), 1e-5)
    if random.random() < rate:
        ind["batch_size"] = random.choice(BATCH_SIZES)
    if random.random() < rate:
        ind["activation"] = random.choice(ACTIVATION_FUNCTIONS)
    if random.random() < rate:
        ind["optimizer"] = random.choice(list(_get_optimizers_map().keys()))
    if random.random() < rate:
        ind["architecture"] = random.choice(ARCHITECTURES)
    if random.random() < rate:
        ind["epochs"] = random.randint(*EPOCH_RANGE)
    if random.random() < rate:
        ind["layer_sizes"] = [random.randint(10, 128) for _ in range(random.randint(1, 5))]
    return ind


def _crossover_and_mutation(population: list[dict], size: int, rate: float = 0.2) -> list[dict]:
    new_pop: list[dict] = []
    while len(new_pop) < size:
        p1 = random.choice(population)
        p2 = random.choice(population)
        child = _crossover(p1, p2)
        child = _mutate(child, rate)
        new_pop.append(child)
    return new_pop[:size]


# ---------------------------------------------------------------------------
# Event helpers
# ---------------------------------------------------------------------------

def _push(event: str, data: Any) -> None:
    """Push an event to the async queue (thread-safe)."""
    if _session.loop and _session.event_queue:
        asyncio.run_coroutine_threadsafe(
            _session.event_queue.put({"event": event, "data": data}),
            _session.loop,
        )


# ---------------------------------------------------------------------------
# Core training loop (runs in a background thread)
# ---------------------------------------------------------------------------

def _train_loop(config: dict[str, Any]) -> None:
    """Main training loop executed in a worker thread."""
    pop_size: int = config["population_size"]
    generations: int = config["generations"]
    max_epoch_time: float = config["max_epoch_time"]

    try:
        _push("log", "🚀 Cargando dataset…")
        ds = load_dataset()
        X_train = ds["X_train"]
        feature_count = ds["feature_count"]
        _push("log", f"✅ Dataset listo – {feature_count} features, {len(X_train)} muestras de entrenamiento")

        # Ensure output dirs exist
        os.makedirs(os.path.join(_base_dir(), settings.MODELS_DIR), exist_ok=True)
        os.makedirs(os.path.join(_base_dir(), settings.LOSS_HISTORY_DIR), exist_ok=True)

        df_config = load_configurations()
        max_gen = 0 if df_config.empty else int(df_config["Generation"].max())
        start_gen = max_gen + 1
        end_gen = start_gen + generations  # exclusive

        individual_id = 0 if df_config.empty else len(df_config)
        session_epoch_times: list[float] = []
        population = [random_config(i) for i in range(pop_size)]

        _push("session_start", {
            "total_generations": generations,
            "population_size": pop_size,
            "start_generation": start_gen,
        })

        for gen in range(start_gen, end_gen):
            if _session.stop_event.is_set():
                _push("log", "🛑 Entrenamiento detenido por el usuario")
                break

            _push("generation_start", {"generation": gen, "total": generations})
            _push("log", f"🌱 Generación {gen}/{start_gen + generations - 1}")

            gen_results: list[IndividualResult] = []

            for i, ind_cfg in enumerate(population):
                if _session.stop_event.is_set():
                    break

                # --- pausa ---
                while _session.pause_event.is_set():
                    time.sleep(0.3)
                    if _session.stop_event.is_set():
                        break

                emoji = random.choice(EMOJIS_ID)
                model_id = f"Ind{individual_id:03}"
                current_id_str = f"{emoji} {model_id}"
                _push("log", f"🧪 Entrenando {current_id_str} ({i+1}/{pop_size}) en Gen {gen}")

                # --- Build & train model ---
                try:
                    model = create_model(
                        ind_cfg["layer_sizes"],
                        ind_cfg["activation"],
                        ind_cfg["optimizer"],
                        ind_cfg["lr"],
                        ind_cfg["architecture"],
                        feature_count,
                    )

                    arch = ind_cfg["architecture"]
                    if arch in ("LSTM", "GRU", "TCN", "Transformer"):
                        X_tr = ds["X_train"].values.reshape(-1, feature_count, 1)
                    else:
                        X_tr = ds["X_train"]

                    # Time-limit callback
                    class _TimeLimitCb(_keras.callbacks.Callback):
                        def __init__(self) -> None:
                            super().__init__()
                            self.exceeded = False

                        def on_epoch_begin(self, epoch: int, logs: dict | None = None) -> None:
                            self._t0 = time.time()

                        def on_epoch_end(self, epoch: int, logs: dict | None = None) -> None:
                            elapsed = time.time() - self._t0
                            session_epoch_times.append(elapsed)
                            if elapsed > max_epoch_time:
                                self.exceeded = True
                                self.model.stop_training = True

                    # Loss history callback
                    class _LossHistoryCb(_keras.callbacks.Callback):
                        def __init__(self, mid: str) -> None:
                            super().__init__()
                            self.mid = mid
                            self.losses: list[float] = []

                        def on_epoch_end(self, epoch: int, logs: dict | None = None) -> None:
                            mae = (logs or {}).get("precios_mae", 0.0)
                            self.losses.append(float(mae))
                            _push("epoch_loss", {"model_id": self.mid, "epoch": epoch + 1, "mae": float(mae)})

                        def on_train_end(self, logs: dict | None = None) -> None:
                            out = os.path.join(_base_dir(), settings.LOSS_HISTORY_DIR, f"{self.mid}_loss.csv")
                            pd.DataFrame({"Epoch": range(1, len(self.losses) + 1), "MAE": self.losses}).to_csv(out, index=False)

                    tcb = _TimeLimitCb()
                    lcb = _LossHistoryCb(model_id)

                    t_start = time.time()
                    model.fit(
                        X_tr,
                        {
                            "direccion_bin": ds["y_train_direccion"],
                            "direccion_cat": ds["y_train_direccion_cat"],
                            "precios": ds["y_train_precios"],
                            "precio_entrada": ds["y_train_entrada"],
                        },
                        epochs=ind_cfg["epochs"],
                        batch_size=ind_cfg["batch_size"],
                        verbose=0,
                        callbacks=[tcb, lcb],
                    )
                    t_elapsed = time.time() - t_start

                    if tcb.exceeded:
                        _push("log", f"⚠️ {current_id_str} descartado por tiempo de epoch")
                        individual_id += 1
                        continue

                    # --- Evaluate ---
                    preds = model.predict(X_tr, verbose=0)
                    precios_pred = ds["scaler_prices"].inverse_transform(preds[2])
                    y_orig = ds["scaler_prices"].inverse_transform(ds["y_train_precios"].values)
                    sl_avg = float(np.mean(np.abs(precios_pred[:, 0] - y_orig[:, 0])))
                    tp_avg = float(np.mean(np.abs(precios_pred[:, 1] - y_orig[:, 1])))

                    pe_pred = ds["scaler_entrada"].inverse_transform(preds[3])
                    y_ent_orig = ds["scaler_entrada"].inverse_transform(ds["y_train_entrada"])
                    pe_avg = float(np.mean(np.abs(pe_pred[:, 0] - y_ent_orig[:, 0])))

                    fitness = sl_avg + tp_avg + pe_avg
                    dir_acc = float(model.history.history.get("direccion_bin_accuracy", [0])[-1])

                    ind_cfg["my_fitness"] = fitness

                    # --- Save model ---
                    model_filename = f"model_{model_id}_gen_{gen}.keras"
                    model_path = os.path.join(_base_dir(), settings.MODELS_DIR, model_filename)
                    model.save(model_path)
                    add_saved_model(model_filename, f"{fitness:.4f}", f"{dir_acc*100:.2f}%", model_path)

                    # --- Persist config ---
                    add_or_update_configuration({
                        "ID": current_id_str,
                        "Generation": gen,
                        "Arquitectura": ind_cfg["architecture"],
                        "Optimizador": ind_cfg["optimizer"],
                        "Epochs": ind_cfg["epochs"],
                        "Layer Sizes": str(ind_cfg["layer_sizes"]),
                        "LR": ind_cfg["lr"],
                        "Batch": ind_cfg["batch_size"],
                    })

                    result = IndividualResult(
                        model_id=current_id_str,
                        generation=gen,
                        architecture=ind_cfg["architecture"],
                        optimizer=ind_cfg["optimizer"],
                        epochs=ind_cfg["epochs"],
                        layer_sizes=ind_cfg["layer_sizes"],
                        lr=ind_cfg["lr"],
                        batch_size=ind_cfg["batch_size"],
                        fitness=fitness,
                        direction_accuracy=dir_acc,
                        sl_avg=sl_avg,
                        tp_avg=tp_avg,
                        pe_avg=pe_avg,
                        model_path=model_path,
                        emoji=emoji,
                    )
                    gen_results.append(result)
                    _push("individual_done", result.model_dump())
                    _push("log", f"✅ {current_id_str} | fitness={fitness:.2f} | dir_acc={dir_acc*100:.1f}% | t={t_elapsed:.1f}s")

                except Exception as exc:
                    _push("log", f"❌ Error en {current_id_str}: {exc}")

                individual_id += 1

            # --- End of generation ---
            if gen_results:
                best = min(gen_results, key=lambda r: r.fitness)
                _push("generation_done", {
                    "generation": gen,
                    "best_fitness": best.fitness,
                    "best_id": best.model_id,
                    "individuals_count": len(gen_results),
                })
                _push("log", f"🔝 Mejor Gen {gen}: {best.model_id} | fitness={best.fitness:.2f}")

            if not _session.stop_event.is_set():
                population = _crossover_and_mutation(population, pop_size)

        _push("session_done", {"message": "Entrenamiento completado ✅"})

    except Exception as exc:
        _push("error", str(exc))

    finally:
        _session.status = TrainingStatus.finished


# ---------------------------------------------------------------------------
# Public API (called from FastAPI routes)
# ---------------------------------------------------------------------------

def start_training(
    population_size: int,
    generations: int,
    max_epoch_time: float,
    loop: asyncio.AbstractEventLoop,
    queue: asyncio.Queue,
) -> None:
    """Start a training session in a background thread."""
    if _session.status == TrainingStatus.running:
        raise RuntimeError("A training session is already running")

    _session.status = TrainingStatus.running
    _session.pause_event.clear()
    _session.stop_event.clear()
    _session.event_queue = queue
    _session.loop = loop

    config = {
        "population_size": population_size,
        "generations": generations,
        "max_epoch_time": max_epoch_time,
    }

    t = threading.Thread(target=_train_loop, args=(config,), daemon=True)
    _session.thread = t
    t.start()


def pause_training() -> None:
    """Toggle pause on the running training session."""
    if _session.status != TrainingStatus.running:
        return
    if _session.pause_event.is_set():
        _session.pause_event.clear()
        _session.status = TrainingStatus.running
    else:
        _session.pause_event.set()
        _session.status = TrainingStatus.paused


def stop_training() -> None:
    """Request cancellation of the current training session."""
    _session.stop_event.set()
    _session.pause_event.clear()
    _session.status = TrainingStatus.idle


def get_status() -> TrainingStatus:
    """Return the current session status."""
    return _session.status
