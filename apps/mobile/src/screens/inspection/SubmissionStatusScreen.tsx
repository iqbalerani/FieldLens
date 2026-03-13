import { Pressable, Text, View } from "react-native";
import { StatusChip } from "../../components/StatusChip";

export function SubmissionStatusScreen({
  status,
  onRefresh,
  onOpenInspection,
}: {
  status: string;
  onRefresh: () => void;
  onOpenInspection: () => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: "#f7f0df", fontSize: 28, fontWeight: "700" }}>Submission status</Text>
      <View
        style={{
          padding: 20,
          borderRadius: 20,
          backgroundColor: "rgba(248,242,230,0.06)",
          borderWidth: 1,
          borderColor: "rgba(248,242,230,0.12)",
          gap: 12,
        }}
      >
        <StatusChip label={status} />
        <Text style={{ color: "#cdbfa5" }}>
          Polling keeps the MVP simple while the backend finishes AI processing in the background.
        </Text>
      </View>
      <Pressable onPress={onRefresh} style={secondaryButtonStyle}>
        <Text style={secondaryButtonTextStyle}>Refresh status</Text>
      </Pressable>
      <Pressable onPress={onOpenInspection} style={primaryButtonStyle}>
        <Text style={primaryButtonTextStyle}>Open inspection detail</Text>
      </Pressable>
    </View>
  );
}

const primaryButtonStyle = {
  backgroundColor: "#f08700",
  padding: 16,
  borderRadius: 18,
  alignItems: "center",
} as const;
const secondaryButtonStyle = {
  backgroundColor: "rgba(248,242,230,0.08)",
  padding: 14,
  borderRadius: 18,
  alignItems: "center",
} as const;
const primaryButtonTextStyle = {
  color: "#28180a",
  fontWeight: "800",
} as const;
const secondaryButtonTextStyle = {
  color: "#f7f0df",
  fontWeight: "700",
} as const;

