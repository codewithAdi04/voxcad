import { useState } from "react";

const tools = [
  { id: "cube", label: "Cube", group: "Objects",
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.3"/><line x1="3" y1="3" x2="6" y2="0.8" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="13" y1="3" x2="16" y2="0.8" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="13" y1="13" x2="16" y2="10.8" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="6" y1="0.8" x2="16" y2="0.8" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="16" y1="0.8" x2="16" y2="10.8" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg> },
  { id: "sphere", label: "Sphere", group: "Objects",
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><ellipse cx="8" cy="8" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/><line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="0.7" opacity="0.4"/></svg> },
  { id: "move", label: "Move", group: "Actions",
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12M8 2L6 4M8 2l2 2M8 14l-2-2M8 14l2-2M2 8l2-2M2 8l2 2M14 8l-2-2M14 8l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id: "rotate", label: "Rotate", group: "Actions",
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 1l2.5 2L8 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: "disperse", label: "Disperse", group: "Actions",
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="3" cy="3" r="1" fill="currentColor" opacity="0.6"/><circle cx="13" cy="3" r="1" fill="currentColor" opacity="0.6"/><circle cx="3" cy="13" r="1" fill="currentColor" opacity="0.6"/><circle cx="13" cy="13" r="1" fill="currentColor" opacity="0.6"/><line x1="8" y1="8" x2="3" y2="3" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/><line x1="8" y1="8" x2="13" y2="3" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/><line x1="8" y1="8" x2="3" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/><line x1="8" y1="8" x2="13" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/></svg> },
];

export default function Toolbox({ onToolSelect }) {
  const [active, setActive] = useState("cube");
  const groups = [...new Set(tools.map((t) => t.group))];

  function select(id) {
    setActive(id);
    onToolSelect?.(id);
  }

  return (
    <div style={styles.box} className="panel">
      {groups.map((group) => (
        <div key={group}>
          <div className="section-label">{group}</div>
          {tools.filter((t) => t.group === group).map((tool) => {
            const isActive = active === tool.id;
            return (
              <button key={tool.id} onClick={() => select(tool.id)}
                style={{ ...styles.btn, ...(isActive ? styles.btnActive : {}) }}>
                <span style={{ color: isActive ? "var(--cyan)" : "var(--text-secondary)" }}>
                  {tool.icon}
                </span>
                {tool.label}
              </button>
            );
          })}
          <div style={{ height: 8 }} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  box: {
    position: "absolute", top: 82, left: 14, width: 168,
    padding: "14px 12px 8px",
    background: "rgba(8,15,30,0.88)",
    border: "1px solid rgba(0,200,255,0.14)",
    borderRadius: 12, backdropFilter: "blur(14px)", zIndex: 20,
  },
  btn: {
    width: "100%", padding: "9px 12px", marginBottom: 5, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600,
    cursor: "pointer", textAlign: "left",
    display: "flex", alignItems: "center", gap: 9, transition: "all 0.15s ease",
  },
  btnActive: {
    background: "rgba(0,200,255,0.1)",
    border: "1px solid rgba(0,200,255,0.3)",
    color: "var(--cyan)",
  },
};