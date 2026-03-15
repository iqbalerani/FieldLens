export const theme = {
  colors: {
    background: "#0d0b09",
    backgroundRaised: "#17120f",
    backgroundInset: "#221912",
    chrome: "#120f0c",
    surface: "#1a1511",
    surfaceStrong: "#241b14",
    surfaceMuted: "#2c2118",
    border: "#433326",
    borderSoft: "#34281f",
    textPrimary: "#f7efe2",
    textSecondary: "#dfceb7",
    textMuted: "#c2ab8c",
    textDim: "#9b8263",
    accent: "#f3a33c",
    accentStrong: "#ffbe5c",
    accentSurface: "rgba(243, 163, 60, 0.16)",
    accentBorder: "rgba(243, 163, 60, 0.42)",
    accentText: "#271507",
    destructive: "#ff9a80",
    destructiveSurface: "rgba(255, 154, 128, 0.16)",
    destructiveBorder: "rgba(255, 154, 128, 0.34)",
    success: "#8fdbab",
    successSurface: "rgba(143, 219, 171, 0.16)",
    successBorder: "rgba(143, 219, 171, 0.32)",
    warning: "#f4c66c",
    warningSurface: "rgba(244, 198, 108, 0.16)",
    warningBorder: "rgba(244, 198, 108, 0.34)",
    overlay: "rgba(10, 7, 5, 0.72)",
  },
  spacing: {
    xxxs: 4,
    xxs: 6,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 30,
    pill: 999,
  },
  typography: {
    eyebrow: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "800" as const,
      letterSpacing: 2.2,
    },
    hero: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "800" as const,
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "800" as const,
    },
    sectionTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700" as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    secondary: {
      fontSize: 15,
      lineHeight: 22,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
    },
    input: {
      fontSize: 16,
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "800" as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
  },
  layout: {
    horizontalPadding: 20,
    compactHorizontalPadding: 16,
    maxContentWidth: 720,
    tabBarHeight: 76,
  },
};

type StatusTone = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export function getStatusTone(label: string): StatusTone {
  const normalized = label.toUpperCase();

  if (["FAIL", "FAILED", "CRITICAL", "ERROR"].includes(normalized)) {
    return {
      backgroundColor: theme.colors.destructiveSurface,
      borderColor: theme.colors.destructiveBorder,
      textColor: theme.colors.destructive,
    };
  }

  if (["WARN", "WARNING", "PROCESSING", "PENDING", "SUBMITTED"].includes(normalized)) {
    return {
      backgroundColor: theme.colors.warningSurface,
      borderColor: theme.colors.warningBorder,
      textColor: theme.colors.warning,
    };
  }

  if (["PASS", "COMPLETE", "COMPLETED", "SYNCED", "SUCCESS"].includes(normalized)) {
    return {
      backgroundColor: theme.colors.successSurface,
      borderColor: theme.colors.successBorder,
      textColor: theme.colors.success,
    };
  }

  return {
    backgroundColor: theme.colors.accentSurface,
    borderColor: theme.colors.accentBorder,
    textColor: theme.colors.accentStrong,
  };
}
