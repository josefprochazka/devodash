import * as Phaser from "phaser";
import { addConfetti, addHintHand, addPrompt, makeParticleTextures } from "../phaser/draw";
import { sfx } from "../phaser/sfx";
import { OUTCOME_EVENT } from "../phaser/usePhaserGame";
import { Jesus } from "./Jesus";
import { Kid } from "./Kid";

export const W = 1200;
export const H = 720;

const GROUND_Y = 655;
const LADDER_X = 600;
const RUNG_GAP = 105;
const LADDER_H = 3 * RUNG_GAP + 40; // pevná délka – i se všemi skutky je krátký
const LIGHT = { x: 600, y: 60 };
const CARD_W = 270;
const CARD_H = 92;

const DEEDS = [
  { icon: "🤝", label: "Pomoc druhým" },
  { icon: "🙇", label: "Poslušnost" },
  { icon: "⛪", label: "Chodit do církve" },
];

type Phase = "build" | "climbing" | "stuck" | "jesus" | "flying" | "done";

interface Card {
  root: Phaser.GameObjects.Container;
  home: { x: number; y: number };
  used: boolean;
  deed: (typeof DEEDS)[number];
}

/**
 * Hra k 1. Petrovu 3:18 – „…aby vás přivedl k Bohu“.
 *
 * Dítě staví z dobrých skutků příčky žebříku (karty vlevo – ťuknout nebo
 * přetáhnout). Žebřík má ale pevnou délku a ke světlu nahoře nedosáhne:
 * postavička vyšplhá, žebřík se zakymácí a dál to nejde. Pak se objeví
 * Ježíš; po ťuknutí na něj přiletí, chytí dítě za ruku a spolu vystoupají
 * až ke světlu. Konec hlásí do Reactu OUTCOME_EVENT („done“).
 */
export class MostScene extends Phaser.Scene {
  private phase: Phase = "build";
  private rungs = 0;
  private cards: Card[] = [];
  private dragged: { card: Card; dx: number; dy: number; downX: number; downY: number } | null = null;

  private prompt!: Phaser.GameObjects.Text;
  private ladder!: Phaser.GameObjects.Container;
  private kid!: Kid;
  private climbButton!: Phaser.GameObjects.Container;
  private hint: Phaser.GameObjects.Text | null = null;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private confetti!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("most");
  }

  create() {
    this.phase = "build";
    this.rungs = 0;
    this.cards = [];
    this.dragged = null;

    makeParticleTextures(this);
    this.drawWorld();

    this.ladder = this.add.container(LADDER_X, GROUND_Y).setDepth(5);
    const rails = this.add.graphics();
    rails.fillStyle(0x92400e);
    rails.fillRoundedRect(-58, -LADDER_H, 14, LADDER_H, 6);
    rails.fillRoundedRect(44, -LADDER_H, 14, LADDER_H, 6);
    this.ladder.add(rails);

    this.kid = new Kid(this, LADDER_X, GROUND_Y);
    this.kid.root.setDepth(10);

    this.dust = this.add
      .particles(0, 0, "p-dust", {
        speed: { min: 60, max: 200 },
        angle: { min: 180, max: 360 },
        gravityY: 300,
        lifespan: 500,
        scale: { start: 0.9, end: 0 },
        tint: 0xfde68a,
        emitting: false,
      })
      .setDepth(11);
    this.confetti = addConfetti(this);

    DEEDS.forEach((deed, i) => this.cards.push(this.makeCard(deed, 175, 300 + i * 120)));
    this.climbButton = this.makeClimbButton();

    this.prompt = addPrompt(this, W / 2, 42);
    this.prompt.setText("Ťukni na dobré skutky – postaví žebřík 🪜");
    this.hint = addHintHand(this, { x: 190, y: 310 }, { x: LADDER_X - 30, y: GROUND_Y - 120 });

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
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0xfde68a, 0xfde68a, 0x38bdf8, 0x38bdf8, 1);
    sky.fillRect(0, 0, W, 330);
    sky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0x065f46, 0x065f46, 1);
    sky.fillRect(0, 330, W, GROUND_Y - 330);
    sky.fillStyle(0x14532d).fillRect(0, GROUND_Y, W, H - GROUND_Y);
    sky.fillStyle(0x166534).fillRect(0, GROUND_Y, W, 10);

    // světlo nahoře – Boží přítomnost
    const rays = this.add.graphics();
    rays.lineStyle(10, 0xfffbeb, 0.5);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rays.lineBetween(Math.cos(a) * 80, Math.sin(a) * 80, Math.cos(a) * 150, Math.sin(a) * 150);
    }
    const glowOuter = this.add.circle(0, 0, 120, 0xfffbeb, 0.35);
    const glowInner = this.add.circle(0, 0, 66, 0xfffbeb, 0.95);
    this.add.container(LIGHT.x, LIGHT.y, [rays, glowOuter, glowInner]).setDepth(1);
    this.tweens.add({ targets: rays, angle: 360, duration: 30000, repeat: -1 });
    this.tweens.add({ targets: glowOuter, scale: 1.2, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1 });

    for (const [x, y, d] of [
      [140, 70, 0],
      [980, 110, 600],
      [300, 160, 1100],
      [1100, 40, 300],
      [820, 200, 900],
    ] as const) {
      const star = this.add.image(x, y, "p-star").setDepth(1).setScale(0.6);
      this.tweens.add({ targets: star, alpha: 0.2, scale: 0.4, duration: 900, delay: d, yoyo: true, repeat: -1 });
    }

    for (const [y, s, delay] of [
      [150, 1, 0],
      [250, 0.7, 9000],
    ] as const) {
      const cloud = this.add.container(-200, y).setDepth(2).setScale(s).setAlpha(0.8);
      cloud.add([
        this.add.ellipse(0, 0, 160, 54, 0xffffff),
        this.add.ellipse(-50, 8, 100, 40, 0xffffff),
        this.add.ellipse(55, 6, 110, 44, 0xffffff),
      ]);
      this.tweens.add({ targets: cloud, x: W + 200, duration: 22000, delay, repeat: -1 });
    }
  }

  private makeCard(deed: (typeof DEEDS)[number], x: number, y: number): Card {
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
    bg.lineStyle(5, 0x6ee7b7).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
    const icon = this.add.text(-CARD_W / 2 + 22, 0, deed.icon, { fontSize: "46px" }).setOrigin(0, 0.5);
    const label = this.add
      .text(-CARD_W / 2 + 86, 0, deed.label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#064e3b",
        wordWrap: { width: CARD_W - 100 },
      })
      .setOrigin(0, 0.5);
    const root = this.add.container(x, y, [bg, icon, label]).setDepth(20);
    return { root, home: { x, y }, used: false, deed };
  }

  private makeClimbButton() {
    const bg = this.add.graphics();
    bg.fillStyle(0x15803d).fillRoundedRect(-150, -46, 300, 92, 46);
    bg.lineStyle(5, 0xbbf7d0).strokeRoundedRect(-150, -46, 300, 92, 46);
    const text = this.add
      .text(0, 0, "Vylézt nahoru ⬆️", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    const btn = this.add.container(990, 560, [bg, text]).setDepth(20).setVisible(false);
    return btn;
  }

  // ------------------------------------------------------ karty a tlačítko

  private onDown(p: Phaser.Input.Pointer) {
    sfx.unlock();
    if (this.phase !== "build") return;

    if (this.climbButton.visible && Math.abs(p.x - 990) < 150 && Math.abs(p.y - 560) < 46) {
      this.startClimb();
      return;
    }
    const card = this.cards.find(
      (c) => !c.used && Math.abs(p.x - c.root.x) < CARD_W / 2 && Math.abs(p.y - c.root.y) < CARD_H / 2,
    );
    if (!card) return;
    this.hint?.destroy();
    this.hint = null;
    this.dragged = { card, dx: card.root.x - p.x, dy: card.root.y - p.y, downX: p.x, downY: p.y };
    card.root.setScale(1.06).setDepth(25);
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.dragged) return;
    this.dragged.card.root.setPosition(p.x + this.dragged.dx, p.y + this.dragged.dy);
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (!this.dragged) return;
    const { card, downX, downY } = this.dragged;
    this.dragged = null;
    const tapped = Phaser.Math.Distance.Between(p.x, p.y, downX, downY) < 12;
    const nearLadder = Math.abs(card.root.x - LADDER_X) < 260;
    if (tapped || nearLadder) {
      this.placeDeed(card);
    } else {
      this.tweens.add({
        targets: card.root,
        x: card.home.x,
        y: card.home.y,
        scale: 1,
        duration: 300,
        ease: "Back.easeOut",
        onComplete: () => card.root.setDepth(20),
      });
    }
  }

  private placeDeed(card: Card) {
    card.used = true;
    this.rungs++;
    const rungY = -this.rungs * RUNG_GAP;

    this.tweens.add({
      targets: card.root,
      x: LADDER_X,
      y: GROUND_Y + rungY,
      scale: 0.2,
      alpha: 0,
      duration: 320,
      ease: "Quad.easeIn",
      onComplete: () => {
        card.root.destroy();
        const rung = this.add.rectangle(0, rungY, 112, 16, 0xb45309).setStrokeStyle(3, 0x78350f);
        const icon = this.add.text(-92, rungY, card.deed.icon, { fontSize: "38px" }).setOrigin(0.5);
        this.ladder.add([rung, icon]);
        rung.setScale(0);
        icon.setScale(0);
        this.tweens.add({ targets: [rung, icon], scale: 1, duration: 300, ease: "Back.easeOut" });
        this.dust.explode(14, LADDER_X, GROUND_Y + rungY);
        sfx.pop();
        this.cameras.main.shake(80, 0.003);
        this.afterDeed();
      },
    });
  }

  private afterDeed() {
    if (!this.climbButton.visible) {
      this.climbButton.setVisible(true).setScale(0);
      this.tweens.add({ targets: this.climbButton, scale: 1, duration: 350, ease: "Back.easeOut" });
      this.tweens.add({
        targets: this.climbButton,
        scale: 1.06,
        duration: 600,
        delay: 400,
        yoyo: true,
        repeat: -1,
      });
    }
    this.prompt.setText(
      this.rungs < DEEDS.length
        ? "Další dobrý skutek? Nebo zkus vylézt ⬆️"
        : "Žebřík je hotový! Zkus vylézt nahoru ⬆️",
    );
  }

  // ------------------------------------------------------------- šplhání

  private startClimb() {
    this.phase = "climbing";
    this.tweens.killTweensOf(this.climbButton);
    this.tweens.add({
      targets: [this.climbButton, ...this.cards.filter((c) => !c.used).map((c) => c.root)],
      alpha: 0,
      duration: 300,
    });
    this.prompt.setText("Šplhám nahoru… 🧗");

    const climbStep = (i: number) => {
      if (i > this.rungs) {
        this.stuck();
        return;
      }
      this.kid.climbPose(i);
      sfx.step(i);
      this.tweens.add({
        targets: this.kid.root,
        y: GROUND_Y - i * RUNG_GAP,
        duration: 480,
        ease: "Sine.easeInOut",
        onComplete: () => climbStep(i + 1),
      });
    };
    climbStep(1);
  }

  private stuck() {
    this.phase = "stuck";
    this.prompt.setText("Žebřík je moc krátký… nahoru to nejde 😟");
    this.kid.setMood("worried");
    this.kid.reachUp();
    sfx.creak();
    this.ladder.angle = 0;
    this.tweens.add({
      targets: [this.ladder, this.kid.root],
      angle: { from: -3, to: 3 },
      duration: 140,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.ladder.angle = 0;
        this.kid.root.angle = 0;
      },
    });
    this.time.delayedCall(2200, () => this.jesusAppears());
  }

  // ------------------------------------------------------------- Ježíš

  private jesusAppears() {
    this.phase = "jesus";
    const pos = { x: 930, y: 330 };

    const beam = this.add.graphics().setDepth(3).setAlpha(0);
    beam.fillStyle(0xfffbeb, 0.4).fillTriangle(LIGHT.x, LIGHT.y, pos.x - 90, pos.y + 10, pos.x + 90, pos.y + 10);
    this.tweens.add({ targets: beam, alpha: 1, duration: 600, yoyo: true, hold: 600 });

    const jesus = new Jesus(this, pos.x, pos.y - 120);
    jesus.root.setDepth(9).setAlpha(0);
    this.tweens.add({ targets: jesus.root, alpha: 1, y: pos.y, duration: 1100, ease: "Sine.easeOut" });
    this.tweens.add({
      targets: jesus.root,
      y: pos.y - 12,
      duration: 1200,
      delay: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    sfx.chime();

    this.time.delayedCall(1000, () => {
      this.prompt.setText("Ťukni na Ježíše – vezme tě za ruku 👆");
      const hand = this.add.text(pos.x + 40, pos.y - 60, "👆", { fontSize: "64px" }).setDepth(40);
      this.tweens.add({ targets: hand, y: pos.y - 30, duration: 500, yoyo: true, repeat: -1 });

      const zone = this.add
        .zone(pos.x, pos.y - 90, 220, 260)
        .setInteractive({ useHandCursor: true })
        .once("pointerdown", () => {
          zone.destroy();
          hand.destroy();
          this.fly(jesus);
        });
    });
  }

  private fly(jesus: Jesus) {
    this.phase = "flying";
    sfx.chime();
    this.tweens.killTweensOf(jesus.root);
    this.kid.setMood("happy");
    this.prompt.setText("Ježíš přilétá… ✨");

    const trail = this.add
      .particles(0, 0, "p-glow", {
        speed: { min: 10, max: 60 },
        lifespan: 900,
        frequency: 40,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xfef3c7, 0xfde68a, 0xffffff],
      })
      .setDepth(8);
    trail.startFollow(jesus.root, 0, -90);

    const kid = this.kid.root;
    const meet = {
      x: kid.x + Kid.FLY_HAND.x - Jesus.HAND.x,
      y: kid.y + Kid.FLY_HAND.y - Jesus.HAND.y,
    };
    this.tweens.add({
      targets: jesus.root,
      x: meet.x,
      y: meet.y,
      duration: 1000,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.kid.flyPose();
        sfx.pop();
        this.prompt.setText("Letíte spolu ke světlu ✨");
        // společně rovně vzhůru
        const rise = LIGHT.y + 190 - kid.y;
        this.tweens.add({
          targets: [kid, jesus.root],
          y: `+=${rise}`,
          duration: 2200,
          ease: "Sine.easeIn",
          onComplete: () => this.arrive(trail),
        });
      },
    });
  }

  private arrive(trail: Phaser.GameObjects.Particles.ParticleEmitter) {
    this.phase = "done";
    trail.stop();
    this.cameras.main.flash(600, 255, 251, 235);
    sfx.heaven();
    this.prompt.setText("Ježíš tě přivedl k Bohu! 🎉");
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 450, () => this.confetti.explode(30, LIGHT.x, LIGHT.y + 120));
    }
    this.time.delayedCall(2200, () => this.game.events.emit(OUTCOME_EVENT, "done"));
  }
}
