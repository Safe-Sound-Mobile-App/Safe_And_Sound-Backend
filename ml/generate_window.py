"""
Safe & Sound — Training-distribution window generator

Generates ONE realistic 4-second window (200 timesteps @ 50Hz) of RAW features:
  [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, heart_rate, spo2]

This reuses the exact generator logic used during model training:
  /Users/oak2002/PycharmProjects/SafeAndSoundPrototype/lstm_fall_detection/generate_data.py

Input (stdin JSON):
  { "label": "Normal"|"Warning"|"Danger"|"Not_Wearing", "seed": 123 }

Output (stdout JSON):
  { "label": "...", "seed": 123, "window": [[...8...], ... 200 rows ...] }
"""

import json
import sys
from typing import Any, Dict, Optional

import numpy as np

# Import training generator module directly (absolute path on this machine).
# This is intentional for demo accuracy and reproducibility.
TRAIN_ROOT = "/Users/oak2002/PycharmProjects/SafeAndSoundPrototype/lstm_fall_detection"
sys.path.insert(0, TRAIN_ROOT)

# pylint: disable=import-error,wrong-import-position
from config import WINDOW_SIZE  # type: ignore
import generate_data as gd  # type: ignore

LABELS = {"Normal", "Warning", "Danger", "Not_Wearing"}


def _gen_one_normal(rng: np.random.Generator) -> np.ndarray:
    person = gd.PersonProfile.random(rng)
    placement = str(rng.choice(gd._PLACEMENTS))
    noise = gd.SensorNoise.for_placement(placement)
    gen_idx = int(rng.integers(len(gd.ADL_GENERATORS)))

    hr_lo, hr_hi = gd._ADL_HR_LIST[gen_idx]
    base_hr = float(rng.uniform(hr_lo, hr_hi))
    base_spo2 = float(rng.uniform(97, 100))

    imu = gd.ADL_GENERATORS[gen_idx](person, rng)
    imu = gd._apply_orientation(imu, placement, rng)
    imu = gd._apply_imu_noise(imu, noise, rng)
    raw = gd._attach_vitals(imu, base_hr, base_spo2, noise.hr_noise_std, noise.spo2_noise_std, rng)
    raw = gd._clip(raw)
    return raw


def _gen_one_warning(rng: np.random.Generator) -> np.ndarray:
    WARNING_TYPES = ["stumble", "tachycardia", "low_spo2", "irregular_gait"]
    person = gd.PersonProfile.random(rng)
    placement = str(rng.choice(gd._PLACEMENTS))
    noise = gd.SensorNoise.for_placement(placement)
    wtype = str(rng.choice(WARNING_TYPES))

    if wtype == "stumble":
        imu = gd._gen_stumble_recovery(person, rng)
        base_hr = float(rng.uniform(70, 105))
        base_spo2 = float(rng.uniform(96, 100))
    elif wtype == "tachycardia":
        adl_idx = int(rng.integers(len(gd.ADL_GENERATORS)))
        imu = gd.ADL_GENERATORS[adl_idx](person, rng)
        base_hr = float(rng.uniform(105, 150))
        base_spo2 = float(rng.uniform(96, 100))
    elif wtype == "low_spo2":
        adl_idx = int(rng.integers(len(gd.ADL_GENERATORS)))
        imu = gd.ADL_GENERATORS[adl_idx](person, rng)
        base_hr = float(rng.uniform(75, 100))
        base_spo2 = float(rng.uniform(88, 93))
    else:
        imu = gd._gen_irregular_gait(person, rng)
        base_hr = float(rng.uniform(65, 95))
        base_spo2 = float(rng.uniform(95, 100))

    imu = gd._apply_orientation(imu, placement, rng)
    imu = gd._apply_imu_noise(imu, noise, rng)
    raw = gd._attach_vitals(imu, base_hr, base_spo2, noise.hr_noise_std, noise.spo2_noise_std, rng)
    raw = gd._clip(raw)
    return raw


def _gen_one_danger(rng: np.random.Generator) -> np.ndarray:
    person = gd.PersonProfile.random(rng)
    placement = str(rng.choice(gd._PLACEMENTS))
    noise = gd.SensorNoise.for_placement(placement)
    gen_idx = int(rng.integers(len(gd.FALL_GENERATORS)))
    gen = gd.FALL_GENERATORS[gen_idx]

    if gen == gd._gen_fall_syncope:
        base_hr = float(rng.uniform(38, 60))
        base_spo2 = float(rng.uniform(90, 97))
    else:
        base_hr = float(rng.uniform(75, 140))
        base_spo2 = float(rng.uniform(94, 99))

    imu = gen(person, rng)
    imu = gd._apply_orientation(imu, placement, rng)
    imu = gd._apply_imu_noise(imu, noise, rng)
    raw = gd._attach_vitals(imu, base_hr, base_spo2, noise.hr_noise_std, noise.spo2_noise_std, rng)
    raw = gd._clip(raw)
    return raw


def _gen_one_not_wearing(rng: np.random.Generator) -> np.ndarray:
    gen_idx = int(rng.integers(len(gd.NOT_WEARING_GENERATORS)))
    gen = gd.NOT_WEARING_GENERATORS[gen_idx]
    imu = gen(rng)
    raw = gd._attach_vitals(imu, base_hr=0.0, base_spo2=0.0, rng=None)
    raw = gd._clip(raw)
    return raw


def generate_window(label: str, seed: Optional[int]) -> np.ndarray:
    rng = np.random.default_rng(seed)
    if label == "Normal":
        raw = _gen_one_normal(rng)
    elif label == "Warning":
        raw = _gen_one_warning(rng)
    elif label == "Danger":
        raw = _gen_one_danger(rng)
    elif label == "Not_Wearing":
        raw = _gen_one_not_wearing(rng)
    else:
        raise ValueError(f"Invalid label: {label}")

    if raw.shape != (WINDOW_SIZE, 8):
        raise ValueError(f"Expected window shape (200,8), got {raw.shape}")
    return raw.astype(np.float32)


def main() -> None:
    req: Dict[str, Any] = json.loads(sys.stdin.read() or "{}")
    label = req.get("label")
    seed = req.get("seed", None)

    if label not in LABELS:
        print(json.dumps({"error": f"label must be one of {sorted(LABELS)}"}), file=sys.stderr)
        raise SystemExit(1)

    window = generate_window(label, int(seed) if seed is not None else None)
    print(json.dumps({"label": label, "seed": seed, "window": window.tolist()}))


if __name__ == "__main__":
    main()

