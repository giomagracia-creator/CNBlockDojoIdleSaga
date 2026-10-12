import type Phaser from "phaser";
import { audio } from "../game/audio.ts";
import {
  HEROES,
  RELICS,
  ROUTES,
  SHOP_ITEMS,
  UPGRADES,
  rankFor,
  upgradeCost,
  type HeroId,
  type LootDrop,
  type RouteId,
  type ShopItemId,
  type UpgradeId,
} from "../game/catalog.ts";
import { store } from "../game/save.ts";

type Panel = "scroll" | "shop" | "workshop" | "heroes" | "routes" | "settings";

type Draft = {
  upgrades: UpgradeId[];
  shop: ShopItemId[];
  hero: HeroId;
  route: RouteId;
  music: number;
  sfx: number;
};

const overlay = () => document.getElementById("overlay") as HTMLElement;
const titleCard = () => document.getElementById("title-card") as HTMLElement;
const menuCard = () => document.getElementById("menu-card") as HTMLElement;
const lootCard = () => document.getElementById("loot-card") as HTMLElement;
const cardBody = () => document.getElementById("card-body") as HTMLElement;
const menuBtn = () => document.getElementById("btn-menu") as HTMLButtonElement;
const applyBtn = () => document.getElementById("btn-apply") as HTMLButtonElement;
const draftNote = () => document.getElementById("draft-note") as HTMLElement;

let openPanel: Panel = "scroll";
let menuOpen = false;
let draft = snapshotDraft();
let sealedMusic = store.data.music;
let sealedSfx = store.data.sfx;
let haul: LootDrop[] = [];
let haulTimer = 0;
let haulStarted = 0;

function snapshotDraft(): Draft {
  return {
    upgrades: [],
    shop: [],
    hero: store.data.hero,
    route: store.data.route,
    music: store.data.music,
    sfx: store.data.sfx,
  };
}

function draftDirty(): boolean {
  return (
    draft.upgrades.length > 0 ||
    draft.shop.length > 0 ||
    draft.hero !== store.data.hero ||
    draft.route !== store.data.route ||
    draft.music !== sealedMusic ||
    draft.sfx !== sealedSfx
  );
}

function queuedGold(): number {
  let gold = 0;
  const counts: Partial<Record<UpgradeId, number>> = {};
  for (const id of draft.upgrades) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) continue;
    const already = store.data.upgrades[id] + (counts[id] ?? 0);
    gold += upgradeCost(def, already).gold;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  for (const id of draft.shop) {
    const item = SHOP_ITEMS.find((entry) => entry.id === id);
    if (item) gold += item.gold;
  }
  if (!store.data.unlockedHeroes.includes(draft.hero)) gold += HEROES[draft.hero].unlock.gold;
  if (!store.data.unlockedRoutes.includes(draft.route)) gold += ROUTES[draft.route].unlockGold;
  return gold;
}

export function mountShell(instance: Phaser.Game): void {
  overlay().hidden = false;
  lootCard().hidden = true;
  syncOverlay();
  window.addEventListener("resize", syncOverlay);
  instance.scale.on("resize", syncOverlay);

  document.getElementById("btn-play")?.addEventListener("click", startWatching);
  document.getElementById("btn-title-settings")?.addEventListener("click", () => {
    audio.unlock();
    startWatching();
    openMenu("settings");
  });
  document.getElementById("btn-card-close")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    audio.click();
    closeMenu(false);
  });
  menuBtn().addEventListener("click", () => {
    if (menuOpen) closeMenu(false);
    else openMenu(openPanel);
  });
  applyBtn().addEventListener("click", applyDraft);
  document.getElementById("card-tabs")?.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest("button[data-panel]");
    if (!btn) return;
    openPanel = btn.getAttribute("data-panel") as Panel;
    audio.click();
    renderMenu();
  });
  store.on(renderHud);
  instance.events.on("dojo-hp", (info: { hp: number; max: number }) => {
    const hp = document.getElementById("hp-count");
    if (hp) hp.textContent = `${info.hp}/${info.max}`;
  });
  instance.events.on("level-up", (info: { loot?: LootDrop[] }) => {
    showLoot(info.loot ?? []);
  });
  instance.events.on("dojo-ready", () => {
    syncOverlay();
    if (store.data.watched) {
      titleCard().hidden = true;
      menuBtn().hidden = false;
      audio.unlock();
      audio.startTheme(ROUTES[store.data.route].music);
    }
  });
  renderHud();
}

function startWatching(): void {
  audio.unlock();
  audio.startTheme(ROUTES[store.data.route].music);
  store.markWatched();
  titleCard().hidden = true;
  menuBtn().hidden = false;
  hideLoot();
  audio.click();
}

function openMenu(panel: Panel): void {
  audio.click();
  menuOpen = true;
  openPanel = panel;
  if (!draftDirty()) draft = snapshotDraft();
  menuCard().hidden = false;
  renderMenu();
}

function closeMenu(keepDraft: boolean): void {
  menuOpen = false;
  menuCard().hidden = true;
  menuCard().setAttribute("hidden", "");
  if (!keepDraft) {
    store.data.music = sealedMusic;
    store.data.sfx = sealedSfx;
    audio.applyVolumes();
    draft = snapshotDraft();
  }
}

function renderMenu(): void {
  const rank = document.getElementById("card-rank");
  if (rank) rank.textContent = `${rankFor(store.data.level)} · LV ${store.data.level}`;
  document.querySelectorAll("#card-tabs button").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-panel") === openPanel);
  });
  if (openPanel === "scroll") cardBody().innerHTML = scrollHtml();
  if (openPanel === "shop") cardBody().innerHTML = shopHtml();
  if (openPanel === "workshop") cardBody().innerHTML = workshopHtml();
  if (openPanel === "heroes") cardBody().innerHTML = heroesHtml();
  if (openPanel === "routes") cardBody().innerHTML = routesHtml();
  if (openPanel === "settings") cardBody().innerHTML = settingsHtml();
  bindPanel();
  paintDraft();
}

function scrollHtml(): string {
  const s = store.stats();
  const relics = store.data.relics.length
    ? store.data.relics.map((id) => RELICS[id].name).join(" · ")
    : "None yet. Level up to open tribute chests.";
  return `<div class="stat-grid">
    <div class="stat">ATK <b>${s.atk}</b></div>
    <div class="stat">HP <b>${s.maxHp}</b></div>
    <div class="stat">CRIT <b>${Math.round(s.crit * 100)}%</b></div>
    <div class="stat">SPD <b>${Math.round(s.speed)}</b></div>
  </div>
  <p class="note">Fruit heals. Crates mint coins. Monsters grant XP.</p>
  <p class="note">Relics: ${relics}</p>
  <p class="note">Stripes ${store.data.stripes} · Kills ${store.data.kills}</p>`;
}

function shopHtml(): string {
  const playerLevel = store.data.level;
  const need = store.needXp();
  const queuedCost = draft.shop.reduce((sum, id) => {
    const item = SHOP_ITEMS.find((entry) => entry.id === id);
    return sum + (item?.gold ?? 0);
  }, 0);
  const confirmLabel = queuedCost > 0 ? `CONFIRM BUY · ${queuedCost} coins` : "CONFIRM BUY";
  const rows = SHOP_ITEMS.map((item) => {
    const owned = store.shopOwned(item.id);
    const queued = draft.shop.includes(item.id);
    const unlocked = playerLevel >= item.level;
    const locked = !owned && !unlocked;
    let label = `Queue ${item.gold} coins`;
    if (owned) label = "OWNED";
    else if (locked) label = `Need LV ${item.level}`;
    else if (queued) label = "Remove";
    const state = owned ? "owned" : queued ? "queued" : locked ? "locked" : "";
    return `<div class="row shop-row ${state}">
      <div>
        <h3><span class="tier">LV ${item.level}</span> ${item.name}</h3>
        <p>${item.blurb}</p>
      </div>
      <button class="row-btn" data-shop="${item.id}" ${owned || locked ? "disabled" : ""}>${label}</button>
    </div>`;
  }).join("");
  return `<div class="shop-wallet">
    <div class="wallet-chip gold">Wallet <b>${store.data.gold}</b> coins</div>
    <div class="wallet-chip lv">LV <b>${playerLevel}</b></div>
    <div class="wallet-chip xp">XP <b>${store.data.exp} / ${need}</b></div>
    <button class="pix-btn shop-confirm" id="btn-shop-confirm" type="button" ${queuedCost ? "" : "disabled"}>
      <img src="/assets/ui/play.png" alt="" />
      <span>${confirmLabel}</span>
    </button>
  </div>
  <p class="note shop-hint">Best gear is on top. Scroll the whole shop. You can only buy a tier once you reach that level.</p>
  <div class="grid shop-grid">${rows}</div>`;
}

function workshopHtml(): string {
  const queued: Partial<Record<UpgradeId, number>> = {};
  for (const id of draft.upgrades) queued[id] = (queued[id] ?? 0) + 1;
  return `<div class="grid">${UPGRADES.map((up) => {
    const pending = queued[up.id] ?? 0;
    const level = store.data.upgrades[up.id] + pending;
    const cost = upgradeCost(up, level);
    return `<div class="row ${pending ? "queued" : ""}">
      <div>
        <h3>${up.name} <span class="note">Lv ${level}${pending ? ` (+${pending})` : ""}</span></h3>
        <p>${up.blurb}</p>
      </div>
      <button class="row-btn" data-up="${up.id}">Queue ${cost.gold}g</button>
    </div>`;
  }).join("")}</div>`;
}

function heroesHtml(): string {
  return `<div class="grid">${(Object.keys(HEROES) as HeroId[])
    .map((id) => {
      const hero = HEROES[id];
      const unlocked = store.data.unlockedHeroes.includes(id);
      const selected = draft.hero === id;
      const label = selected
        ? "Chosen"
        : unlocked
          ? "Choose"
          : `Queue ${hero.unlock.gold}g · LV ${hero.unlock.level}`;
      return `<div class="row hero-card ${selected ? "queued" : ""}">
        <div class="preview-wrap"><img src="/assets/heroes/${id}/idle.png" alt="" /></div>
        <div>
          <h3>${hero.name}</h3>
          <p>${hero.role}. ${hero.blurb}</p>
        </div>
        <button class="row-btn" data-hero="${id}" ${selected ? "disabled" : ""}>${label}</button>
      </div>`;
    })
    .join("")}</div>`;
}

function routesHtml(): string {
  return `<div class="grid">${(Object.keys(ROUTES) as RouteId[])
    .map((id) => {
      const route = ROUTES[id];
      const unlocked = store.data.unlockedRoutes.includes(id);
      const selected = draft.route === id;
      const label = selected
        ? "Chosen"
        : unlocked
          ? "Choose"
          : `Queue ${route.unlockGold}g · LV ${route.unlockLevel}`;
      return `<div class="row ${selected ? "queued" : ""}">
        <div>
          <h3><img src="/assets/ui/lv${route.number}.png" alt="" style="width:19px;height:17px;image-rendering:pixelated;vertical-align:middle" /> ${route.name}</h3>
          <p>Heal fruit: ${route.fruits.join(" · ")}</p>
        </div>
        <button class="row-btn" data-route="${id}" ${selected ? "disabled" : ""}>${label}</button>
      </div>`;
    })
    .join("")}</div>`;
}

function settingsHtml(): string {
  return `<div>
    <div class="slider-row">
      <label for="music-vol">Music ${Math.round(draft.music * 100)}</label>
      <input id="music-vol" type="range" min="0" max="100" value="${Math.round(draft.music * 100)}" />
    </div>
    <div class="slider-row">
      <label for="sfx-vol">Hits ${Math.round(draft.sfx * 100)}</label>
      <input id="sfx-vol" type="range" min="0" max="100" value="${Math.round(draft.sfx * 100)}" />
    </div>
    <p class="note">Sliders preview now. APPLY writes them to the scroll.</p>
  </div>`;
}

function bindPanel(): void {
  cardBody().querySelectorAll<HTMLButtonElement>("[data-shop]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shop as ShopItemId;
      const item = SHOP_ITEMS.find((entry) => entry.id === id);
      if (!item) return;
      if (store.shopOwned(id) || store.data.level < item.level) {
        audio.deny();
        return;
      }
      if (draft.shop.includes(id)) {
        draft.shop = draft.shop.filter((queued) => queued !== id);
      } else {
        draft.shop.push(id);
      }
      audio.click();
      renderMenu();
    });
  });
  document.getElementById("btn-shop-confirm")?.addEventListener("click", () => {
    audio.click();
    applyDraft();
  });
  cardBody().querySelectorAll<HTMLButtonElement>("[data-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      draft.upgrades.push(btn.dataset.up as UpgradeId);
      audio.click();
      renderMenu();
    });
  });
  cardBody().querySelectorAll<HTMLButtonElement>("[data-hero]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.hero as HeroId;
      const need = HEROES[id].unlock;
      if (!store.data.unlockedHeroes.includes(id) && store.data.level < need.level) {
        audio.deny();
        return;
      }
      draft.hero = id;
      audio.click();
      renderMenu();
    });
  });
  cardBody().querySelectorAll<HTMLButtonElement>("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.route as RouteId;
      if (!store.data.unlockedRoutes.includes(id) && store.data.level < ROUTES[id].unlockLevel) {
        audio.deny();
        return;
      }
      draft.route = id;
      audio.click();
      renderMenu();
    });
  });
  const music = document.getElementById("music-vol") as HTMLInputElement | null;
  const sfx = document.getElementById("sfx-vol") as HTMLInputElement | null;
  if (music && sfx) {
    const preview = () => {
      draft.music = Number(music.value) / 100;
      draft.sfx = Number(sfx.value) / 100;
      store.data.music = draft.music;
      store.data.sfx = draft.sfx;
      audio.unlock();
      audio.applyVolumes();
      paintDraft();
    };
    music.addEventListener("input", preview);
    sfx.addEventListener("input", preview);
  }
}

function paintDraft(): void {
  const dirty = draftDirty();
  applyBtn().disabled = !dirty;
  const label = applyBtn().querySelector("span");
  if (label) label.textContent = openPanel === "shop" || draft.shop.length ? "CONFIRM BUY" : "APPLY";
  const cost = queuedGold();
  if (!dirty) {
    draftNote().textContent = "No unsealed changes.";
    draftNote().classList.remove("flash-seal");
    return;
  }
  draftNote().textContent =
    cost > 0 ? `Unsealed · ${cost} coins on CONFIRM` : "Unsealed changes · CONFIRM / APPLY to keep them";
}

function applyDraft(): void {
  if (!draftDirty()) return;
  const spentHero = !store.data.unlockedHeroes.includes(draft.hero);
  const spentRoute = !store.data.unlockedRoutes.includes(draft.route);
  if (queuedGold() > store.data.gold) {
    audio.deny();
    draftNote().textContent = "Not enough coins to seal this scroll.";
    return;
  }
  for (const id of draft.shop) {
    if (!store.buyShop(id)) {
      audio.deny();
      draftNote().textContent = "Could not buy every queued shop item.";
      renderMenu();
      return;
    }
  }
  for (const id of draft.upgrades) {
    if (!store.buyUpgrade(id)) {
      audio.deny();
      draftNote().textContent = "Could not buy every queued art.";
      renderMenu();
      return;
    }
  }
  if (spentHero && !store.unlockHero(draft.hero)) {
    audio.deny();
    return;
  }
  store.setHero(draft.hero);
  if (spentRoute && !store.unlockRoute(draft.route)) {
    audio.deny();
    return;
  }
  store.setRoute(draft.route);
  store.setVolumes(draft.music, draft.sfx);
  sealedMusic = draft.music;
  sealedSfx = draft.sfx;
  audio.applyVolumes();
  audio.startTheme(ROUTES[store.data.route].music);
  audio.applySeal();
  draft = snapshotDraft();
  draftNote().textContent = "Sealed. The mat has your changes.";
  draftNote().classList.add("flash-seal");
  renderMenu();
  paintDraft();
}

function hideLoot(): void {
  window.clearTimeout(haulTimer);
  haulTimer = 0;
  haulStarted = 0;
  haul = [];
  lootCard().hidden = true;
}

function showLoot(drops: LootDrop[]): void {
  if (!drops.length) return;
  if (!haulStarted) haulStarted = Date.now();
  haul = haul.concat(drops);
  lootCard().hidden = false;
  const levels = haul.map((d) => d.level);
  const title = document.getElementById("loot-title");
  if (title) {
    title.textContent = levels.length === 1 ? `Level ${levels[0]} opened` : `Levels ${levels.join(" · ")} opened`;
  }
  const list = document.getElementById("loot-haul") as HTMLElement;
  list.innerHTML = haul
    .map((drop) => `<div>+${drop.gold} coins · ${RELICS[drop.relic].name} — ${RELICS[drop.relic].blurb}</div>`)
    .join("");
  audio.chest();
  const remaining = Math.max(350, 2000 - (Date.now() - haulStarted));
  window.clearTimeout(haulTimer);
  haulTimer = window.setTimeout(hideLoot, remaining);
}

function renderHud(): void {
  const gold = document.getElementById("gold-count");
  const lv = document.getElementById("lv-count");
  const xpLabel = document.getElementById("xp-label");
  const fill = document.getElementById("xp-fill");
  if (gold) gold.textContent = String(store.data.gold);
  if (lv) lv.textContent = String(store.data.level);
  const need = store.needXp();
  if (xpLabel) xpLabel.textContent = `${store.data.exp} / ${need} XP`;
  if (fill) fill.style.width = `${Math.min(100, (store.data.exp / need) * 100)}%`;
  if (menuOpen) renderMenu();
}

export function syncOverlay(): void {
  const layer = overlay();
  layer.style.left = "0";
  layer.style.top = "0";
  layer.style.width = "100%";
  layer.style.height = "100%";
}
