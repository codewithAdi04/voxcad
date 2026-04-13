from fastapi import APIRouter, UploadFile, File
import tempfile
import json
import uuid

from app.services.speech_service import transcribe_audio
from app.services.brain_service import ask_llm
from app.services.cad_service import execute_command

router = APIRouter()


@router.post("/process")
async def process_voice(audio: UploadFile = File(...), session_id: str | None = None):

    try:
       
        session_id = session_id or str(uuid.uuid4())

        audio_bytes = await audio.read()

        if not audio_bytes:
            return {"error": "Empty audio received"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_bytes)
            path = tmp.name

        text = transcribe_audio(path)

        if not text:
            return {
                "error": "Could not transcribe audio",
                "session_id": session_id
            }

 
        try:
            command = json.loads(ask_llm(text))
        except Exception as e:
            return {
                "error": "Invalid AI response",
                "raw": ask_llm(text),
                "details": str(e),
                "session_id": session_id
            }

        # 🧬 execute CAD
        result = await execute_command(command, session_id)

        return {
            "text": text,
            "command": command,
            "result": result,
            "session_id": session_id
        }

    except Exception as e:
        return {
            "error": "Voice processing failed",
            "details": str(e)
        }