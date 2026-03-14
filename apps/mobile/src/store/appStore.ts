import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CurrentUser, InspectionDetail, InspectionSummary } from "@fieldlens/shared";

export type LocalPhoto = {
  id: string;
  uri: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
};

export type InspectionDraft = {
  siteName: string;
  inspectionType: string;
  inspectorName: string;
  latitude?: number | null;
  longitude?: number | null;
  textNotes: string;
  simulatedVoiceInput: string;
  voiceTranscript: string;
  photos: LocalPhoto[];
};

export type PendingInspection = {
  id: string;
  createdAt: string;
  draft: InspectionDraft;
  retries: number;
};

type AppState = {
  token: string | null;
  currentUser: CurrentUser | null;
  draft: InspectionDraft;
  inspections: InspectionSummary[];
  inspectionDetail: InspectionDetail | null;
  pendingQueue: PendingInspection[];
  setToken: (token: string | null) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  logout: () => void;
  updateDraft: (draft: Partial<InspectionDraft>) => void;
  resetDraft: () => void;
  setInspections: (inspections: InspectionSummary[]) => void;
  setInspectionDetail: (detail: InspectionDetail | null) => void;
  enqueuePending: (item: PendingInspection) => void;
  dequeuePending: (id: string) => void;
};

export const emptyDraft: InspectionDraft = {
  siteName: "",
  inspectionType: "Construction",
  inspectorName: "Indigo Inspector",
  latitude: null,
  longitude: null,
  textNotes: "",
  simulatedVoiceInput: "There are visible cracks in the north wall and the entrance signage is missing.",
  voiceTranscript: "",
  photos: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      draft: emptyDraft,
      inspections: [],
      inspectionDetail: null,
      pendingQueue: [],
      setToken: (token) => set({ token }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      logout: () => set({ token: null, currentUser: null, inspections: [], inspectionDetail: null }),
      updateDraft: (draft) => set((state) => ({ draft: { ...state.draft, ...draft } })),
      resetDraft: () => set({ draft: emptyDraft }),
      setInspections: (inspections) => set({ inspections }),
      setInspectionDetail: (inspectionDetail) => set({ inspectionDetail }),
      enqueuePending: (item) =>
        set((state) => ({ pendingQueue: [...state.pendingQueue, item] })),
      dequeuePending: (id) =>
        set((state) => ({ pendingQueue: state.pendingQueue.filter((p) => p.id !== id) })),
    }),
    {
      name: "fieldlens-mobile-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
