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
import { PhoneFrame } from "../components/PhoneFrame";
import { COLORS } from "../constants";

const SLIDES = [
  {
    file: "Site Basics.jpeg",
    label: "Site Information Entry",
    step: "01",
    description: "Inspector fills in site details — location, client, date, and project ID",
  },
  {
    file: "Photo Evidence.jpeg",
    label: "Photo Evidence Capture",
    step: "02",
    description: "Nova 2 Lite analyzes captured photos and auto-tags defects and materials",
  },
  {
    file: "Voice Walkthorough.jpeg",
    label: "Voice Walkthrough — Nova 2 Sonic",
    step: "03",
    description: "Real-time voice transcription converts spoken observations into structured notes",
  },
  {
    file: "Additional Notes.jpeg",
    label: "Additional Notes",
    step: "04",
    description: "Supplementary text notes and annotations added to the inspection record",
  },
  {
    file: "Review and Submit.jpeg",
    label: "Review & Submit",
    step: "05",
    description: "Inspector reviews AI-assembled report before final submission",
  },
  {
    file: "Inpection report submission.jpeg",
    label: "Submitting to Nova AI...",
    step: "06",
    description: "Data package sent to Amazon Bedrock — Nova 2 Lite generates the full report",
  },
  {
    file: "Inspection Detail.jpeg",
    label: "AI-Generated Report — Nova 2 Lite",
    step: "07",
    description: "Complete structured inspection report with findings, photos, and recommendations",
  },
];

const FRAMES_PER_SLIDE = 235;

export const MobileDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const currentIndex = Math.min(Math.floor(frame / FRAMES_PER_SLIDE), 6);
  const slideLocalFrame = frame - currentIndex * FRAMES_PER_SLIDE;

  const SLIDE_IN = 20;
  const SLIDE_OUT = 20;
  const TOTAL = FRAMES_PER_SLIDE;

  // Title opacity
  const sceneOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-mobile-demo.mp3")} />
      <BackgroundGrid />

      {/* Blue glow behind phone */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 500px 600px at 50% 55%, rgba(14,165,233,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0 100px",
          gap: 80,
        }}
      >
        {/* Left: phone */}
        <div
          style={{
            opacity: sceneOpacity,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <PhoneFrame width={340} height={700}>
            {SLIDES.map((slide, i) => {
              const isActive = i === currentIndex;
              if (!isActive) return null;

              const slideIn = interpolate(slideLocalFrame, [0, SLIDE_IN], [100, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const slideOut = interpolate(
                slideLocalFrame,
                [TOTAL - SLIDE_OUT, TOTAL],
                [0, -100],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const isSliding =
                slideLocalFrame < SLIDE_IN
                  ? slideIn
                  : slideLocalFrame > TOTAL - SLIDE_OUT
                  ? slideOut
                  : 0;

              return (
                <div
                  key={slide.file}
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateX(${isSliding}%)`,
                  }}
                >
                  <Img
                    src={staticFile(slide.file)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              );
            })}
          </PhoneFrame>
        </div>

        {/* Right: info panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Step badge */}
          <div
            style={{
              opacity: sceneOpacity,
              fontSize: 13,
              color: COLORS.awsOrange,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Mobile App · Step{" "}
            {String(currentIndex + 1).padStart(2, "0")} / 07
          </div>

          {/* Current slide title */}
          {SLIDES.map((slide, i) => {
            const isActive = i === currentIndex;
            const labelOpacity = interpolate(
              slideLocalFrame,
              [0, 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            if (!isActive) return null;
            return (
              <div key={slide.file}>
                <div
                  style={{
                    opacity: labelOpacity,
                    fontSize: 42,
                    fontWeight: 800,
                    color: COLORS.white,
                    lineHeight: 1.2,
                    marginBottom: 16,
                  }}
                >
                  {slide.label}
                </div>
                <div
                  style={{
                    opacity: labelOpacity,
                    fontSize: 18,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.6,
                    maxWidth: 480,
                  }}
                >
                  {slide.description}
                </div>
              </div>
            );
          })}

          {/* Progress dots */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 24,
              opacity: sceneOpacity,
            }}
          >
            {SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIndex ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === currentIndex
                      ? COLORS.awsOrange
                      : i < currentIndex
                      ? "rgba(255,153,0,0.4)"
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          {/* Nova badge for voice slide */}
          {currentIndex === 2 && (
            <div
              style={{
                opacity: interpolate(slideLocalFrame, [20, 40], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                marginTop: 8,
                padding: "12px 20px",
                border: `1px solid ${COLORS.electricBlue}40`,
                borderRadius: 10,
                backgroundColor: `${COLORS.electricBlue}10`,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                alignSelf: "flex-start",
              }}
            >
              <span style={{ fontSize: 20 }}>🎙️</span>
              <div>
                <div
                  style={{
                    color: COLORS.electricBlue,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Amazon Nova 2 Sonic
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  Real-time voice transcription
                </div>
              </div>
            </div>
          )}

          {/* Nova Lite badge for last slide */}
          {currentIndex === 6 && (
            <div
              style={{
                opacity: interpolate(slideLocalFrame, [20, 40], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                marginTop: 8,
                padding: "12px 20px",
                border: `1px solid ${COLORS.awsOrange}40`,
                borderRadius: 10,
                backgroundColor: `${COLORS.awsOrange}10`,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                alignSelf: "flex-start",
              }}
            >
              <span style={{ fontSize: 20 }}>🧠</span>
              <div>
                <div
                  style={{
                    color: COLORS.awsOrange,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Amazon Nova 2 Lite
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  Multimodal report generation
                </div>
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
