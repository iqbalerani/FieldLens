import { Pressable, Text, View } from "react-native";

export function LoginScreen({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: "#f7f0df", fontSize: 38, fontWeight: "700" }}>FieldLens</Text>
      <Text style={{ color: "#cdbfa5", lineHeight: 22 }}>
        Demo sign-in keeps the mobile app focused on the inspection flow. Choose a role and continue.
      </Text>
      {["demo-inspector", "demo-supervisor", "demo-admin"].map((token) => (
        <Pressable
          key={token}
          onPress={() => onSelect(token)}
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: token === "demo-inspector" ? "#f08700" : "rgba(248,242,230,0.08)",
            borderWidth: 1,
            borderColor: "rgba(248,242,230,0.14)",
          }}
        >
          <Text style={{ color: token === "demo-inspector" ? "#211408" : "#f7f0df", fontWeight: "700" }}>{token}</Text>
        </Pressable>
      ))}
    </View>
  );
}

