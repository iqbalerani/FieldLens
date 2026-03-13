import type { InspectionSummary } from "@fieldlens/shared";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusChip } from "../../components/StatusChip";

export function HomeScreen({
  inspections,
  pendingCount = 0,
  onNewInspection,
  onOpenInspection,
}: {
  inspections: InspectionSummary[];
  pendingCount?: number;
  onNewInspection: () => void;
  onOpenInspection: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={{ gap: 16 }}>
      <View style={{ gap: 10 }}>
        <Text style={{ color: "#ffcf88", textTransform: "uppercase", letterSpacing: 2.5 }}>Field operations</Text>
        <Text style={{ color: "#f7f0df", fontSize: 32, fontWeight: "700" }}>Capture quickly. Report clearly.</Text>
        <Text style={{ color: "#cdbfa5", lineHeight: 22 }}>
          Start a new inspection, monitor processing, or review recently generated findings.
        </Text>
      </View>

      {pendingCount > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 14,
            borderRadius: 16,
            backgroundColor: "rgba(240,135,0,0.12)",
            borderWidth: 1,
            borderColor: "rgba(240,135,0,0.35)",
          }}
        >
          <Text style={{ fontSize: 18 }}>📡</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#ffcf88", fontWeight: "700" }}>
              {pendingCount} inspection{pendingCount !== 1 ? "s" : ""} pending sync
            </Text>
            <Text style={{ color: "#cdbfa5", fontSize: 12, marginTop: 2 }}>
              Will upload automatically when connection is restored.
            </Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={onNewInspection}
        style={{
          backgroundColor: "#f08700",
          padding: 18,
          borderRadius: 22,
        }}
      >
        <Text style={{ color: "#28180a", fontWeight: "800", fontSize: 16 }}>New inspection</Text>
      </Pressable>

      <View style={{ gap: 12 }}>
        {inspections.map((inspection) => (
          <Pressable
            key={inspection.id}
            onPress={() => onOpenInspection(inspection.id)}
            style={{
              padding: 18,
              borderRadius: 20,
              backgroundColor: "rgba(248,242,230,0.06)",
              borderWidth: 1,
              borderColor: "rgba(248,242,230,0.12)",
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: "#cdbfa5", fontSize: 12 }}>{inspection.inspectionType}</Text>
                <Text style={{ color: "#f7f0df", fontWeight: "700", fontSize: 18 }}>{inspection.siteName}</Text>
              </View>
              <StatusChip label={inspection.overallStatus ?? inspection.status} />
            </View>
            <Text style={{ color: "#cdbfa5" }}>
              {inspection.summary ?? "Awaiting report generation. Submission is still moving through the pipeline."}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

