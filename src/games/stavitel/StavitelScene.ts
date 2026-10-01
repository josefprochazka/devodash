import * as Phaser from "phaser";
import { Builder } from "./Builder";
import { sfx } from "./sfx";
import { SAND_H, makeTextures } from "./textures";

/** Logická velikost scény – Phaser ji pak přizpůsobí šířce obrazovky. */
export const W = 1200;
export const H = 720;
export const OUTCOME_EVENT = "stavitel-outcome";

export type Plot = "rock" | "sand";

const GROUND_Y = 600;
const WATER_Y = 572; // kam vystoupá hladina při bouřce
const TRAY = { x: 600, y: 664 }; // kde se objevuje další kostka

const PLOTS: Record<Plot, { x: number; top: number; builderX: number; label: string }> = {
  rock: { x: 315, top: 494, builderX: 533, label: "Skála" },
  sand: { x: 885, top: GROUND_Y - SAND_H + 4, builderX: 667, label: "Písek" },
};

/** Pořadí stavby: posun každého dílu vůči středu základů. */
const PIECES = [
  { key: "brick-door", dx: -64, dy: -30 },
  { key: "brick-window", dx: 64, dy: -30 },
  { key: "brick-window", dx: -64, dy: -90 },
  { key: "brick", dx: 64, dy: -90 },
  { key: "roof", dx: 0, dy: -165 },
];

/**
 * Hra k Matouši 7:24–27 – moudrý a pošetilý stavitel.
 *
 * Průběh: CHOOSE (ťuknout na skálu, nebo písek) -> BUILD (přetáhnout 5 dílů
 * domu) -> STORM (déšť, blesky, stoupající voda) -> výsledek. Na skále dům
 * vydrží, na písku se písek rozplaví a dům spadne do vody. Výsledek se
 * posílá do Reactu přes `game.events` (OUTCOME_EVENT).
 */
export class StavitelScene extends Phaser.Scene {
  private plot: Plot = "rock";
  private nextPiece = 0;
  private placed: Phaser.GameObjects.Image[] = [];
  private choiceObjects: Phaser.GameObjects.GameObject[] = [];

  private prompt!: Phaser.GameObjects.Text;
  private builder!: Builder;
  private sun!: Phaser.GameObjects.Container;
  private rainbow!: Phaser.GameObjects.Graphics;
  private sandImg!: Phaser.GameObjects.Image;
  private water!: Phaser.GameObjects.Container;
  private waves!: Phaser.GameObjects.TileSprite;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private splash!: Phaser.GameObjects.Particles.ParticleEmitter;
  private stars!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("stavitel");
  }

  create() {
    // Scéna se při "Zkusit znovu" restartuje, instance třídy ale zůstává.
    this.plot = "rock";
    this.nextPiece = 0;
    this.placed = [];
    this.choiceObjects = [];

    makeTextures(this);
    this.drawWorld();

    this.builder = new Builder(this, 600, GROUND_Y);
    this.builder.root.setDepth(12);

    this.dust = this.add
      .particles(0, 0, "dust", {
        speed: { min: 80, max: 240 },
        angle: { min: 190, max: 350 },
        gravityY: 450,
        lifespan: 600,
        scale: { start: 1.3, end: 0 },
        alpha: { start: 0.9, end: 0 },
        emitting: false,
      })
      .setDepth(11);
    this.splash = this.add
      .particles(0, 0, "drop", {
        speed: { min: 180, max: 420 },
        angle: { min: 225, max: 315 },
        gravityY: 1000,
        lifespan: 750,
        scale: { start: 1.4, end: 0.6 },
        emitting: false,
      })
      .setDepth(16);
    this.stars = this.add
      .particles(0, 0, "star", {
        speed: { min: 250, max: 520 },
        angle: { min: 200, max: 340 },
        gravityY: 520,
        lifespan: 1800,
        rotate: { min: 0, max: 360 },
        scale: { start: 1.3, end: 0.4 },
        tint: [0xfde047, 0xf472b6, 0x60a5fa, 0x4ade80, 0xfb923c],
        emitting: false,
      })
      .setDepth(25);

    this.prompt = this.add
      .text(W / 2, 42, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#1c1917",
        backgroundColor: "#ffffffdd",
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.startChoose();
  }

  update(_time: number, delta: number) {
    this.waves.tilePositionX += delta * 0.12;
  }

  // ---------------------------------------------------------------- svět

  private drawWorld() {
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0xe0f2fe, 0xe0f2fe, 1);
    sky.fillRect(0, 0, W, GROUND_Y);

    this.rainbow = this.add.graphics().setDepth(1).setAlpha(0);
    [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x8b5cf6].forEach((c, i) => {
      this.rainbow.lineStyle(16, c, 0.85);
      this.rainbow.beginPath();
      this.rainbow.arc(W / 2, 640, 540 - i * 16, Math.PI, Math.PI * 2);
      this.rainbow.strokePath();
    });

    const rays = this.add.graphics();
    rays.lineStyle(6, 0xfde047);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.lineBetween(Math.cos(a) * 62, Math.sin(a) * 62, Math.cos(a) * 84, Math.sin(a) * 84);
    }
    const disc = this.add.circle(0, 0, 50, 0xfde047);
    this.sun = this.add.container(1080, 110, [rays, disc]).setDepth(1);
    this.tweens.add({ targets: rays, angle: 360, duration: 20000, repeat: -1 });

    const land = this.add.graphics().setDepth(2);
    land.fillStyle(0xbbf7d0).fillEllipse(900, GROUND_Y + 20, 820, 200);
    land.fillStyle(0x86efac).fillEllipse(260, GROUND_Y + 20, 720, 230);
    land.fillStyle(0x92400e).fillRect(0, GROUND_Y, W, H - GROUND_Y);
    land.fillStyle(0x65a30d).fillRect(0, GROUND_Y, W, 14);
    // kytičky u pláže – písek vypadá lákavě
    for (const [x, c] of [
      [730, 0xf472b6],
      [770, 0xffffff],
      [1030, 0xfacc15],
      [1075, 0xf472b6],
    ] as const) {
      land.fillStyle(0x15803d).fillRect(x - 2, GROUND_Y - 18, 4, 18);
      land.fillStyle(c).fillCircle(x, GROUND_Y - 20, 8);
    }

    this.add.image(PLOTS.rock.x, GROUND_Y + 2, "rock").setOrigin(0.5, 1).setDepth(3);
    this.sandImg = this.add.image(PLOTS.sand.x, GROUND_Y + 2, "sand").setOrigin(0.5, 1).setDepth(3);

    for (const plot of ["rock", "sand"] as const) {
      this.add
        .text(PLOTS[plot].x, GROUND_Y + 34, PLOTS[plot].label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "30px",
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#451a03",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(4);
    }

    const body = this.add.rectangle(0, 40, W, H, 0x0284c7, 0.92).setOrigin(0);
    this.waves = this.add.tileSprite(0, 0, W, 40, "wave").setOrigin(0);
    this.water = this.add.container(0, H + 10, [body, this.waves]).setDepth(15);
  }

  // --------------------------------------------------------- 1) výběr místa

  private startChoose() {
    this.prompt.setText("Kde postavíš dům? Ťukni na místo 👆");

    for (const plot of ["rock", "sand"] as const) {
      const { x, top } = PLOTS[plot];
      const ring = this.add.ellipse(x, top, 300, 56).setStrokeStyle(7, 0xfde047).setDepth(5);
      this.tweens.add({
        targets: ring,
        scale: 1.12,
        alpha: 0.5,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      const zone = this.add
        .zone(x, top - 80, 380, 300)
        .setInteractive({ useHandCursor: true })
        .once("pointerdown", () => this.choose(plot));
      this.choiceObjects.push(ring, zone);
    }
  }

  private choose(plot: Plot) {
    sfx.unlock();
    sfx.pop();
    this.plot = plot;
    this.choiceObjects.forEach((o) => o.destroy());
    this.choiceObjects = [];

    const { builderX } = PLOTS[plot];
    this.builder.faceTo(plot === "rock" ? -1 : 1);
    this.prompt.setText(plot === "rock" ? "Stavíme na skále 🪨" : "Stavíme na písku 🏖️");
    this.builder.walkTo(builderX, () => this.spawnPiece());
  }

  // ------------------------------------------------------------- 2) stavba

  private spawnPiece() {
    if (this.nextPiece >= PIECES.length) {
      this.startStorm();
      return;
    }
    if (this.nextPiece === 0) this.prompt.setText("Přetáhni díly na místo a postav dům 🧱");

    const spec = PIECES[this.nextPiece];
    const base = PLOTS[this.plot];
    const target = { x: base.x + spec.dx, y: base.top + spec.dy };

    const ghost = this.add.image(target.x, target.y, spec.key).setAlpha(0.3).setDepth(9);
    this.tweens.add({ targets: ghost, alpha: 0.12, duration: 500, yoyo: true, repeat: -1 });

    const piece = this.add.image(TRAY.x, TRAY.y, spec.key).setDepth(10).setScale(0);
    this.tweens.add({ targets: piece, scale: 1, duration: 300, ease: "Back.easeOut" });
    piece.setInteractive({ draggable: true, useHandCursor: true });

    // ukazující ruka jen u první kostky, pak už to děti znají
    let hand: Phaser.GameObjects.Text | null = null;
    if (this.nextPiece === 0) {
      hand = this.add.text(TRAY.x + 20, TRAY.y + 10, "👆", { fontSize: "64px" }).setDepth(26);
      this.tweens.add({
        targets: hand,
        x: target.x + 20,
        y: target.y + 10,
        duration: 1300,
        ease: "Sine.easeInOut",
        repeat: -1,
        repeatDelay: 500,
      });
    }

    const place = () => {
      hand?.destroy();
      piece.disableInteractive();
      this.tweens.add({
        targets: piece,
        x: target.x,
        y: target.y,
        scale: 1,
        duration: 220,
        ease: "Back.easeOut",
        onComplete: () => {
          ghost.destroy();
          piece.setDepth(10);
          this.dust.explode(16, target.x, target.y + (spec.key === "roof" ? 50 : 30));
          this.cameras.main.shake(90, 0.003);
          sfx.pop();
          this.builder.hammer();
          this.placed.push(piece);
          this.nextPiece++;
          this.time.delayedCall(250, () => this.spawnPiece());
        },
      });
    };

    piece.on("dragstart", () => {
      sfx.unlock();
      piece.setScale(1.08).setDepth(13);
    });
    piece.on("drag", (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      piece.setPosition(dragX, dragY);
    });
    piece.on("dragend", () => {
      const moved = Phaser.Math.Distance.Between(piece.x, piece.y, TRAY.x, TRAY.y);
      const nearTarget = Phaser.Math.Distance.Between(piece.x, piece.y, target.x, target.y) < 130;
      // ťuknutí bez tažení kostku taky položí – pro nejmenší děti
      if (nearTarget || moved < 12) {
        place();
      } else {
        this.tweens.add({
          targets: piece,
          x: TRAY.x,
          y: TRAY.y,
          scale: 1,
          duration: 300,
          ease: "Back.easeOut",
          onComplete: () => piece.setDepth(10),
        });
      }
    });
  }

  // ------------------------------------------------------------- 3) bouřka

  private startStorm() {
    this.prompt.setText("Hotovo! Ale pozor… blíží se bouřka! ⛈️");

    this.time.delayedCall(900, () => {
      const dark = this.add.rectangle(0, 0, W, H, 0x0f172a).setOrigin(0).setDepth(20).setAlpha(0);
      this.tweens.add({ targets: dark, alpha: 0.5, duration: 1500 });
      this.tweens.add({ targets: this.sun, alpha: 0, duration: 1200 });

      const clouds = [
        [200, 80],
        [480, 55],
        [760, 90],
        [1040, 65],
      ].map(([x, y], i) => {
        const cloud = this.add
          .image(i < 2 ? -300 : W + 300, y, "cloud")
          .setScale(1.25)
          .setDepth(21);
        this.tweens.add({ targets: cloud, x, duration: 1400, ease: "Sine.easeOut" });
        return cloud;
      });

      const rain = this.add
        .particles(0, -30, "drop", {
          x: { min: -150, max: W + 150 },
          speedY: { min: 900, max: 1200 },
          speedX: -220,
          rotate: 12,
          lifespan: 900,
          frequency: 10,
          quantity: 3,
          alpha: { start: 0.85, end: 0.5 },
        })
        .setDepth(22);

      // vítr cloumá domem
      this.tweens.add({
        targets: this.placed,
        x: "+=4",
        duration: 90,
        yoyo: true,
        repeat: -1,
      });

      this.tweens.add({ targets: this.water, y: WATER_Y, duration: 3200, ease: "Sine.easeInOut" });

      this.time.delayedCall(1300, () => this.lightning());
      this.time.delayedCall(2900, () => this.lightning());
      this.time.delayedCall(4300, () => {
        this.tweens.killTweensOf(this.placed);
        if (this.plot === "rock") this.surviveStorm(dark, clouds, rain);
        else this.collapse();
      });
    });
  }

  private lightning() {
    const x = Phaser.Math.Between(250, 950);
    const path: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(x, 110)];
    let px = x;
    for (let y = 170; y <= 470; y += 60) {
      px += Phaser.Math.Between(-45, 45);
      path.push(new Phaser.Math.Vector2(px, y));
    }
    const bolt = this.add.graphics().setDepth(23);
    bolt.lineStyle(14, 0xfef08a, 0.35).strokePoints(path);
    bolt.lineStyle(6, 0xffffff).strokePoints(path);
    this.tweens.add({ targets: bolt, alpha: 0, duration: 350, delay: 120, onComplete: () => bolt.destroy() });

    this.cameras.main.flash(180, 255, 255, 255);
    this.cameras.main.shake(400, 0.008);
    sfx.thunder();
  }

  private surviveStorm(
    dark: Phaser.GameObjects.Rectangle,
    clouds: Phaser.GameObjects.Image[],
    rain: Phaser.GameObjects.Particles.ParticleEmitter,
  ) {
    rain.stop();
    this.prompt.setText("Dům na skále vydržel! 🎉");
    this.tweens.add({ targets: dark, alpha: 0, duration: 1500 });
    clouds.forEach((c, i) =>
      this.tweens.add({ targets: c, x: i < 2 ? -300 : W + 300, duration: 1600, ease: "Sine.easeIn" }),
    );
    this.tweens.add({ targets: this.sun, alpha: 1, duration: 1500 });
    this.tweens.add({ targets: this.rainbow, alpha: 1, duration: 2000, delay: 600 });
    this.tweens.add({ targets: this.water, y: H + 10, duration: 2200, ease: "Sine.easeIn" });

    this.builder.celebrate();
    sfx.win();
    const { x, top } = PLOTS.rock;
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 450, () => this.stars.explode(28, x, top - 200));
    }
    this.time.delayedCall(2000, () => this.game.events.emit(OUTCOME_EVENT, "rock"));
  }

  private collapse() {
    this.prompt.setText("Ach ne! Voda rozplavila písek… 😢");
    this.cameras.main.shake(600, 0.01);

    this.tweens.add({
      targets: this.sandImg,
      scaleY: 0.15,
      duration: 1300,
      ease: "Quad.easeIn",
    });

    // shora dolů: nejdřív padá střecha, pak kostky
    [...this.placed].reverse().forEach((piece, i) => {
      this.tweens.add({
        targets: piece,
        x: piece.x + Phaser.Math.Between(-140, 140),
        y: GROUND_Y + 40 + i * 12,
        angle: Phaser.Math.Between(-130, 130),
        duration: 900,
        delay: 250 + i * 110,
        ease: "Quad.easeIn",
        onComplete: () => {
          this.splash.explode(18, piece.x, WATER_Y + 10);
          if (i === 0) sfx.splash();
          this.tweens.add({ targets: piece, alpha: 0.35, y: "+=30", duration: 800 });
        },
      });
    });

    this.time.delayedCall(1400, () => {
      this.builder.cry();
      sfx.sad();
    });
    this.time.delayedCall(2600, () => this.game.events.emit(OUTCOME_EVENT, "sand"));
  }
}
