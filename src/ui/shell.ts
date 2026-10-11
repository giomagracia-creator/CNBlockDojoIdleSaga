import type Phaser from "phaser";
import { audio } from "../game/audio.ts";
import {
  FRUIT_ORDER,
  HEROES,
  ROUTES,
  UPGRADES,
  upgradeCost,
  type FruitId,
  type HeroId,
  type RouteId,
} from "../game/catalog.ts";
import { store } from "../game/save.ts";

type Panel = "workshop" | "heroes" | "routes" | "settings";

const overlay = () => document.getElementById("overlay") as HTMLElement;
const titleCard = () => document.getElementById("title-card") as HTMLElement;
const drawer = () => document.getElementById("drawer") as HTMLElement;
const drawerTitle = () => document.getElementById("drawer-title") as HTMLElement;
const drawerBody = () => document.getElementById("drawer-body") as HTMLElement;
const dock = () => document.getElementById("dock") as HTMLElement;

let openPanel: Panel | null = null;

export function mountShell(instance: Phaser.Game): void {
  overlay().hidden = false;
  syncOverlay();
  window.addEventListener("resize", syncOverlay);
  instance.scale.on("resize", syncOverlay);

  document.getElementById("btn-play")?.addEventListener("click", startWatching);
  document.getElementById("btn-title-settings")?.addEventListener("click", () => {
    audio.unlock();
    startWatching();
    openDrawer("settings");
  });
  document.getElementById("btn-drawer-close")?.addEventListener("click", () => {
    audio.click();
    closeDrawer();
  });
  dock().addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest("button[data-panel]");
    if (!btn) return;
    const panel = btn.getAttribute("data-panel") as Panel;
    if (openPanel === panel) closeDrawer();
    else openDrawer(panel);
  });

  store.on(renderHud);
  instance.events.on("dojo-hp", (info: { hp: number; max: number }) => {
    const hp = document.getElementById("hp-count");
    if (hp) hp.textContent = `${info.hp}/${info.max}`;
  });
  instance.events.on("dojo-ready", () => {
    syncOverlay();
    if (store.data.watched) {
      titleCard().hidden = true;
      dock().hidden = false;
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
  dock().hidden = false;
  audio.click();
}

function openDrawer(panel: Panel): void {
  audio.click();
  openPanel = panel;
  drawer().hidden = false;
  drawerTitle().textContent =
    panel === "workshop" ? "Workshop" : panel === "heroes" ? "Students" : panel === "routes" ? "Routes" : "Sound";
  dock().querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-panel") === panel);
  });
  renderPanel(panel);
}

function closeDrawer(): void {
  openPanel = null;
  drawer().hidden = true;
  dock().querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
}

function renderPanel(panel: Panel): void {
  if (panel === "workshop") drawerBody().innerHTML = workshopHtml();
  if (panel === "heroes") drawerBody().innerHTML = heroesHtml();
  if (panel === "routes") drawerBody().innerHTML = routesHtml();
  if (panel === "settings") drawerBody().innerHTML = settingsHtml();
  bindPanel(panel);
}

function workshopHtml(): string {
  return `<div class="grid">${UPGRADES.map((up) => {
    const level = store.data.upgrades[up.id];
    const cost = upgradeCost(up, level);
    const can = store.canPay(cost);
    return `<div class="row">
      <div>
        <h3>${up.name} <span class="note">Lv ${level}</span></h3>
        <p>${up.blurb}</p>
      </div>
      <button class="row-btn" data-up="${up.id}" ${can ? "" : "disabled"}>${store.formatCost(cost)}</button>
    </div>`;
  }).join("")}</div>`;
}

function heroesHtml(): string {
  return `<div class="grid">${(Object.keys(HEROES) as HeroId[])
    .map((id) => {
      const hero = HEROES[id];
      const unlocked = store.data.unlockedHeroes.includes(id);
      const selected = store.data.hero === id;
      const cost = hero.unlock;
      const label = selected
        ? "On the mat"
        : unlocked
          ? "Send"
          : `Unlock ${cost.gold}g${cost.fruit ? ` + ${cost.amount} ${cost.fruit}` : ""}`;
      return `<div class="row hero-card">
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
      const selected = store.data.route === id;
      const label = selected ? "Running" : unlocked ? "Switch" : `Unlock ${route.unlockGold}g`;
      return `<div class="row">
        <div>
          <h3><img src="/assets/ui/lv${route.number}.png" alt="" style="width:19px;height:17px;image-rendering:pixelated;vertical-align:middle" /> ${route.name}</h3>
          <p>${route.fruits.join(" · ")} / ${route.enemies.join(" · ")}</p>
        </div>
        <button class="row-btn" data-route="${id}" ${selected ? "disabled" : ""}>${label}</button>
      </div>`;
    })
    .join("")}</div>`;
}

function settingsHtml(): string {
  return `<div>
    <div class="slider-row">
      <label for="music-vol">Music ${Math.round(store.data.music * 100)}</label>
      <input id="music-vol" type="range" min="0" max="100" value="${Math.round(store.data.music * 100)}" />
    </div>
    <div class="slider-row">
      <label for="sfx-vol">Hits ${Math.round(store.data.sfx * 100)}</label>
      <input id="sfx-vol" type="range" min="0" max="100" value="${Math.round(store.data.sfx * 100)}" />
    </div>
    <p class="note">Stripes walked: ${store.data.stripes} · Monsters stomped: ${store.data.kills}</p>
    <p class="note">The student never leaves the mat. A knockdown is just a knockdown.</p>
  </div>`;
}

function bindPanel(panel: Panel): void {
  if (panel === "workshop") {
    drawerBody().querySelectorAll<HTMLButtonElement>("[data-up]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.up as (typeof UPGRADES)[number]["id"];
        if (store.buyUpgrade(id)) audio.buy();
        else audio.deny();
        renderPanel("workshop");
      });
    });
  }
  if (panel === "heroes") {
    drawerBody().querySelectorAll<HTMLButtonElement>("[data-hero]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.hero as HeroId;
        if (!store.data.unlockedHeroes.includes(id)) {
          if (store.unlockHero(id)) {
            audio.buy();
            store.setHero(id);
          } else audio.deny();
        } else if (store.setHero(id)) {
          audio.click();
        } else audio.deny();
        renderPanel("heroes");
      });
    });
  }
  if (panel === "routes") {
    drawerBody().querySelectorAll<HTMLButtonElement>("[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.route as RouteId;
        if (!store.data.unlockedRoutes.includes(id)) {
          if (store.unlockRoute(id)) {
            audio.buy();
            store.setRoute(id);
          } else audio.deny();
        } else if (store.setRoute(id)) {
          audio.click();
        } else audio.deny();
        renderPanel("routes");
      });
    });
  }
  if (panel === "settings") {
    const music = document.getElementById("music-vol") as HTMLInputElement;
    const sfx = document.getElementById("sfx-vol") as HTMLInputElement;
    const apply = () => {
      store.setVolumes(Number(music.value) / 100, Number(sfx.value) / 100);
      audio.unlock();
      audio.applyVolumes();
      renderPanel("settings");
    };
    music.addEventListener("input", apply);
    sfx.addEventListener("input", apply);
  }
}

function renderHud(): void {
  const gold = document.getElementById("gold-count");
  const stripes = document.getElementById("stripe-count");
  const fruits = document.getElementById("fruit-row");
  if (gold) gold.textContent = String(store.data.gold);
  if (stripes) stripes.textContent = String(store.data.stripes);
  if (fruits) {
    fruits.innerHTML = FRUIT_ORDER.filter((id) => store.data.fruit[id] > 0)
      .map(
        (id: FruitId) =>
          `<span class="chip fruit-chip"><span class="fruit-ico"><img src="/assets/items/fruits/${id}.png" alt="" /></span>${store.data.fruit[id]}</span>`,
      )
      .join("");
  }
  if (openPanel) renderPanel(openPanel);
}

export function syncOverlay(): void {
  const canvas = document.querySelector("#game canvas") as HTMLCanvasElement | null;
  const layer = overlay();
  if (!canvas) {
    layer.style.inset = "0";
    return;
  }
  const rect = canvas.getBoundingClientRect();
  layer.style.left = `${rect.left}px`;
  layer.style.top = `${rect.top}px`;
  layer.style.width = `${rect.width}px`;
  layer.style.height = `${rect.height}px`;
}
