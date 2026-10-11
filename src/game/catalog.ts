export type HeroId = "mask" | "frog" | "pink";
export type RouteId = "grove" | "orchard" | "hollow";
export type FruitId =
  | "apple"
  | "bananas"
  | "cherries"
  | "kiwi"
  | "melon"
  | "orange"
  | "pineapple"
  | "strawberry";
export type EnemyId =
  | "slime"
  | "mushroom"
  | "plant"
  | "pig"
  | "bunny"
  | "radish"
  | "snail"
  | "trunk"
  | "rock";
export type UpgradeId =
  | "ironStomp"
  | "fruitCake"
  | "quickFeet"
  | "luckyPeel"
  | "magnet"
  | "crateCrew";

export type Cost = { gold?: number; fruit?: FruitId; amount?: number };

export type HeroDef = {
  id: HeroId;
  name: string;
  role: string;
  blurb: string;
  atk: number;
  hp: number;
  interval: number;
  speed: number;
  crit: number;
  farm: number;
  unlock: { gold: number; fruit?: FruitId; amount?: number };
};

export type RouteDef = {
  id: RouteId;
  name: string;
  number: "01" | "02" | "03";
  backdrop: string;
  fruits: FruitId[];
  enemies: EnemyId[];
  topTile: number;
  fillTile: number;
  unlockGold: number;
  music: "grove" | "orchard" | "hollow";
};

export type EnemyDef = {
  id: EnemyId;
  hp: number;
  atk: number;
  interval: number;
  speed: number;
  gold: number;
  ranged: boolean;
  frameW: number;
  frameH: number;
  runKey: string;
  idleKey?: string;
  hitKey: string;
  attackKey?: string;
};

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  blurb: string;
  goldBase?: number;
  fruit?: FruitId;
  fruitBase?: number;
  growth: number;
};

export const FRUIT_ORDER: FruitId[] = [
  "apple",
  "bananas",
  "cherries",
  "kiwi",
  "strawberry",
  "orange",
  "melon",
  "pineapple",
];

export const HEROES: Record<HeroId, HeroDef> = {
  mask: {
    id: "mask",
    name: "Mask Dude",
    role: "Striker",
    blurb: "The dojo’s default student. Steady stomps, steady hands.",
    atk: 6,
    hp: 28,
    interval: 0.82,
    speed: 76,
    crit: 0.08,
    farm: 1,
    unlock: { gold: 0 },
  },
  frog: {
    id: "frog",
    name: "Ninja Frog",
    role: "Farmer",
    blurb: "Fast feet. Thin skin. The blocks never see them coming.",
    atk: 5,
    hp: 20,
    interval: 0.58,
    speed: 92,
    crit: 0.18,
    farm: 1.35,
    unlock: { gold: 80, fruit: "bananas", amount: 8 },
  },
  pink: {
    id: "pink",
    name: "Pink Man",
    role: "Tank",
    blurb: "Takes the hit, then takes the mat back.",
    atk: 7,
    hp: 44,
    interval: 1.05,
    speed: 64,
    crit: 0.06,
    farm: 0.9,
    unlock: { gold: 140, fruit: "apple", amount: 10 },
  },
};

export const ROUTES: Record<RouteId, RouteDef> = {
  grove: {
    id: "grove",
    name: "Green Grove",
    number: "01",
    backdrop: "bg-green",
    fruits: ["apple", "kiwi"],
    enemies: ["slime", "mushroom", "plant"],
    topTile: 7,
    fillTile: 29,
    unlockGold: 0,
    music: "grove",
  },
  orchard: {
    id: "orchard",
    name: "Pink Orchard",
    number: "02",
    backdrop: "bg-pink",
    fruits: ["cherries", "strawberry"],
    enemies: ["pig", "bunny", "radish"],
    topTile: 183,
    fillTile: 205,
    unlockGold: 40,
    music: "orchard",
  },
  hollow: {
    id: "hollow",
    name: "Brown Hollow",
    number: "03",
    backdrop: "bg-brown",
    fruits: ["bananas", "orange"],
    enemies: ["snail", "trunk", "rock"],
    topTile: 95,
    fillTile: 117,
    unlockGold: 100,
    music: "hollow",
  },
};

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  slime: {
    id: "slime",
    hp: 14,
    atk: 3,
    interval: 1.15,
    speed: 28,
    gold: 4,
    ranged: false,
    frameW: 44,
    frameH: 30,
    runKey: "slime-run",
    hitKey: "slime-hit",
  },
  mushroom: {
    id: "mushroom",
    hp: 18,
    atk: 4,
    interval: 1.25,
    speed: 24,
    gold: 5,
    ranged: false,
    frameW: 32,
    frameH: 32,
    runKey: "mushroom-run",
    idleKey: "mushroom-idle",
    hitKey: "mushroom-hit",
  },
  plant: {
    id: "plant",
    hp: 16,
    atk: 4,
    interval: 1.7,
    speed: 0,
    gold: 6,
    ranged: true,
    frameW: 44,
    frameH: 42,
    runKey: "plant-idle",
    idleKey: "plant-idle",
    hitKey: "plant-hit",
    attackKey: "plant-attack",
  },
  pig: {
    id: "pig",
    hp: 20,
    atk: 5,
    interval: 1.05,
    speed: 34,
    gold: 6,
    ranged: false,
    frameW: 36,
    frameH: 30,
    runKey: "pig-run",
    idleKey: "pig-idle",
    hitKey: "pig-hit",
  },
  bunny: {
    id: "bunny",
    hp: 16,
    atk: 4,
    interval: 0.95,
    speed: 40,
    gold: 6,
    ranged: false,
    frameW: 34,
    frameH: 44,
    runKey: "bunny-run",
    idleKey: "bunny-idle",
    hitKey: "bunny-hit",
  },
  radish: {
    id: "radish",
    hp: 18,
    atk: 4,
    interval: 1.1,
    speed: 32,
    gold: 6,
    ranged: false,
    frameW: 30,
    frameH: 38,
    runKey: "radish-run",
    idleKey: "radish-idle",
    hitKey: "radish-hit",
  },
  snail: {
    id: "snail",
    hp: 32,
    atk: 5,
    interval: 1.45,
    speed: 14,
    gold: 8,
    ranged: false,
    frameW: 38,
    frameH: 24,
    runKey: "snail-walk",
    idleKey: "snail-idle",
    hitKey: "snail-hit",
  },
  trunk: {
    id: "trunk",
    hp: 26,
    atk: 6,
    interval: 1.8,
    speed: 18,
    gold: 9,
    ranged: true,
    frameW: 64,
    frameH: 32,
    runKey: "trunk-run",
    idleKey: "trunk-idle",
    hitKey: "trunk-hit",
    attackKey: "trunk-attack",
  },
  rock: {
    id: "rock",
    hp: 28,
    atk: 6,
    interval: 1.3,
    speed: 22,
    gold: 8,
    ranged: false,
    frameW: 38,
    frameH: 34,
    runKey: "rock-run",
    idleKey: "rock-idle",
    hitKey: "rock-hit",
  },
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: "ironStomp",
    name: "Iron Stomp",
    blurb: "Heavier landings. More bruise per hop.",
    goldBase: 15,
    growth: 1.38,
  },
  {
    id: "fruitCake",
    name: "Fruit Cake",
    blurb: "A denser student. More hits before a knockdown.",
    fruit: "apple",
    fruitBase: 5,
    growth: 1.32,
  },
  {
    id: "quickFeet",
    name: "Quick Feet",
    blurb: "Shorter breath between stomps. A little more run.",
    goldBase: 18,
    growth: 1.4,
  },
  {
    id: "luckyPeel",
    name: "Lucky Peel",
    blurb: "The hop lands on a seam. Crits more often.",
    fruit: "cherries",
    fruitBase: 4,
    growth: 1.36,
  },
  {
    id: "magnet",
    name: "Fruit Magnet",
    blurb: "Snacks drift toward the student.",
    fruit: "kiwi",
    fruitBase: 4,
    growth: 1.4,
  },
  {
    id: "crateCrew",
    name: "Block Crew",
    blurb: "Training posts spill more gold when they split.",
    fruit: "bananas",
    fruitBase: 5,
    growth: 1.34,
  },
];

export const TERRAIN_COLUMNS = 22;
export const VIEW_W = 384;
export const VIEW_H = 216;
export const GROUND_Y = 184;
export const STRIPE_EVERY = 2200;

export function upgradeCost(def: UpgradeDef, level: number): Cost {
  const mul = def.growth ** level;
  if (def.goldBase != null) {
    return { gold: Math.floor(def.goldBase * mul) };
  }
  return {
    fruit: def.fruit,
    amount: Math.max(1, Math.floor((def.fruitBase ?? 4) * mul)),
  };
}
