import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { COLORS } from "../constants";

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const diagramOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-architecture.mp3")} />
      <BackgroundGrid />

      {/* Subtle center glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 1000px 500px at 50% 55%, rgba(255,153,0,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          opacity: titleOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: COLORS.awsOrange,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}
        >
          System Architecture
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: COLORS.white,
          }}
        >
          FieldLens — Powered by Amazon Nova
        </div>
      </div>

      {/* Diagram centered */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 80,
          opacity: diagramOpacity,
        }}
      >
        <ArchitectureDiagram frame={frame} />
      </AbsoluteFill>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 60,
          display: "flex",
          gap: 20,
          opacity: interpolate(frame, [60, 90], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {[
          { color: COLORS.mobileBlue, label: "Mobile" },
          { color: COLORS.backendGreen, label: "Backend" },
          { color: COLORS.webOrange, label: "Web" },
          { color: COLORS.awsOrange, label: "Nova AI" },
          { color: COLORS.infraPurple, label: "Infrastructure" },
        ].map(({ color, label }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
