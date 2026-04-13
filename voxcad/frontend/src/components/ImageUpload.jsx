import { useRef, useState } from "react";

const BASE_URL = "http://127.0.0.1:8000";

export default function ImageUpload({ onResult, sessionId }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (sessionId) formData.append("session_id", sessionId);

      const res = await fetch(`${BASE_URL}/api/cad/image-to-3d`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      onResult(data);
    } catch (err) {
      console.error("Image upload error:", err);
      onResult({ error: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />

      <button
        style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        title="Upload image or sketch to create 3D object"
      >
        {loading ? (
          <span style={s.spinner}>⏳</span>
        ) : (
          <>
            <span style={{ fontSize: 16 }}>🖼️</span>
            <span style={s.label}>
              {preview ? "Change Image" : "Image → 3D"}
            </span>
          </>
        )}
      </button>

      {preview && !loading && (
        <div style={s.preview}>
          <img src={preview} alt="preview" style={s.img} />
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(168,85,247,0.15)",
    border: "1px solid rgba(168,85,247,0.4)",
    borderRadius: 8,
    color: "#a855f7",
    fontSize: 12,
    padding: "9px 14px",
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  },
  label: {
    fontSize: 12,
  },
  preview: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid rgba(168,85,247,0.4)",
    flexShrink: 0,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  spinner: {
    fontSize: 16,
  },
};