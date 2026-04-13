export default function MicButton({ micOn, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={micOn ? "Stop listening" : "Start listening"}
      aria-label="Toggle microphone"
      aria-pressed={micOn}
      style={{
        ...styles.btn,
        ...(micOn ? styles.btnOn : {})
      }}
    >
      🎤

      {micOn && (
        <>
          <span style={styles.ring} />
          <span style={styles.ring2} />
        </>
      )}
    </button>
  );
}

const styles = {
  btn: {
    position: "absolute",
    right: 24,
    top: "50%",
    transform: "translateY(-50%)",

    width: 56,
    height: 56,
    borderRadius: "50%",

    border: "1px solid rgba(0,200,255,0.25)",
    background: "rgba(10, 15, 25, 0.6)",

    color: "#00d4ff",
    fontSize: 22,

    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    zIndex: 30,

    backdropFilter: "blur(10px)",
    transition: "all 0.25s ease"
  },

  btnOn: {
    background: "rgba(0, 200, 255, 0.15)",
    borderColor: "#00d4ff",
    boxShadow: "0 0 25px rgba(0, 212, 255, 0.25)",
    transform: "translateY(-50%) scale(1.08)"
  },

  ring: {
    position: "absolute",
    inset: -6,
    borderRadius: "50%",
    border: "1.5px solid rgba(0, 212, 255, 0.35)",
    animation: "micPulse 1.4s ease-out infinite",
    pointerEvents: "none"
  },

  ring2: {
    position: "absolute",
    inset: -14,
    borderRadius: "50%",
    border: "1px solid rgba(0, 212, 255, 0.15)",
    animation: "micPulse 2.2s ease-out infinite",
    pointerEvents: "none"
  }
};