"""
Safe & Sound — TFLite LSTM Fall Detection Inference
Receives sensor JSON from Node.js via stdin, returns prediction JSON via stdout.
"""

import os
import sys
import json

# Suppress TensorFlow verbose logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
import joblib
import tensorflow as tf

# Paths are relative to this file's directory (Backend/ml/)
ML_DIR      = os.path.dirname(os.path.abspath(__file__))
TFLITE_PATH = os.path.join(ML_DIR, "lstm_fall_detection.tflite")
SCALER_PATH = os.path.join(ML_DIR, "scaler.pkl")
LABELS      = ["Normal", "Warning", "Danger", "Not_Wearing"]

def load_model():
    scaler      = joblib.load(SCALER_PATH)
    interpreter = tf.lite.Interpreter(model_path=TFLITE_PATH)
    interpreter.allocate_tensors()
    in_det  = interpreter.get_input_details()
    out_det = interpreter.get_output_details()
    return scaler, interpreter, in_det, out_det

def predict(data: dict) -> dict:
    scaler, interpreter, in_det, out_det = load_model()

    # Preferred input: a full 200×8 window (in training distribution).
    # Fallback: single reading payload (legacy) which will be tiled.
    if "window" in data and data["window"] is not None:
        window = np.array(data["window"], dtype=np.float32)  # (200, 8)
    else:
        one_reading = [
            data["accelerometer"]["x"],
            data["accelerometer"]["y"],
            data["accelerometer"]["z"],
            data["gyro"]["x"],
            data["gyro"]["y"],
            data["gyro"]["z"],
            data["heartRate"],
            data["spo2"],
        ]
        # Build 200-timestep window (steady-state assumption for single snapshot)
        window = np.tile(one_reading, (200, 1)).astype(np.float32)  # (200, 8)

    if window.shape != (200, 8):
        raise ValueError(f"Expected window shape (200,8), got {window.shape}")

    # Derive 3 extra channels
    acc_mag  = np.linalg.norm(window[:, :3], axis=1, keepdims=True)
    gyro_mag = np.linalg.norm(window[:, 3:6], axis=1, keepdims=True)
    acc_diff = np.diff(window[:, :3], axis=0, prepend=window[:1, :3])
    jerk_mag = np.linalg.norm(acc_diff, axis=1, keepdims=True)
    window11 = np.concatenate([window, acc_mag, gyro_mag, jerk_mag], axis=1)  # (200, 11)

    # Normalize and run inference
    X = scaler.transform(window11)[np.newaxis].astype(np.float32)  # (1, 200, 11)
    interpreter.set_tensor(in_det[0]["index"], X)
    interpreter.invoke()
    scores = interpreter.get_tensor(out_det[0]["index"])[0]

    # Priority threshold decision (matches original test logic)
    if   scores[3] >= 0.70: status = "Not_Wearing"
    elif scores[2] >= 0.35: status = "Danger"
    elif scores[1] >= 0.40: status = "Warning"
    else:                   status = "Normal"

    return {
        "status":     status,
        "confidence": float(max(scores)),
        "scores": {
            "Normal":      float(scores[0]),
            "Warning":     float(scores[1]),
            "Danger":      float(scores[2]),
            "Not_Wearing": float(scores[3]),
        },
    }

if __name__ == "__main__":
    try:
        raw  = sys.stdin.read()
        data = json.loads(raw)
        result = predict(data)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
