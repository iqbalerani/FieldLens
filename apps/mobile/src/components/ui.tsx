import type { ReactNode } from "react";
import type {
  PressableProps,
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../theme";

const toneStyles = StyleSheet.create({
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
  },
  strong: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
  },
  accent: {
    backgroundColor: theme.colors.accentSurface,
    borderColor: theme.colors.accentBorder,
  },
  danger: {
    backgroundColor: theme.colors.destructiveSurface,
    borderColor: theme.colors.destructiveBorder,
  },
});

type Tone = keyof typeof toneStyles;

export function TitleBlock({
  eyebrow,
  title,
  description,
  hero = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  hero?: boolean;
}) {
  return (
    <View style={styles.titleBlock}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={hero ? styles.heroTitle : styles.title}>{title}</Text>
      {description ? <Text style={[styles.bodyText, styles.textSecondary]}>{description}</Text> : null}
    </View>
  );
}

export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function BodyText({
  children,
  tone = "secondary",
  style,
}: {
  children: ReactNode;
  tone?: "primary" | "secondary" | "muted" | "dim";
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        styles.bodyText,
        tone === "primary"
          ? styles.textPrimary
          : tone === "muted"
            ? styles.textMuted
            : tone === "dim"
              ? styles.textDim
              : styles.textSecondary,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  tone = "default",
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, toneStyles[tone], style]}>{children}</View>;
}

export function PressableCard({
  children,
  tone = "default",
  style,
  ...props
}: PressableProps & {
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.card,
        toneStyles[tone],
        styles.interactiveCard,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  style,
  textStyle,
  ...props
}: PressableProps & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        variant === "primary"
          ? styles.buttonPrimary
          : variant === "danger"
            ? styles.buttonDanger
            : styles.buttonSecondary,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function FieldInput({ style, placeholderTextColor, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={placeholderTextColor ?? theme.colors.textDim}
      selectionColor={theme.colors.accent}
      style={[styles.input, style]}
    />
  );
}

export function SelectionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.accentStrong,
    ...theme.typography.eyebrow,
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    ...theme.typography.hero,
  },
  title: {
    color: theme.colors.textPrimary,
    ...theme.typography.title,
  },
  sectionLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.label,
  },
  bodyText: {
    ...theme.typography.body,
  },
  textPrimary: {
    color: theme.colors.textPrimary,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
  },
  textMuted: {
    color: theme.colors.textMuted,
  },
  textDim: {
    color: theme.colors.textDim,
  },
  card: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
  },
  interactiveCard: {
    minHeight: 116,
    justifyContent: "center",
  },
  button: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accentStrong,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
  },
  buttonDanger: {
    backgroundColor: theme.colors.destructiveSurface,
    borderColor: theme.colors.destructiveBorder,
  },
  buttonText: {
    ...theme.typography.button,
  },
  buttonTextPrimary: {
    color: theme.colors.accentText,
  },
  buttonTextSecondary: {
    color: theme.colors.textPrimary,
  },
  input: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundInset,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    ...theme.typography.input,
  },
  chip: {
    minHeight: 44,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accentStrong,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.borderSoft,
  },
  chipText: {
    ...theme.typography.label,
  },
  chipTextSelected: {
    color: theme.colors.accentText,
  },
  chipTextUnselected: {
    color: theme.colors.textSecondary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
