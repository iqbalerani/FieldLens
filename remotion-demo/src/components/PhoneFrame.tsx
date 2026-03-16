import React from "react";
import { COLORS } from "../constants";

type PhoneFrameProps = {
  children: React.ReactNode;
  width?: number;
  height?: number;
};

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  width = 360,
  height = 720,
}) => {
  const borderRadius = 50;
  const borderWidth = 3;
  const notchWidth = 120;
  const notchHeight = 28;
  const homeIndicatorWidth = 100;

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        border: `${borderWidth}px solid #2a2520`,
        backgroundColor: "#0d0b09",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 0 60px rgba(14,165,233,0.15), 0 30px 80px rgba(0,0,0,0.8)",
        flexShrink: 0,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: notchWidth,
          height: notchHeight,
          backgroundColor: "#0d0b09",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          zIndex: 10,
        }}
      />

      {/* Screen content */}
      <div
        style={{
          position: "absolute",
          top: notchHeight,
          left: 0,
          right: 0,
          bottom: 30,
          overflow: "hidden",
          borderRadius: `0 0 ${borderRadius - borderWidth}px ${
            borderRadius - borderWidth
          }px`,
        }}
      >
        {children}
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: homeIndicatorWidth,
          height: 5,
          backgroundColor: "rgba(255,255,255,0.3)",
          borderRadius: 3,
        }}
      />

      {/* Subtle screen reflection */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "30%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
          borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Side buttons left */}
      <div
        style={{
          position: "absolute",
          left: -borderWidth - 4,
          top: "25%",
          width: 4,
          height: 40,
          backgroundColor: "#1a1614",
          borderRadius: "2px 0 0 2px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -borderWidth - 4,
          top: "35%",
          width: 4,
          height: 40,
          backgroundColor: "#1a1614",
          borderRadius: "2px 0 0 2px",
        }}
      />

      {/* Power button right */}
      <div
        style={{
          position: "absolute",
          right: -borderWidth - 4,
          top: "28%",
          width: 4,
          height: 60,
          backgroundColor: "#1a1614",
          borderRadius: "0 2px 2px 0",
        }}
      />

      {/* Orange accent glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          border: "1px solid rgba(255,153,0,0.15)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />
    </div>
  );
};
