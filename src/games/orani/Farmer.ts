import * as Phaser from "phaser";

export type Mood = "neutral" | "happy" | "sad";

const SKIN = 0xf5c79e;
const SHIRT = 0x16a34a;
const PANTS = 0x78350f;

/**
 * Farmář se slaměným kloboukem a ručním pluhem. Kreslený kódem; počátek
 * kontejneru je mezi chodidly (`y` = úroveň země), dívá se doprava.
 * Přední ruka je samostatný Graphics s počátkem v rameni, aby se dala otáčet.
 */
export class Farmer {
  /** Jak daleko před farmářem je radlice pluhu (tam se oře). */
  static readonly PLOW_REACH = 140;

  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly face: Phaser.GameObjects.Graphics;
  private readonly arm: Phaser.GameObjects.Graphics;
  private readonly plow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    const body = scene.add.graphics();
    // nohy a boty
    body.fillStyle(PANTS);
    body.fillRoundedRect(-20, -54, 16, 50, 5);
    body.fillRoundedRect(4, -54, 16, 50, 5);
    body.fillStyle(0x292524);
    body.fillRoundedRect(-24, -10, 23, 10, 4);
    body.fillRoundedRect(3, -10, 24, 10, 4);
    // zadní ruka
    body.fillStyle(0x15803d).fillRoundedRect(-38, -118, 14, 48, 7);
    // trup – zelená košile, kalhoty se šlemi
    body.fillStyle(SHIRT).fillRoundedRect(-28, -124, 56, 80, 14);
    body.fillStyle(0x15803d);
    for (const y of [-108, -92, -76]) body.fillRect(-28, y, 56, 3);
    body.fillStyle(PANTS).fillRoundedRect(-28, -62, 56, 18, { tl: 0, tr: 0, bl: 10, br: 10 });
    body.fillRect(-20, -124, 7, 64);
    body.fillRect(13, -124, 7, 64);
    // hlava, vousy a slaměný klobouk
    body.fillStyle(SKIN).fillCircle(0, -150, 30);
    body.fillStyle(0xeab308).fillEllipse(0, -168, 104, 22);
    body.fillStyle(0xfacc15).fillRoundedRect(-28, -202, 56, 36, { tl: 20, tr: 20, bl: 0, br: 0 });
    body.fillStyle(0xb45309).fillRect(-28, -178, 56, 7);

    this.face = scene.add.graphics();

    // pluh: dvě rukojeti, hřídel a radlice
    this.plow = scene.add.graphics();
    this.plow.lineStyle(9, 0x92400e);
    this.plow.lineBetween(56, -96, 118, -20);
    this.plow.lineStyle(7, 0x78350f);
    this.plow.lineBetween(44, -88, 106, -14);
    this.plow.lineStyle(10, 0x92400e);
    this.plow.lineBetween(100, -20, 150, -20);
    this.plow.fillStyle(0x78716c).fillTriangle(118, -24, 162, -2, 116, 0);
    this.plow.fillStyle(0xd6d3d1).fillTriangle(130, -14, 158, -3, 128, -2);

    this.arm = scene.add.graphics({ x: 20, y: -114 });
    this.arm.fillStyle(SHIRT).fillRoundedRect(-7, 0, 14, 44, 7);
    this.arm.fillStyle(SKIN).fillCircle(0, 48, 8);
    this.arm.angle = -60;

    this.root = scene.add.container(x, y, [body, this.plow, this.arm, this.face]);
    this.setMood("neutral");
  }

  setMood(mood: Mood) {
    const f = this.face;
    f.clear();
    f.fillStyle(0x1c1917);
    f.fillCircle(-10, -154, 4);
    f.fillCircle(11, -154, 4);
    if (mood === "happy") {
      f.fillStyle(0xfb7185, 0.5);
      f.fillCircle(-19, -140, 6);
      f.fillCircle(20, -140, 6);
    }
    f.lineStyle(4, 0x7c2d12);
    f.beginPath();
    if (mood === "happy") {
      f.arc(0, -144, 12, Math.PI * 0.15, Math.PI * 0.85);
    } else if (mood === "sad") {
      f.arc(0, -126, 12, Math.PI * 1.2, Math.PI * 1.8);
    } else {
      f.moveTo(-8, -136);
      f.lineTo(8, -136);
    }
    f.strokePath();
  }

  showPlow(visible: boolean) {
    this.plow.setVisible(visible);
    this.arm.angle = visible ? -60 : 0;
  }

  /** Lehké pohupování při chůzi – volat při každém posunu. */
  sway(x: number) {
    this.root.angle = Math.sin(x / 14) * 4;
    this.plow.y = Math.abs(Math.sin(x / 14)) * -3;
  }

  celebrate() {
    this.setMood("happy");
    this.root.angle = 0;
    this.scene.tweens.add({
      targets: this.root,
      y: this.root.y - 60,
      duration: 260,
      ease: "Quad.easeOut",
      yoyo: true,
      repeat: 5,
    });
    this.scene.tweens.add({ targets: this.arm, angle: -170, duration: 260, yoyo: true, repeat: 5 });
  }

  cry() {
    this.setMood("sad");
    for (const [side, delay] of [
      [-1, 0],
      [1, 450],
    ] as const) {
      const tear = this.scene.add.circle(side * 12, -146, 5, 0x60a5fa);
      this.root.add(tear);
      this.scene.tweens.add({
        targets: tear,
        y: -108,
        alpha: { from: 1, to: 0 },
        duration: 900,
        delay,
        repeat: -1,
      });
    }
  }
}
