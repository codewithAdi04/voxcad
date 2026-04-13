const BASE_URL = "http://127.0.0.1:8000";

//  persistent session memory
let sessionId = localStorage.getItem("voxcad_session");

export async function sendCommand(text) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s for Ollama

    const res = await fetch(`${BASE_URL}/api/cad/execute-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        session_id: sessionId
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();

    if (data.session_id) {
      sessionId = data.session_id;
      localStorage.setItem("voxcad_session", sessionId);
    }

    return data;

  } catch (err) {
    console.error("API Error:", err);

    return {
      error: true,
      message: err.name === "AbortError"
        ? "Request timeout — Ollama is slow, try again"
        : "Backend connection failed"
    };
  }
}