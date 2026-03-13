import { Pressable, Text, View } from "react-native";

export function SettingsScreen({ onResetDraft }: { onResetDraft: () => void }) {
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
    </View>
  );
}

