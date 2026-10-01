import * as Phaser from "phaser";

export type Mood = "neutral" | "happy" | "sad";

const SKIN = 0xf5c79e;

/**
 * Postavička stavitele v přilbě. Kreslená kódem; počátek kontejneru je
 * mezi chodidly, takže `y` = úroveň země. Ruka s kladivem je samostatný
 * Graphics s počátkem v rameni, aby se dala otáčet.
 */
export class Builder {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly face: Phaser.GameObjects.Graphics;
  private readonly arm: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    const body = scene.add.graphics();
    // nohy a boty
    body.fillStyle(0x1e3a8a);
    body.fillRoundedRect(-20, -52, 16, 48, 5);
    body.fillRoundedRect(4, -52, 16, 48, 5);
    body.fillStyle(0x44403c);
    body.fillRoundedRect(-25, -10, 23, 10, 4);
    body.fillRoundedRect(2, -10, 23, 10, 4);
    // zadní ruka
    body.fillStyle(SKIN).fillRoundedRect(-40, -116, 14, 50, 7);
    // trup – tričko a montérky
    body.fillStyle(0xf97316).fillRoundedRect(-30, -124, 60, 80, 14);
    body.fillStyle(0x1d4ed8).fillRoundedRect(-30, -84, 60, 40, { tl: 0, tr: 0, bl: 12, br: 12 });
    body.fillRect(-22, -110, 8, 28);
    body.fillRect(14, -110, 8, 28);
    // hlava a přilba
    body.fillStyle(SKIN).fillCircle(0, -152, 32);
    body.fillStyle(0xfacc15);
    body.beginPath();
    body.arc(0, -160, 34, Math.PI, 0);
    body.closePath();
    body.fillPath();
    body.fillRoundedRect(-42, -164, 84, 10, 5);

    this.face = scene.add.graphics();

    this.arm = scene.add.graphics({ x: 26, y: -114 });
    this.arm.fillStyle(SKIN).fillRoundedRect(-7, 0, 14, 48, 7);
    this.arm.fillStyle(0x92400e).fillRect(0, 38, 42, 7);
    this.arm.fillStyle(0x57534e).fillRoundedRect(36, 26, 16, 32, 3);

    this.root = scene.add.container(x, y, [body, this.arm, this.face]);
    this.setMood("neutral");
  }

  setMood(mood: Mood) {
    const f = this.face;
    f.clear();
    f.fillStyle(0x1c1917);
    f.fillCircle(-11, -156, 4);
    f.fillCircle(11, -156, 4);
    if (mood === "happy") {
      f.fillStyle(0xfb7185, 0.5);
      f.fillCircle(-20, -142, 6);
      f.fillCircle(20, -142, 6);
    }
    f.lineStyle(4, 0x7c2d12);
    f.beginPath();
    if (mood === "happy") {
      f.arc(0, -146, 12, Math.PI * 0.15, Math.PI * 0.85);
    } else if (mood === "sad") {
      f.arc(0, -128, 12, Math.PI * 1.2, Math.PI * 1.8);
    } else {
      f.moveTo(-8, -138);
      f.lineTo(8, -138);
    }
    f.strokePath();
  }

  /** 1 = dívá se doprava, -1 = doleva. */
  faceTo(dir: 1 | -1) {
    this.root.scaleX = dir;
  }

  walkTo(x: number, onDone: () => void) {
    const duration = Math.max(400, Math.abs(this.root.x - x) * 8);
    this.scene.tweens.add({
      targets: this.root,
      x,
      duration,
      ease: "Sine.easeInOut",
      onComplete: onDone,
    });
    this.scene.tweens.add({
      targets: this.root,
      y: this.root.y - 10,
      duration: 140,
      yoyo: true,
      repeat: Math.floor(duration / 280),
    });
  }

  hammer() {
    this.scene.tweens.add({
      targets: this.arm,
      angle: { from: 0, to: -75 },
      duration: 110,
      yoyo: true,
      repeat: 1,
    });
  }

  celebrate() {
    this.setMood("happy");
    this.scene.tweens.add({
      targets: this.root,
      y: this.root.y - 60,
      duration: 260,
      ease: "Quad.easeOut",
      yoyo: true,
      repeat: 4,
    });
    this.scene.tweens.add({
      targets: this.arm,
      angle: -150,
      duration: 260,
      yoyo: true,
      repeat: 4,
    });
  }

  cry() {
    this.setMood("sad");
    for (const [side, delay] of [
      [-1, 0],
      [1, 450],
    ] as const) {
      const tear = this.scene.add.circle(side * 13, -148, 5, 0x60a5fa);
      this.root.add(tear);
      this.scene.tweens.add({
        targets: tear,
        y: -110,
        alpha: { from: 1, to: 0 },
        duration: 900,
        delay,
        repeat: -1,
      });
    }
  }
}
