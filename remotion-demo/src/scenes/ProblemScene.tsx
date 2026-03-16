import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { COLORS } from "../constants";

const PROBLEMS = [
  "Manual paper forms → transcription errors & lost data",
  "Photos stored in personal phones, not linked to reports",
  "Voice notes never make it into official documentation",
  "Days to generate final PDF report from field notes",
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-problem.mp3")} />
      <BackgroundGrid />

      {/* Left red glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 600px 500px at 20% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0 120px",
          gap: 80,
        }}
      >
        {/* Left: stat */}
        <div
          style={{
            opacity: headingOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 380,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: COLORS.awsOrange,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              marginBottom: 12,
            }}
          >
            Current Reality
          </div>

          <div
            style={{
              transform: `scale(${statScale})`,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <AnimatedCounter
              from={0}
              to={4}
              frame={frame}
              startFrame={30}
              endFrame={90}
              suffix="+"
              style={{
                fontSize: 140,
                fontWeight: 900,
                color: "#EF4444",
                lineHeight: 1,
                textShadow: "0 0 60px rgba(239,68,68,0.4)",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
              marginTop: -8,
              lineHeight: 1.4,
            }}
          >
            hours per inspection
          </div>

          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.35)",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            documentation & reporting time
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 32,
              width: 320,
              height: 6,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${interpolate(frame, [60, 150], [0, 100], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}%`,
                background: "linear-gradient(90deg, #EF4444, #FF9900)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 400,
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />

        {/* Right: problem list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 13,
              color: COLORS.awsOrange,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              marginBottom: 8,
            }}
          >
            Pain Points
          </div>

          {PROBLEMS.map((problem, i) => {
            const itemOpacity = interpolate(
              frame,
              [60 + i * 30, 80 + i * 30],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const itemX = interpolate(
              frame,
              [60 + i * 30, 80 + i * 30],
              [-30, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "16px 20px",
                  backgroundColor: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#EF4444",
                    marginTop: 6,
                    flexShrink: 0,
                    boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 18,
                    lineHeight: 1.5,
                  }}
                >
                  {problem}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
