let ws = null;
let reconnectTimer = null;
const listeners = new Set();

let sessionId = localStorage.getItem("voxcad_session");

export function connectWS(url = "ws://127.0.0.1:8000/ws") {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("[VOXCAD] WebSocket connected");
    clearTimeout(reconnectTimer);
    notify({ type: "status", value: "connected" });
  };

  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      console.log("[VOXCAD] Backend:", data);

      // 🧠 session sync (important)
      if (data.session_id) {
        sessionId = data.session_id;
        localStorage.setItem("voxcad_session", sessionId);
      }

      notify(data);
    } catch {
      console.log("[VOXCAD] Raw:", msg.data);
    }
  };

  ws.onerror = (err) => {
    console.warn("[VOXCAD] WebSocket error", err);
  };

  ws.onclose = () => {
    console.log("[VOXCAD] WebSocket closed. Reconnecting in 3s...");
    notify({ type: "status", value: "disconnected" });
    reconnectTimer = setTimeout(() => connectWS(url), 3000);
  };
}

// 🔥 FIXED SEND FUNCTION (IMPORTANT)
export function sendCommand(text) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      text,
      session_id: sessionId
    }));
  } else {
    console.warn("[VOXCAD] WebSocket not open. Command dropped:", text);
  }
}

export function onMessage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(data) {
  listeners.forEach((fn) => fn(data));
}

export function disconnectWS() {
  clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}