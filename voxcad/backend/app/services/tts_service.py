import os

def speak(text: str):
    try:
        # MacOS built-in TTS
        os.system(f'say "{text}"')
    except Exception as e:
        print("TTS Error:", e)