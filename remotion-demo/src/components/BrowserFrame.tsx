import React from "react";
import { COLORS } from "../constants";

type BrowserFrameProps = {
  children: React.ReactNode;
  url?: string;
  width?: number;
  height?: number;
};

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  url = "app.fieldlens.ai",
  width = 1200,
  height = 720,
}) => {
  const toolbarHeight = 48;
  const borderRadius = 12;

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        border: `1px solid rgba(255,255,255,0.12)`,
        backgroundColor: "#0a0f1a",
        overflow: "hidden",
        boxShadow:
          "0 0 60px rgba(0,212,255,0.1), 0 40px 100px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          height: toolbarHeight,
          backgroundColor: "#0f1520",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Traffic lights */}
        {["#FF5F57", "#FFBD2E", "#28CA41"].map((c, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: c,
              opacity: 0.8,
            }}
          />
        ))}

        {/* Address bar */}
        <div
          style={{
            flex: 1,
            margin: "0 16px",
            height: 28,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
          }}
        >
          {/* Lock icon */}
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path
              d="M8 5H7V3.5C7 2.12 5.88 1 4.5 1C3.12 1 2 2.12 2 3.5V5H1C0.45 5 0 5.45 0 6V11C0 11.55 0.45 12 1 12H8C8.55 12 9 11.55 9 11V6C9 5.45 8.55 5 8 5ZM4.5 9C3.95 9 3.5 8.55 3.5 8C3.5 7.45 3.95 7 4.5 7C5.05 7 5.5 7.45 5.5 8C5.5 8.55 5.05 9 4.5 9ZM6 5H3V3.5C3 2.67 3.67 2 4.5 2C5.33 2 6 2.67 6 3.5V5Z"
              fill="#22C55E"
            />
          </svg>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {url}
          </span>
        </div>

        {/* AWS badge */}
        <div
          style={{
            padding: "4px 10px",
            backgroundColor: "rgba(255,153,0,0.15)",
            border: "1px solid rgba(255,153,0,0.3)",
            borderRadius: 4,
            color: COLORS.awsOrange,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          LIVE
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};
