import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { TitleScene } from "./TitleScene";
import { ProblemScene } from "./ProblemScene";
import { SolutionScene } from "./SolutionScene";
import { MobileDemo } from "./MobileDemo";
import { ArchitectureScene } from "./ArchitectureScene";
import { AnalyticsScene } from "./AnalyticsScene";
import { WebDemoScene } from "./WebDemoScene";
import { WalkthroughScene } from "./WalkthroughScene";
import { ClosingScene } from "./ClosingScene";
import { SCENE_DURATIONS } from "../constants";

export const FieldLensDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.problem}>
          <ProblemScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.solution}>
          <SolutionScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.mobileDemo}>
          <MobileDemo />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.architecture}>
          <ArchitectureScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.analytics}>
          <AnalyticsScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.webDemo}>
          <WebDemoScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.walkthrough} premountFor={90}>
          <WalkthroughScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.closing}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
