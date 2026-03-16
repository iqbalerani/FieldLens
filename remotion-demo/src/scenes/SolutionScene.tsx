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
import { NovaModelCard } from "../components/NovaModelCard";
import { COLORS } from "../constants";

const NOVA_CARDS = [
  {
    model: "2 Lite",
    capability: "Multimodal Reasoning",
    useCase:
      "Analyzes photos, forms, and notes to auto-generate structured inspection reports",
    color: COLORS.awsOrange,
    icon: "🧠",
    delay: 80,
  },
  {
    model: "2 Sonic",
    capability: "Voice-to-Text",
    useCase:
      "Real-time transcription of inspector voice walkthroughs into detailed field notes",
    color: COLORS.electricBlue,
    icon: "🎙️",
    delay: 110,
  },
  {
    model: "Embeddings",
    capability: "Semantic Search",
    useCase:
      "Nova Multimodal Embeddings enable natural-language search across all inspection data",
    color: COLORS.mobileBlue,
    icon: "🔍",
    delay: 140,
  },
];

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-solution.mp3")} />
      <BackgroundGrid />

      {/* Green glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 800px 600px at 50% 30%, rgba(34,197,94,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 100px 50px",
          gap: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headingOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
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
            }}
          >
            The FieldLens Solution
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              transform: `scale(${statScale})`,
            }}
          >
            <span
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: "#22C55E",
                textShadow: "0 0 60px rgba(34,197,94,0.4)",
                lineHeight: 1,
              }}
            >
              Under 5
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              minutes
            </span>
          </div>

          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            from field inspection to AI-generated report
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: interpolate(frame, [40, 80], [0, 700], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.awsOrange}, transparent)`,
            marginBottom: 32,
          }}
        />

        {/* Nova model cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
            width: "100%",
          }}
        >
          {NOVA_CARDS.map((card) => (
            <NovaModelCard key={card.model} {...card} frame={frame} />
          ))}
        </div>

        {/* Powered by Amazon Bedrock */}
        <div
          style={{
            opacity: interpolate(frame, [180, 220], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            marginTop: 28,
            padding: "10px 24px",
            border: `1px solid ${COLORS.awsOrange}30`,
            borderRadius: 8,
            backgroundColor: "rgba(255,153,0,0.06)",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
            }}
          >
            All models accessed via{" "}
            <span style={{ color: COLORS.awsOrange, fontWeight: 700 }}>
              Amazon Bedrock
            </span>{" "}
            · Zero infrastructure management
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
