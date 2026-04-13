import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

SYSTEM_PROMPT = """You are VoxCAD — an expert 3D CAD AI that builds ANY object using multiple 3D primitives.

You MUST always return a JSON with multiple parts to approximate ANY real object.

AVAILABLE PRIMITIVES:
- cube: {width, height, depth}
- sphere: {radius}
- cylinder: {radius, height}
- cone: {radius, height}
- torus: {radius, tube}
- capsule: {radius, height}
- octahedron: {radius}

OUTPUT FORMAT (always return "parts" array — minimum 2 parts):
{
  "type": "cad",
  "operation": "create_multi",
  "name": "Drone",
  "parts": [
    {"shape": "cylinder", "name": "Body", "color": "#333333", "dimensions": {"radius": 1.2, "height": 0.4}, "position": {"x": 0, "y": 0.2, "z": 0}},
    {"shape": "torus", "name": "Propeller FL", "color": "#222222", "dimensions": {"radius": 0.6, "tube": 0.08}, "position": {"x": 1.5, "y": 0.4, "z": 1.5}},
    {"shape": "torus", "name": "Propeller FR", "color": "#222222", "dimensions": {"radius": 0.6, "tube": 0.08}, "position": {"x": 1.5, "y": 0.4, "z": -1.5}},
    {"shape": "torus", "name": "Propeller BL", "color": "#222222", "dimensions": {"radius": 0.6, "tube": 0.08}, "position": {"x": -1.5, "y": 0.4, "z": 1.5}},
    {"shape": "torus", "name": "Propeller BR", "color": "#222222", "dimensions": {"radius": 0.6, "tube": 0.08}, "position": {"x": -1.5, "y": 0.4, "z": -1.5}},
    {"shape": "sphere", "name": "Camera", "color": "#111111", "dimensions": {"radius": 0.2}, "position": {"x": 0, "y": -0.1, "z": 1.3}}
  ]
}

EXAMPLES OF HOW TO BUILD OBJECTS:

"make a drone":
- Body: flat cylinder
- 4 Propellers: torus at corners
- Camera: small sphere underneath
- Arms: thin cylinders connecting body to propellers

"build an elephant":
- Body: large sphere/capsule
- Head: medium sphere  
- 4 Legs: cylinders
- Trunk: long thin cylinder curved down
- Ears: flat spheres on sides
- Tail: tiny cylinder

"create an airplane":
- Fuselage: long thin cylinder
- Wings: flat wide boxes on sides
- Tail fin: small vertical box
- Engines: cylinders under wings
- Nose: cone at front

"make a rocket":
- Body: tall cylinder
- Nose: cone on top
- Fins: 3-4 flat boxes at base
- Engine nozzle: small cone at bottom

"build a guitar":
- Body: large sphere flattened
- Neck: long thin box
- Headstock: small box at top
- Strings: very thin cylinders

"create a chair":
- Seat: flat box
- Back: thin tall box
- 4 Legs: thin cylinders

"make a dog":
- Body: capsule horizontal
- Head: sphere
- 4 Legs: cylinders
- Tail: small cylinder angled up
- Ears: flat spheres/boxes
- Nose: tiny sphere

"build a tree":
- Trunk: brown cylinder
- 3 Foliage layers: green cones stacked

"create a building":
- Main structure: tall box
- Windows: small flat boxes
- Roof: flat box or pyramid

RULES:
- ALWAYS return "create_multi" operation
- ALWAYS have at least 3-6 parts
- Position parts relative to center (0,0,0)
- Objects should sit on y=0 ground plane
- Use realistic colors
- Scale everything reasonably (total object 2-6 units tall usually)
- Be creative — approximate any object with available primitives
- For colors: use realistic defaults if not specified
"""

def ask_llm(text: str) -> str:
    """Try Ollama LLM for multi-part objects, fallback to smart parser."""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "llama3",
                "prompt": SYSTEM_PROMPT + f"\n\nUser: {text}\nJSON:",
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "top_p": 0.9,
                    "num_predict": 800,
                }
            },
            timeout=60
        )
        if response.status_code == 200:
            raw = response.json().get("response", "").strip()
            print(f"[LLM] Raw response (first 300): {raw[:300]}")

            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                if parsed.get("operation") == "create_multi" and parsed.get("parts"):
                    print(f"[LLM] Multi-part OK: {len(parsed['parts'])} parts")
                    return json.dumps(parsed)
    except Exception as e:
        print(f"[LLM] Failed: {e} — using smart parser")

    return smart_parse(text)


def smart_parse(text: str) -> str:
    """Smart multi-part object builder."""
    t = text.lower().strip()
    print(f"[SmartParse] Input: {t}")

    color = extract_color(t)
    size  = extract_size(t)

    #  SCENE CONTROLS 
    if re.search(r"\bclear\b|\bdelete all\b|\breset\b", t):
        return json.dumps({"type": "cad", "operation": "clear", "payload": {}})
    if re.search(r"\bdisperse\b|\bexplode\b|\bscatter\b", t):
        return json.dumps({"type": "neuron", "operation": "disperse", "payload": {}})

    # VEHICLES 
    if re.search(r"\bdrone\b|\bquadcopter\b|\buav\b", t):
        return _multi("Drone", [
            _part("cylinder", "Body", color or "#2a2a2a", {"radius": 1.0, "height": 0.35}, 0, 0.18, 0),
            _part("cylinder", "Arm FL", "#1a1a1a", {"radius": 0.08, "height": 1.4}, 0.7, 0.18, 0.7),
            _part("cylinder", "Arm FR", "#1a1a1a", {"radius": 0.08, "height": 1.4}, 0.7, 0.18, -0.7),
            _part("cylinder", "Arm BL", "#1a1a1a", {"radius": 0.08, "height": 1.4}, -0.7, 0.18, 0.7),
            _part("cylinder", "Arm BR", "#1a1a1a", {"radius": 0.08, "height": 1.4}, -0.7, 0.18, -0.7),
            _part("torus", "Prop FL", "#555555", {"radius": 0.45, "tube": 0.06}, 1.4, 0.35, 1.4),
            _part("torus", "Prop FR", "#555555", {"radius": 0.45, "tube": 0.06}, 1.4, 0.35, -1.4),
            _part("torus", "Prop BL", "#555555", {"radius": 0.45, "tube": 0.06}, -1.4, 0.35, 1.4),
            _part("torus", "Prop BR", "#555555", {"radius": 0.45, "tube": 0.06}, -1.4, 0.35, -1.4),
            _part("sphere", "Camera", "#111111", {"radius": 0.18}, 0, -0.1, 1.0),
        ])

    if re.search(r"\bcar\b|\bvehicle\b|\btruck\b|\bjeep\b|\bsuv\b", t):
        c = color or "#cc2222"
        return _multi("Car", [
            _part("cube", "Body", c, {"width": 2.2, "height": 0.7, "depth": 4.2}, 0, 0.65, 0),
            _part("cube", "Cabin", c, {"width": 1.8, "height": 0.65, "depth": 2.0}, 0, 1.35, 0.2),
            _part("cube", "Windshield", "#aaddff", {"width": 1.75, "height": 0.58, "depth": 0.05}, 0, 1.35, -0.85),
            _part("cylinder", "Wheel FL", "#111111", {"radius": 0.38, "height": 0.28}, 1.15, 0.38, 1.3),
            _part("cylinder", "Wheel FR", "#111111", {"radius": 0.38, "height": 0.28}, -1.15, 0.38, 1.3),
            _part("cylinder", "Wheel BL", "#111111", {"radius": 0.38, "height": 0.28}, 1.15, 0.38, -1.3),
            _part("cylinder", "Wheel BR", "#111111", {"radius": 0.38, "height": 0.28}, -1.15, 0.38, -1.3),
            _part("sphere", "Headlight L", "#ffffaa", {"radius": 0.15}, 0.7, 0.65, -2.12),
            _part("sphere", "Headlight R", "#ffffaa", {"radius": 0.15}, -0.7, 0.65, -2.12),
        ])

    if re.search(r"\bairplane\b|\bplane\b|\bjet\b|\baircraft\b", t):
        c = color or "#dddddd"
        return _multi("Airplane", [
            _part("cylinder", "Fuselage", c, {"radius": 0.5, "height": 6}, 0, 1, 0),
            _part("cone", "Nose", c, {"radius": 0.5, "height": 1.2}, 0, 1, 3.6),
            _part("cube", "Wing L", c, {"width": 0.2, "height": 4, "depth": 1.5}, 2.1, 1, 0),
            _part("cube", "Wing R", c, {"width": 0.2, "height": 4, "depth": 1.5}, -2.1, 1, 0),
            _part("cube", "Tail Fin", c, {"width": 0.15, "height": 1.5, "depth": 1.2}, 0, 1.9, -2.8),
            _part("cube", "Tail L", c, {"width": 0.12, "height": 1.5, "depth": 0.8}, 0.9, 1, -2.8),
            _part("cube", "Tail R", c, {"width": 0.12, "height": 1.5, "depth": 0.8}, -0.9, 1, -2.8),
            _part("cylinder", "Engine L", "#888888", {"radius": 0.3, "height": 1.2}, 1.5, 0.6, 0.5),
            _part("cylinder", "Engine R", "#888888", {"radius": 0.3, "height": 1.2}, -1.5, 0.6, 0.5),
        ])

    if re.search(r"\bhelicopter\b|\bchopper\b", t):
        c = color or "#4a7a4a"
        return _multi("Helicopter", [
            _part("capsule", "Body", c, {"radius": 0.7, "height": 2.5}, 0, 1, 0),
            _part("cylinder", "Tail Boom", c, {"radius": 0.2, "height": 3}, 0, 1.2, -2),
            _part("torus", "Main Rotor 1", "#222222", {"radius": 2.0, "tube": 0.06}, 0, 2.2, 0),
            _part("torus", "Main Rotor 2", "#222222", {"radius": 2.0, "tube": 0.06}, 0, 2.3, 0),
            _part("torus", "Tail Rotor", "#222222", {"radius": 0.5, "tube": 0.05}, 0.55, 1.5, -3.4),
            _part("cylinder", "Skid L", "#333333", {"radius": 0.08, "height": 2.5}, 0.8, 0.15, 0),
            _part("cylinder", "Skid R", "#333333", {"radius": 0.08, "height": 2.5}, -0.8, 0.15, 0),
        ])

    if re.search(r"\brocket\b|\bmissile\b|\bspaceship\b|\bshuttle\b", t):
        c = color or "#cccccc"
        return _multi("Rocket", [
            _part("cylinder", "Body", c, {"radius": 0.6, "height": 5 * size}, 0, 2.5 * size, 0),
            _part("cone", "Nose", "#ff4444", {"radius": 0.6, "height": 1.5}, 0, 5 * size + 0.75, 0),
            _part("cube", "Fin 1", "#aaaaaa", {"width": 0.08, "height": 1.5, "depth": 1.0}, 0.65, 0.75, 0),
            _part("cube", "Fin 2", "#aaaaaa", {"width": 0.08, "height": 1.5, "depth": 1.0}, -0.65, 0.75, 0),
            _part("cube", "Fin 3", "#aaaaaa", {"width": 1.0, "height": 1.5, "depth": 0.08}, 0, 0.75, 0.65),
            _part("cone", "Nozzle", "#ff8800", {"radius": 0.5, "height": 0.8}, 0, -0.1, 0),
            _part("sphere", "Window", "#aaddff", {"radius": 0.25}, 0, 4.2, 0.58),
        ])

    if re.search(r"\bship\b|\bboat\b|\byacht\b|\bsailboat\b", t):
        c = color or "#8B4513"
        return _multi("Ship", [
            _part("cube", "Hull", c, {"width": 3, "height": 1, "depth": 7}, 0, 0.5, 0),
            _part("cube", "Deck", "#ddccaa", {"width": 2.5, "height": 0.2, "depth": 5}, 0, 1.1, 0),
            _part("cube", "Cabin", "#ffffff", {"width": 2, "height": 1.5, "depth": 2.5}, 0, 2.0, 0.5),
            _part("cylinder", "Mast", "#8B4513", {"radius": 0.1, "height": 4}, 0, 4, 0),
            _part("cube", "Sail", "#ffffff", {"width": 0.05, "height": 2.5, "depth": 2}, 0, 3.5, 0),
            _part("cone", "Bow", c, {"radius": 1.5, "height": 1.5}, 0, 0.5, -4),
        ])

    if re.search(r"\btank\b|\barmor\b|\bmilitary\b", t):
        c = color or "#4a5a2a"
        return _multi("Tank", [
            _part("cube", "Hull", c, {"width": 3, "height": 1.2, "depth": 4.5}, 0, 0.6, 0),
            _part("cube", "Turret", c, {"width": 2, "height": 0.9, "depth": 2}, 0, 1.65, 0.2),
            _part("cylinder", "Barrel", "#333333", {"radius": 0.15, "height": 3}, 0, 1.8, -1.8),
            _part("cylinder", "Wheel L1", "#222222", {"radius": 0.45, "height": 0.3}, 1.6, 0.45, 1.5),
            _part("cylinder", "Wheel L2", "#222222", {"radius": 0.45, "height": 0.3}, 1.6, 0.45, -1.5),
            _part("cylinder", "Wheel R1", "#222222", {"radius": 0.45, "height": 0.3}, -1.6, 0.45, 1.5),
            _part("cylinder", "Wheel R2", "#222222", {"radius": 0.45, "height": 0.3}, -1.6, 0.45, -1.5),
        ])

    # ANIMALS 
    if re.search(r"\belephant\b", t):
        c = color or "#888880"
        return _multi("Elephant", [
            _part("sphere", "Body", c, {"radius": 2.0}, 0, 2, 0),
            _part("sphere", "Head", c, {"radius": 1.2}, 0, 3.8, 1.5),
            _part("cylinder", "Trunk", c, {"radius": 0.25, "height": 2.5}, 0, 2.8, 2.9),
            _part("cylinder", "Leg FL", c, {"radius": 0.45, "height": 2}, 1.0, 1.0, 1.0),
            _part("cylinder", "Leg FR", c, {"radius": 0.45, "height": 2}, -1.0, 1.0, 1.0),
            _part("cylinder", "Leg BL", c, {"radius": 0.45, "height": 2}, 1.0, 1.0, -1.0),
            _part("cylinder", "Leg BR", c, {"radius": 0.45, "height": 2}, -1.0, 1.0, -1.0),
            _part("sphere", "Ear L", c, {"radius": 0.9}, 1.3, 3.8, 1.3),
            _part("sphere", "Ear R", c, {"radius": 0.9}, -1.3, 3.8, 1.3),
            _part("cylinder", "Tail", c, {"radius": 0.1, "height": 1.2}, 0, 2.2, -2.0),
        ])

    if re.search(r"\bdog\b|\bpuppy\b|\bwolf\b", t):
        c = color or "#c8a870"
        return _multi("Dog", [
            _part("capsule", "Body", c, {"radius": 0.7, "height": 1.8}, 0, 1.2, 0),
            _part("sphere", "Head", c, {"radius": 0.65}, 0, 2.1, 1.3),
            _part("sphere", "Snout", c, {"radius": 0.3}, 0, 1.9, 1.95),
            _part("sphere", "Nose", "#111111", {"radius": 0.1}, 0, 2.0, 2.25),
            _part("cylinder", "Leg FL", c, {"radius": 0.2, "height": 1.1}, 0.6, 0.55, 0.7),
            _part("cylinder", "Leg FR", c, {"radius": 0.2, "height": 1.1}, -0.6, 0.55, 0.7),
            _part("cylinder", "Leg BL", c, {"radius": 0.2, "height": 1.1}, 0.6, 0.55, -0.7),
            _part("cylinder", "Leg BR", c, {"radius": 0.2, "height": 1.1}, -0.6, 0.55, -0.7),
            _part("sphere", "Ear L", "#a07850", {"radius": 0.28}, 0.45, 2.65, 1.2),
            _part("sphere", "Ear R", "#a07850", {"radius": 0.28}, -0.45, 2.65, 1.2),
            _part("cylinder", "Tail", c, {"radius": 0.12, "height": 1.0}, 0, 1.8, -1.35),
        ])

    if re.search(r"\bcat\b|\bkitten\b", t):
        c = color or "#d4a070"
        return _multi("Cat", [
            _part("sphere", "Body", c, {"radius": 0.8}, 0, 1.1, 0),
            _part("sphere", "Head", c, {"radius": 0.6}, 0, 2.1, 0.5),
            _part("cone", "Ear L", c, {"radius": 0.2, "height": 0.35}, 0.35, 2.65, 0.4),
            _part("cone", "Ear R", c, {"radius": 0.2, "height": 0.35}, -0.35, 2.65, 0.4),
            _part("sphere", "Nose", "#ff9999", {"radius": 0.08}, 0, 1.95, 1.1),
            _part("cylinder", "Leg FL", c, {"radius": 0.15, "height": 0.9}, 0.5, 0.45, 0.5),
            _part("cylinder", "Leg FR", c, {"radius": 0.15, "height": 0.9}, -0.5, 0.45, 0.5),
            _part("cylinder", "Leg BL", c, {"radius": 0.15, "height": 0.9}, 0.5, 0.45, -0.5),
            _part("cylinder", "Leg BR", c, {"radius": 0.15, "height": 0.9}, -0.5, 0.45, -0.5),
            _part("cylinder", "Tail", c, {"radius": 0.1, "height": 1.5}, 0, 1.3, -1.1),
        ])

    if re.search(r"\bbird\b|\bparrot\b|\beagle\b|\bpenguin\b", t):
        c = color or "#3366cc"
        return _multi("Bird", [
            _part("sphere", "Body", c, {"radius": 0.7}, 0, 1.2, 0),
            _part("sphere", "Head", c, {"radius": 0.45}, 0, 2.1, 0.4),
            _part("cone", "Beak", "#ffaa00", {"radius": 0.12, "height": 0.5}, 0, 2.0, 0.95),
            _part("cube", "Wing L", c, {"width": 0.15, "height": 1.8, "depth": 0.8}, 1.0, 1.4, 0),
            _part("cube", "Wing R", c, {"width": 0.15, "height": 1.8, "depth": 0.8}, -1.0, 1.4, 0),
            _part("cylinder", "Leg L", "#ffaa00", {"radius": 0.08, "height": 0.7}, 0.25, 0.35, 0.3),
            _part("cylinder", "Leg R", "#ffaa00", {"radius": 0.08, "height": 0.7}, -0.25, 0.35, 0.3),
            _part("cone", "Tail", c, {"radius": 0.3, "height": 0.8}, 0, 1.1, -0.9),
        ])

    if re.search(r"\bfish\b|\bshark\b|\bdolphin\b", t):
        c = color or "#4488cc"
        return _multi("Fish", [
            _part("sphere", "Body", c, {"radius": 1.0}, 0, 1, 0),
            _part("cone", "Head", c, {"radius": 0.8, "height": 1.5}, 0, 1, 1.4),
            _part("cube", "Tail", c, {"width": 0.1, "height": 1.2, "depth": 0.8}, 0, 1, -1.3),
            _part("cube", "Fin Top", c, {"width": 0.08, "height": 0.8, "depth": 0.6}, 0, 1.9, 0),
            _part("cube", "Fin L", c, {"width": 0.8, "height": 0.08, "depth": 0.5}, 1.1, 0.9, 0.3),
            _part("cube", "Fin R", c, {"width": 0.8, "height": 0.08, "depth": 0.5}, -1.1, 0.9, 0.3),
            _part("sphere", "Eye L", "#ffffff", {"radius": 0.15}, 0.55, 1.2, 1.6),
            _part("sphere", "Eye R", "#ffffff", {"radius": 0.15}, -0.55, 1.2, 1.6),
        ])

    if re.search(r"\bhorse\b|\bunicorn\b", t):
        c = color or "#c8a060"
        return _multi("Horse", [
            _part("capsule", "Body", c, {"radius": 0.9, "height": 2.5}, 0, 1.8, 0),
            _part("sphere", "Head", c, {"radius": 0.7}, 0, 3.2, 1.8),
            _part("cylinder", "Neck", c, {"radius": 0.4, "height": 1.2}, 0, 2.7, 1.1),
            _part("cylinder", "Leg FL", c, {"radius": 0.22, "height": 1.8}, 0.7, 0.9, 1.2),
            _part("cylinder", "Leg FR", c, {"radius": 0.22, "height": 1.8}, -0.7, 0.9, 1.2),
            _part("cylinder", "Leg BL", c, {"radius": 0.22, "height": 1.8}, 0.7, 0.9, -1.2),
            _part("cylinder", "Leg BR", c, {"radius": 0.22, "height": 1.8}, -0.7, 0.9, -1.2),
            _part("cylinder", "Tail", "#8B6040", {"radius": 0.15, "height": 1.5}, 0, 2.0, -1.8),
            _part("cone", "Snout", c, {"radius": 0.35, "height": 0.6}, 0, 2.9, 2.5),
        ])

    if re.search(r"\bdinosaur\b|\bt.rex\b|\btrex\b|\braptor\b", t):
        c = color or "#4a8a3a"
        return _multi("T-Rex", [
            _part("capsule", "Body", c, {"radius": 1.2, "height": 2.5}, 0, 2.5, 0),
            _part("sphere", "Head", c, {"radius": 1.0}, 0, 4.5, 1.8),
            _part("cylinder", "Neck", c, {"radius": 0.6, "height": 1.5}, 0, 3.8, 1.0),
            _part("cylinder", "Leg L", c, {"radius": 0.5, "height": 2.5}, 1.0, 1.25, 0),
            _part("cylinder", "Leg R", c, {"radius": 0.5, "height": 2.5}, -1.0, 1.25, 0),
            _part("cone", "Tail", c, {"radius": 0.8, "height": 3.5}, 0, 2.0, -2.5),
            _part("cylinder", "Arm L", c, {"radius": 0.2, "height": 1.0}, 1.3, 3.2, 0.8),
            _part("cylinder", "Arm R", c, {"radius": 0.2, "height": 1.0}, -1.3, 3.2, 0.8),
            _part("sphere", "Eye L", "#ffff00", {"radius": 0.2}, 0.5, 4.8, 2.7),
            _part("sphere", "Eye R", "#ffff00", {"radius": 0.2}, -0.5, 4.8, 2.7),
        ])

    #  BUILDINGS 
    if re.search(r"\bhouse\b|\bhome\b|\bcottage\b|\bcabin\b", t):
        c = color or "#e8d5b0"
        return _multi("House", [
            _part("cube", "Walls", c, {"width": 4, "height": 3, "depth": 4}, 0, 1.5, 0),
            _part("cone", "Roof", "#8B2500", {"radius": 3.2, "height": 2}, 0, 4, 0),
            _part("cube", "Door", "#5C3317", {"width": 0.9, "height": 1.8, "depth": 0.1}, 0, 0.9, 2.05),
            _part("cube", "Window L", "#aaddff", {"width": 0.9, "height": 0.8, "depth": 0.1}, -1.2, 1.8, 2.05),
            _part("cube", "Window R", "#aaddff", {"width": 0.9, "height": 0.8, "depth": 0.1}, 1.2, 1.8, 2.05),
            _part("cylinder", "Chimney", "#888888", {"radius": 0.3, "height": 1.5}, 1.2, 4.5, -0.8),
        ])

    if re.search(r"\bbuilding\b|\btower\b|\bskyscraper\b|\boffice\b", t):
        c = color or "#8899aa"
        h = 12 * size
        return _multi("Building", [
            _part("cube", "Structure", c, {"width": 3, "height": h, "depth": 3}, 0, h/2, 0),
            _part("cube", "Window 1", "#aaddff", {"width": 2.5, "height": 0.4, "depth": 0.1}, 0, h*0.8, 1.52),
            _part("cube", "Window 2", "#aaddff", {"width": 2.5, "height": 0.4, "depth": 0.1}, 0, h*0.6, 1.52),
            _part("cube", "Window 3", "#aaddff", {"width": 2.5, "height": 0.4, "depth": 0.1}, 0, h*0.4, 1.52),
            _part("cube", "Roof", "#667788", {"width": 3.2, "height": 0.3, "depth": 3.2}, 0, h+0.15, 0),
            _part("cylinder", "Antenna", "#555555", {"radius": 0.08, "height": 2}, 0, h+1.15, 0),
        ])

    if re.search(r"\bcastle\b|\bfort\b|\bfortress\b", t):
        c = color or "#999988"
        return _multi("Castle", [
            _part("cube", "Wall Front", c, {"width": 6, "height": 4, "depth": 0.6}, 0, 2, 3),
            _part("cube", "Wall Back", c, {"width": 6, "height": 4, "depth": 0.6}, 0, 2, -3),
            _part("cube", "Wall L", c, {"width": 0.6, "height": 4, "depth": 6}, 3, 2, 0),
            _part("cube", "Wall R", c, {"width": 0.6, "height": 4, "depth": 6}, -3, 2, 0),
            _part("cylinder", "Tower FL", c, {"radius": 0.8, "height": 5.5}, 3, 2.75, 3),
            _part("cylinder", "Tower FR", c, {"radius": 0.8, "height": 5.5}, -3, 2.75, 3),
            _part("cylinder", "Tower BL", c, {"radius": 0.8, "height": 5.5}, 3, 2.75, -3),
            _part("cylinder", "Tower BR", c, {"radius": 0.8, "height": 5.5}, -3, 2.75, -3),
            _part("cone", "Spire FL", "#cc2222", {"radius": 0.8, "height": 1.5}, 3, 6.25, 3),
            _part("cone", "Spire FR", "#cc2222", {"radius": 0.8, "height": 1.5}, -3, 6.25, 3),
        ])

    if re.search(r"\bbridge\b", t):
        c = color or "#888888"
        return _multi("Bridge", [
            _part("cube", "Deck", c, {"width": 1.5, "height": 0.3, "depth": 8}, 0, 2, 0),
            _part("cylinder", "Pillar L", c, {"radius": 0.4, "height": 2}, 2, 1, 0),
            _part("cylinder", "Pillar R", c, {"radius": 0.4, "height": 2}, -2, 1, 0),
            _part("cube", "Rail L", "#aaaaaa", {"width": 0.1, "height": 0.6, "depth": 8}, 0.8, 2.45, 0),
            _part("cube", "Rail R", "#aaaaaa", {"width": 0.1, "height": 0.6, "depth": 8}, -0.8, 2.45, 0),
            _part("cube", "Tower L", c, {"width": 0.5, "height": 3, "depth": 0.5}, 2, 3.5, 0),
            _part("cube", "Tower R", c, {"width": 0.5, "height": 3, "depth": 0.5}, -2, 3.5, 0),
        ])

    #  FURNITURE 
    if re.search(r"\btable\b|\bdesk\b", t):
        c = color or "#8B4513"
        return _multi("Table", [
            _part("cube", "Top", c, {"width": 4, "height": 0.18, "depth": 2.5}, 0, 2.09, 0),
            _part("cylinder", "Leg FL", c, {"radius": 0.1, "height": 2}, 1.7, 1, 1.0),
            _part("cylinder", "Leg FR", c, {"radius": 0.1, "height": 2}, 1.7, 1, -1.0),
            _part("cylinder", "Leg BL", c, {"radius": 0.1, "height": 2}, -1.7, 1, 1.0),
            _part("cylinder", "Leg BR", c, {"radius": 0.1, "height": 2}, -1.7, 1, -1.0),
        ])

    if re.search(r"\bchair\b|\bstool\b|\bsofa\b", t):
        c = color or "#5C3317"
        return _multi("Chair", [
            _part("cube", "Seat", c, {"width": 1.2, "height": 0.12, "depth": 1.2}, 0, 1.06, 0),
            _part("cube", "Back", c, {"width": 1.2, "height": 1.3, "depth": 0.1}, 0, 1.75, -0.55),
            _part("cylinder", "Leg FL", c, {"radius": 0.07, "height": 1.0}, 0.5, 0.5, 0.5),
            _part("cylinder", "Leg FR", c, {"radius": 0.07, "height": 1.0}, -0.5, 0.5, 0.5),
            _part("cylinder", "Leg BL", c, {"radius": 0.07, "height": 1.0}, 0.5, 0.5, -0.5),
            _part("cylinder", "Leg BR", c, {"radius": 0.07, "height": 1.0}, -0.5, 0.5, -0.5),
        ])

    #  NATURE 
    if re.search(r"\btree\b|\bpine\b|\boak\b|\bpalm\b", t):
        c = color or "#228B22"
        return _multi("Tree", [
            _part("cylinder", "Trunk", "#8B4513", {"radius": 0.25, "height": 2.5}, 0, 1.25, 0),
            _part("cone", "Foliage 1", c, {"radius": 1.8, "height": 2.0}, 0, 3.5, 0),
            _part("cone", "Foliage 2", c, {"radius": 1.4, "height": 1.8}, 0, 4.8, 0),
            _part("cone", "Foliage 3", c, {"radius": 1.0, "height": 1.5}, 0, 5.9, 0),
        ])

    if re.search(r"\bmushroom\b", t):
        c = color or "#cc4422"
        return _multi("Mushroom", [
            _part("cylinder", "Stem", "#eeeecc", {"radius": 0.3, "height": 1.5}, 0, 0.75, 0),
            _part("sphere", "Cap", c, {"radius": 1.2}, 0, 2.1, 0),
            _part("sphere", "Spot 1", "#ffffff", {"radius": 0.2}, 0.5, 2.8, 0.7),
            _part("sphere", "Spot 2", "#ffffff", {"radius": 0.15}, -0.6, 2.5, 0.4),
            _part("sphere", "Spot 3", "#ffffff", {"radius": 0.18}, 0.2, 2.3, -0.8),
        ])

    if re.search(r"\bmountain\b|\bvolcano\b|\bhill\b", t):
        c = color or "#888866"
        return _multi("Mountain", [
            _part("cone", "Peak", "#ffffff", {"radius": 1.5, "height": 3}, 0, 7, 0),
            _part("cone", "Mid", c, {"radius": 4, "height": 6}, 0, 3, 0),
            _part("cone", "Base", "#667755", {"radius": 6, "height": 4}, 0, 2, 0),
        ])

    if re.search(r"\bflower\b|\brose\b|\btulip\b", t):
        c = color or "#ff4488"
        return _multi("Flower", [
            _part("cylinder", "Stem", "#228B22", {"radius": 0.08, "height": 2.5}, 0, 1.25, 0),
            _part("sphere", "Center", "#ffdd00", {"radius": 0.3}, 0, 2.8, 0),
            _part("sphere", "Petal 1", c, {"radius": 0.4}, 0.5, 2.9, 0),
            _part("sphere", "Petal 2", c, {"radius": 0.4}, -0.5, 2.9, 0),
            _part("sphere", "Petal 3", c, {"radius": 0.4}, 0, 2.9, 0.5),
            _part("sphere", "Petal 4", c, {"radius": 0.4}, 0, 2.9, -0.5),
            _part("sphere", "Leaf", "#228B22", {"radius": 0.35}, 0.4, 1.5, 0),
        ])

    # TECH / GADGETS 
    if re.search(r"\brobot\b|\bmech\b|\bandroid\b", t):
        c = color or "#aaaaaa"
        return _multi("Robot", [
            _part("cube", "Body", c, {"width": 1.2, "height": 1.5, "depth": 0.8}, 0, 1.75, 0),
            _part("cube", "Head", c, {"width": 0.9, "height": 0.9, "depth": 0.8}, 0, 2.95, 0),
            _part("sphere", "Eye L", "#00d4ff", {"radius": 0.14}, 0.22, 3.0, 0.42),
            _part("sphere", "Eye R", "#00d4ff", {"radius": 0.14}, -0.22, 3.0, 0.42),
            _part("cylinder", "Arm L", c, {"radius": 0.2, "height": 1.3}, 0.85, 1.8, 0),
            _part("cylinder", "Arm R", c, {"radius": 0.2, "height": 1.3}, -0.85, 1.8, 0),
            _part("cylinder", "Leg L", c, {"radius": 0.22, "height": 1.5}, 0.32, 0.75, 0),
            _part("cylinder", "Leg R", c, {"radius": 0.22, "height": 1.5}, -0.32, 0.75, 0),
        ])

    if re.search(r"\bphone\b|\bmobile\b|\bsmartphone\b", t):
        c = color or "#111111"
        return _multi("Phone", [
            _part("cube", "Body", c, {"width": 0.8, "height": 1.7, "depth": 0.1}, 0, 0.85, 0),
            _part("cube", "Screen", "#222244", {"width": 0.7, "height": 1.4, "depth": 0.02}, 0, 0.9, 0.06),
            _part("sphere", "Camera", "#333333", {"radius": 0.08}, 0.25, 1.6, -0.06),
            _part("cylinder", "Button", "#333333", {"radius": 0.06, "height": 0.02}, 0, 0.08, 0.06),
        ])

    if re.search(r"\blaptop\b|\bcomputer\b", t):
        c = color or "#888888"
        return _multi("Laptop", [
            _part("cube", "Base", c, {"width": 3, "height": 0.15, "depth": 2}, 0, 0.075, 0),
            _part("cube", "Screen", "#222244", {"width": 2.9, "height": 1.8, "depth": 0.1}, 0, 1.35, -0.95),
            _part("cube", "Bezel", c, {"width": 3, "height": 1.9, "depth": 0.12}, 0, 1.35, -0.94),
            _part("cube", "Keyboard", "#333333", {"width": 2.6, "height": 0.02, "depth": 1.6}, 0, 0.16, 0.1),
        ])

    if re.search(r"\bguitar\b|\bviolin\b|\binstrument\b", t):
        c = color or "#8B4513"
        return _multi("Guitar", [
            _part("sphere", "Body", c, {"radius": 1.2}, 0, 1.2, 0),
            _part("cube", "Neck", c, {"width": 0.25, "height": 3.5, "depth": 0.15}, 0, 3.7, 0),
            _part("cube", "Head", c, {"width": 0.4, "height": 0.6, "depth": 0.15}, 0, 5.7, 0),
            _part("cylinder", "String 1", "#cccccc", {"radius": 0.02, "height": 4.5}, 0.06, 3.5, 0.08),
            _part("cylinder", "String 2", "#cccccc", {"radius": 0.02, "height": 4.5}, -0.06, 3.5, 0.08),
            _part("cylinder", "Sound Hole", "#333333", {"radius": 0.4, "height": 0.05}, 0, 1.2, 1.21),
        ])

    if re.search(r"\bbottle\b|\bcan\b|\bjar\b|\bvase\b", t):
        c = color or "#44aa66"
        return _multi("Bottle", [
            _part("cylinder", "Body", c, {"radius": 0.55, "height": 2.5}, 0, 1.25, 0),
            _part("cylinder", "Neck", c, {"radius": 0.25, "height": 1.0}, 0, 3.0, 0),
            _part("cylinder", "Cap", "#cc2222", {"radius": 0.28, "height": 0.2}, 0, 3.6, 0),
            _part("torus", "Label", "#ffffff", {"radius": 0.56, "tube": 0.05}, 0, 1.2, 0),
        ])

    if re.search(r"\bcup\b|\bmug\b|\bglass\b", t):
        c = color or "#ffffff"
        return _multi("Cup", [
            _part("cylinder", "Body", c, {"radius": 0.5, "height": 1.5}, 0, 0.75, 0),
            _part("torus", "Handle", c, {"radius": 0.4, "tube": 0.08}, 0.75, 0.75, 0),
            _part("cylinder", "Base", c, {"radius": 0.55, "height": 0.1}, 0, 0.05, 0),
        ])

    # SIMPLE SHAPES (single primitive) 
    if re.search(r"\bcube\b|\bbox\b|\bblock\b|\bbrick\b", t):
        w = 2 * size
        h = 2 * size
        return _single("cube", "Cube", color, {"width": w, "height": h, "depth": w})

    if re.search(r"\bsphere\b|\bball\b|\borb\b|\bglobe\b", t):
        return _single("sphere", "Sphere", color, {"radius": 1.0 * size})

    if re.search(r"\bcylinder\b|\bpillar\b|\bpipe\b|\btube\b", t):
        return _single("cylinder", "Cylinder", color, {"radius": 0.5 * size, "height": 3 * size})

    if re.search(r"\bcone\b", t):
        return _single("cone", "Cone", color, {"radius": 1.0 * size, "height": 2.5 * size})

    if re.search(r"\btorus\b|\bdonut\b|\bring\b", t):
        return _single("torus", "Torus", color, {"radius": 1.5 * size, "tube": 0.4 * size})

    if re.search(r"\bdiamond\b|\bgem\b|\bcrystal\b", t):
        return _single("octahedron", "Diamond", color or "#00d4ff", {"radius": 1.2 * size})

    
    fallback_prompt = f"Create a 3D object for: '{text}'. Return JSON with shape, color, and basic dimensions."
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "llama3",
            "prompt": SYSTEM_PROMPT + f"\n\nUser: {text}\nJSON:",
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": 600}
        }, timeout=30)
        if response.status_code == 200:
            raw = response.json().get("response", "").strip()
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                if parsed.get("parts") or parsed.get("operation"):
                    return json.dumps(parsed)
    except Exception:
        pass

    # Last resort
    import random
    shapes = ["sphere", "cube", "cylinder", "capsule"]
    colors = ["#ff4444", "#4488ff", "#44cc66", "#ffaa00", "#aa44ff", "#00d4ff"]
    return _single(random.choice(shapes), text.title()[:20], color or random.choice(colors), {"radius": 1.5 * size})


#  HELPERS 

def _part(shape, name, color, dims, x=0, y=0, z=0):
    return {"shape": shape, "name": name, "color": color, "dimensions": dims, "position": {"x": x, "y": y, "z": z}}

def _multi(name, parts):
    return json.dumps({"type": "cad", "operation": "create_multi", "name": name, "parts": parts})

def _single(shape, name, color, dims, count=1):
    payload = {"shape": shape, "name": name, "dimensions": dims, "count": count}
    if color: payload["color"] = color
    return json.dumps({"type": "cad", "operation": "create_primitive", "payload": payload})

def extract_size(text: str) -> float:
    if re.search(r"\btiny\b|\bmicro\b|\bsmall\b|\blittle\b|\bmini\b", text): return 0.4
    if re.search(r"\bbig\b|\blarge\b|\bhuge\b|\bgiant\b|\bmassive\b", text): return 3.0
    return 1.0

def extract_count(text: str) -> int:
    match = re.search(r"(\d+)\s*(of|x|times|pieces)?", text)
    if match:
        n = int(match.group(1))
        if 1 <= n <= 20: return n
    return 1

def extract_color(text: str):
    color_map = {
        "red": "#ff2222", "blue": "#0066ff", "green": "#00cc44",
        "yellow": "#ffdd00", "orange": "#ff8800", "purple": "#aa33ff",
        "pink": "#ff66aa", "white": "#ffffff", "black": "#111111",
        "gray": "#888888", "grey": "#888888", "brown": "#8B4513",
        "gold": "#ffd700", "golden": "#ffd700", "silver": "#c0c0c0",
        "cyan": "#00d4ff", "teal": "#008888", "magenta": "#ff00ff",
        "violet": "#8800ff", "lime": "#aaff00", "coral": "#ff6655",
        "turquoise": "#40E0D0", "maroon": "#800000", "navy": "#001f7a",
        "neon": "#00ffaa", "chrome": "#dddddd", "metal": "#aaaaaa",
        "metallic": "#aaaaaa", "wooden": "#8B4513", "wood": "#8B4513",
        "glass": "#aaddff",
    }
    for word, hex_color in color_map.items():
        if word in text:
            return hex_color
    return None