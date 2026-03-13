import type { InspectionSummary } from "@fieldlens/shared";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusChip } from "../../components/StatusChip";

export function HistoryScreen({
  inspections,
  onOpenInspection,
}: {
  inspections: InspectionSummary[];
  onOpenInspection: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={{ gap: 12 }}>
      <Text style={{ color: "#f7f0df", fontSize: 28, fontWeight: "700" }}>History</Text>
      {inspections.map((inspection) => (
        <Pressable key={inspection.id} onPress={() => onOpenInspection(inspection.id)} style={cardStyle}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#f7f0df", fontWeight: "700", fontSize: 16 }}>{inspection.siteName}</Text>
            <StatusChip label={inspection.overallStatus ?? inspection.status} />
          </View>
          <Text style={{ color: "#cdbfa5", marginTop: 8 }}>{inspection.summary ?? "Awaiting report."}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const cardStyle = {
  padding: 18,
  borderRadius: 18,
  backgroundColor: "rgba(248,242,230,0.05)",
  borderWidth: 1,
  borderColor: "rgba(248,242,230,0.12)",
} as const;

