import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { COLORS } from "../constants";
import walkthroughAudioConfig from "../walkthrough-audio.json";

export const WalkthroughScene: React.FC = () => {
  const frame = useCurrentFrame();
  const walkthroughMediaSrc = staticFile(walkthroughAudioConfig.sourceFile);

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out last 30 frames (2700 total)
  const fadeOut = interpolate(frame, [2670, 2700], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(fadeIn, fadeOut);

  // Audio volume callback mirrors the visual fade so audio fades in/out with the video
  const volumeCallback = (f: number) => {
    const vIn = interpolate(f, [0, 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const vOut = interpolate(f, [2670, 2700], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return Math.min(vIn, vOut);
  };

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <BackgroundGrid />

      <AbsoluteFill style={{ opacity }}>
        {/* Video frames via FFmpeg — reliable across all codecs */}
        <OffthreadVideo
          src={walkthroughMediaSrc}
          trimBefore={walkthroughAudioConfig.trimBeforeInFrames}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          muted
        />
        {/* Narration voiceover overlay */}
        <Audio
          src={staticFile("audio/fieldlens-demo-walkthrough.mp3")}
          volume={volumeCallback}
        />

        {/* Dark top overlay for header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Header label */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 40,
            opacity: headerOpacity,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "4px 12px",
              backgroundColor: "rgba(255,153,0,0.2)",
              border: `1px solid ${COLORS.awsOrange}50`,
              borderRadius: 6,
              color: COLORS.awsOrange,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            LIVE DEMO
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Full walkthrough — FieldLens in action
          </span>
        </div>

        {/* Bottom gradient bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${COLORS.awsOrange}, ${COLORS.electricBlue})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
