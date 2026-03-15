import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import {
  ActionButton,
  BodyText,
  Card,
  FieldInput,
  SectionLabel,
  SelectionChip,
  TitleBlock,
} from "../../components/ui";
import { useVoiceStream } from "../../hooks/useVoiceStream";
import type { InspectionDraft, LocalPhoto } from "../../store/appStore";
import { theme } from "../../theme";

const inspectionTypes = ["Construction", "Property", "Warehouse", "NGO", "Other"];

function StepHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <BodyText tone="secondary">{description}</BodyText>
    </View>
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

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
    onChange({ photos: draft.photos.filter((photo) => photo.id !== id) });
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  };

  const handleMicPress = async () => {
    if (recordingState === "recording") {
      const text = await stopRecording();
      if (text) {
        onChange({ voiceTranscript: text });
      }
    } else {
      await startRecording();
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    return `${Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
  };

  const waveformBars = [0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 1.0, 0.4, 0.7];

  const steps = [
    <View key="site" style={styles.stepContent}>
      <StepHeader
        title="Site basics"
        description="Start with the core details so every inspection can be identified and searched later."
      />
      <Card tone="strong" style={styles.stepCard}>
        <FieldInput
          placeholder="Site name"
          value={draft.siteName}
          onChangeText={(siteName) => onChange({ siteName })}
        />
        <FieldInput
          placeholder="Inspector name"
          value={draft.inspectorName}
          onChangeText={(inspectorName) => onChange({ inspectorName })}
        />
        <View style={styles.fieldGroup}>
          <SectionLabel>Inspection type</SectionLabel>
          <View style={styles.selectionWrap}>
            {inspectionTypes.map((type) => (
              <SelectionChip
                key={type}
                label={type}
                selected={draft.inspectionType === type}
                onPress={() => onChange({ inspectionType: type })}
              />
            ))}
          </View>
        </View>
        <ActionButton onPress={captureLocation} variant="secondary">
          Use current location
        </ActionButton>
        <View style={styles.infoStrip}>
          <SectionLabel>GPS capture</SectionLabel>
          <BodyText tone="primary">
            {draft.latitude?.toFixed(4) ?? "--"}, {draft.longitude?.toFixed(4) ?? "--"}
          </BodyText>
        </View>
      </Card>
    </View>,

    <View key="photos" style={styles.stepContent}>
      <StepHeader
        title="Photo evidence"
        description="Capture the visual record now so the report has reliable supporting context."
      />
      <Card tone="strong" style={styles.stepCard}>
        <ActionButton onPress={pickPhoto}>Capture photo</ActionButton>
        <BodyText tone="dim">
          {draft.photos.length} photo{draft.photos.length !== 1 ? "s" : ""} captured (max 10)
        </BodyText>
      </Card>
      {draft.photos.map((photo) => (
        <Card key={photo.id} tone="default" style={styles.photoCard}>
          <View style={styles.photoMeta}>
            <Text numberOfLines={1} style={styles.photoName}>
              {photo.fileName}
            </Text>
            <BodyText tone="dim" style={styles.photoSize}>
              {(photo.sizeBytes / 1024).toFixed(0)} KB
            </BodyText>
          </View>
          <Pressable onPress={() => removePhoto(photo.id)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </Card>
      ))}
    </View>,

    <View key="voice" style={styles.stepContent}>
      <StepHeader
        title="Voice walkthrough"
        description="Record a spoken walkthrough, then keep the generated transcript clean and readable."
      />
      <Card tone="strong" style={styles.stepCard}>
        <ActionButton
          onPress={() => void handleMicPress()}
          variant={recordingState === "recording" ? "danger" : "primary"}
        >
          {recordingState === "recording"
            ? `Stop recording (${formatDuration(durationMs)})`
            : recordingState === "processing"
              ? "Transcribing..."
              : "Record voice note"}
        </ActionButton>

        {recordingState === "recording" ? (
          <View style={styles.waveformRow}>
            {waveformBars.map((heightScale, index) => (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: 8 + heightScale * 26,
                    opacity: 0.65 + heightScale * 0.3,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        <Card tone="default" style={styles.transcriptCard}>
          <SectionLabel>Live transcript</SectionLabel>
          <BodyText tone="primary">{transcript || draft.voiceTranscript || "No transcript yet."}</BodyText>
        </Card>

        {transcript ? (
          <ActionButton onPress={() => onChange({ voiceTranscript: transcript })} variant="secondary">
            Use this transcript
          </ActionButton>
        ) : null}

        <BodyText tone="dim" style={styles.centeredHelper}>
          {connected ? "Streaming audio to Nova Sonic..." : "You can also edit the saved transcript manually."}
        </BodyText>

        <FieldInput
          multiline
          value={draft.voiceTranscript}
          onChangeText={(voiceTranscript) => onChange({ voiceTranscript })}
          placeholder="Captured transcript will appear here."
          style={styles.multilineInput}
          textAlignVertical="top"
        />
      </Card>
    </View>,

    <View key="notes" style={styles.stepContent}>
      <StepHeader
        title="Additional notes"
        description="Capture anything that does not belong in the spoken walkthrough before you submit."
      />
      <Card tone="strong" style={styles.stepCard}>
        <SectionLabel>Additional notes (optional)</SectionLabel>
        <FieldInput
          multiline
          value={draft.textNotes}
          onChangeText={(textNotes) => onChange({ textNotes })}
          placeholder="Any extra observations not in the voice note..."
          style={styles.notesInput}
          textAlignVertical="top"
        />
      </Card>
    </View>,

    <View key="review" style={styles.stepContent}>
      <StepHeader
        title="Review and submit"
        description="Check the final payload before sending it through the processing pipeline."
      />
      <Card tone="strong" style={styles.stepCard}>
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
            ["Voice transcript", draft.voiceTranscript ? truncate(draft.voiceTranscript, 80) : "None saved"],
            ["Notes", draft.textNotes ? truncate(draft.textNotes, 80) : "None"],
          ] as [string, string][]
        ).map(([label, value]) => (
          <View key={label} style={styles.reviewRow}>
            <SectionLabel>{label}</SectionLabel>
            <BodyText tone="primary">{value}</BodyText>
          </View>
        ))}
      </Card>
      <ActionButton onPress={onSubmit}>Submit inspection</ActionButton>
    </View>,
  ];

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <TitleBlock
        title="New inspection"
        description="Capture site details, evidence, and live notes in one clean flow that holds up on phones and tablets."
      />

      <View style={styles.progressRow}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === step
                ? styles.progressDotActive
                : index < step
                  ? styles.progressDotComplete
                  : styles.progressDotPending,
            ]}
          />
        ))}
        <Text style={styles.progressText}>
          {step + 1} / {steps.length}
        </Text>
      </View>

      {steps[step]}

      <View style={styles.navigationRow}>
        {step > 0 ? (
          <ActionButton onPress={() => setStep((value) => value - 1)} variant="secondary" style={styles.navButton}>
            Back
          </ActionButton>
        ) : null}
        {step < steps.length - 1 ? (
          <ActionButton onPress={() => setStep((value) => value + 1)} style={styles.flexButton}>
            Next
          </ActionButton>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  progressDot: {
    height: 8,
    flex: 1,
    borderRadius: theme.radii.pill,
  },
  progressDotActive: {
    backgroundColor: theme.colors.accent,
  },
  progressDotComplete: {
    backgroundColor: theme.colors.accentSurface,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  progressDotPending: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  progressText: {
    minWidth: 48,
    textAlign: "right",
    color: theme.colors.textDim,
    ...theme.typography.caption,
  },
  stepContent: {
    gap: theme.spacing.md,
  },
  stepHeader: {
    gap: theme.spacing.xxs,
  },
  stepTitle: {
    color: theme.colors.textPrimary,
    ...theme.typography.sectionTitle,
  },
  stepCard: {
    gap: theme.spacing.md,
  },
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  selectionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  infoStrip: {
    gap: theme.spacing.xxxs,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.backgroundInset,
  },
  photoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  photoMeta: {
    flex: 1,
    gap: theme.spacing.xxxs,
  },
  photoName: {
    color: theme.colors.textPrimary,
    ...theme.typography.label,
  },
  photoSize: {
    fontSize: 13,
    lineHeight: 18,
  },
  removeButton: {
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.destructiveBorder,
    backgroundColor: theme.colors.destructiveSurface,
  },
  removeButtonText: {
    color: theme.colors.destructive,
    ...theme.typography.label,
  },
  waveformRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    height: 42,
  },
  waveformBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accentStrong,
  },
  transcriptCard: {
    gap: theme.spacing.xs,
  },
  centeredHelper: {
    textAlign: "center",
  },
  multilineInput: {
    minHeight: 128,
  },
  notesInput: {
    minHeight: 164,
  },
  reviewRow: {
    gap: theme.spacing.xxxs,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  navigationRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  navButton: {
    minWidth: 112,
  },
  flexButton: {
    flex: 1,
  },
});
