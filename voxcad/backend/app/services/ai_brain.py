import requests


OLLAMA_URL = "http://localhost:11434/api/generate"

SYSTEM_PROMPT = """
You are an AI CAD assistant.
Convert user input into JSON CAD commands.

Rules:
- Only output JSON
- Supported:
  create_primitive (box, cylinder)
  translate, rotate, disperse

Examples:
Input: create a box 10 5 3
Output: {"operation":"create_primitive","type":"box","dimensions":{"length":10,"width":5,"height":3}}

Input: disperse
Output: {"operation":"disperse"}
"""

def ask_llm(text: str):
    response = requests.post(OLLAMA_URL, json={
        "model": "llama3",
        "prompt": SYSTEM_PROMPT + "\nUser: " + text,
        "stream": False
    })

    data = response.json()
    return data["response"]