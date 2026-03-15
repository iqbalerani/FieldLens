import type { InspectionSummary } from "@fieldlens/shared";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { StatusChip } from "../../components/StatusChip";
import { BodyText, Card, PressableCard, SectionLabel, TitleBlock } from "../../components/ui";
import { theme } from "../../theme";

export function HistoryScreen({
  inspections,
  onOpenInspection,
}: {
  inspections: InspectionSummary[];
  onOpenInspection: (id: string) => void;
}) {
  return (
    <Screen>
      <TitleBlock
        title="History"
        description="Review recently submitted inspections and reopen reports without hunting through washed-out lists."
      />
      <View style={styles.list}>
        {inspections.length === 0 ? (
          <Card tone="strong">
            <SectionLabel>No inspections yet</SectionLabel>
            <BodyText tone="secondary">Submitted inspections will appear here once you start capturing work.</BodyText>
          </Card>
        ) : (
          inspections.map((inspection) => (
            <PressableCard key={inspection.id} onPress={() => onOpenInspection(inspection.id)} tone="strong">
              <View style={styles.cardHeader}>
                <Text style={styles.siteName}>{inspection.siteName}</Text>
                <StatusChip label={inspection.overallStatus ?? inspection.status} />
              </View>
              <BodyText tone="secondary">{inspection.summary ?? "Awaiting report."}</BodyText>
            </PressableCard>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  siteName: {
    flex: 1,
    color: theme.colors.textPrimary,
    ...theme.typography.sectionTitle,
  },
});
