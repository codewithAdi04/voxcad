import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { connectWS } from "./engine/websocket.js";

// Connect to backend WebSocket on startup
connectWS("ws://127.0.0.1:8000/ws");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);