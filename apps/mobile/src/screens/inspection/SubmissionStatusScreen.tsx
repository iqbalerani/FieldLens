import { StyleSheet } from "react-native";
import { Screen } from "../../components/Screen";
import { StatusChip } from "../../components/StatusChip";
import { ActionButton, BodyText, Card, TitleBlock } from "../../components/ui";
import { theme } from "../../theme";

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
    <Screen scroll={false}>
      <TitleBlock
        title="Submission status"
        description="Track AI processing in a clearer state view while the backend finishes report generation."
      />
      <Card tone="accent" style={styles.statusCard}>
        <StatusChip label={status} />
        <BodyText tone="secondary">
          Polling keeps the MVP simple while the backend finishes AI processing in the background.
        </BodyText>
      </Card>
      <ActionButton onPress={onRefresh} variant="secondary">
        Refresh status
      </ActionButton>
      <ActionButton onPress={onOpenInspection}>Open inspection detail</ActionButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    gap: theme.spacing.sm,
  },
});
