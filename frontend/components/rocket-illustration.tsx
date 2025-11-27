"use client";

import { useEffect, useState } from "react";

export function RocketIllustration() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in after mount
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <img
      className="am-rocket-illustration"
      height={425}
      width={500}
      src="/hero-animation_files/66e47654be5d3e3979ea567e_rocket-illustration-updated.avif"
      alt="Rocket illustration"
      style={{
        border: "0px",
        maxWidth: "100%",
        transition: "transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 1s cubic-bezier(0.23, 1, 0.32, 1)",
        zIndex: 1,
        position: "absolute",
        width: "30.19%",
        top: "16.1%",
        right: "-7.2%",
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "scale3d(1, 1, 1) translate3d(0, 0, 0)"
          : "scale3d(0.95, 0.95, 1) translate3d(2vw, 2vh, 0)",
      }}
    />
  );
}

export default RocketIllustration;

