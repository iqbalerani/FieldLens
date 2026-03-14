import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
    <View style={{ gap: 14 }}>
      <Text style={{ color: "#f7f0df", fontSize: 38, fontWeight: "700" }}>FieldLens</Text>
      <Text style={{ color: "#cdbfa5", lineHeight: 22 }}>
        Sign in with your FieldLens credentials to capture inspections, upload media, and generate live Nova reports.
      </Text>
      <View style={{ gap: 10 }}>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#8a7e69"
          value={email}
          onChangeText={setEmail}
          style={{
            padding: 16,
            borderRadius: 18,
            color: "#f7f0df",
            backgroundColor: "rgba(248,242,230,0.08)",
            borderWidth: 1,
            borderColor: "rgba(248,242,230,0.14)",
          }}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#8a7e69"
          value={password}
          onChangeText={setPassword}
          style={{
            padding: 16,
            borderRadius: 18,
            color: "#f7f0df",
            backgroundColor: "rgba(248,242,230,0.08)",
            borderWidth: 1,
            borderColor: "rgba(248,242,230,0.14)",
          }}
        />
      </View>
      {error ? <Text style={{ color: "#ff9d7a" }}>{error}</Text> : null}
      <Pressable
        onPress={() => void handleSubmit()}
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: "#f08700",
          borderWidth: 1,
          borderColor: "rgba(248,242,230,0.14)",
        }}
      >
        <Text style={{ color: "#211408", fontWeight: "700" }}>{submitting ? "Signing in..." : "Continue"}</Text>
      </Pressable>
    </View>
  );
}
