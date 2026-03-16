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

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const linksOpacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dividerWidth = interpolate(frame, [60, 100], [0, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-closing.mp3")} />
      <BackgroundGrid />

      {/* Radial glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 900px 500px at 50% 50%, rgba(255,153,0,0.10) 0%, transparent 70%)",
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
        {/* Powered by */}
        <div
          style={{
            opacity: logoOpacity,
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginBottom: 16,
          }}
        >
          Powered by
        </div>

        {/* Amazon Nova */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          <GlowText size={80} color={COLORS.awsOrange}>
            Amazon Nova
          </GlowText>
        </div>

        {/* Field + Lens */}
        <div
          style={{
            opacity: taglineOpacity,
            marginTop: 8,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.white,
            }}
          >
            Field
          </span>
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.awsOrange,
            }}
          >
            Lens
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.awsOrange}, transparent)`,
            marginTop: 28,
            marginBottom: 28,
          }}
        />

        {/* Hackathon badge */}
        <div
          style={{
            opacity: badgeOpacity,
            padding: "14px 32px",
            border: `1px solid ${COLORS.awsOrange}50`,
            borderRadius: 12,
            backgroundColor: "rgba(255,153,0,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: COLORS.awsOrange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🏆
          </div>
          <div>
            <div
              style={{
                color: COLORS.awsOrange,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              AWS Nova AI Hackathon 2026
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              Built with Amazon Bedrock · Nova 2 Lite · Nova 2 Sonic · Nova Embeddings
            </div>
          </div>
        </div>

        {/* Nova model pills */}
        <div
          style={{
            opacity: linksOpacity,
            display: "flex",
            gap: 12,
          }}
        >
          {[
            { name: "Nova 2 Lite", color: COLORS.awsOrange },
            { name: "Nova 2 Sonic", color: COLORS.electricBlue },
            { name: "Nova Embeddings", color: COLORS.mobileBlue },
          ].map((m) => (
            <div
              key={m.name}
              style={{
                padding: "8px 16px",
                border: `1px solid ${m.color}40`,
                borderRadius: 8,
                backgroundColor: `${m.color}10`,
                color: m.color,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {m.name}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
