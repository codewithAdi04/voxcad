from fastapi import APIRouter
from pydantic import BaseModel
from app.services.brain_service import ask_llm
import json
import uuid

router = APIRouter()

class TextRequest(BaseModel):
    text: str
    session_id: str | None = None


@router.post("/execute-text")
async def execute_text(req: TextRequest):
    try:
        session_id = req.session_id or str(uuid.uuid4())

        raw = ask_llm(req.text)

        try:
            command = json.loads(raw)
        except Exception:
            return {"error": "Invalid AI response", "raw": raw}

        return {
            "text": req.text,
            "command": command,
            "session_id": session_id
        }

    except Exception as e:
        return {
            "error": "Backend execution failed",
            "details": str(e)
        }