import cadquery as cq

def create_primitive(cmd: dict):
    t = cmd.get("type", "box")
    d = cmd.get("dimensions", {})

    if t == "box":
        return cq.Workplane("XY").box(
            d.get("length",10),
            d.get("width",10),
            d.get("height",10)
        )

    if t == "cylinder":
        return cq.Workplane("XY").cylinder(
            d.get("height",10),
            d.get("radius",5)
        )

    return cq.Workplane("XY").box(10,10,10)