import {
  HEROES,
  RELICS,
  ROUTES,
  UPGRADES,
  rollLevelLoot,
  upgradeCost,
  xpToNext,
  type Cost,
  type HeroId,
  type LootDrop,
  type RelicId,
  type RouteId,
  type UpgradeId,
} from "./catalog.ts";

const KEY = "block-dojo-v2";

export type SaveData = {
  gold: number;
  level: number;
  exp: number;
  relics: RelicId[];
  upgrades: Record<UpgradeId, number>;
  unlockedHeroes: HeroId[];
  unlockedRoutes: RouteId[];
  hero: HeroId;
  route: RouteId;
  music: number;
  sfx: number;
  stripes: number;
  kills: number;
  lastSeen: number;
  watched: boolean;
  pendingLoot: LootDrop[];
};

export type HeroStats = {
  atk: number;
  maxHp: number;
  interval: number;
  speed: number;
  crit: number;
  farm: number;
  magnet: number;
  crateGold: number;
};

function defaults(): SaveData {
  return {
    gold: 0,
    level: 1,
    exp: 0,
    relics: [],
    upgrades: {
      ironStomp: 0,
      fruitCake: 0,
      quickFeet: 0,
      luckyPeel: 0,
      magnet: 0,
      crateCrew: 0,
    },
    unlockedHeroes: ["mask"],
    unlockedRoutes: ["grove"],
    hero: "mask",
    route: "grove",
    music: 0.55,
    sfx: 0.8,
    stripes: 0,
    kills: 0,
    lastSeen: Date.now(),
    watched: false,
    pendingLoot: [],
  };
}

export type StoreListener = () => void;

class Store {
  data: SaveData = defaults();
  private listeners: StoreListener[] = [];

  constructor() {
    this.load();
  }

  on(fn: StoreListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(): void {
    this.save();
    for (const fn of this.listeners) fn();
  }

  load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        this.data = defaults();
        return;
      }
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      this.data = {
        ...defaults(),
        ...parsed,
        upgrades: { ...defaults().upgrades, ...parsed.upgrades },
        relics: parsed.relics ?? [],
        pendingLoot: parsed.pendingLoot ?? [],
      };
      this.applyOffline();
    } catch {
      this.data = defaults();
    }
  }

  save(): void {
    this.data.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(this.data));
  }

  private applyOffline(): void {
    const elapsed = Date.now() - (this.data.lastSeen || Date.now());
    const minutes = Math.min(25, elapsed / 60000);
    if (minutes < 0.4) return;
    this.data.gold += Math.floor(minutes * (4 + this.data.upgrades.crateCrew + this.data.level * 0.4));
    this.addExp(Math.floor(minutes * (6 + this.data.level)), false);
  }

  stats(): HeroStats {
    const hero = HEROES[this.data.hero];
    const u = this.data.upgrades;
    const lv = this.data.level - 1;
    const relics = this.data.relics;
    const count = (id: RelicId) => relics.filter((r) => r === id).length;
    return {
      atk: Math.round((hero.atk + u.ironStomp * 2.2 + lv * 1.3 + count("ironCharm") * 2) * 10) / 10,
      maxHp: Math.round(hero.hp + u.fruitCake * 6 + lv * 4 + count("heartSeed") * 6),
      interval: Math.max(0.36, hero.interval - u.quickFeet * 0.045),
      speed: hero.speed + u.quickFeet * 4 + count("swiftLeaf") * 6,
      crit: Math.min(0.5, hero.crit + u.luckyPeel * 0.035 + count("luckyPit") * 0.04),
      farm: hero.farm + u.crateCrew * 0.08,
      magnet: 18 + u.magnet * 10 + count("magnetRind") * 8,
      crateGold: 6 + u.crateCrew * 2 + count("coinBrand") * 2,
    };
  }

  needXp(): number {
    return xpToNext(this.data.level);
  }

  canPay(cost: Cost): boolean {
    return this.data.gold >= cost.gold;
  }

  pay(cost: Cost): boolean {
    if (!this.canPay(cost)) return false;
    this.data.gold -= cost.gold;
    this.emit();
    return true;
  }

  addGold(n: number): void {
    this.data.gold += Math.max(0, Math.round(n));
    this.emit();
  }

  addExp(n: number, emit = true): number {
    this.data.exp += Math.max(0, Math.round(n));
    let gained = 0;
    while (this.data.exp >= xpToNext(this.data.level)) {
      this.data.exp -= xpToNext(this.data.level);
      this.data.level += 1;
      this.data.pendingLoot.push(rollLevelLoot(this.data.level));
      gained += 1;
    }
    if (emit) this.emit();
    return gained;
  }

  collectLoot(drop: LootDrop): boolean {
    const idx = this.data.pendingLoot.findIndex((d) => d.level === drop.level && d.relic === drop.relic && d.gold === drop.gold);
    if (idx < 0) return false;
    this.data.pendingLoot.splice(idx, 1);
    this.data.gold += drop.gold;
    this.data.relics.push(drop.relic);
    this.emit();
    return true;
  }

  buyUpgrade(id: UpgradeId): boolean {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const cost = upgradeCost(def, this.data.upgrades[id]);
    if (!this.canPay(cost)) return false;
    this.data.gold -= cost.gold;
    this.data.upgrades[id] += 1;
    this.emit();
    return true;
  }

  unlockHero(id: HeroId): boolean {
    if (this.data.unlockedHeroes.includes(id)) return true;
    const cost = HEROES[id].unlock;
    if (this.data.level < cost.level || !this.canPay({ gold: cost.gold })) return false;
    this.data.gold -= cost.gold;
    this.data.unlockedHeroes.push(id);
    this.emit();
    return true;
  }

  setHero(id: HeroId): boolean {
    if (!this.data.unlockedHeroes.includes(id)) return false;
    this.data.hero = id;
    this.emit();
    return true;
  }

  unlockRoute(id: RouteId): boolean {
    if (this.data.unlockedRoutes.includes(id)) return true;
    const route = ROUTES[id];
    if (this.data.level < route.unlockLevel || !this.canPay({ gold: route.unlockGold })) return false;
    this.data.gold -= route.unlockGold;
    this.data.unlockedRoutes.push(id);
    this.emit();
    return true;
  }

  setRoute(id: RouteId): boolean {
    if (!this.data.unlockedRoutes.includes(id)) return false;
    this.data.route = id;
    this.emit();
    return true;
  }

  setVolumes(music: number, sfx: number): void {
    this.data.music = music;
    this.data.sfx = sfx;
    this.emit();
  }

  markWatched(): void {
    this.data.watched = true;
    this.emit();
  }

  addStripe(): void {
    this.data.stripes += 1;
    this.emit();
  }

  addKill(): void {
    this.data.kills += 1;
    this.emit();
  }

  formatCost(cost: Cost): string {
    return `${cost.gold}g`;
  }

  relicName(id: RelicId): string {
    return RELICS[id].name;
  }
}

export const store = new Store();
