from fastapi import APIRouter, UploadFile, File, Form
from app.services.image_service import analyze_image
import uuid

router = APIRouter()

@router.post("/image-to-3d")
async def image_to_3d(
    file: UploadFile = File(...),
    session_id: str = Form(None)
):
    try:
        session_id = session_id or str(uuid.uuid4())

        # Read image bytes
        image_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"

        # Analyze with LLaVA
        command = await analyze_image(image_bytes, mime_type)

        return {
            "command": command,
            "session_id": session_id
        }

    except Exception as e:
        return {"error": str(e)}