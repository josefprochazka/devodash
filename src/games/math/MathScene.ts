import * as Phaser from "phaser";
import { makeParticleTextures } from "../phaser/draw";
import { sfx } from "../phaser/sfx";
import { type Creature, makeCreature } from "./creatures";
import type { CreatureType } from "./options";

export const W = 1200;
export const H = 720;

const MAX = 10;
const START_VALUE = 5;

// číselná osa vpravo
const AXIS_X = 1065;
const AXIS_TOP = 170; // y pro 10
const AXIS_BOTTOM = 640; // y pro 0
const axisY = (n: number) => AXIS_BOTTOM - (n / MAX) * (AXIS_BOTTOM - AXIS_TOP);

// místa v jeskyni: dvě řady po pěti (přední řada se plní první)
const SLOT_XS = [175, 320, 465, 610, 755];
const FRONT_Y = 640;
const BACK_Y = 470;
const slot = (i: number) =>
  i < 5 ? { x: SLOT_XS[i], y: FRONT_Y, scale: 1 } : { x: SLOT_XS[i - 5], y: BACK_Y, scale: 0.85 };

/**
 * Matematické objevování – „Kolik je v jeskyni?“ Dítě táhne žlutý knoflík
 * po svislé ose 0–10 a v jeskyni přibývají/ubývají postavičky (dvě řady po
 * pěti, ať je vidět i „pět a ještě…“). Po puštění osy appka číslo přečte
 * nahlas. Typy postaviček a stav (stojí / v pohybu) nastavuje React přes
 * `game.registry` klíče "types" a "active".
 */
export class MathScene extends Phaser.Scene {
  private value = START_VALUE;
  private creatures: Creature[] = [];
  private dragging = false;

  private knob!: Phaser.GameObjects.Container;
  private badge!: Phaser.GameObjects.Text;
  private badgeBox!: Phaser.GameObjects.Container;
  private labels: Phaser.GameObjects.Text[] = [];
  private nothing!: Phaser.GameObjects.Text;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("math");
  }

  create() {
    this.value = START_VALUE;
    this.creatures = [];
    this.labels = [];
    this.dragging = false;

    makeParticleTextures(this);
    this.drawCave();
    this.drawAxis();

    this.dust = this.add
      .particles(0, 0, "p-dust", {
        speed: { min: 60, max: 180 },
        lifespan: 450,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: 0xd6d3d1,
        emitting: false,
      })
      .setDepth(20);

    this.nothing = this.add
      .text(465, 520, "NIC", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "110px",
        fontStyle: "900",
        color: "#d6d3d1",
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);

    this.syncCreatures(false);
    this.updateAxis(false);

    const onTypes = () => this.rebuildCreatures();
    const onActive = () => this.creatures.forEach((c) => c.setActive(this.isActive()));
    this.registry.events.on("changedata-types", onTypes);
    this.registry.events.on("changedata-active", onActive);
    this.input.on("pointerdown", this.onDown, this);
    this.input.on("pointermove", this.onMove, this);
    this.input.on("pointerup", this.onUp, this);
    this.input.on("pointerupoutside", this.onUp, this);
    this.events.once("shutdown", () => {
      this.registry.events.off("changedata-types", onTypes);
      this.registry.events.off("changedata-active", onActive);
      this.input.off("pointerdown", this.onDown, this);
      this.input.off("pointermove", this.onMove, this);
      this.input.off("pointerup", this.onUp, this);
      this.input.off("pointerupoutside", this.onUp, this);
    });
  }

  private types(): CreatureType[] {
    const t = this.registry.get("types") as CreatureType[] | undefined;
    return t && t.length > 0 ? t : ["dwarf"];
  }

  private isActive() {
    return Boolean(this.registry.get("active"));
  }

  // ------------------------------------------------------------- jeskyně

  private drawCave() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0xe0f2fe, 0xe0f2fe, 1);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x65a30d).fillRect(0, H - 40, W, 40);

    // skála kolem jeskyně
    const rock = this.add.graphics().setDepth(1);
    rock.fillStyle(0x78716c).fillRoundedRect(20, 40, 900, 700, { tl: 330, tr: 330, bl: 0, br: 0 });
    rock.fillStyle(0x57534e);
    for (const [x, y, r] of [
      [120, 210, 34],
      [820, 190, 40],
      [470, 70, 28],
      [60, 420, 26],
      [880, 430, 30],
    ] as const) {
      rock.fillCircle(x, y, r);
    }

    // vnitřek jeskyně
    const inside = this.add.graphics().setDepth(2);
    inside.fillGradientStyle(0x292524, 0x292524, 0x44403c, 0x44403c, 1);
    inside.fillRoundedRect(75, 125, 790, 600, { tl: 280, tr: 280, bl: 0, br: 0 });
    inside.fillStyle(0x57534e).fillEllipse(470, 690, 760, 120);
    // krápníky
    inside.fillStyle(0x1c1917);
    for (const [x, len] of [
      [300, 50],
      [380, 34],
      [520, 60],
      [610, 40],
      [690, 30],
    ] as const) {
      inside.fillTriangle(x - 14, 150 + (x % 3) * 8, x + 14, 150 + (x % 3) * 8, x, 150 + len + (x % 3) * 8);
    }

    // třpytící se krystaly
    for (const [x, y, c, d] of [
      [130, 360, 0xa78bfa, 0],
      [800, 330, 0x22d3ee, 500],
      [190, 250, 0xf472b6, 900],
      [760, 230, 0xa78bfa, 300],
    ] as const) {
      const crystal = this.add.graphics({ x, y }).setDepth(3);
      crystal.fillStyle(c).fillTriangle(-10, 14, 0, -20, 10, 14);
      crystal.fillStyle(0xffffff, 0.5).fillTriangle(-3, 8, 0, -12, 3, 8);
      this.tweens.add({ targets: crystal, alpha: 0.45, duration: 800, delay: d, yoyo: true, repeat: -1 });
    }

    // pochodně
    for (const x of [140, 800]) {
      const torch = this.add.graphics().setDepth(3);
      torch.fillStyle(0x78350f).fillRect(x - 5, 440, 10, 50);
      const glow = this.add.circle(x, 425, 60, 0xfb923c, 0.18).setDepth(3);
      const flame = this.add.ellipse(x, 425, 26, 42, 0xf97316).setDepth(3);
      const core = this.add.ellipse(x, 430, 12, 22, 0xfde047).setDepth(3);
      this.tweens.add({
        targets: [flame, core],
        scaleY: 1.25,
        scaleX: 0.85,
        duration: 140,
        yoyo: true,
        repeat: -1,
        delay: x,
      });
      this.tweens.add({ targets: glow, alpha: 0.32, scale: 1.1, duration: 260, yoyo: true, repeat: -1 });
    }
  }

  // ---------------------------------------------------------------- osa

  private drawAxis() {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0xe0e7ff).fillRoundedRect(AXIS_X - 32, AXIS_TOP - 36, 64, AXIS_BOTTOM - AXIS_TOP + 72, 32);
    g.lineStyle(6, 0xa5b4fc).strokeRoundedRect(AXIS_X - 32, AXIS_TOP - 36, 64, AXIS_BOTTOM - AXIS_TOP + 72, 32);
    g.lineStyle(4, 0xa5b4fc);
    for (let n = 0; n <= MAX; n++) {
      g.lineBetween(AXIS_X - 14, axisY(n), AXIS_X + 14, axisY(n));
      this.labels.push(
        this.add
          .text(AXIS_X + 50, axisY(n), String(n), {
            fontFamily: "system-ui, sans-serif",
            fontSize: "26px",
            fontStyle: "bold",
            color: "#a5b4fc",
          })
          .setOrigin(0, 0.5)
          .setDepth(5),
      );
    }

    const knobBg = this.add.circle(0, 0, 28, 0xfbbf24).setStrokeStyle(6, 0xf59e0b);
    this.knob = this.add.container(AXIS_X, axisY(this.value), [knobBg]).setDepth(6);

    const box = this.add.graphics();
    box.fillStyle(0xffffff).fillRoundedRect(-58, -52, 116, 104, 24);
    box.lineStyle(6, 0x818cf8).strokeRoundedRect(-58, -52, 116, 104, 24);
    this.badge = this.add
      .text(0, 2, String(this.value), {
        fontFamily: "system-ui, sans-serif",
        fontSize: "76px",
        fontStyle: "900",
        color: "#4338ca",
      })
      .setOrigin(0.5);
    this.badgeBox = this.add.container(AXIS_X, 70, [box, this.badge]).setDepth(6);

    this.add
      .text(AXIS_X, H - 22, "táhni ⬆️⬇️", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#57534e",
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private onDown(p: Phaser.Input.Pointer) {
    if (Math.abs(p.x - AXIS_X) > 90 || p.y < AXIS_TOP - 60 || p.y > AXIS_BOTTOM + 60) return;
    sfx.unlock();
    this.dragging = true;
    this.knob.setScale(1.2);
    this.setValue(this.valueAt(p.y));
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (this.dragging) this.setValue(this.valueAt(p.y));
  }

  private onUp() {
    if (!this.dragging) return;
    this.dragging = false;
    this.knob.setScale(1);
    sfx.say(String(this.value));
  }

  private valueAt(y: number) {
    const ratio = Phaser.Math.Clamp((AXIS_BOTTOM - y) / (AXIS_BOTTOM - AXIS_TOP), 0, 1);
    return Math.round(ratio * MAX);
  }

  private setValue(n: number) {
    if (n === this.value) return;
    this.value = n;
    sfx.tick(n);
    this.updateAxis(true);
    this.syncCreatures(true);
  }

  private updateAxis(animate: boolean) {
    this.knob.y = axisY(this.value);
    this.badge.setText(String(this.value));
    this.labels.forEach((l, n) => {
      const current = n === this.value;
      l.setColor(current ? "#d97706" : "#a5b4fc").setFontSize(current ? 36 : 26);
    });
    if (animate) {
      this.tweens.killTweensOf(this.badgeBox);
      this.badgeBox.setScale(1);
      this.tweens.add({ targets: this.badgeBox, scale: 1.18, duration: 110, yoyo: true });
    }
  }

  // --------------------------------------------------------- postavičky

  /** Přidá nebo odebere postavičky, aby jich bylo přesně `value`. */
  private syncCreatures(animate: boolean) {
    const types = this.types();
    while (this.creatures.length < this.value) {
      const i = this.creatures.length;
      const s = slot(i);
      const type = types[Math.floor(Math.random() * types.length)];
      const c = makeCreature(this, type, s.x, s.y, i);
      c.root.setDepth(i < 5 ? 11 : 10);
      c.setActive(this.isActive());
      if (animate) {
        c.root.setScale(0);
        this.tweens.add({ targets: c.root, scale: s.scale, duration: 320, ease: "Back.easeOut" });
        this.dust.explode(8, s.x, s.y - 10);
      } else {
        c.root.setScale(s.scale);
      }
      this.creatures.push(c);
    }
    while (this.creatures.length > this.value) {
      const c = this.creatures.pop()!;
      const s = slot(this.creatures.length);
      if (animate) {
        sfx.poof();
        this.dust.explode(10, s.x, s.y - 50);
      }
      c.destroy();
    }

    const empty = this.value === 0;
    this.tweens.killTweensOf(this.nothing);
    this.tweens.add({ targets: this.nothing, alpha: empty ? 1 : 0, duration: 250 });
  }

  /** Jiný výběr typů – všechny postavičky se vymění za nové. */
  private rebuildCreatures() {
    this.creatures.forEach((c) => c.destroy());
    this.creatures = [];
    this.syncCreatures(true);
  }
}
