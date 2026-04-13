from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import uuid

from app.services.brain_service import ask_llm
from app.services.cad_service import execute_command

router = APIRouter()

connections = {}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    session_id = str(uuid.uuid4())
    await websocket.accept()
    connections[session_id] = websocket
    print(f"Client connected with session: {session_id}")

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            text = payload.get("text", "")
            received_session_id = payload.get("session_id", session_id)

            # 🧠 AI Processing
            try:
                command = json.loads(ask_llm(text))
            except Exception as e:
                print(f"AI processing error: {e}")
                await websocket.send_json({"type": "error", "message": "AI processing error."})
                continue

            # 🧬 CAD Engine
            try:
                result = await execute_command(command, received_session_id)
            except Exception as e:
                print(f"CAD execution error: {e}")
                await websocket.send_json({"type": "error", "message": "CAD engine error."})
                continue

            # 📡 Send result
            await websocket.send_json({
                "type": "response",
                "text": text,
                "command": command,
                "result": result
            })

    except WebSocketDisconnect:
        print(f"Client with session {session_id} disconnected.")
        connections.pop(session_id, None)

    except Exception as e:
        print(f"Unexpected error: {e}")
       
        try:
            await websocket.send_json({"type": "error", "message": "Unexpected error."})
        except Exception:
            pass
        connections.pop(session_id, None)