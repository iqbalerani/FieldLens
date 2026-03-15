import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "../../components/Screen";
import { ActionButton, BodyText, Card, FieldInput, TitleBlock } from "../../components/ui";
import { theme } from "../../theme";

export function LoginScreen({
  onSubmit,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("inspector@fieldlens.local");
  const [password, setPassword] = useState("FieldLensInspector123!");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TitleBlock
        eyebrow="Secure mobile access"
        title="FieldLens"
        description="Sign in to capture inspections, attach evidence, and send live site reports without sacrificing readability in the field."
        hero
      />
      <Card tone="strong" style={styles.formCard}>
        <View style={styles.formFields}>
          <FieldInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
          <FieldInput
          secureTextEntry
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
        />
        </View>
        {error ? (
          <BodyText tone="primary" style={styles.errorText}>
            {error}
          </BodyText>
        ) : null}
        <ActionButton onPress={() => void handleSubmit()}>
          {submitting ? "Signing in..." : "Continue"}
        </ActionButton>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    gap: theme.spacing.xl,
  },
  formCard: {
    gap: theme.spacing.md,
  },
  formFields: {
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.destructive,
  },
});
