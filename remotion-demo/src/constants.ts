export const COLORS = {
  bg: "#060B14",
  awsOrange: "#FF9900",
  mobileBlue: "#0EA5E9",
  backendGreen: "#22C55E",
  webOrange: "#F97316",
  infraPurple: "#A78BFA",
  electricBlue: "#00D4FF",
  white: "#FFFFFF",
  dimWhite: "rgba(255,255,255,0.7)",
  cardBg: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.1)",
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene durations in frames
export const SCENE_DURATIONS = {
  title: 150,
  problem: 300,
  solution: 300,
  mobileDemo: 1650,
  architecture: 1200,
  analytics: 750,
  webDemo: 1200,
  walkthrough: 2700,
  closing: 450,
};

export const TOTAL_FRAMES = Object.values(SCENE_DURATIONS).reduce(
  (a, b) => a + b,
  0
); // 8700
