import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useVoiceStream } from "../../hooks/useVoiceStream";
import type { InspectionDraft, LocalPhoto } from "../../store/appStore";

const inspectionTypes = ["Construction", "Property", "Warehouse", "NGO", "Other"];

export function NewInspectionWizard({
  draft,
  onChange,
  onSubmit,
}: {
  draft: InspectionDraft;
  onChange: (partial: Partial<InspectionDraft>) => void;
  onSubmit: () => void;
}) {
  const [step, setStep] = useState(0);
  const {
    transcript,
    connected,
    recordingState,
    durationMs,
    startRecording,
    stopRecording,
    streamWords,
    setTranscript,
  } = useVoiceStream();

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required", "FieldLens needs camera access to capture evidence.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
    if (!result.canceled) {
      const asset = result.assets[0];
      const photo: LocalPhoto = {
        id: `${Date.now()}`,
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        sizeBytes: asset.fileSize ?? 0,
      };
      onChange({ photos: [...draft.photos, photo] });
    }
  };

  const removePhoto = (id: string) => {
    onChange({ photos: draft.photos.filter((p) => p.id !== id) });
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return;
    const position = await Location.getCurrentPositionAsync({});
    onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  };

  const handleMicPress = async () => {
    if (recordingState === "recording") {
      const text = await stopRecording();
      if (text) onChange({ voiceTranscript: text });
    } else {
      await startRecording();
    }
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const WAVEFORM_BARS = [0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 1.0, 0.4, 0.7];

  const steps = [
    // ── Step 1: Site info ──
    <View key="site" style={{ gap: 12 }}>
      <TextInput
        placeholder="Site name"
        placeholderTextColor="#8a7e69"
        value={draft.siteName}
        onChangeText={(siteName) => onChange({ siteName })}
        style={inputStyle}
      />
      <TextInput
        placeholder="Inspector name"
        placeholderTextColor="#8a7e69"
        value={draft.inspectorName}
        onChangeText={(inspectorName) => onChange({ inspectorName })}
        style={inputStyle}
      />
      <Text style={{ color: "#cdbfa5" }}>Inspection type</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {inspectionTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => onChange({ inspectionType: type })}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: draft.inspectionType === type ? "#f08700" : "rgba(248,242,230,0.08)",
            }}
          >
            <Text style={{ color: draft.inspectionType === type ? "#28180a" : "#f7f0df", fontWeight: "700" }}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={captureLocation} style={secondaryButtonStyle}>
        <Text style={secondaryButtonTextStyle}>📍  Use current location</Text>
      </Pressable>
      <Text style={{ color: "#cdbfa5" }}>
        GPS: {draft.latitude?.toFixed(4) ?? "--"}, {draft.longitude?.toFixed(4) ?? "--"}
      </Text>
    </View>,

    // ── Step 2: Photos ──
    <View key="photos" style={{ gap: 12 }}>
      <Pressable onPress={pickPhoto} style={primaryButtonStyle}>
        <Text style={primaryButtonTextStyle}>📷  Capture photo</Text>
      </Pressable>
      <Text style={{ color: "#8a7e69", fontSize: 12 }}>
        {draft.photos.length} photo{draft.photos.length !== 1 ? "s" : ""} captured (max 10)
      </Text>
      {draft.photos.map((photo) => (
        <View
          key={photo.id}
          style={[cardStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#f7f0df", fontWeight: "700" }} numberOfLines={1}>
              {photo.fileName}
            </Text>
            <Text style={{ color: "#8a7e69", fontSize: 11 }}>{(photo.sizeBytes / 1024).toFixed(0)} KB</Text>
          </View>
          <Pressable onPress={() => removePhoto(photo.id)} style={{ padding: 8 }}>
            <Text style={{ color: "#ff6b6b", fontWeight: "700" }}>✕</Text>
          </Pressable>
        </View>
      ))}
    </View>,

    // ── Step 3: Voice recording ──
    <View key="voice" style={{ gap: 12 }}>
      <Pressable
        onPress={() => void handleMicPress()}
        style={[
          primaryButtonStyle,
          { backgroundColor: recordingState === "recording" ? "#ff4444" : "#f08700" },
        ]}
      >
        <Text style={primaryButtonTextStyle}>
          {recordingState === "recording"
            ? `⏹  Stop  (${formatDuration(durationMs)})`
            : recordingState === "processing"
            ? "⏳  Transcribing…"
            : "🎙  Record voice note"}
        </Text>
      </Pressable>

      {recordingState === "recording" && (
        <View style={{ flexDirection: "row", gap: 4, justifyContent: "center", alignItems: "flex-end", height: 36 }}>
          {WAVEFORM_BARS.map((h, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 8 + h * 24,
                borderRadius: 3,
                backgroundColor: "#f08700",
                opacity: 0.6 + h * 0.4,
              }}
            />
          ))}
        </View>
      )}

      <View style={cardStyle}>
        <Text style={{ color: "#ffcf88", marginBottom: 8 }}>Live transcript</Text>
        <Text style={{ color: "#f7f0df" }}>
          {transcript || draft.voiceTranscript || "No transcript yet."}
        </Text>
      </View>

      {!!transcript && (
        <Pressable onPress={() => onChange({ voiceTranscript: transcript })} style={secondaryButtonStyle}>
          <Text style={secondaryButtonTextStyle}>✓  Use this transcript</Text>
        </Pressable>
      )}

      <Text style={{ color: "#8a7e69", fontSize: 11, textAlign: "center" }}>— or type to simulate —</Text>
      <TextInput
        multiline
        value={draft.simulatedVoiceInput}
        onChangeText={(simulatedVoiceInput) => onChange({ simulatedVoiceInput })}
        placeholder="Describe site conditions (text demo fallback)"
        placeholderTextColor="#8a7e69"
        style={[inputStyle, { minHeight: 80 }]}
      />
      <Pressable
        onPress={() => streamWords(`voice-${Date.now()}`, draft.simulatedVoiceInput)}
        style={secondaryButtonStyle}
        disabled={connected}
      >
        <Text style={secondaryButtonTextStyle}>{connected ? "Streaming…" : "Stream demo transcript"}</Text>
      </Pressable>
    </View>,

    // ── Step 4: Text notes ──
    <View key="notes" style={{ gap: 12 }}>
      <Text style={{ color: "#cdbfa5" }}>Additional notes (optional)</Text>
      <TextInput
        multiline
        value={draft.textNotes}
        onChangeText={(textNotes) => onChange({ textNotes })}
        placeholder="Any extra observations not in the voice note…"
        placeholderTextColor="#8a7e69"
        style={[inputStyle, { minHeight: 140 }]}
      />
    </View>,

    // ── Step 5: Review & Submit ──
    <View key="review" style={{ gap: 12 }}>
      <Text style={{ color: "#f7f0df", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
        Review before submitting
      </Text>
      {(
        [
          ["Site", draft.siteName || "Not set"],
          ["Inspector", draft.inspectorName || "Not set"],
          ["Type", draft.inspectionType],
          [
            "GPS",
            draft.latitude
              ? `${draft.latitude.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
              : "Not captured",
          ],
          ["Photos", `${draft.photos.length} photo${draft.photos.length !== 1 ? "s" : ""}`],
          [
            "Voice transcript",
            draft.voiceTranscript ? `${draft.voiceTranscript.slice(0, 80)}…` : "None saved",
          ],
          ["Notes", draft.textNotes ? `${draft.textNotes.slice(0, 80)}…` : "None"],
        ] as [string, string][]
      ).map(([label, value]) => (
        <View key={label} style={cardStyle}>
          <Text style={reviewLabel}>{label}</Text>
          <Text style={reviewValue}>{value}</Text>
        </View>
      ))}
      <Pressable onPress={onSubmit} style={primaryButtonStyle}>
        <Text style={primaryButtonTextStyle}>🚀  Submit inspection</Text>
      </Pressable>
    </View>,
  ];

  return (
    <ScrollView contentContainerStyle={{ gap: 16 }}>
      <Text style={{ color: "#f7f0df", fontSize: 28, fontWeight: "700" }}>New inspection</Text>

      {/* Progress dots */}
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i === step ? "#f08700" : i < step ? "rgba(240,135,0,0.4)" : "rgba(248,242,230,0.15)",
            }}
          />
        ))}
        <Text style={{ color: "#8a7e69", fontSize: 11, marginLeft: 6 }}>
          {step + 1} / {steps.length}
        </Text>
      </View>

      {steps[step]}

      <View style={{ flexDirection: "row", gap: 10 }}>
        {step > 0 && (
          <Pressable onPress={() => setStep((v) => v - 1)} style={secondaryButtonStyle}>
            <Text style={secondaryButtonTextStyle}>← Back</Text>
          </Pressable>
        )}
        {step < steps.length - 1 && (
          <Pressable onPress={() => setStep((v) => v + 1)} style={[primaryButtonStyle, { flex: 1 }]}>
            <Text style={primaryButtonTextStyle}>Next →</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: "rgba(248,242,230,0.06)",
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "rgba(248,242,230,0.12)",
  color: "#f7f0df",
  padding: 14,
} as const;

const primaryButtonStyle = {
  backgroundColor: "#f08700",
  padding: 16,
  borderRadius: 18,
  alignItems: "center" as const,
};

const secondaryButtonStyle = {
  backgroundColor: "rgba(248,242,230,0.08)",
  padding: 14,
  borderRadius: 18,
  alignItems: "center" as const,
};

const primaryButtonTextStyle = { color: "#28180a", fontWeight: "800" as const };
const secondaryButtonTextStyle = { color: "#f7f0df", fontWeight: "700" as const };

const cardStyle = {
  padding: 16,
  borderRadius: 18,
  backgroundColor: "rgba(248,242,230,0.05)",
  borderWidth: 1,
  borderColor: "rgba(248,242,230,0.12)",
} as const;

const reviewLabel = { color: "#cdbfa5", marginBottom: 4, fontSize: 12 } as const;
const reviewValue = { color: "#f7f0df", fontWeight: "700" as const } as const;
