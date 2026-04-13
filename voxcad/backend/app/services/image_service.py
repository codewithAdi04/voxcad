import base64
import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

VISION_PROMPT = """You are VoxCAD — an AI that converts images and sketches into 3D CAD commands.

Analyze this image carefully. Identify the main object(s) shown.

Output ONLY a single valid JSON object. No explanation, no markdown, no extra text.

SUPPORTED SHAPES:
Simple: cube, box, sphere, ball, cylinder, pipe, cone, torus, ring, plane, capsule, octahedron, tetrahedron, icosahedron
Complex (multi-part): car, house, table, chair, tree, robot

OUTPUT FORMAT:
{
  "type": "cad",
  "operation": "create_primitive",
  "payload": {
    "shape": "car",
    "name": "Red Sports Car",
    "color": "#cc2222",
    "dimensions": {},
    "count": 1
  }
}

EXAMPLES:
- Photo of a car → {"type":"cad","operation":"create_primitive","payload":{"shape":"car","name":"Car","color":"#cc2222","dimensions":{},"count":1}}
- Sketch of a house → {"type":"cad","operation":"create_primitive","payload":{"shape":"house","name":"House","color":"#e8d5b0","dimensions":{},"count":1}}
- Photo of a ball → {"type":"cad","operation":"create_primitive","payload":{"shape":"sphere","name":"Ball","color":"#ff6600","dimensions":{"radius":1.5},"count":1}}
- Sketch of a box → {"type":"cad","operation":"create_primitive","payload":{"shape":"cube","name":"Box","color":"#888888","dimensions":{"width":2,"height":2,"depth":2},"count":1}}
- Photo of a tree → {"type":"cad","operation":"create_primitive","payload":{"shape":"tree","name":"Tree","color":"#228B22","dimensions":{},"count":1}}
- Sketch of a table → {"type":"cad","operation":"create_primitive","payload":{"shape":"table","name":"Table","color":"#8B4513","dimensions":{},"count":1}}
- Drawing of a cylinder → {"type":"cad","operation":"create_primitive","payload":{"shape":"cylinder","name":"Cylinder","color":"#4488ff","dimensions":{"radius":1,"height":3},"count":1}}

RULES:
- Identify the dominant object in the image
- Infer color from image if visible, otherwise use a realistic default
- For sketches/drawings, use your best judgment about what object is drawn
- Always output valid JSON only
"""

async def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """Send image to LLaVA via Ollama and get CAD command back."""

    # Convert to base64
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "llava",
                "prompt": VISION_PROMPT,
                "images": [image_b64],
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.9,
                }
            },
            timeout=60
        )

        if response.status_code == 200:
            raw = response.json().get("response", "").strip()
            print(f"[LLaVA] Raw response: {raw}")

            # Extract JSON
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                if parsed.get("type") or parsed.get("operation"):
                    return parsed

    except Exception as e:
        print(f"[LLaVA] Error: {e}")

    # Fallback
    return {
        "type": "cad",
        "operation": "create_primitive",
        "payload": {
            "shape": "cube",
            "name": "Object",
            "color": "#888888",
            "dimensions": {"width": 2, "height": 2, "depth": 2},
            "count": 1
        }
    }