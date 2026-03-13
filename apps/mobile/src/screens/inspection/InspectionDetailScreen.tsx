import type { InspectionDetail } from "@fieldlens/shared";
import { ScrollView, Text, View } from "react-native";
import { StatusChip } from "../../components/StatusChip";

export function InspectionDetailScreen({ inspection }: { inspection: InspectionDetail | null }) {
  if (!inspection) {
    return <Text style={{ color: "#cdbfa5" }}>Loading inspection detail...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 16 }}>
      <Text style={{ color: "#f7f0df", fontSize: 28, fontWeight: "700" }}>{inspection.siteName}</Text>
      <StatusChip label={inspection.report?.overallStatus ?? inspection.status} />
      <View style={cardStyle}>
        <Text style={labelStyle}>Summary</Text>
        <Text style={valueStyle}>{inspection.report?.summary ?? inspection.summary}</Text>
      </View>
      <View style={cardStyle}>
        <Text style={labelStyle}>Transcript</Text>
        <Text style={valueStyle}>{inspection.voiceTranscript ?? "No transcript available."}</Text>
      </View>
      <View style={cardStyle}>
        <Text style={labelStyle}>Issues</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {inspection.report?.issues.map((issue) => (
            <View key={`${issue.title}-${issue.affectedArea}`} style={issueCardStyle}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#f7f0df", fontWeight: "700" }}>{issue.title}</Text>
                <StatusChip label={issue.severity} />
              </View>
              <Text style={{ color: "#cdbfa5", marginTop: 8 }}>{issue.description}</Text>
            </View>
          )) ?? <Text style={valueStyle}>No issues extracted yet.</Text>}
        </View>
      </View>
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
const issueCardStyle = {
  padding: 14,
  borderRadius: 16,
  backgroundColor: "rgba(248,242,230,0.04)",
} as const;
const labelStyle = { color: "#ffcf88", marginBottom: 8 } as const;
const valueStyle = { color: "#f7f0df", lineHeight: 22 } as const;

