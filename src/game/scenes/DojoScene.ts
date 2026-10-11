import Phaser from "phaser";
import { audio } from "../audio.ts";
import { heroAnim } from "../assets.ts";
import {
  ENEMIES,
  GROUND_Y,
  ROUTES,
  STRIPE_EVERY,
  VIEW_H,
  VIEW_W,
  type EnemyId,
  type FruitId,
  type HeroId,
  type RouteId,
} from "../catalog.ts";
import { store, type HeroStats } from "../save.ts";

type Kind = "enemy" | "crate" | "fruit" | "bullet" | "flag";

type Actor = {
  kind: Kind;
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  hp?: number;
  maxHp?: number;
  atk?: number;
  cooldown?: number;
  enemyId?: EnemyId;
  fruit?: FruitId;
  box?: 1 | 2 | 3;
  dead?: boolean;
  ranged?: boolean;
  speed?: number;
};

export class DojoScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Sprite;
  private heroShadow!: Phaser.GameObjects.Image;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBack!: Phaser.GameObjects.Rectangle;
  private bg!: Phaser.GameObjects.TileSprite;
  private ground: Phaser.GameObjects.Image[] = [];
  private actors: Actor[] = [];
  private texts: Phaser.GameObjects.Text[] = [];

  private heroX = 80;
  private heroY = GROUND_Y;
  private hp = 28;
  private maxHp = 28;
  private state: "run" | "hop" | "hurt" | "down" = "run";
  private hopT = 0;
  private hopFrom = 0;
  private hopTo = 0;
  private hopTarget: Actor | null = null;
  private atkCd = 0;
  private iFrames = 0;
  private regen = 0;
  private nextX = 160;
  private nextStripe = STRIPE_EVERY;
  private lastFight = false;
  private heroId: HeroId = "mask";
  private routeId: RouteId = "grove";
  private stats: HeroStats = store.stats();
  private queuedHero: HeroId | null = null;
  private queuedRoute: RouteId | null = null;

  constructor() {
    super("dojo");
  }

  create(): void {
    this.heroId = store.data.hero;
    this.routeId = store.data.route;
    this.stats = store.stats();
    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;

    const route = ROUTES[this.routeId];
    this.bg = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, route.backdrop).setOrigin(0, 0).setScrollFactor(0);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER / 4, VIEW_H);
    this.cameras.main.setRoundPixels(true);

    this.paintGround(0, 40);
    this.heroShadow = this.add.image(this.heroX, GROUND_Y + 2, "fx-shadow").setDepth(2);
    this.hero = this.add.sprite(this.heroX, this.heroY, `${this.heroId}-run`).setDepth(5);
    this.hero.setOrigin(0.5, 1);
    this.playHero("run");

    this.hpBack = this.add.rectangle(this.heroX, this.heroY - 38, 24, 4, 0x2a2030).setDepth(8);
    this.hpBar = this.add.rectangle(this.heroX - 11, this.heroY - 38, 22, 2, 0x86d46c).setOrigin(0, 0.5).setDepth(8);

    this.spawnFlag(40, false);
    this.fillAhead();

    store.on(() => this.onStore());
    this.game.events.emit("dojo-ready");
  }

  private onStore(): void {
    this.stats = store.stats();
    this.maxHp = this.stats.maxHp;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (store.data.hero !== this.heroId) this.queuedHero = store.data.hero;
    if (store.data.route !== this.routeId) this.queuedRoute = store.data.route;
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.stats = store.stats();
    this.applyQueues();
    this.tickHero(dt);
    this.tickActors(dt);
    this.collectAndCombat();
    this.recycle();
    this.fillAhead();
    this.syncView();
  }

  private applyQueues(): void {
    if (this.state !== "run") return;
    if (this.queuedRoute) {
      const next = this.queuedRoute;
      this.queuedRoute = null;
      this.switchRoute(next);
    }
    if (this.queuedHero) {
      const next = this.queuedHero;
      this.queuedHero = null;
      this.swapHero(next);
    }
  }

  private switchRoute(id: RouteId): void {
    this.routeId = id;
    const route = ROUTES[id];
    this.bg.setTexture(route.backdrop);
    for (const tile of this.ground) tile.destroy();
    this.ground = [];
    for (const actor of this.actors) {
      actor.sprite.destroy();
      actor.shadow.destroy();
    }
    this.actors = [];
    this.heroX = Math.max(80, this.heroX);
    this.nextX = this.heroX + 140;
    this.nextStripe = this.heroX + STRIPE_EVERY;
    this.lastFight = false;
    this.paintGround(this.heroX - 80, 50);
    this.spawnFlag(this.heroX + 20, false);
    this.fillAhead();
    this.burst(this.heroX, this.heroY - 20, "fx-confetti");
    audio.startTheme(route.music);
  }

  private swapHero(id: HeroId): void {
    this.heroId = id;
    this.playHero("run");
    this.maxHp = this.stats.maxHp;
    this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.25));
    const pop = this.add.sprite(this.heroX, this.heroY - 8, "hero-appear").setDepth(9);
    pop.setOrigin(0.5, 1);
    pop.play("hero-appear");
    pop.once("animationcomplete", () => pop.destroy());
  }

  private tickHero(dt: number): void {
    this.atkCd = Math.max(0, this.atkCd - dt);
    this.iFrames = Math.max(0, this.iFrames - dt);
    this.regen = Math.max(0, this.regen - dt);
    if (this.regen > 0) {
      this.hp = Math.min(this.maxHp, this.hp + dt * 7);
    }

    if (this.state === "down") {
      this.hopT += dt;
      this.heroY = GROUND_Y - Math.max(0, 10 - this.hopT * 18);
      if (this.hopT > 1.15) {
        this.state = "run";
        this.regen = 2.4;
        this.playHero("run");
      }
      return;
    }

    if (this.state === "hurt") {
      this.hopT += dt;
      if (this.hopT > 0.28) {
        this.state = "run";
        this.playHero("run");
      }
      return;
    }

    if (this.state === "hop") {
      this.hopT += dt;
      const dur = 0.36;
      const t = Math.min(1, this.hopT / dur);
      this.heroX = this.hopFrom + (this.hopTo - this.hopFrom) * t;
      this.heroY = GROUND_Y - Math.sin(t * Math.PI) * 28;
      this.playHero(t < 0.5 ? "jump" : "fall", false);
      if (t >= 1) {
        this.heroY = GROUND_Y;
        this.landHop();
      }
      return;
    }

    this.heroX += this.stats.speed * dt;
    this.heroY = GROUND_Y;
    this.playHero("run", false);

    if (this.atkCd <= 0) {
      const target = this.nearestSmash();
      if (target) this.beginHop(target);
    }
  }

  private beginHop(target: Actor): void {
    this.state = "hop";
    this.hopT = 0;
    this.hopFrom = this.heroX;
    this.hopTo = target.sprite.x - 8;
    this.hopTarget = target;
    this.atkCd = this.stats.interval;
    this.playHero("jump");
  }

  private landHop(): void {
    const target = this.hopTarget;
    this.hopTarget = null;
    this.state = "run";
    this.playHero("run");
    this.dust(this.heroX, GROUND_Y);
    this.cameras.main.shake(80, 0.004);
    audio.stomp();
    if (!target || target.dead) return;
    if (target.kind === "crate") {
      this.smashCrate(target);
      return;
    }
    if (target.kind === "enemy") {
      this.stompEnemy(target);
    }
  }

  private smashCrate(actor: Actor): void {
    const box = actor.box ?? 1;
    if (actor.sprite instanceof Phaser.GameObjects.Sprite) {
      actor.sprite.play(`box${box}-break`);
    }
    actor.dead = true;
    const gold = Math.round((this.stats.crateGold + box) * this.stats.farm);
    store.addGold(gold);
    this.float(`+${gold}g`, actor.sprite.x, actor.sprite.y - 16, "#f2c14e");
    audio.crate();
    audio.coin();
    const route = ROUTES[this.routeId];
    if (Math.random() < 0.85) {
      const fruit = route.fruits[Math.floor(Math.random() * route.fruits.length)] ?? "apple";
      store.addFruit(fruit, 1);
      this.float(`+1`, actor.sprite.x + 8, actor.sprite.y - 24, "#f4efe4");
    }
    this.time.delayedCall(220, () => this.dropActor(actor));
  }

  private stompEnemy(actor: Actor): void {
    const crit = Math.random() < this.stats.crit;
    const dmg = Math.max(1, Math.round(this.stats.atk * (crit ? 1.8 : 1)));
    actor.hp = (actor.hp ?? 1) - dmg;
    this.flash(actor.sprite);
    this.float(crit ? `${dmg}!` : `${dmg}`, actor.sprite.x, actor.sprite.y - 18, crit ? "#f2c14e" : "#fff4e0");
    audio.hit();
    if (actor.sprite instanceof Phaser.GameObjects.Sprite && actor.enemyId) {
      const hit = ENEMIES[actor.enemyId].hitKey;
      if (this.anims.exists(hit)) actor.sprite.play(hit);
    }
    if ((actor.hp ?? 0) <= 0) this.killEnemy(actor);
  }

  private killEnemy(actor: Actor): void {
    actor.dead = true;
    const def = actor.enemyId ? ENEMIES[actor.enemyId] : null;
    const gold = Math.round((def?.gold ?? 4) * this.stats.farm);
    store.addGold(gold);
    store.addKill();
    this.float(`+${gold}g`, actor.sprite.x, actor.sprite.y - 20, "#f2c14e");
    audio.coin();
    const route = ROUTES[this.routeId];
    if (Math.random() < 0.35) {
      const fruit = route.fruits[Math.floor(Math.random() * route.fruits.length)] ?? "apple";
      store.addFruit(fruit, 1);
    }
    this.tweens.add({
      targets: actor.sprite,
      alpha: 0,
      y: actor.sprite.y - 10,
      duration: 180,
      onComplete: () => this.dropActor(actor),
    });
  }

  private tickActors(dt: number): void {
    for (const actor of this.actors) {
      if (actor.dead) continue;
      actor.cooldown = Math.max(0, (actor.cooldown ?? 0) - dt);
      if (actor.kind === "fruit") {
        const dx = this.heroX - actor.sprite.x;
        if (Math.abs(dx) < this.stats.magnet) {
          actor.sprite.x += Math.sign(dx) * 90 * dt;
        } else {
          actor.sprite.y = GROUND_Y - 18 + Math.sin(this.time.now / 220 + actor.sprite.x) * 3;
        }
      }
      if (actor.kind === "enemy" && actor.enemyId) {
        const def = ENEMIES[actor.enemyId];
        const dist = actor.sprite.x - this.heroX;
        if (!def.ranged && dist > 26) {
          actor.sprite.x -= def.speed * dt;
          this.playIfSprite(actor, def.runKey);
        } else if (!def.ranged) {
          this.playIfSprite(actor, def.idleKey ?? def.runKey, false);
        } else {
          this.playIfSprite(actor, def.idleKey ?? def.runKey, false);
          if ((actor.cooldown ?? 0) <= 0 && dist < 220 && dist > 20) {
            actor.cooldown = def.interval;
            this.playIfSprite(actor, def.attackKey ?? def.runKey);
            this.spawnBullet(actor.sprite.x - 10, actor.sprite.y - 16, def.id === "trunk" ? "trunk-bullet" : "plant-bullet", def.atk);
          }
        }
      }
      if (actor.kind === "bullet") {
        actor.sprite.x -= 90 * dt;
        if (actor.sprite.x < this.heroX - 80) actor.dead = true;
      }
      actor.shadow.x = actor.sprite.x;
      actor.shadow.y = GROUND_Y + 2;
      actor.shadow.setVisible(actor.kind !== "bullet");
    }
  }

  private collectAndCombat(): void {
    for (const actor of this.actors) {
      if (actor.dead) continue;
      const dist = Math.abs(actor.sprite.x - this.heroX);
      if (actor.kind === "fruit" && dist < 14) {
        this.takeFruit(actor);
      }
      if (actor.kind === "flag" && dist < 16 && this.heroX >= actor.sprite.x) {
        this.hitStripe(actor);
      }
      if ((actor.kind === "enemy" || actor.kind === "bullet") && dist < 18 && this.iFrames <= 0 && this.state !== "hop") {
        if (actor.kind === "enemy" && (actor.cooldown ?? 0) > 0 && !actor.ranged) continue;
        if (actor.kind === "enemy") actor.cooldown = ENEMIES[actor.enemyId ?? "slime"].interval;
        this.hurtHero(actor.atk ?? 3);
        if (actor.kind === "bullet") {
          actor.dead = true;
          actor.sprite.destroy();
          actor.shadow.destroy();
        }
      }
    }
  }

  private takeFruit(actor: Actor): void {
    actor.dead = true;
    if (actor.fruit) store.addFruit(actor.fruit, 1);
    this.hp = Math.min(this.maxHp, this.hp + 1);
    audio.fruit();
    this.float("+1", actor.sprite.x, actor.sprite.y - 12, "#b6f29a");
    if (actor.sprite instanceof Phaser.GameObjects.Sprite && this.anims.exists("fruit-collected")) {
      actor.sprite.play("fruit-collected");
      actor.sprite.once("animationcomplete", () => this.dropActor(actor));
    } else {
      this.dropActor(actor);
    }
  }

  private hitStripe(actor: Actor): void {
    actor.dead = true;
    store.addStripe();
    store.addGold(18);
    const fruit = ROUTES[this.routeId].fruits[0] ?? "apple";
    store.addFruit(fruit, 2);
    audio.stripe();
    this.burst(actor.sprite.x, GROUND_Y - 24, "fx-confetti");
    this.float("STRIPE", actor.sprite.x, GROUND_Y - 40, "#f2c14e");
    this.time.delayedCall(400, () => this.dropActor(actor));
  }

  private hurtHero(atk: number): void {
    this.hp -= atk;
    this.iFrames = 0.45;
    this.flash(this.hero);
    audio.hurt();
    this.float(`-${atk}`, this.heroX, this.heroY - 36, "#e07a8a");
    if (this.hp <= 0) {
      this.hp = 1;
      this.state = "down";
      this.hopT = 0;
      this.iFrames = 1.4;
      this.playHero("hit");
      audio.knockdown();
      this.float("DOWN", this.heroX, this.heroY - 48, "#f4efe4");
      return;
    }
    this.state = "hurt";
    this.hopT = 0;
    this.playHero("hit");
  }

  private nearestSmash(): Actor | null {
    let best: Actor | null = null;
    let bestDist = 36;
    for (const actor of this.actors) {
      if (actor.dead) continue;
      if (actor.kind !== "enemy" && actor.kind !== "crate") continue;
      const dist = actor.sprite.x - this.heroX;
      if (dist > 8 && dist < bestDist) {
        best = actor;
        bestDist = dist;
      }
    }
    return best;
  }

  private fillAhead(): void {
    const horizon = this.heroX + VIEW_W + 80;
    while (this.nextX < horizon) {
      if (this.nextX >= this.nextStripe) {
        this.spawnFlag(this.nextStripe, true);
        this.nextStripe += STRIPE_EVERY;
        this.nextX += 90;
        continue;
      }
      this.lastFight = !this.lastFight;
      if (this.lastFight) this.spawnFight(this.nextX);
      else this.spawnFarm(this.nextX);
      this.nextX += 170 + Math.random() * 40;
    }
  }

  private spawnFarm(x: number): void {
    const route = ROUTES[this.routeId];
    const fruits = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < fruits; i += 1) {
      const fruit = route.fruits[i % route.fruits.length] ?? "apple";
      this.spawnFruit(x + i * 28, fruit);
    }
    this.spawnCrate(x + fruits * 28 + 16);
  }

  private spawnFight(x: number): void {
    const route = ROUTES[this.routeId];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      const id = route.enemies[Math.floor(Math.random() * route.enemies.length)] ?? "slime";
      this.spawnEnemy(x + i * 36, id);
    }
  }

  private spawnEnemy(x: number, id: EnemyId): void {
    const def = ENEMIES[id];
    const sprite = this.add.sprite(x, GROUND_Y, def.runKey).setDepth(4);
    sprite.setOrigin(0.5, 1);
    if (this.anims.exists(def.runKey)) sprite.play(def.runKey);
    const shadow = this.add.image(x, GROUND_Y + 2, "fx-shadow").setDepth(2);
    this.actors.push({
      kind: "enemy",
      sprite,
      shadow,
      hp: def.hp + Math.floor(store.data.stripes * 0.6),
      maxHp: def.hp,
      atk: def.atk,
      cooldown: 0.3,
      enemyId: id,
      ranged: def.ranged,
      speed: def.speed,
    });
  }

  private spawnCrate(x: number): void {
    const box = (1 + Math.floor(Math.random() * 3)) as 1 | 2 | 3;
    const sprite = this.add.sprite(x, GROUND_Y, `box${box}-idle`).setDepth(4);
    sprite.setOrigin(0.5, 1);
    const shadow = this.add.image(x, GROUND_Y + 2, "fx-shadow").setDepth(2);
    this.actors.push({ kind: "crate", sprite, shadow, box });
  }

  private spawnFruit(x: number, fruit: FruitId): void {
    const sprite = this.add.sprite(x, GROUND_Y - 18, `fruit-${fruit}`).setDepth(4);
    sprite.setOrigin(0.5, 1);
    if (this.anims.exists(`fruit-${fruit}`)) sprite.play(`fruit-${fruit}`);
    const shadow = this.add.image(x, GROUND_Y + 2, "fx-shadow").setDepth(2).setScale(0.7);
    this.actors.push({ kind: "fruit", sprite, shadow, fruit });
  }

  private spawnFlag(x: number, moving: boolean): void {
    const key = moving ? "flag-move" : "trophy";
    const sprite = this.add.sprite(x, GROUND_Y, key).setDepth(3);
    sprite.setOrigin(0.5, 1);
    if (moving && this.anims.exists("flag-move")) sprite.play("flag-move");
    const shadow = this.add.image(x, GROUND_Y + 2, "fx-shadow").setDepth(2);
    this.actors.push({ kind: "flag", sprite, shadow });
  }

  private spawnBullet(x: number, y: number, key: string, atk: number): void {
    const sprite = this.add.image(x, y, key).setDepth(6);
    const shadow = this.add.image(x, GROUND_Y + 2, "fx-shadow").setDepth(2).setVisible(false);
    this.actors.push({ kind: "bullet", sprite, shadow, atk });
  }

  private paintGround(fromX: number, tiles: number): void {
    const route = ROUTES[this.routeId];
    const start = Math.floor(fromX / 16) * 16;
    for (let i = 0; i < tiles; i += 1) {
      const x = start + i * 16;
      const top = this.add.image(x, GROUND_Y, "terrain", route.topTile).setOrigin(0, 0).setDepth(1);
      const fill = this.add.image(x, GROUND_Y + 16, "terrain", route.fillTile).setOrigin(0, 0).setDepth(1);
      this.ground.push(top, fill);
    }
  }

  private recycle(): void {
    const left = this.heroX - 140;
    this.actors = this.actors.filter((actor) => {
      if (actor.dead || actor.sprite.x < left) {
        actor.sprite.destroy();
        actor.shadow.destroy();
        return false;
      }
      return true;
    });
    this.ground = this.ground.filter((tile) => {
      if (tile.x < left) {
        tile.destroy();
        return false;
      }
      return true;
    });
    const right = this.ground.reduce((m, t) => Math.max(m, t.x), this.heroX);
    if (right < this.heroX + VIEW_W + 48) {
      this.paintGround(right + 16, 12);
    }
  }

  private dropActor(actor: Actor): void {
    actor.dead = true;
    actor.sprite.destroy();
    actor.shadow.destroy();
    this.actors = this.actors.filter((a) => a !== actor);
  }

  private syncView(): void {
    this.hero.x = Math.round(this.heroX);
    this.hero.y = Math.round(this.heroY);
    this.heroShadow.x = this.hero.x;
    this.heroShadow.y = GROUND_Y + 2;
    this.hpBack.setPosition(this.hero.x, this.hero.y - 38);
    this.hpBar.setPosition(this.hero.x - 11, this.hero.y - 38);
    this.hpBar.width = Math.max(1, 22 * (this.hp / this.maxHp));
    this.hpBar.fillColor = this.state === "down" ? 0xe07a8a : 0x86d46c;
    this.cameras.main.scrollX = Math.round(this.heroX - 90);
    this.bg.tilePositionX = this.cameras.main.scrollX * 0.18;
    this.game.events.emit("dojo-hp", { hp: Math.ceil(this.hp), max: this.maxHp });
  }

  private playHero(action: "idle" | "run" | "jump" | "fall" | "hit" | "spin", force = true): void {
    const key = heroAnim(this.heroId, action);
    if (!this.anims.exists(key)) return;
    if (!force && this.hero.anims.currentAnim?.key === key) return;
    this.hero.play(key, true);
  }

  private playIfSprite(actor: Actor, key: string, force = true): void {
    if (!(actor.sprite instanceof Phaser.GameObjects.Sprite)) return;
    if (!this.anims.exists(key)) return;
    if (!force && actor.sprite.anims.currentAnim?.key === key) return;
    if (actor.sprite.anims.currentAnim?.key?.includes("hit") && actor.sprite.anims.isPlaying) return;
    actor.sprite.play(key, true);
  }

  private float(text: string, x: number, y: number, color: string): void {
    const label = this.add
      .text(x, y, text, { fontFamily: "Thaleah, monospace", fontSize: "10px", color })
      .setDepth(12)
      .setOrigin(0.5);
    this.texts.push(label);
    this.tweens.add({
      targets: label,
      y: y - 18,
      alpha: 0,
      duration: 520,
      onComplete: () => {
        label.destroy();
        this.texts = this.texts.filter((t) => t !== label);
      },
    });
  }

  private dust(x: number, y: number): void {
    const p = this.add.image(x, y, "fx-dust").setDepth(7);
    this.tweens.add({
      targets: p,
      y: y - 8,
      alpha: 0,
      duration: 240,
      onComplete: () => p.destroy(),
    });
  }

  private burst(x: number, y: number, key: string): void {
    for (let i = 0; i < 8; i += 1) {
      const bit = this.add.image(x, y, key).setDepth(10);
      if (bit.frame && "setSize" in bit) {
        /* keep */
      }
      this.tweens.add({
        targets: bit,
        x: x + (Math.random() - 0.5) * 50,
        y: y - 10 - Math.random() * 28,
        alpha: 0,
        duration: 420 + Math.random() * 200,
        onComplete: () => bit.destroy(),
      });
    }
  }

  private flash(obj: Phaser.GameObjects.GameObject & { setTint?: (n: number) => void; clearTint?: () => void }): void {
    obj.setTint?.(0xffffff);
    this.time.delayedCall(80, () => obj.clearTint?.());
  }
}
