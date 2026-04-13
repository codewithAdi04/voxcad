from cad_engine.operations.primitives import create_primitive
from cad_engine.operations.transforms import apply_transform
from cad_engine.operations.booleans import apply_boolean
from cad_engine.exporters.mesh_exporter import export_to_stl
from app.services.neuron_service import NeuralCAD

_sessions = {}
_brains = {}

def get_brain(session_id):
    if session_id not in _brains:
        _brains[session_id] = NeuralCAD()
    return _brains[session_id]


async def execute_command(command: dict, session_id: str):

    brain = get_brain(session_id)
    brain.create_node(command)

    op = command.get("operation")
    model = _sessions.get(session_id)

    if op == "create_primitive":
        model = create_primitive(command)

    elif op in ("translate", "rotate"):
        model = apply_transform(model, command)

    elif op in ("boolean_union", "boolean_subtract"):
        model = apply_boolean(model, command)

    elif op == "disperse":
        brain.disperse()
        return {"status": "dispersed"}

    _sessions[session_id] = model

    path = export_to_stl(model, session_id)

    return {
        "status": "ok",
        "stl_path": path,
        "nodes": len(brain.get_graph().nodes)
    }