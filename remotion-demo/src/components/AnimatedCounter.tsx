import React from "react";
import { interpolate } from "remotion";

type AnimatedCounterProps = {
  from: number;
  to: number;
  frame: number;
  startFrame: number;
  endFrame: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from,
  to,
  frame,
  startFrame,
  endFrame,
  prefix = "",
  suffix = "",
  decimals = 0,
  style,
}) => {
  const value = interpolate(frame, [startFrame, endFrame], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span style={style}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};
