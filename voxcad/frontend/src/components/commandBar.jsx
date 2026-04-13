import { useState } from "react";

export default function CommandBar({ onSend }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setLoading(true);

    try {
      await onSend?.(trimmed);
      setValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Ask AI CAD: cube, sphere, rotate, build structure..."
        style={styles.input}
        disabled={loading}
      />

      <button
        onClick={handleSend}
        style={{
          ...styles.btn,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "PROCESSING..." : "SEND →"}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "absolute",
    bottom: 14,
    left: "50%",
    transform: "translateX(-50%)",
    width: "60%",
    display: "flex",
    borderRadius: "14px",
    overflow: "hidden",

    // 🔥 AI DARK GLASS UI
    background: "rgba(10, 15, 25, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(0, 200, 255, 0.25)",
    boxShadow: "0 0 25px rgba(0, 200, 255, 0.08)"
  },

  input: {
    flex: 1,
    padding: "14px 16px",
    border: "none",
    outline: "none",
    fontSize: "14px",

    color: "#E6F1FF",
    background: "transparent"
  },

  btn: {
    padding: "14px 20px",
    border: "none",

    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "#fff",

    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.8px"
  }
};