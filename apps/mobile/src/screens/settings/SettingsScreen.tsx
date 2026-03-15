import { StyleSheet } from "react-native";
import { Screen } from "../../components/Screen";
import { ActionButton, BodyText, Card, TitleBlock } from "../../components/ui";
import { theme } from "../../theme";

export function SettingsScreen({
  onResetDraft,
  onLogout,
}: {
  onResetDraft: () => void;
  onLogout: () => void;
}) {
  return (
    <Screen scroll={false}>
      <TitleBlock
        title="Settings"
        description="Your current draft stays on-device so active inspection work survives restarts and poor connectivity."
      />
      <Card tone="strong" style={styles.actionsCard}>
        <BodyText tone="secondary">
          Use these controls to clear the local draft or end the current session on this device.
        </BodyText>
        <ActionButton onPress={onResetDraft} variant="secondary">
          Reset local draft
        </ActionButton>
        <ActionButton onPress={onLogout} variant="danger">
          Sign out
        </ActionButton>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    gap: theme.spacing.md,
  },
});
