import { Pressable, Text, View } from "react-native";

export function SettingsScreen({
  onResetDraft,
  onLogout,
}: {
  onResetDraft: () => void;
  onLogout: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: "#f7f0df", fontSize: 28, fontWeight: "700" }}>Settings</Text>
      <Text style={{ color: "#cdbfa5", lineHeight: 22 }}>
        The MVP stores your current draft locally so inspection work survives restarts.
      </Text>
      <Pressable
        onPress={onResetDraft}
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: "rgba(248,242,230,0.08)",
        }}
      >
        <Text style={{ color: "#f7f0df", fontWeight: "700" }}>Reset local draft</Text>
      </Pressable>
      <Pressable
        onPress={onLogout}
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: "rgba(255,107,107,0.14)",
        }}
      >
        <Text style={{ color: "#ffb4a8", fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
