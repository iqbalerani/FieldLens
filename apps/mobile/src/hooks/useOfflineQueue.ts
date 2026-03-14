import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";
import { api } from "../api/client";
import { useAppStore } from "../store/appStore";

/**
 * Monitors network connectivity and automatically flushes the pending
 * inspection queue when the device comes back online.
 *
 * Returns the number of pending items so callers can show a sync badge.
 */
export function useOfflineQueue(token: string | null) {
  const { pendingQueue, dequeuePending, setInspections } = useAppStore();
  const isSyncing = useRef(false);

  const syncQueue = async () => {
    if (isSyncing.current || !token || pendingQueue.length === 0) return;
    isSyncing.current = true;

    for (const item of pendingQueue) {
      try {
        const { draft } = item;
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
          if (photo && target.uploadUrl) {
            await api.uploadPhoto(token, created.inspectionId, target.id, target.uploadUrl, photo);
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
        dequeuePending(item.id);
      } catch {
        // Leave failed items in the queue for the next connectivity event.
        // Silently skip to avoid interrupting the sync of other items.
      }
    }

    // Refresh inspections list after syncing
    try {
      const updated = await api.listInspections(token);
      setInspections(updated);
    } catch {
      // Non-fatal
    }

    isSyncing.current = false;
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void syncQueue();
      }
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQueue, token]);

  return { pendingCount: pendingQueue.length, syncQueue };
}
