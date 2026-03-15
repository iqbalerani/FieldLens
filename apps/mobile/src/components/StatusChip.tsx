import { StyleSheet, Text, View } from "react-native";
import { getStatusTone, theme } from "../theme";

export function StatusChip({ label }: { label: string }) {
  const normalized = label.toUpperCase();
  const tone = getStatusTone(normalized);

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: tone.backgroundColor,
          borderColor: tone.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: tone.textColor }]}>{normalized}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: theme.colors.textPrimary,
    ...theme.typography.caption,
  },
});
