import os, cadquery as cq

EXPORT_DIR = "/tmp/voxcad"
os.makedirs(EXPORT_DIR, exist_ok=True)

def export_to_stl(model, session_id):
    path = f"{EXPORT_DIR}/{session_id}.stl"
    cq.exporters.export(model, path)
    return path