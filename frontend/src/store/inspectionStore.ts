import { create } from 'zustand'
import type { DefectLocation, InspectResponse } from '@/types/api'

export interface ARObject {
  id: string;
  type: 'box' | 'arrow' | 'label' | 'pulse';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label?: string;
  confidence?: number;
  animated?: boolean;
}

interface InspectionState {
  currentInspection: InspectResponse | null;
  arObjects: ARObject[];
  captureMode: 'live' | 'preview' | 'result';
  setCurrentInspection: (inspection: InspectResponse | null) => void;
  setARObjects: (objects: ARObject[]) => void;
  setCaptureMode: (mode: 'live' | 'preview' | 'result') => void;
  resetInspection: () => void;
}

export const useInspectionStore = create<InspectionState>()((set) => ({
  currentInspection: null,
  arObjects: [],
  captureMode: 'live',
  setCurrentInspection: (inspection) => set({ currentInspection: inspection }),
  setARObjects: (objects) => set({ arObjects: objects }),
  setCaptureMode: (mode) => set({ captureMode: mode }),
  resetInspection: () => set({ currentInspection: null, arObjects: [], captureMode: 'live' }),
}))
