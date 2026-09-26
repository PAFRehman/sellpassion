import { freshDemoState } from "@/lib/passionhouse-demo";
import type { PassionHouseState } from "@/lib/passionhouse-types";

export interface PassionHouseRepository {
  load(): PassionHouseState;
  save(state: PassionHouseState): void;
  reset(): PassionHouseState;
}

const STORAGE_KEY = "passionhouse.mvp.state.v1";

function isPassionHouseState(value: unknown): value is PassionHouseState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PassionHouseState>;
  return (
    state.schemaVersion === 1 &&
    Array.isArray(state.users) &&
    Array.isArray(state.ideas) &&
    Array.isArray(state.accessRequests) &&
    Array.isArray(state.proposals) &&
    Array.isArray(state.dealRooms)
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  reset() {
    const next = freshDemoState();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  },
};
