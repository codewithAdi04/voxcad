const hints = [
  { icon: "⟳", label: "Drag", action: "Rotate Scene" },
  { icon: "⊕", label: "Scroll", action: "Zoom In/Out" },
  { icon: "🎤", label: "Voice", action: "AI Commands" },
  { icon: "🧠", label: "AI", action: "Brain Active" },
];

export default function Controls() {
  return (
    <div style={styles.wrap}>
      
      {/* HEADER */}
      <div style={styles.header}>
        CONTROLS GUIDE
      </div>

      {/* LIST */}
      {hints.map((h) => (
        <div key={h.label} style={styles.row}>
          <span style={styles.icon}>{h.icon}</span>
          <span style={styles.label}>{h.label}</span>
          <span style={styles.sep}>—</span>
          <span style={styles.action}>{h.action}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    bottom: 90,
    right: 14,

    width: 220,
    padding: "12px 14px",

    borderRadius: 14,

    // 🔥 GLASS HUD STYLE
    background: "rgba(10, 15, 25, 0.72)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(0, 200, 255, 0.15)",
    boxShadow: "0 0 18px rgba(0, 200, 255, 0.05)",

    color: "#cbd5e1",
    zIndex: 15
  },

  header: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.5px",

    color: "#00d4ff",

    marginBottom: "10px"
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    lineHeight: 2,
    padding: "2px 0"
  },

  icon: {
    fontSize: 12,
    width: 18,
    textAlign: "center",
    color: "#00d4ff",
    opacity: 0.9
  },

  label: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "rgba(226,234,248,0.6)",
    minWidth: 50
  },

  sep: {
    color: "rgba(226,234,248,0.2)",
    fontSize: 10
  },

  action: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "rgba(226,234,248,0.4)"
  }
};