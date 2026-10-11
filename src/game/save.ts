import {
  HEROES,
  ROUTES,
  UPGRADES,
  upgradeCost,
  type Cost,
  type FruitId,
  type HeroId,
  type RouteId,
  type UpgradeId,
} from "./catalog.ts";

const KEY = "block-dojo-v1";

export type SaveData = {
  gold: number;
  fruit: Record<FruitId, number>;
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

function emptyFruit(): Record<FruitId, number> {
  return {
    apple: 0,
    bananas: 0,
    cherries: 0,
    kiwi: 0,
    melon: 0,
    orange: 0,
    pineapple: 0,
    strawberry: 0,
  };
}

function defaults(): SaveData {
  return {
    gold: 0,
    fruit: emptyFruit(),
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
      this.data = { ...defaults(), ...parsed, fruit: { ...emptyFruit(), ...parsed.fruit } };
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
    const gold = Math.floor(minutes * (3 + this.data.upgrades.ironStomp + this.data.upgrades.crateCrew));
    const apples = Math.floor(minutes * 0.6);
    this.data.gold += gold;
    this.data.fruit.apple += apples;
  }

  stats(): HeroStats {
    const hero = HEROES[this.data.hero];
    const u = this.data.upgrades;
    return {
      atk: Math.round((hero.atk + u.ironStomp * 2.2) * 10) / 10,
      maxHp: Math.round(hero.hp + u.fruitCake * 6),
      interval: Math.max(0.38, hero.interval - u.quickFeet * 0.045),
      speed: hero.speed + u.quickFeet * 4,
      crit: Math.min(0.45, hero.crit + u.luckyPeel * 0.035),
      farm: hero.farm + u.crateCrew * 0.08,
      magnet: 18 + u.magnet * 10,
      crateGold: 5 + u.crateCrew * 2,
    };
  }

  canPay(cost: Cost): boolean {
    if (cost.gold != null && this.data.gold < cost.gold) return false;
    if (cost.fruit && cost.amount != null && this.data.fruit[cost.fruit] < cost.amount) {
      return false;
    }
    return true;
  }

  pay(cost: Cost): boolean {
    if (!this.canPay(cost)) return false;
    if (cost.gold != null) this.data.gold -= cost.gold;
    if (cost.fruit && cost.amount != null) this.data.fruit[cost.fruit] -= cost.amount;
    this.emit();
    return true;
  }

  addGold(n: number): void {
    this.data.gold += Math.max(0, Math.round(n));
    this.emit();
  }

  addFruit(id: FruitId, n = 1): void {
    this.data.fruit[id] += n;
    this.emit();
  }

  buyUpgrade(id: UpgradeId): boolean {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const cost = upgradeCost(def, this.data.upgrades[id]);
    if (!this.canPay(cost)) return false;
    this.pay(cost);
    this.data.upgrades[id] += 1;
    this.emit();
    return true;
  }

  unlockHero(id: HeroId): boolean {
    if (this.data.unlockedHeroes.includes(id)) return true;
    const cost = HEROES[id].unlock;
    if (!this.canPay({ gold: cost.gold, fruit: cost.fruit, amount: cost.amount })) {
      return false;
    }
    this.pay({ gold: cost.gold, fruit: cost.fruit, amount: cost.amount });
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
    const gold = ROUTES[id].unlockGold;
    if (!this.canPay({ gold })) return false;
    this.pay({ gold });
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
    if (cost.gold != null) return `${cost.gold}g`;
    if (cost.fruit && cost.amount != null) {
      return `${cost.amount} ${cost.fruit}`;
    }
    return "free";
  }
}

export const store = new Store();
