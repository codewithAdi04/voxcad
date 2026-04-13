export default function Console({ message }) {
  return (
    <div style={styles.wrapper}>
      
      {/* Header */}
      <div style={styles.title}>
        AI CONSOLE
        <span style={styles.dot} />
      </div>

      {/* Body */}
      <div style={styles.body}>
        {message || "Waiting for voice or command input..."}
      </div>

    </div>
  );
}

const styles = {
  wrapper: {
    position: "absolute",
    bottom: 80,
    left: 14,
    width: "320px",

    padding: "12px",
    borderRadius: "12px",

    // 🔥 AI GLASS LOOK
    background: "rgba(10, 15, 25, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(0, 200, 255, 0.2)",
    boxShadow: "0 0 20px rgba(0, 200, 255, 0.08)",
    color: "#E6F1FF"
  },

  title: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: "8px",
    color: "#00c6ff"
  },

  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00ffcc",
    boxShadow: "0 0 10px #00ffcc"
  },

  body: {
    fontSize: "13px",
    lineHeight: "1.4",
    opacity: 0.9,

    minHeight: "40px",
    wordBreak: "break-word"
  }
};