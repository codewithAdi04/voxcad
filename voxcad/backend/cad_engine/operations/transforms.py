import random

NEURON_STATE = {
    "particles": [],
    "original": None
}

def apply_transform(command: dict):
    action = command.get("action")

    if action == "create_cube":
        NEURON_STATE["original"] = {"type": "cube", "size": 1}
        return {"status": "cube_created"}

    elif action == "create_sphere":
        NEURON_STATE["original"] = {"type": "sphere", "radius": 1}
        return {"status": "sphere_created"}

    elif action == "disperse":
        particles = []

        for _ in range(100):
            particles.append({
                "x": random.uniform(-5, 5),
                "y": random.uniform(-5, 5),
                "z": random.uniform(-5, 5)
            })

        NEURON_STATE["particles"] = particles

        return {
            "status": "dispersed",
            "particles": particles
        }

    elif action == "assemble":
        return {
            "status": "assembled",
            "object": NEURON_STATE["original"]
        }

    return {"status": "unknown"}