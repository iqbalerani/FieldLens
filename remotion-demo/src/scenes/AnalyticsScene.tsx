import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { COLORS } from "../constants";

const STATS = [
  {
    value: 47,
    label: "Nova Invocations",
    suffix: "",
    color: COLORS.awsOrange,
    delay: 80,
  },
  {
    value: 3,
    label: "Model Types",
    suffix: "",
    color: COLORS.electricBlue,
    delay: 120,
  },
  {
    value: 100,
    label: "via Amazon Bedrock",
    suffix: "%",
    color: COLORS.mobileBlue,
    delay: 160,
  },
];

export const AnalyticsScene: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imgOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arrow animation
  const arrowProgress = interpolate(frame, [100, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arrowLength = 80;
  const arrowDashOffset = arrowLength * (1 - arrowProgress);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-analytics.mp3")} />
      <BackgroundGrid />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 700px 400px at 50% 40%, rgba(255,153,0,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 80px",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            opacity: headerOpacity,
            fontSize: 13,
            color: COLORS.awsOrange,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginBottom: 8,
          }}
        >
          Proof of Work
        </div>

        <div
          style={{
            opacity: headerOpacity,
            fontSize: 36,
            fontWeight: 800,
            color: COLORS.white,
            marginBottom: 32,
          }}
        >
          Real Nova Model Invocations
        </div>

        {/* Main content: image + stat boxes */}
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "center",
            width: "100%",
            flex: 1,
          }}
        >
          {/* Analytics image */}
          <div
            style={{
              opacity: imgOpacity,
              flex: 1,
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: `0 0 60px rgba(255,153,0,0.1)`,
            }}
          >
            <Img
              src={staticFile("Nova Model Innovocation.png")}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />

            {/* Overlay glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,153,0,0.03) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            {/* SVG callout arrows */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
              viewBox="0 0 600 400"
              preserveAspectRatio="none"
            >
              <line
                x1="150"
                y1="80"
                x2="30"
                y2="30"
                stroke={COLORS.awsOrange}
                strokeWidth="2"
                strokeDasharray={arrowLength}
                strokeDashoffset={arrowDashOffset}
                markerEnd="url(#arrowhead)"
              />
              <line
                x1="300"
                y1="200"
                x2="570"
                y2="160"
                stroke={COLORS.electricBlue}
                strokeWidth="2"
                strokeDasharray={arrowLength}
                strokeDashoffset={arrowDashOffset}
                markerEnd="url(#arrowhead2)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill={COLORS.awsOrange}
                  />
                </marker>
                <marker
                  id="arrowhead2"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill={COLORS.electricBlue}
                  />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Stat boxes */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 260,
            }}
          >
            {STATS.map((stat) => {
              const statOpacity = interpolate(
                frame,
                [stat.delay, stat.delay + 25],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const statX = interpolate(
                frame,
                [stat.delay, stat.delay + 25],
                [40, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              return (
                <div
                  key={stat.label}
                  style={{
                    opacity: statOpacity,
                    transform: `translateX(${statX}px)`,
                    padding: "20px 24px",
                    border: `1px solid ${stat.color}30`,
                    borderRadius: 14,
                    backgroundColor: `${stat.color}08`,
                    boxShadow: `0 0 30px ${stat.color}10`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <AnimatedCounter
                      from={0}
                      to={stat.value}
                      frame={frame}
                      startFrame={stat.delay}
                      endFrame={stat.delay + 60}
                      suffix={stat.suffix}
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: stat.color,
                        lineHeight: 1,
                        textShadow: `0 0 30px ${stat.color}60`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: "rgba(255,255,255,0.55)",
                      marginTop: 4,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
