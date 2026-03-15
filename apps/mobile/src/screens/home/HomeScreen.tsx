import type { InspectionSummary } from "@fieldlens/shared";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { StatusChip } from "../../components/StatusChip";
import { ActionButton, BodyText, Card, PressableCard, SectionLabel, TitleBlock } from "../../components/ui";
import { theme } from "../../theme";

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
    <Screen>
      <TitleBlock
        eyebrow="Field operations"
        title="Capture quickly. Report clearly."
        description="Start a new inspection, monitor uploads, and reopen recent findings from a layout that stays readable on real devices."
        hero
      />

      {pendingCount > 0 && (
        <Card tone="accent" style={styles.syncBanner}>
          <Text style={styles.bannerIcon}>📡</Text>
          <View style={styles.syncCopy}>
            <Text style={styles.bannerTitle}>
              {pendingCount} inspection{pendingCount !== 1 ? "s" : ""} pending sync
            </Text>
            <BodyText tone="secondary" style={styles.bannerText}>
              Will upload automatically when connection is restored.
            </BodyText>
          </View>
        </Card>
      )}

      <ActionButton onPress={onNewInspection} style={styles.primaryCta}>
        New inspection
      </ActionButton>

      <View style={styles.list}>
        {inspections.length === 0 ? (
          <Card tone="strong">
            <SectionLabel>No inspections yet</SectionLabel>
            <BodyText tone="secondary">
              Create your first inspection to start building a searchable field record.
            </BodyText>
          </Card>
        ) : (
          inspections.map((inspection) => (
            <PressableCard
              key={inspection.id}
              onPress={() => onOpenInspection(inspection.id)}
              tone="strong"
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardCopy}>
                  <SectionLabel>{inspection.inspectionType}</SectionLabel>
                  <Text style={styles.siteName}>{inspection.siteName}</Text>
                </View>
                <StatusChip label={inspection.overallStatus ?? inspection.status} />
              </View>
              <BodyText tone="secondary">
                {inspection.summary ??
                  "Awaiting report generation. Submission is still moving through the pipeline."}
              </BodyText>
            </PressableCard>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  bannerIcon: {
    fontSize: 20,
  },
  syncCopy: {
    flex: 1,
    gap: theme.spacing.xxxs,
  },
  bannerTitle: {
    color: theme.colors.accentStrong,
    ...theme.typography.label,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryCta: {
    minHeight: 60,
  },
  list: {
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  cardCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  siteName: {
    color: theme.colors.textPrimary,
    ...theme.typography.sectionTitle,
  },
});
