import { useEffect, useRef } from "react";
import { initScene, disposeScene } from "../engine/threeScene";

export default function Scene() {
  const ref = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!ref.current || initialized.current) return;
    initialized.current = true;
    const cleanup = initScene(ref.current);
    return () => {
      initialized.current = false;
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return <div ref={ref} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}