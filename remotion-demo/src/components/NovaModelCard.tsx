import React from "react";
import { interpolate } from "remotion";
import { COLORS } from "../constants";

type NovaModelCardProps = {
  model: string;
  capability: string;
  useCase: string;
  color: string;
  icon: string;
  frame: number;
  delay: number;
};

export const NovaModelCard: React.FC<NovaModelCardProps> = ({
  model,
  capability,
  useCase,
  color,
  icon,
  frame,
  delay,
}) => {
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(localFrame, [0, 20], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        backgroundColor: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}40`,
        borderRadius: 16,
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
        boxShadow: `0 0 30px ${color}15`,
      }}
    >
      {/* Icon + model name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: `${color}20`,
            border: `1px solid ${color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              color: COLORS.white,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Amazon Nova
          </div>
          <div
            style={{
              color,
              fontSize: 17,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {model}
          </div>
        </div>
      </div>

      {/* Capability badge */}
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "4px 10px",
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 6,
          color,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}
      >
        {capability}
      </div>

      {/* Use case */}
      <div
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {useCase}
      </div>
    </div>
  );
};
