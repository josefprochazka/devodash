import * as Phaser from "phaser";

const SKIN = 0xf2c9a0;
const SHIRT = 0xef4444;
const PANTS = 0x1d4ed8;

/**
 * Dítě, které šplhá po žebříku a pak letí s Ježíšem. Počátek kontejneru je
 * u chodidel. Ruce a nohy jsou samostatné Graphics s počátkem v kloubu
 * (rameno, kyčel), takže se jen otáčejí – úhel 0 = visí dolů, 180 = nahoru.
 */
export class Kid {
  /** Kde je pravá ruka v póze „letím“ (vůči chodidlům) – tam ji chytí Ježíš. */
  static readonly FLY_HAND = { x: 35, y: -117 };

  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly armL: Phaser.GameObjects.Graphics;
  private readonly armR: Phaser.GameObjects.Graphics;
  private readonly legL: Phaser.GameObjects.Graphics;
  private readonly legR: Phaser.GameObjects.Graphics;
  private readonly face: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    const limb = (lx: number, ly: number, color: number, len: number, end: number) => {
      const g = scene.add.graphics({ x: lx, y: ly });
      g.fillStyle(color).fillRoundedRect(-6, 0, 12, len, 6);
      g.fillStyle(end).fillCircle(0, len, 6.5);
      return g;
    };
    this.legL = limb(-8, -46, PANTS, 40, 0x44403c);
    this.legR = limb(8, -46, PANTS, 40, 0x44403c);
    this.armL = limb(-17, -84, SHIRT, 36, SKIN);
    this.armR = limb(17, -84, SHIRT, 36, SKIN);

    const body = scene.add.graphics();
    body.fillStyle(SHIRT).fillRoundedRect(-19, -92, 38, 50, 13);
    body.fillStyle(SKIN).fillCircle(0, -110, 21);
    body.fillStyle(0x5b3a29);
    body.beginPath();
    body.arc(0, -114, 22, Math.PI * 1.05, Math.PI * 1.95);
    body.closePath();
    body.fillPath();

    this.face = scene.add.graphics();
    this.root = scene.add.container(x, y, [this.legL, this.legR, this.armL, this.armR, body, this.face]);
    this.setMood("neutral");
    this.stand();
  }

  setMood(mood: "neutral" | "happy" | "worried") {
    const f = this.face;
    f.clear();
    f.fillStyle(0x292524);
    f.fillCircle(-7, -110, 2.6);
    f.fillCircle(7, -110, 2.6);
    f.lineStyle(3, 0x7c2d12);
    f.beginPath();
    if (mood === "happy") f.arc(0, -104, 8, Math.PI * 0.15, Math.PI * 0.85);
    else if (mood === "worried") f.arc(0, -94, 7, Math.PI * 1.2, Math.PI * 1.8);
    else {
      f.moveTo(-5, -99);
      f.lineTo(5, -99);
    }
    f.strokePath();
  }

  stand() {
    this.armL.angle = 12;
    this.armR.angle = -12;
    this.legL.angle = 0;
    this.legR.angle = 0;
  }

  /** Póza na žebříku; `phase` střídá, která ruka/noha je výš. */
  climbPose(phase: number) {
    const up = phase % 2 === 0;
    this.armL.angle = up ? 168 : 148;
    this.armR.angle = up ? -148 : -168;
    this.legL.angle = up ? 18 : 0;
    this.legR.angle = up ? 0 : -18;
  }

  /** Natahuje se nahoru ke světlu – ale nedosáhne. */
  reachUp() {
    for (const [arm, angle] of [
      [this.armL, 178],
      [this.armR, -178],
    ] as const) {
      this.scene.tweens.add({ targets: arm, angle, duration: 300, yoyo: true, repeat: 3 });
    }
  }

  flyPose() {
    this.armR.angle = -150;
    this.armL.angle = 40;
    this.legL.angle = 25;
    this.legR.angle = 10;
  }
}
