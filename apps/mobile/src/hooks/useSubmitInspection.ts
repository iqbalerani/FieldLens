import NetInfo from "@react-native-community/netinfo";
import { Alert } from "react-native";
import { api } from "../api/client";
import { useAppStore } from "../store/appStore";

/**
 * Encapsulates the full inspection submission flow:
 *  - Offline: enqueues the draft and shows a user-facing alert
 *  - Online:  creates, uploads photos, completes media, submits
 *
 * Returns the inspectionId on success, or null if offline/error.
 */
export function useSubmitInspection() {
  const { token, draft, resetDraft, enqueuePending, setInspections } = useAppStore();

  const submit = async (): Promise<string | null> => {
    if (!token) return null;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.isInternetReachable === false) {
      enqueuePending({
        id: `pending-${Date.now()}`,
        createdAt: new Date().toISOString(),
        draft,
        retries: 0,
      });
      Alert.alert(
        "Saved offline",
        "No connection detected. Your inspection has been saved and will sync automatically when you reconnect.",
      );
      resetDraft();
      return null;
    }

    try {
      const created = await api.createInspection(token, {
        siteName: draft.siteName,
        inspectionType: draft.inspectionType,
        inspectorName: draft.inspectorName,
        latitude: draft.latitude,
        longitude: draft.longitude,
        textNotes: draft.textNotes,
        requestedMedia: draft.photos.map((photo) => ({
          type: "photo",
          mimeType: photo.mimeType,
          sizeBytes: photo.sizeBytes,
          fileName: photo.fileName,
        })),
      });

      for (let i = 0; i < created.uploadTargets.length; i++) {
        const target = created.uploadTargets[i];
        const photo = draft.photos[i];
        if (photo) {
          await api.uploadPhoto(token, created.inspectionId, target.id, photo);
        }
      }

      await api.completeMedia(token, created.inspectionId, {
        media: created.uploadTargets.map((t) => ({
          id: t.id,
          s3Key: t.s3Key,
          mimeType: t.mimeType,
          sizeBytes: t.sizeBytes,
          type: t.type,
        })),
        voiceTranscript: draft.voiceTranscript,
      });

      await api.submitInspection(token, created.inspectionId);
      resetDraft();

      // Refresh the inspections list in the background
      api.listInspections(token).then(setInspections).catch(() => {});

      return created.inspectionId;
    } catch (err) {
      Alert.alert("Submission failed", String(err));
      return null;
    }
  };

  return { submit };
}
