import { CLASS_OF_16, type FarmJob } from "./classRoster.ts";

const CHANNEL = "block-dojo-pumpkin";
const STATE_KEY = "block-dojo-pumpkin-state";
const CMD_KEY = "block-dojo-pumpkin-cmd";

export type StudentState = {
  id: number;
  job: FarmJob;
  locked: boolean;
  pumpkins: number;
  ore: number;
};

export type FarmState = {
  students: StudentState[];
  meteorCount: number;
  lastMeteor: number;
};

export type FarmCommand =
  | { type: "meteor" }
  | { type: "job"; studentId: number; job: FarmJob }
  | { type: "jobAll"; job: FarmJob }
  | { type: "lock"; studentId: number; locked: boolean };

function emptyState(): FarmState {
  return {
    students: CLASS_OF_16.map((s) => ({
      id: s.id,
      job: s.id % 3 === 0 ? "mine" : "farm",
      locked: false,
      pumpkins: 0,
      ore: 0,
    })),
    meteorCount: 0,
    lastMeteor: 0,
  };
}

export function loadFarmState(): FarmState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as FarmState;
    if (!Array.isArray(parsed.students) || parsed.students.length !== CLASS_OF_16.length) {
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveFarmState(state: FarmState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function applyFarmCommand(state: FarmState, cmd: FarmCommand): FarmState {
  const next: FarmState = {
    ...state,
    students: state.students.map((s) => ({ ...s })),
  };
  if (cmd.type === "meteor") {
    next.meteorCount += 1;
    next.lastMeteor = Date.now();
  } else if (cmd.type === "job") {
    const row = next.students.find((s) => s.id === cmd.studentId);
    if (row && !row.locked) row.job = cmd.job;
  } else if (cmd.type === "jobAll") {
    for (const row of next.students) {
      if (!row.locked) row.job = cmd.job;
    }
  } else if (cmd.type === "lock") {
    const row = next.students.find((s) => s.id === cmd.studentId);
    if (row) row.locked = cmd.locked;
  }
  return next;
}

type Listener = (cmd: FarmCommand) => void;

const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function ensureChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent<FarmCommand>) => {
      for (const fn of listeners) fn(event.data);
    };
  }
  return channel;
}

export function publishFarmCommand(cmd: FarmCommand): void {
  const state = applyFarmCommand(loadFarmState(), cmd);
  saveFarmState(state);
  const ch = ensureChannel();
  if (ch) {
    ch.postMessage(cmd);
  } else {
    try {
      localStorage.setItem(CMD_KEY, JSON.stringify({ ...cmd, at: Date.now() }));
    } catch {
      /* ignore quota */
    }
  }
  for (const fn of listeners) fn(cmd);
}

export function onFarmCommand(fn: Listener): () => void {
  listeners.add(fn);
  ensureChannel();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CMD_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as FarmCommand;
      fn(parsed);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
