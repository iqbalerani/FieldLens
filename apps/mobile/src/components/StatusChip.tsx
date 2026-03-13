import { Text, View } from "react-native";

export function StatusChip({ label }: { label: string }) {
  const normalized = label.toUpperCase();
  const backgroundColor =
    normalized === "FAIL" || normalized === "CRITICAL"
      ? "rgba(239, 106, 91, 0.15)"
      : normalized === "WARN" || normalized === "WARNING" || normalized === "PROCESSING"
        ? "rgba(246, 178, 75, 0.15)"
        : "rgba(125, 207, 155, 0.15)";
  const color =
    normalized === "FAIL" || normalized === "CRITICAL"
      ? "#ef6a5b"
      : normalized === "WARN" || normalized === "WARNING" || normalized === "PROCESSING"
        ? "#f6b24b"
        : "#7dcf9b";
  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{normalized}</Text>
    </View>
  );
}

