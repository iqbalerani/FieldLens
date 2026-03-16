import React from "react";
import { COLORS } from "../constants";

type GlowTextProps = {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
};

export const GlowText: React.FC<GlowTextProps> = ({
  children,
  color = COLORS.awsOrange,
  size = 72,
  style,
}) => {
  return (
    <span
      style={{
        color,
        fontSize: size,
        fontWeight: 800,
        textShadow: `0 0 40px ${color}80, 0 0 80px ${color}40`,
        letterSpacing: "-0.02em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
