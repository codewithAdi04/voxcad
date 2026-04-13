import { useState, useCallback, useEffect, useRef } from "react";
import Scene from "./components/Scene";
import ImageUpload from "./components/ImageUpload";
import { sendCommand } from "./api";
import {
  addObject,
  deleteSelected,
  duplicateSelected,
  clearScene,
  setTransformMode,
  cameraFitAll,
  cameraTop,
  cameraFront,
  cameraSide,
  zoomIn,
  zoomOut,
  onObjectSelect,
  updateObjectProperty,
  toggleGrid,
  toggleAxes,
  getObjectList,
  selectById,
} from "./engine/threeScene";

export default function App() {
  const [logs, setLogs] = useState([{ type: "info", text: "VoxCAD ready 🚀 — type anything or upload an image!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const [objectList, setObjectList] = useState([]);
  const [transformMode, setTransformModeState] = useState("translate");
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [activePanel, setActivePanel] = useState("properties");
  const [sessionId, setSessionId] = useState(null);
  const logEndRef = useRef(null);

  const log = useCallback((text, type = "info") => {
    setLogs((prev) => [...prev.slice(-50), { type, text, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    onObjectSelect((info) => {
      setSelectedObj(info);
      setObjectList(getObjectList());
    });
  }, []);

  async function handleSend() {
    const cmd = input.trim();
    if (!cmd || loading) return;
    setInput("");
    setLoading(true);
    log(`> ${cmd}`, "user");

    try {
      const res = await sendCommand(cmd);
      if (res?.session_id) setSessionId(res.session_id);
      const command = res?.command;

      if (command?.operation === "create_primitive" && command?.payload?.shape) {
        const count = command.payload.count || 1;
        for (let i = 0; i < count; i++) {
          addObject({
            shape: command.payload.shape,
            dimensions: command.payload.dimensions || {},
            color: command.payload.color,
            name: command.payload.name || command.payload.shape,
          });
        }
        log(`✅ Created ${count}x ${command.payload.shape}`, "success");
        setObjectList(getObjectList());
      } else if (command?.operation === "clear") {
        clearScene();
        setSelectedObj(null);
        setObjectList([]);
        log("🗑️ Scene cleared", "info");
      } else if (command?.operation === "disperse" || command?.type === "neuron") {
        log("💫 Disperse!", "success");
      } else if (command?.operation === "translate") {
        log("↔️ Translated", "success");
      } else if (command?.operation === "rotate") {
        log("🔄 Rotated", "success");
      } else if (res?.message) {
        log(res.message, "ai");
      } else {
        log("🤔 Try: 'create a red sphere' or 'make a big cube'", "warn");
      }
    } catch (err) {
      log("❌ Backend error — is backend running?", "error");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Image upload handler
  async function handleImageResult(data) {
    if (data?.error) {
      log("❌ Image analysis failed", "error");
      return;
    }
    const command = data?.command;
    if (command?.operation === "create_primitive" && command?.payload?.shape) {
      addObject({
        shape: command.payload.shape,
        dimensions: command.payload.dimensions || {},
        color: command.payload.color,
        name: command.payload.name || command.payload.shape,
      });
      log(`🖼️ Created from image: ${command.payload.name || command.payload.shape}`, "success");
      setObjectList(getObjectList());
    } else {
      log("🤔 Couldn't recognize object in image", "warn");
    }
  }

  function switchMode(mode) {
    setTransformMode(mode);
    setTransformModeState(mode);
  }

  function handleToggleGrid() {
    const next = !showGrid;
    setShowGrid(next);
    toggleGrid(next);
  }

  function handleToggleAxes() {
    const next = !showAxes;
    setShowAxes(next);
    toggleAxes(next);
  }

  function handlePropChange(prop, val) {
    updateObjectProperty(prop, parseFloat(val) || val);
    setSelectedObj((prev) => prev ? { ...prev } : prev);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (document.activeElement.tagName === "INPUT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
        setSelectedObj(null);
        setObjectList(getObjectList());
      }
      if (e.key === "g") switchMode("translate");
      if (e.key === "r") switchMode("rotate");
      if (e.key === "s") switchMode("scale");
      if (e.key === "f") cameraFitAll();
      if (e.key === "d" && e.shiftKey) {
        duplicateSelected();
        setObjectList(getObjectList());
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const logColor = {
    info: "#8ba3c7", user: "#00d4ff", success: "#22d3a0",
    error: "#ff4d6a", warn: "#f59e0b", ai: "#a855f7"
  };

  return (
    <div style={s.root}>
      <Scene />

      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={s.logo}>⬡ VOXCAD</div>

        <div style={s.btnGroup}>
          {[
            { label: "Fit All", fn: cameraFitAll },
            { label: "Top", fn: cameraTop },
            { label: "Front", fn: cameraFront },
            { label: "Side", fn: cameraSide },
          ].map(({ label, fn }) => (
            <button key={label} style={s.topBtn} onClick={fn}>{label}</button>
          ))}
        </div>

        <div style={s.btnGroup}>
          <button style={s.topBtn} onClick={zoomIn}>＋ Zoom</button>
          <button style={s.topBtn} onClick={zoomOut}>－ Zoom</button>
        </div>

        <div style={s.btnGroup}>
          <button style={{ ...s.topBtn, ...(showGrid ? s.active : {}) }} onClick={handleToggleGrid}>Grid</button>
          <button style={{ ...s.topBtn, ...(showAxes ? s.active : {}) }} onClick={handleToggleAxes}>Axes</button>
        </div>

        <div style={s.btnGroup}>
          <button style={s.topBtn} onClick={() => { duplicateSelected(); setObjectList(getObjectList()); }}>⧉ Duplicate</button>
          <button style={{ ...s.topBtn, color: "#ff4d6a" }} onClick={() => { deleteSelected(); setSelectedObj(null); setObjectList(getObjectList()); }}>✕ Delete</button>
          <button style={{ ...s.topBtn, color: "#f59e0b" }} onClick={() => { clearScene(); setSelectedObj(null); setObjectList([]); }}>⬛ Clear All</button>
        </div>
      </div>

      {/* LEFT TOOLBAR */}
      <div style={s.leftBar}>
        {[
          { mode: "translate", icon: "✥", label: "Move\n(G)" },
          { mode: "rotate",    icon: "↻", label: "Rotate\n(R)" },
          { mode: "scale",     icon: "⤡", label: "Scale\n(S)" },
        ].map(({ mode, icon, label }) => (
          <button
            key={mode}
            title={label}
            style={{ ...s.toolBtn, ...(transformMode === mode ? s.toolActive : {}) }}
            onClick={() => switchMode(mode)}
          >
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 9, opacity: 0.6, whiteSpace: "pre", textAlign: "center" }}>{label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={s.toolBtn} title="Fit All (F)" onClick={cameraFitAll}>
          <span style={{ fontSize: 18 }}>⊡</span>
          <span style={{ fontSize: 9, opacity: 0.6 }}>Fit</span>
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div style={s.rightPanel}>
        <div style={s.panelTabs}>
          <button style={{ ...s.tab, ...(activePanel === "properties" ? s.tabActive : {}) }} onClick={() => setActivePanel("properties")}>Properties</button>
          <button style={{ ...s.tab, ...(activePanel === "objects" ? s.tabActive : {}) }} onClick={() => setActivePanel("objects")}>
            Objects {objectList.length > 0 && <span style={s.badge}>{objectList.length}</span>}
          </button>
        </div>

        <div style={s.panelBody}>
          {activePanel === "properties" && (
            selectedObj ? (
              <>
                <div style={s.propSection}>
                  <div style={s.sectionLabel}>OBJECT</div>
                  <div style={s.objName}>
                    {selectedObj.name}
                    <span style={s.chip}>{selectedObj.shape}</span>
                  </div>
                </div>

                <div style={s.propSection}>
                  <div style={s.sectionLabel}>POSITION</div>
                  {["x", "y", "z"].map((ax) => (
                    <div key={ax} style={s.propRow}>
                      <span style={s.propLabel}>{ax.toUpperCase()}</span>
                      <input style={s.propInput} type="number" step="0.1"
                        value={parseFloat(selectedObj.position?.[ax] ?? 0).toFixed(2)}
                        onChange={(e) => handlePropChange(ax, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div style={s.propSection}>
                  <div style={s.sectionLabel}>ROTATION (deg)</div>
                  {["x", "y", "z"].map((ax) => (
                    <div key={ax} style={s.propRow}>
                      <span style={s.propLabel}>{ax.toUpperCase()}</span>
                      <input style={{ ...s.propInput, opacity: 0.6 }} type="number" step="1"
                        value={parseFloat(selectedObj.rotation?.[ax] ?? 0).toFixed(1)} readOnly />
                    </div>
                  ))}
                </div>

                <div style={s.propSection}>
                  <div style={s.sectionLabel}>SCALE</div>
                  {[["sx","X"],["sy","Y"],["sz","Z"]].map(([prop, label]) => (
                    <div key={prop} style={s.propRow}>
                      <span style={s.propLabel}>{label}</span>
                      <input style={s.propInput} type="number" step="0.1" min="0.01"
                        value={parseFloat(selectedObj.scale?.[prop.slice(1)] ?? 1).toFixed(2)}
                        onChange={(e) => handlePropChange(prop, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div style={s.propSection}>
                  <div style={s.sectionLabel}>MATERIAL</div>
                  <div style={s.propRow}>
                    <span style={s.propLabel}>Color</span>
                    <input type="color" defaultValue={selectedObj.color || "#00ffff"}
                      style={{ ...s.propInput, padding: 2, height: 28, cursor: "pointer" }}
                      onChange={(e) => handlePropChange("color", e.target.value)} />
                  </div>
                  <div style={s.propRow}>
                    <span style={s.propLabel}>Metal</span>
                    <input style={s.propInput} type="range" min="0" max="1" step="0.01"
                      defaultValue={selectedObj.metalness ?? 0.3}
                      onChange={(e) => handlePropChange("metalness", e.target.value)} />
                  </div>
                  <div style={s.propRow}>
                    <span style={s.propLabel}>Rough</span>
                    <input style={s.propInput} type="range" min="0" max="1" step="0.01"
                      defaultValue={selectedObj.roughness ?? 0.4}
                      onChange={(e) => handlePropChange("roughness", e.target.value)} />
                  </div>
                  <div style={s.propRow}>
                    <span style={s.propLabel}>Wire</span>
                    <input type="checkbox" onChange={(e) => handlePropChange("wireframe", e.target.checked)} />
                  </div>
                </div>
              </>
            ) : (
              <div style={s.emptyState}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>⬡</div>
                <div>Click an object to inspect</div>
                <div style={{ marginTop: 6, opacity: 0.45, fontSize: 11 }}>or type/upload below</div>
              </div>
            )
          )}

          {activePanel === "objects" && (
            objectList.length === 0 ? (
              <div style={s.emptyState}>No objects in scene</div>
            ) : (
              objectList.map((obj) => (
                <div key={obj.id}
                  style={{ ...s.objRow, ...(selectedObj?.id === obj.id ? s.objRowActive : {}) }}
                  onClick={() => selectById(obj.id)}>
                  <span style={{ fontSize: 14 }}>⬡</span>
                  <span style={{ flex: 1, fontSize: 12 }}>{obj.name}</span>
                  <span style={s.chip}>{obj.shape}</span>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* BOTTOM CONSOLE + INPUT */}
      <div style={s.bottom}>
        <div style={s.console}>
          {logs.map((l) => (
            <div key={l.id} style={{ color: logColor[l.type] || "#8ba3c7", fontSize: 12, lineHeight: 1.6 }}>
              {l.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* ✅ Input row with Image Upload button */}
        <div style={s.inputRow}>
          <ImageUpload onResult={handleImageResult} sessionId={sessionId} />
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={loading ? "Processing..." : "Type anything · or upload a photo/sketch above →"}
            disabled={loading}
            autoFocus
          />
          <button
            style={{ ...s.sendBtn, opacity: loading ? 0.5 : 1 }}
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "⏳" : "⏎ Send"}
          </button>
        </div>

        <div style={s.shortcuts}>
          <span>G · Move</span>
          <span>R · Rotate</span>
          <span>S · Scale</span>
          <span>F · Fit All</span>
          <span>Del · Delete</span>
          <span>Shift+D · Duplicate</span>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    width: "100vw", height: "100vh",
    position: "relative", overflow: "hidden",
    background: "#050a14",
    fontFamily: "'Space Mono', monospace",
    color: "#e2eaf8",
  },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 44,
    background: "rgba(5,10,20,0.94)",
    backdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(0,200,255,0.12)",
    display: "flex", alignItems: "center", gap: 6,
    padding: "0 12px", zIndex: 100,
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: 15, color: "#00d4ff", letterSpacing: 3, marginRight: 8,
  },
  btnGroup: {
    display: "flex", gap: 2,
    borderRight: "1px solid rgba(255,255,255,0.06)",
    paddingRight: 8, marginRight: 2,
  },
  topBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,200,255,0.1)",
    color: "#8ba3c7", fontSize: 11, padding: "4px 10px",
    borderRadius: 6, cursor: "pointer",
  },
  active: {
    background: "rgba(0,212,255,0.15)",
    color: "#00d4ff", borderColor: "rgba(0,212,255,0.4)",
  },
  leftBar: {
    position: "absolute", top: 44, left: 0, bottom: 160,
    width: 54,
    background: "rgba(5,10,20,0.92)",
    backdropFilter: "blur(14px)",
    borderRight: "1px solid rgba(0,200,255,0.1)",
    display: "flex", flexDirection: "column",
    alignItems: "center", padding: "10px 0", gap: 4,
    zIndex: 100,
  },
  toolBtn: {
    width: 42, padding: "8px 0",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 8, color: "#8ba3c7",
    cursor: "pointer", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 2,
  },
  toolActive: {
    background: "rgba(0,212,255,0.12)",
    borderColor: "rgba(0,212,255,0.3)",
    color: "#00d4ff",
  },
  rightPanel: {
    position: "absolute", top: 44, right: 0, bottom: 160,
    width: 244,
    background: "rgba(5,10,20,0.94)",
    backdropFilter: "blur(14px)",
    borderLeft: "1px solid rgba(0,200,255,0.1)",
    display: "flex", flexDirection: "column",
    zIndex: 100,
  },
  panelTabs: {
    display: "flex",
    borderBottom: "1px solid rgba(0,200,255,0.1)",
    flexShrink: 0,
  },
  tab: {
    flex: 1, padding: "9px 0", fontSize: 11,
    background: "transparent", border: "none",
    color: "#8ba3c7", cursor: "pointer", letterSpacing: 0.5,
  },
  tabActive: {
    color: "#00d4ff",
    boxShadow: "inset 0 -2px 0 #00d4ff",
  },
  badge: {
    background: "rgba(0,212,255,0.2)", color: "#00d4ff",
    fontSize: 10, padding: "1px 5px", borderRadius: 10, marginLeft: 4,
  },
  panelBody: { flex: 1, overflowY: "auto" },
  propSection: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  sectionLabel: {
    fontSize: 9, letterSpacing: "0.14em",
    color: "rgba(0,200,255,0.45)", marginBottom: 7,
  },
  propRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 5 },
  propLabel: { fontSize: 10, color: "#8ba3c7", width: 38, flexShrink: 0 },
  propInput: {
    flex: 1, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(0,200,255,0.12)",
    borderRadius: 4, color: "#e2eaf8",
    fontSize: 11, padding: "3px 6px",
    fontFamily: "'Space Mono', monospace", width: "100%",
  },
  objName: {
    fontSize: 13, fontWeight: 600, color: "#e2eaf8",
    display: "flex", alignItems: "center", gap: 6,
  },
  chip: {
    background: "rgba(0,212,255,0.1)", color: "#00d4ff",
    fontSize: 9, padding: "2px 6px", borderRadius: 4, letterSpacing: 1,
  },
  objRow: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 12px", cursor: "pointer", fontSize: 12,
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  objRowActive: {
    background: "rgba(0,212,255,0.08)",
    borderLeft: "2px solid #00d4ff",
  },
  emptyState: {
    textAlign: "center", color: "#8ba3c7",
    fontSize: 12, padding: "48px 16px",
  },
  bottom: {
    position: "absolute", bottom: 0, left: 54, right: 244,
    background: "rgba(5,10,20,0.96)",
    backdropFilter: "blur(14px)",
    borderTop: "1px solid rgba(0,200,255,0.12)",
    padding: "8px 14px", zIndex: 100,
  },
  console: { height: 64, overflowY: "auto", marginBottom: 8 },
  inputRow: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(0,200,255,0.2)",
    borderRadius: 8, color: "#e2eaf8",
    fontSize: 13, padding: "9px 14px",
    fontFamily: "'Space Mono', monospace", outline: "none",
  },
  sendBtn: {
    background: "rgba(0,212,255,0.15)",
    border: "1px solid rgba(0,212,255,0.35)",
    borderRadius: 8, color: "#00d4ff",
    fontSize: 12, padding: "9px 18px",
    cursor: "pointer", fontFamily: "'Space Mono', monospace",
    whiteSpace: "nowrap",
  },
  shortcuts: {
    display: "flex", gap: 14, marginTop: 7,
    fontSize: 10, color: "rgba(139,163,199,0.35)",
  },
};