def parse_command(text: str):
    text = text.lower()

    if "box" in text:
        return {
            "operation": "create_box",
            "dimensions": {"length": 10, "width": 5, "height": 3}
        }

    if "cylinder" in text:
        return {
            "operation": "create_cylinder",
            "dimensions": {"radius": 5, "height": 10}
        }

    if "disperse" in text:
        return {"operation": "disperse"}

    return {"operation": "unknown", "text": text}