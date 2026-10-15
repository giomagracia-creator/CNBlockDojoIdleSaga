import type { HeroId } from "./catalog.ts";

export type FarmJob = "farm" | "mine" | "idle";

export type StudentDef = {
  id: number;
  name: string;
  hero: HeroId;
  tint: number;
};

/** One class of 16 for the Dojo TV pumpkin patch. */
export const CLASS_OF_16: StudentDef[] = [
  { id: 0, name: "Ava", hero: "mask", tint: 0xffe0b0 },
  { id: 1, name: "Ben", hero: "frog", tint: 0xb8f0c8 },
  { id: 2, name: "Cora", hero: "pink", tint: 0xffc0d8 },
  { id: 3, name: "Dex", hero: "mask", tint: 0xc8d8ff },
  { id: 4, name: "Eva", hero: "frog", tint: 0xfff0a0 },
  { id: 5, name: "Finn", hero: "pink", tint: 0xd0fff0 },
  { id: 6, name: "Gia", hero: "mask", tint: 0xffd0a8 },
  { id: 7, name: "Hiro", hero: "frog", tint: 0xa8e8ff },
  { id: 8, name: "Ivy", hero: "pink", tint: 0xf0c0ff },
  { id: 9, name: "Jax", hero: "mask", tint: 0xe8e0c0 },
  { id: 10, name: "Kai", hero: "frog", tint: 0xc0ffd0 },
  { id: 11, name: "Luna", hero: "pink", tint: 0xffd8e8 },
  { id: 12, name: "Max", hero: "mask", tint: 0xd8c8ff },
  { id: 13, name: "Nia", hero: "frog", tint: 0xffe8c0 },
  { id: 14, name: "Omar", hero: "pink", tint: 0xc8fff8 },
  { id: 15, name: "Piper", hero: "mask", tint: 0xffc8c0 },
];

export const CLASS_SIZE = CLASS_OF_16.length;
