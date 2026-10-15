import Phaser from "phaser";
import { heroAnim } from "../assets.ts";
import { CLASS_OF_16, type FarmJob } from "../classRoster.ts";
import { VIEW_H, VIEW_W } from "../catalog.ts";
import {
  applyFarmCommand,
  loadFarmState,
  onFarmCommand,
  saveFarmState,
  type FarmCommand,
  type FarmState,
} from "../farmBus.ts";
import { store } from "../save.ts";

type Plot = {
  x: number;
  y: number;
  ripe: boolean;
  grow: number;
  mark: Phaser.GameObjects.Arc;
};

type Vein = {
  x: number;
  y: number;
  hp: number;
  sprite: Phaser.GameObjects.Image;
};

type Kid = {
  id: number;
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  tx: number;
  ty: number;
  job: FarmJob;
  locked: boolean;
  cooldown: number;
};

type Meteor = {
  sprite: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  dead?: boolean;
};

export class FarmScene extends Phaser.Scene {
  private kids: Kid[] = [];
  private plots: Plot[] = [];
  private veins: Vein[] = [];
  private meteors: Meteor[] = [];
  private state: FarmState = loadFarmState();
  private unsub: (() => void) | null = null;
  private meteorQueued = 0;
  private banner!: Phaser.GameObjects.Text;

  constructor() {
    super("farm");
  }

  create(): void {
    this.state = loadFarmState();
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBackgroundColor("#1a1024");

    this.add.rectangle(0, 0, VIEW_W, 92, 0x2a1838).setOrigin(0, 0);
    this.add.rectangle(0, 88, VIEW_W, VIEW_H - 88, 0x3d2a18).setOrigin(0, 0);
    this.add.rectangle(0, 86, VIEW_W, 6, 0x5a3a20).setOrigin(0, 0);

    for (let i = 0; i < 7; i++) {
      const x = 18 + i * 54;
      this.add.rectangle(x, 28, 22, 10, 0xff8a3a, 0.35).setOrigin(0.5);
    }

    this.banner = this.add
      .text(8, 6, "PUMPKIN PATCH\nCLASS OF 16", {
        fontFamily: "Thaleah, monospace",
        fontSize: "8px",
        color: "#f4efe4",
      })
      .setDepth(20)
      .setLineSpacing(2);

    this.plots = [];
    for (let i = 0; i < 12; i++) {
      const x = 28 + (i % 6) * 56;
      const y = 118 + Math.floor(i / 6) * 36;
      const mark = this.add.circle(x, y, 7, 0x6a3a12).setDepth(3);
      this.plots.push({ x, y, ripe: i % 3 === 0, grow: i % 5, mark });
      this.paintPlot(this.plots[i]);
    }

    this.veins = [];
    const rocks = [
      { x: 330, y: 124 },
      { x: 348, y: 152 },
      { x: 312, y: 168 },
      { x: 360, y: 188 },
    ];
    for (const rock of rocks) {
      const sprite = this.add.image(rock.x, rock.y, "rock-idle").setDepth(4).setScale(0.7);
      this.veins.push({ x: rock.x, y: rock.y, hp: 4, sprite });
    }

    this.kids = CLASS_OF_16.map((def, index) => {
      const row = this.state.students[index];
      const x = 24 + (index % 8) * 44;
      const y = 100 + Math.floor(index / 8) * 22;
      const sprite = this.add.sprite(x, y, `${def.hero}-idle`).setDepth(6).setScale(0.7);
      sprite.setOrigin(0.5, 1);
      sprite.setTint(def.tint);
      sprite.play(heroAnim(def.hero, "idle"));
      const label = this.add
        .text(x, y + 2, def.name, {
          fontFamily: "Thaleah, monospace",
          fontSize: "6px",
          color: "#f4efe4",
        })
        .setOrigin(0.5, 0)
        .setDepth(7);
      return {
        id: def.id,
        name: def.name,
        sprite,
        label,
        tx: x,
        ty: y,
        job: row?.job ?? "farm",
        locked: row?.locked ?? false,
        cooldown: 200 + index * 80,
      };
    });

    this.unsub = onFarmCommand((cmd) => this.onCommand(cmd));
    this.game.events.emit("farm-ready");
    this.refreshBanner();
  }

  shutdown(): void {
    this.unsub?.();
    this.unsub = null;
  }

  private onCommand(cmd: FarmCommand): void {
    this.state = applyFarmCommand(this.state, cmd);
    saveFarmState(this.state);
    if (cmd.type === "meteor") this.meteorQueued += 1;
    for (const kid of this.kids) {
      const row = this.state.students.find((s) => s.id === kid.id);
      if (!row) continue;
      kid.job = row.job;
      kid.locked = row.locked;
      kid.sprite.setAlpha(row.locked ? 0.45 : 1);
    }
    this.refreshBanner();
  }

  private paintPlot(plot: Plot): void {
    plot.mark.setFillStyle(plot.ripe ? 0xe07020 : 0x6a3a12);
    plot.mark.setRadius(plot.ripe ? 8 : 5);
  }

  private refreshBanner(): void {
    const pumpkins = this.state.students.reduce((n, s) => n + s.pumpkins, 0);
    const ore = this.state.students.reduce((n, s) => n + s.ore, 0);
    this.banner.setText(
      `PATCH  CLASS OF 16\n${pumpkins} gourds  ${ore} ore  M${this.state.meteorCount}`,
    );
  }

  update(_t: number, dt: number): void {
    if (this.meteorQueued > 0) {
      this.meteorQueued -= 1;
      this.spawnMeteorWave();
    }

    for (const plot of this.plots) {
      if (plot.ripe) continue;
      plot.grow += dt;
      if (plot.grow > 4200) {
        plot.ripe = true;
        this.paintPlot(plot);
      }
    }

    for (const meteor of this.meteors) {
      if (meteor.dead) continue;
      meteor.sprite.x += meteor.vx * (dt / 16);
      meteor.sprite.y += meteor.vy * (dt / 16);
      if (meteor.sprite.y > 188) {
        this.impact(meteor.sprite.x, 186);
        meteor.sprite.destroy();
        meteor.dead = true;
      }
    }
    this.meteors = this.meteors.filter((m) => !m.dead);

    for (const kid of this.kids) {
      kid.cooldown -= dt;
      if (kid.locked) {
        kid.sprite.play(heroAnim(CLASS_OF_16[kid.id].hero, "idle"), true);
        continue;
      }
      const dest = this.pickDest(kid);
      kid.tx = dest.x;
      kid.ty = dest.y;
      const dx = kid.tx - kid.sprite.x;
      const dy = kid.ty - kid.sprite.y;
      const dist = Math.hypot(dx, dy);
      const hero = CLASS_OF_16[kid.id].hero;
      if (dist > 2) {
        const step = 0.22 * dt;
        kid.sprite.x += (dx / dist) * step;
        kid.sprite.y += (dy / dist) * step;
        kid.sprite.setFlipX(dx < 0);
        kid.sprite.play(heroAnim(hero, "run"), true);
      } else {
        kid.sprite.play(heroAnim(hero, "idle"), true);
        if (kid.cooldown <= 0) this.work(kid);
      }
      kid.label.setPosition(kid.sprite.x, kid.sprite.y + 2);
    }
  }

  private pickDest(kid: Kid): { x: number; y: number } {
    if (kid.job === "mine") {
      const vein = this.veins.filter((v) => v.hp > 0).sort((a, b) => a.hp - b.hp)[0];
      if (vein) return { x: vein.x - 10, y: vein.y + 4 };
    }
    const ripe = this.plots.find((p) => p.ripe);
    if (ripe && kid.job !== "idle") return { x: ripe.x, y: ripe.y + 6 };
    return { x: 40 + (kid.id % 8) * 40, y: 200 };
  }

  private work(kid: Kid): void {
    kid.cooldown = 900 + kid.id * 40;
    const row = this.state.students.find((s) => s.id === kid.id);
    if (!row) return;
    if (kid.job === "mine") {
      const vein = this.veins.find((v) => v.hp > 0 && Math.hypot(v.x - kid.sprite.x, v.y - kid.sprite.y) < 18);
      if (!vein) return;
      vein.hp -= 1;
      vein.sprite.setTint(0xffcc88);
      this.time.delayedCall(80, () => vein.sprite.clearTint());
      if (vein.hp <= 0) {
        vein.sprite.setAlpha(0.25);
        row.ore += 2;
        store.addGold(3);
        this.grantExp(4);
        this.time.delayedCall(6000, () => {
          vein.hp = 4;
          vein.sprite.setAlpha(1);
        });
      } else {
        row.ore += 1;
        store.addGold(1);
        this.grantExp(1);
      }
    } else if (kid.job !== "idle") {
      const plot = this.plots.find((p) => p.ripe && Math.hypot(p.x - kid.sprite.x, p.y - kid.sprite.y) < 16);
      if (!plot) return;
      plot.ripe = false;
      plot.grow = 0;
      this.paintPlot(plot);
      row.pumpkins += 1;
      store.addGold(2);
      this.grantExp(2);
    }
    saveFarmState(this.state);
    this.refreshBanner();
  }

  private grantExp(n: number): void {
    const loot = store.addExp(n);
    if (loot.length) this.game.events.emit("level-up", { loot });
  }

  private spawnMeteorWave(): void {
    for (let i = 0; i < 5; i++) {
      const x = 40 + Math.random() * 280;
      const sprite = this.add.rectangle(x, -8 - i * 12, 3, 10, 0xff6a2a).setDepth(12).setRotation(0.5);
      this.meteors.push({ sprite, vx: 1.6, vy: 3.4 + i * 0.2 });
    }
    this.game.events.emit("farm-meteor");
  }

  private impact(x: number, y: number): void {
    const flash = this.add.circle(x, y, 10, 0xffcc66, 0.8).setDepth(11);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 280,
      onComplete: () => flash.destroy(),
    });
    store.addGold(4);
    this.grantExp(3);
    const nearest = this.veins
      .filter((v) => v.hp > 0)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (nearest && Math.hypot(nearest.x - x, nearest.y - y) < 40) {
      nearest.hp = 0;
      nearest.sprite.setAlpha(0.25);
      this.time.delayedCall(5000, () => {
        nearest.hp = 4;
        nearest.sprite.setAlpha(1);
      });
    }
  }
}
