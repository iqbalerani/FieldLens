import type { InspectionDetail } from "@fieldlens/shared";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { StatusChip } from "../../components/StatusChip";
import { BodyText, Card, SectionLabel, TitleBlock } from "../../components/ui";
import { theme } from "../../theme";

export function InspectionDetailScreen({ inspection }: { inspection: InspectionDetail | null }) {
  if (!inspection) {
    return (
      <Screen>
        <TitleBlock title="Inspection detail" description="Loading the latest captured evidence and generated report." />
        <Card tone="strong">
          <BodyText tone="secondary">Loading inspection detail...</BodyText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <TitleBlock title={inspection.siteName} description="Inspection detail" />
      <StatusChip label={inspection.report?.overallStatus ?? inspection.status} />
      <Card tone="strong">
        <SectionLabel>Summary</SectionLabel>
        <BodyText tone="primary">{inspection.report?.summary ?? inspection.summary}</BodyText>
      </Card>
      <Card tone="strong">
        <SectionLabel>Transcript</SectionLabel>
        <BodyText tone="primary">{inspection.voiceTranscript ?? "No transcript available."}</BodyText>
      </Card>
      <Card tone="strong">
        <SectionLabel>Issues</SectionLabel>
        <View style={styles.issueList}>
          {inspection.report?.issues.map((issue) => (
            <View key={`${issue.title}-${issue.affectedArea}`} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <StatusChip label={issue.severity} />
              </View>
              <BodyText tone="secondary">{issue.description}</BodyText>
            </View>
          )) ?? <BodyText tone="secondary">No issues extracted yet.</BodyText>}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  issueList: {
    gap: theme.spacing.sm,
  },
  issueCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.backgroundInset,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  issueTitle: {
    flex: 1,
    color: theme.colors.textPrimary,
    ...theme.typography.label,
  },
});
