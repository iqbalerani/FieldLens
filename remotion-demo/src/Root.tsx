import React from "react";
import { Composition } from "remotion";
import { FieldLensDemo } from "./scenes/FieldLensDemo";
import { TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FieldLensDemo"
      component={FieldLensDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
