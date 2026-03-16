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
import { BrowserFrame } from "../components/BrowserFrame";
import { COLORS } from "../constants";

const WEB_SLIDES = [
  {
    file: "Web Dashboard Overview.png",
    label: "Dashboard Overview",
    description: "Real-time inspection feed with live status updates via WebSocket",
    step: "01",
  },
  {
    file: "Web Inspections.png",
    label: "Inspections List",
    description: "Filterable list of all inspections — search by site, status, or date range",
    step: "02",
  },
  {
    file: "Web Analytics.png",
    label: "Analytics & Insights",
    description: "Nova-powered analytics — defect trends, inspector performance, and compliance tracking",
    step: "03",
  },
];

const FRAMES_PER_SLIDE = 400;

export const WebDemoScene: React.FC = () => {
  const frame = useCurrentFrame();

  const currentIndex = Math.min(Math.floor(frame / FRAMES_PER_SLIDE), 2);
  const slideLocalFrame = frame - currentIndex * FRAMES_PER_SLIDE;

  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Audio src={staticFile("audio/fieldlens-demo-web-demo.mp3")} />
      <BackgroundGrid />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 800px 500px at 50% 50%, rgba(249,115,22,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "40px 80px",
          gap: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: sceneOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: COLORS.awsOrange,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "monospace",
                marginBottom: 4,
              }}
            >
              Web Dashboard · Step {String(currentIndex + 1).padStart(2, "0")} / 03
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.white }}>
              {WEB_SLIDES[currentIndex].label}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                marginTop: 4,
              }}
            >
              {WEB_SLIDES[currentIndex].description}
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 8 }}>
            {WEB_SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIndex ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === currentIndex
                      ? COLORS.webOrange
                      : i < currentIndex
                      ? "rgba(249,115,22,0.4)"
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Browser frame */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(slideLocalFrame, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(slideLocalFrame, [0, 20], [0.97, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
          }}
        >
          <BrowserFrame
            url="fieldlensweb-production.up.railway.app"
            width={1600}
            height={800}
          >
            <Img
              src={staticFile(WEB_SLIDES[currentIndex].file)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </BrowserFrame>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
