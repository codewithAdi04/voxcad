export default function VoicePanel({
  micOn,
  onMicToggle,
  onSendCommand,
  onDisperse
}) {
  return (
    <div style={styles.panel}>
      
      {/* HEADER */}
      <div style={styles.header}>
        AI CONTROL CENTER
        <span style={styles.statusDot} />
      </div>

      {/* MIC */}
      <button
        style={{
          ...styles.btn,
          ...(micOn ? styles.btnActive : {})
        }}
        onClick={onMicToggle}
      >
        🎤 {micOn ? "Listening..." : "Start Voice"}

        {micOn && <span style={styles.liveDot} />}
      </button>

      {/* COMMAND */}
      <button style={styles.btn} onClick={onSendCommand}>
        🧠 Send Command
      </button>

      {/* DISPERSE */}
      <button
        style={{ ...styles.btn, marginBottom: 0 }}
        onClick={onDisperse}
      >
        💥 Disperse Neurons
      </button>
    </div>
  );
}

const styles = {
  panel: {
    position: "absolute",
    top: 80,
    right: 14,

    width: 210,
    padding: "14px",

    borderRadius: "14px",

    // 🔥 AI GLASS PANEL
    background: "rgba(10, 15, 25, 0.75)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(0, 200, 255, 0.18)",
    boxShadow: "0 0 25px rgba(0, 200, 255, 0.06)",

    zIndex: 20
  },

  header: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",

    color: "#00c6ff",

    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: "10px"
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#00ffcc",
    boxShadow: "0 0 10px #00ffcc",
    animation: "dotPulse 1.5s infinite"
  },

  btn: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 8,

    borderRadius: "10px",

    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.03)",

    color: "#cbd5e1",

    fontSize: "12px",
    fontWeight: 600,

    cursor: "pointer",
    textAlign: "left",

    display: "flex",
    alignItems: "center",
    gap: 10,

    transition: "all 0.2s ease"
  },

  btnActive: {
    background: "rgba(0, 200, 255, 0.12)",
    border: "1px solid rgba(0, 200, 255, 0.35)",
    color: "#00d4ff",
    boxShadow: "0 0 15px rgba(0, 200, 255, 0.1)"
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#00d4ff",
    marginLeft: "auto",
    animation: "dotPulse 1.2s infinite"
  }
};