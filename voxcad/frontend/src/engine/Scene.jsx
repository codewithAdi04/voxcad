import { useEffect, useRef } from "react";
import { initScene } from "./threeScene";

export default function Scene() {
  const ref = useRef();

  useEffect(() => {
    initScene(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 0,
      }}
    />
  );
}