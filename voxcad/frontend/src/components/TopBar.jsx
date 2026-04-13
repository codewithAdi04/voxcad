export default function TopBar({ micOn = false, aiStatus = "ready" }) {
  return (
    <div style={styles.bar}>
      
      {/* LOGO */}
      <div style={styles.logo}>
        VOX<span style={styles.logoFade}>CAD</span>
        <span style={styles.logoSub}>STUDIO</span>
      </div>

      {/* STATUS */}
      <div style={styles.right}>
        
        {/* MIC STATUS */}
        <span
          style={{
            ...styles.pill,
            ...(micOn ? styles.pillOn : styles.pillOff)
          }}
        >
          <span style={styles.dot(micOn ? "#00d4ff" : "#64748b")} />
          {micOn ? "MIC ACTIVE" : "MIC OFF"}
        </span>

        {/* AI STATUS */}
        <span
          style={{
            ...styles.pill,
            ...styles.pillOn
          }}
        >
          <span style={styles.dot("#00ffcc")} />
          AI {aiStatus.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    height: 54,

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    padding: "0 18px",
    zIndex: 50,

    // 🔥 GLASS TOPBAR
    background: "rgba(10, 15, 25, 0.75)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(0, 200, 255, 0.18)",
    borderRadius: 14,

    boxShadow: "0 0 20px rgba(0, 200, 255, 0.06)"
  },

  logo: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "0.14em",
    color: "#00d4ff",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "baseline",
    gap: 6
  },

  logoFade: {
    color: "#ffffff",
    opacity: 0.5
  },

  logoSub: {
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "rgba(226, 234, 248, 0.35)",
    marginLeft: 6
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },

  pill: {
    display: "flex",
    alignItems: "center",
    gap: 6,

    padding: "6px 10px",
    borderRadius: 999,

    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.5px",

    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#cbd5e1"
  },

  pillOn: {
    border: "1px solid rgba(0, 200, 255, 0.3)",
    background: "rgba(0, 200, 255, 0.08)",
    color: "#00d4ff"
  },

  pillOff: {
    opacity: 0.6
  },

  dot: (color) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 10px ${color}`
  })
};