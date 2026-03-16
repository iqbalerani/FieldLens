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
import { GlowText } from "../components/GlowText";
import { COLORS } from "../constants";

const NOVA_MODELS = [
  { name: "Nova 2 Lite", label: "Multimodal Reasoning", color: COLORS.awsOrange },
  { name: "Nova 2 Sonic", label: "Voice-to-Text", color: COLORS.electricBlue },
  { name: "Nova Embeddings", label: "Semantic Search", color: COLORS.mobileBlue },
];

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(frame, [0, 20], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 120 } });
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dividerWidth = interpolate(frame, [50, 80], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-title.mp3")} />
      <BackgroundGrid />

      {/* Radial glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 800px 400px at 50% 45%, rgba(255,153,0,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* AWS Hackathon badge */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
            padding: "6px 18px",
            border: `1px solid ${COLORS.awsOrange}50`,
            borderRadius: 20,
            backgroundColor: "rgba(255,153,0,0.08)",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              color: COLORS.awsOrange,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            AWS Nova AI Hackathon 2026
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            display: "flex",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <GlowText size={96} color={COLORS.white}>
            Field
          </GlowText>
          <GlowText size={96} color={COLORS.awsOrange}>
            Lens
          </GlowText>
        </div>

        {/* Subtitle */}
        <div style={{ opacity: subtitleOpacity, marginTop: 8 }}>
          <span
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 24,
              fontWeight: 400,
              letterSpacing: "0.05em",
            }}
          >
            AI-Powered Field Inspection Platform
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.awsOrange}, transparent)`,
            marginTop: 32,
            marginBottom: 32,
          }}
        />

        {/* Nova model badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {NOVA_MODELS.map((m, i) => {
            const badgeOpacity = interpolate(frame, [80 + i * 12, 100 + i * 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const badgeY = interpolate(frame, [80 + i * 12, 100 + i * 12], [20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={m.name}
                style={{
                  opacity: badgeOpacity,
                  transform: `translateY(${badgeY}px)`,
                  padding: "10px 20px",
                  border: `1px solid ${m.color}40`,
                  borderRadius: 10,
                  backgroundColor: `${m.color}10`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 180,
                }}
              >
                <span
                  style={{
                    color: m.color,
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {m.name}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                  }}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
