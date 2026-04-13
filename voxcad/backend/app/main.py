from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.voice import router as voice_router
from app.api.routes.cad import router as cad_router
from app.api.routes.image import router as image_router  # ✅ NEW
from app.api.routes import websocket

app = FastAPI(title="VoxCAD AI Engine 🚀")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router, prefix="/api/voice")
app.include_router(cad_router, prefix="/api/cad")
app.include_router(image_router, prefix="/api/cad")  # ✅ NEW
app.include_router(websocket.router)


@app.get("/")
def home():
    return {"status": "VoxCAD running 🚀"}