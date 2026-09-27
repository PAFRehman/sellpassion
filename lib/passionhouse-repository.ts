import { freshDemoState } from "@/lib/passionhouse-demo";
import type { PassionHouseState } from "@/lib/passionhouse-types";

export interface PassionHouseRepository {
  load(): PassionHouseState;
  save(state: PassionHouseState): void;
  reset(): PassionHouseState;
}

const STORAGE_KEY = "passionhouse.mvp.state.v3";

function isPassionHouseState(value: unknown): value is PassionHouseState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PassionHouseState>;
  return (
    state.schemaVersion === 3 &&
    Array.isArray(state.users) &&
    Array.isArray(state.ideas) &&
    Array.isArray(state.accessRequests) &&
    Array.isArray(state.proposals) &&
    Array.isArray(state.dealRooms) &&
    Array.isArray(state.fundingRequests)
  );
}

export const localRepository: PassionHouseRepository = {
  load() {
    if (typeof window === "undefined") return freshDemoState();
    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY);
      if (!serialized) return freshDemoState();
      const parsed: unknown = JSON.parse(serialized);
      return isPassionHouseState(parsed) ? parsed : freshDemoState();
    } catch {
      return freshDemoState();
    }
  },
  save(state) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Large local media can exceed a browser's demo storage quota. The
      // in-memory session remains usable even when persistence is unavailable.
    }
  },
  reset() {
    const next = freshDemoState();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  },
};
