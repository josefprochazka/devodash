import * as Phaser from "phaser";
import { addConfetti, addHintHand, addPrompt, makeParticleTextures } from "../phaser/draw";
import { sfx } from "../phaser/sfx";
import { OUTCOME_EVENT } from "../phaser/usePhaserGame";
import { Farmer } from "./Farmer";
import { BED_H, BED_W, FIELD_H, FIELD_W, makeTextures } from "./textures";

export const W = 1200;
export const H = 720;

export type Outcome = "prepared" | "lazy";

const FIELD_X = 180; // levý okraj pole
const FIELD_Y = 345; // horní okraj pole
const HORIZON_Y = 345;
const ROW_Y = 490; // kde farmář stojí, když oře
const BED = { x: 270, y: 650 }; // střed postele
const DONE_AT = 0.95; // kolik pole musí být zoráno
const GRAB_RADIUS = 140; // jak daleko od farmáře se ho dá chytit prstem

/**
 * Hra k Přísloví 20:4 – „Lenoch na podzim neorá…“
 *
 * Podzim: dítě táhne farmáře prstem přes pole a za pluhem zůstává zoraná
 * hlína. Nebo ho přetáhne do postele a farmář usne. Pak „plyne čas“
 * (zima, jaro, léto) a přijdou žně: zorané pole se zazlátne pšenicí,
 * neorané zaroste plevelem a farmáři kručí v břiše. Výsledek jde do
 * Reactu přes OUTCOME_EVENT.
 */
export class OraniScene extends Phaser.Scene {
  private plowed = 0; // 0–1, kolik pole je zoráno (jen roste)
  private lastSoundX = 0;
  private dragging = false;
  private grab = { dx: 0, dy: 0 };
  private finished = false;

  private prompt!: Phaser.GameObjects.Text;
  private farmer!: Farmer;
  private plowedImg!: Phaser.GameObjects.Image;
  private grassImg!: Phaser.GameObjects.Image;
  private bed!: Phaser.GameObjects.Image;
  private sun!: Phaser.GameObjects.Container;
  private summerSky!: Phaser.GameObjects.Graphics;
  private canopies: Phaser.GameObjects.Image[] = [];
  private leaves!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private confetti!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hint: Phaser.GameObjects.Text | null = null;
  private sleepObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("orani");
  }

  create() {
    this.plowed = 0;
    this.lastSoundX = 0;
    this.dragging = false;
    this.finished = false;
    this.canopies = [];
    this.sleepObjs = [];

    makeTextures(this);
    makeParticleTextures(this);
    this.drawWorld();

    this.farmer = new Farmer(this, FIELD_X - Farmer.PLOW_REACH, ROW_Y);
    this.farmer.root.setDepth(12);

    this.dust = this.add
      .particles(0, 0, "p-dust", {
        speed: { min: 40, max: 140 },
        angle: { min: 200, max: 340 },
        gravityY: 300,
        lifespan: 500,
        scale: { start: 0.9, end: 0 },
        tint: 0x78350f,
        emitting: false,
      })
      .setDepth(11);
    this.confetti = addConfetti(this);

    this.prompt = addPrompt(this, W / 2, 42);
    this.prompt.setText("Táhni farmáře přes pole ➡️ nebo do postele 🛏️");

    this.hint = addHintHand(
      this,
      { x: this.farmer.root.x + 10, y: ROW_Y - 90 },
      { x: FIELD_X + FIELD_W - 120, y: ROW_Y - 90 },
    );

    this.input.on("pointerdown", this.onDown, this);
    this.input.on("pointermove", this.onMove, this);
    this.input.on("pointerup", this.onUp, this);
    this.input.on("pointerupoutside", this.onUp, this);
    this.events.once("shutdown", () => {
      this.input.off("pointerdown", this.onDown, this);
      this.input.off("pointermove", this.onMove, this);
      this.input.off("pointerup", this.onUp, this);
      this.input.off("pointerupoutside", this.onUp, this);
    });
  }

  // ---------------------------------------------------------------- svět

  private drawWorld() {
    // podzimní a letní obloha – letní je pod podzimní a odkryje se při žních
    this.summerSky = this.add.graphics().setDepth(0);
    this.summerSky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xe0f2fe, 0xe0f2fe, 1);
    this.summerSky.fillRect(0, 0, W, HORIZON_Y);
    const autumnSky = this.add.graphics().setDepth(0).setName("autumnSky");
    autumnSky.fillGradientStyle(0xfb923c, 0xfb923c, 0xfef3c7, 0xfef3c7, 1);
    autumnSky.fillRect(0, 0, W, HORIZON_Y);

    const disc = this.add.circle(0, 0, 44, 0xfde047);
    const glow = this.add.circle(0, 0, 64, 0xfde047, 0.3);
    this.sun = this.add.container(150, 150, [glow, disc]).setDepth(1);
    this.tweens.add({ targets: glow, scale: 1.15, duration: 1200, yoyo: true, repeat: -1 });

    const hills = this.add.graphics().setDepth(2);
    hills.fillStyle(0x65a30d).fillEllipse(260, HORIZON_Y + 30, 760, 170);
    hills.fillStyle(0x4d7c0f).fillEllipse(930, HORIZON_Y + 40, 860, 150);

    for (const [x, y, s] of [
      [90, 300, 1],
      [1080, 290, 0.9],
      [640, 300, 0.6],
    ] as const) {
      const trunk = this.add.rectangle(x, y + 30, 22 * s, 90 * s, 0x78350f).setDepth(2);
      trunk.setOrigin(0.5, 1);
      const canopy = this.add
        .image(x, y - 50 * s, "o-canopy")
        .setScale(s)
        .setTint(0xf97316)
        .setDepth(2);
      this.canopies.push(canopy);
    }

    // spodní louka a cestička
    const ground = this.add.graphics().setDepth(2);
    ground.fillStyle(0x65a30d).fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
    ground.fillStyle(0xd6b98c).fillRect(0, FIELD_Y + FIELD_H + 8, W, 26);

    this.grassImg = this.add.image(FIELD_X, FIELD_Y, "o-grass").setOrigin(0).setDepth(3);
    this.plowedImg = this.add.image(FIELD_X, FIELD_Y, "o-plowed").setOrigin(0).setDepth(4);
    this.plowedImg.setCrop(0, 0, 0, FIELD_H);

    // postel – druhá volba
    const bedGlow = this.add
      .ellipse(BED.x, BED.y + 20, BED_W + 50, 60, 0xa5b4fc, 0.5)
      .setDepth(5);
    this.tweens.add({ targets: bedGlow, alpha: 0.15, duration: 900, yoyo: true, repeat: -1 });
    this.bed = this.add.image(BED.x, BED.y, "o-bed").setDepth(6);
    this.add
      .text(BED.x + BED_W / 2 + 20, BED.y + 10, "💤 spát", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#312e81",
        strokeThickness: 6,
      })
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.leaves = this.add
      .particles(0, -20, "o-leaf", {
        x: { min: 0, max: W },
        speedY: { min: 40, max: 90 },
        speedX: { min: -40, max: 40 },
        rotate: { start: 0, end: 360 },
        lifespan: 7000,
        frequency: 260,
        tint: [0xf97316, 0xdc2626, 0xfacc15, 0xb45309],
        scale: { min: 0.8, max: 1.4 },
      })
      .setDepth(8);
  }

  // ------------------------------------------------------------ tažení

  private onDown(p: Phaser.Input.Pointer) {
    if (this.finished) return;
    const f = this.farmer.root;
    if (Phaser.Math.Distance.Between(p.x, p.y, f.x + 40, f.y - 90) > GRAB_RADIUS) return;
    sfx.unlock();
    this.dragging = true;
    this.grab = { dx: f.x - p.x, dy: f.y - p.y };
    this.hint?.destroy();
    this.hint = null;
    this.tweens.killTweensOf(f);
    f.setScale(1.06);
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.dragging) return;
    const f = this.farmer.root;
    f.x = Phaser.Math.Clamp(p.x + this.grab.dx, 40, W - 60);
    f.y = Phaser.Math.Clamp(p.y + this.grab.dy, 420, H - 10);
    this.farmer.sway(f.x);
    this.bed.setScale(this.overBed() ? 1.08 : 1);

    const onField = f.y < FIELD_Y + FIELD_H + 40;
    if (!onField) return;

    // Orat jde jen plynule od kraje – skok doprostřed pole se nepočítá.
    const plowX = f.x + Farmer.PLOW_REACH;
    const frontier = FIELD_X + this.plowed * FIELD_W;
    if (plowX > frontier && plowX - frontier < 90) {
      this.plowed = Math.min(1, (plowX - FIELD_X) / FIELD_W);
      this.plowedImg.setCrop(0, 0, this.plowed * FIELD_W, FIELD_H);
      this.sun.x = 150 + this.plowed * 900;
      this.sun.y = 150 - Math.sin(this.plowed * Math.PI) * 60;
      if (plowX - this.lastSoundX > 35) {
        this.lastSoundX = plowX;
        sfx.plow();
        this.dust.explode(5, plowX, f.y - 4);
      }
      if (this.plowed >= DONE_AT) this.finishPlowing();
    }
  }

  private onUp() {
    if (!this.dragging) return;
    this.dragging = false;
    const f = this.farmer.root;
    f.setScale(1);
    this.bed.setScale(1);
    if (this.overBed()) {
      this.goToBed();
    } else if (f.y > FIELD_Y + FIELD_H + 40) {
      // pustil ho mimo pole i postel – vrátí se zpátky k poli
      this.tweens.add({ targets: f, y: ROW_Y, duration: 400, ease: "Sine.easeOut" });
    }
  }

  private overBed() {
    const f = this.farmer.root;
    return Math.abs(f.x - BED.x) < BED_W / 2 + 30 && f.y > BED.y - BED_H / 2 - 20;
  }

  // ------------------------------------------------------ dvě zakončení

  private finishPlowing() {
    this.finished = true;
    this.dragging = false;
    this.plowedImg.setCrop(0, 0, FIELD_W, FIELD_H);
    this.farmer.root.setScale(1);
    this.prompt.setText("Pole je zorané a zaseté! 👏");
    sfx.pop();
    this.farmer.setMood("happy");
    this.time.delayedCall(1200, () => this.passTime("prepared"));
  }

  private goToBed() {
    this.finished = true;
    this.prompt.setText("Farmáři se nechce… jde radši spát 😴");
    this.farmer.root.setVisible(false);

    const head = this.add.circle(BED.x - 72, BED.y - 12, 26, 0xf5c79e).setDepth(7);
    const cap = this.add.triangle(BED.x - 92, BED.y - 30, 0, 30, 30, 0, 40, 34, 0x60a5fa).setDepth(7);
    const blanket = this.add.image(BED.x + 22, BED.y + 2, "o-blanket").setDepth(8);
    this.tweens.add({ targets: blanket, scaleY: 1.08, duration: 900, yoyo: true, repeat: -1 });
    const eyes = this.add.graphics().setDepth(8);
    eyes.lineStyle(3, 0x1c1917);
    eyes.lineBetween(BED.x - 84, BED.y - 14, BED.x - 76, BED.y - 14);
    eyes.lineBetween(BED.x - 68, BED.y - 14, BED.x - 60, BED.y - 14);
    this.sleepObjs.push(head, cap, blanket, eyes);

    for (let i = 0; i < 3; i++) {
      const z = this.add
        .text(BED.x - 60, BED.y - 40, "Z", {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${28 + i * 8}px`,
          fontStyle: "bold",
          color: "#4338ca",
        })
        .setDepth(9)
        .setAlpha(0);
      this.sleepObjs.push(z);
      this.tweens.add({
        targets: z,
        x: BED.x - 20 + i * 24,
        y: BED.y - 130 - i * 20,
        alpha: { from: 1, to: 0 },
        duration: 1600,
        delay: i * 500,
        repeat: -1,
      });
    }
    sfx.snore();
    this.time.delayedCall(1600, () => sfx.snore());
    this.time.delayedCall(3000, () => this.passTime("lazy"));
  }

  // --------------------------------------------------- plyne čas -> žně

  private passTime(outcome: Outcome) {
    const night = this.add.rectangle(0, 0, W, H, 0x0f172a).setOrigin(0).setDepth(50).setAlpha(0);
    const label = this.add
      .text(W / 2, H / 2, "🌙 Plyne čas…", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "56px",
        fontStyle: "bold",
        color: "#f8fafc",
      })
      .setOrigin(0.5)
      .setDepth(51)
      .setAlpha(0);

    sfx.whoosh();
    this.tweens.add({ targets: [night, label], alpha: 1, duration: 700 });

    const steps = ["❄️ zima", "🌸 jaro", "☀️ léto", "🌾 přichází žně!"];
    steps.forEach((text, i) => {
      this.time.delayedCall(1100 + i * 650, () => {
        label.setText(text);
        sfx.tick(i * 3);
        this.tweens.add({ targets: label, scale: { from: 1.25, to: 1 }, duration: 250 });
      });
    });

    this.time.delayedCall(900, () => this.toHarvestWorld(outcome));
    this.time.delayedCall(1100 + steps.length * 650 + 300, () => {
      this.tweens.add({
        targets: [night, label],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          night.destroy();
          label.destroy();
          if (outcome === "prepared") this.goodHarvest();
          else this.emptyHarvest();
        },
      });
    });
  }

  /** Za tmy přestaví svět na léto. */
  private toHarvestWorld(outcome: Outcome) {
    this.children.getByName("autumnSky")?.destroy();
    this.canopies.forEach((c) => c.setTint(0x16a34a));
    this.leaves.stop();
    this.leaves.killAll();
    this.sun.setPosition(1050, 110);
    this.hint?.destroy();

    // farmář vstal z postele / odložil pluh a stojí před polem
    this.sleepObjs.forEach((o) => {
      this.tweens.killTweensOf(o);
      o.destroy();
    });
    this.sleepObjs = [];
    this.farmer.root.setVisible(true).setPosition(560, 660).setAngle(0).setDepth(20);
    this.farmer.showPlow(false);
    this.farmer.setMood("neutral");

    if (outcome === "prepared") {
      this.plowedImg.setCrop(0, 0, FIELD_W, FIELD_H);
    } else {
      this.grassImg.setTint(0xbfa66a);
      this.plowedImg.setTint(0xa16207);
    }
    this.prompt.setText("");
  }

  private goodHarvest() {
    this.prompt.setText("Přišly žně! Pole je plné pšenice 🌾");
    const wheat: Phaser.GameObjects.Image[] = [];
    for (let row = 0; row < 4; row++) {
      for (let x = FIELD_X + 16; x < FIELD_X + FIELD_W - 8; x += 28) {
        const img = this.add
          .image(x + (row % 2) * 14, FIELD_Y + 52 + row * 40, "o-wheat")
          .setOrigin(0.5, 1)
          .setScale(0.75 + row * 0.1, 0)
          .setDepth(5 + row * 0.1);
        wheat.push(img);
      }
    }
    wheat.forEach((img) => {
      this.tweens.add({
        targets: img,
        scaleY: img.scaleX,
        duration: 500,
        delay: (img.x - FIELD_X) * 1.4,
        ease: "Back.easeOut",
      });
    });
    this.time.delayedCall(400, () => sfx.whoosh());
    // pšenice se vlní ve větru
    this.time.delayedCall(1900, () => {
      this.tweens.add({
        targets: wheat,
        angle: { from: -4, to: 4 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: this.tweens.stagger(15, {}),
      });
    });

    // sklizeň do košíku
    this.add.text(660, 640, "🧺", { fontSize: "84px" }).setOrigin(0.5).setDepth(21);
    const goods = ["🍞", "🌾", "🥖", "🍞", "🌾", "🥐"];
    goods.forEach((g, i) => {
      this.time.delayedCall(1800 + i * 300, () => {
        const item = this.add
          .text(Phaser.Math.Between(FIELD_X + 100, FIELD_X + FIELD_W - 100), FIELD_Y + 60, g, {
            fontSize: "52px",
          })
          .setOrigin(0.5)
          .setDepth(22);
        this.tweens.add({
          targets: item,
          x: 640 + (i % 3) * 22,
          y: 600 - Math.floor(i / 3) * 26,
          duration: 600,
          ease: "Quad.easeIn",
          onComplete: () => sfx.pop(),
        });
      });
    });

    this.time.delayedCall(3800, () => {
      this.farmer.celebrate();
      sfx.win();
      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 450, () => this.confetti.explode(28, 600, 420));
      }
    });
    this.time.delayedCall(5600, () => this.game.events.emit(OUTCOME_EVENT, "prepared"));
  }

  private emptyHarvest() {
    this.prompt.setText("Přišly žně… ale na poli roste jen plevel 😟");
    for (let i = 0; i < 26; i++) {
      const weed = this.add
        .image(
          FIELD_X + 30 + ((i * 137) % (FIELD_W - 60)),
          FIELD_Y + 40 + ((i * 53) % (FIELD_H - 30)),
          "o-weed",
        )
        .setOrigin(0.5, 1)
        .setScale(1, 0)
        .setDepth(5);
      this.tweens.add({ targets: weed, scaleY: 1, duration: 400, delay: i * 50 });
    }
    // suchý vítr
    this.time.delayedCall(600, () => sfx.whoosh());

    this.time.delayedCall(1700, () => {
      const bubble = this.add
        .text(this.farmer.root.x + 40, this.farmer.root.y - 250, "kruuuu… 🍽️", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "32px",
          fontStyle: "bold",
          color: "#44403c",
          backgroundColor: "#ffffff",
          padding: { x: 16, y: 10 },
        })
        .setOrigin(0, 0.5)
        .setDepth(23)
        .setScale(0);
      this.tweens.add({ targets: bubble, scale: 1, duration: 300, ease: "Back.easeOut" });
      sfx.growl();
      this.tweens.add({
        targets: this.farmer.root,
        x: "+=5",
        duration: 60,
        yoyo: true,
        repeat: 5,
      });
    });
    this.time.delayedCall(3000, () => {
      this.prompt.setText("Nemá co sklidit a má hlad 😢");
      this.farmer.cry();
      sfx.sad();
    });
    this.time.delayedCall(4600, () => this.game.events.emit(OUTCOME_EVENT, "lazy"));
  }
}
