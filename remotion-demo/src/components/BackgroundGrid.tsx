import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../constants";

export const BackgroundGrid: React.FC = () => {
  const dotSize = 1;
  const spacing = 40;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
      }}
    />
  );
};
