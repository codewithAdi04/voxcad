import tempfile
import os
import wave
import json

# Safe vosk import
try:
    from vosk import Model, KaldiRecognizer
    MODEL_PATH = "models/vosk-model-small-en-us-0.15"
    model = Model(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
except ImportError:
    model = None
    print("[VoxCAD] vosk not installed — speech disabled")

from app.services.brain_service import ask_llm


async def transcribe_audio(audio_bytes: bytes, mime_type="audio/webm"):
    if model is None:
        return "Speech recognition unavailable"

    ext = "webm" if "webm" in mime_type else "wav"

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as f:
        f.write(audio_bytes)
        path = f.name

    try:
        wf = wave.open(path, "rb")
        rec = KaldiRecognizer(model, wf.getframerate())
        result_text = ""

        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result_text += json.loads(rec.Result())["text"] + " "

        result_text += json.loads(rec.FinalResult())["text"]
        return result_text.strip()

    except Exception as e:
        print(f"[VoxCAD] Transcription error: {e}")
        return ""
    finally:
        os.remove(path)


def process_text_with_ai(text: str):
    return ask_llm(text)