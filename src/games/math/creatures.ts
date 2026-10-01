import * as Phaser from "phaser";
import { points } from "../phaser/draw";
import type { CreatureType } from "./options";

/**
 * Postavičky do jeskyně. Každá je kontejner s počátkem u země a umí dva
 * stavy: v klidu (stojí), nebo „v pohybu“ (trpaslík kope krumpáčem,
 * jablíčko poskakuje, králíček hopsá). `variant` mění barvy a posouvá
 * fázi animace, aby nebyly všechny stejné.
 */
export abstract class Creature {
  readonly root: Phaser.GameObjects.Container;
  protected readonly scene: Phaser.Scene;
  protected readonly variant: number;

  constructor(scene: Phaser.Scene, x: number, y: number, variant: number) {
    this.scene = scene;
    this.variant = variant;
    this.root = scene.add.container(x, y);
  }

  /** Všechny části, které se animují (kvůli zastavení tweenů). */
  protected abstract parts(): Phaser.GameObjects.GameObject[];
  protected abstract resetPose(): void;
  protected abstract animate(delay: number): void;

  setActive(active: boolean) {
    // jen části těla – tween na `root` (naskočení do jeskyně) musí doběhnout
    this.scene.tweens.killTweensOf(this.parts());
    this.resetPose();
    if (active) this.animate((this.variant % 5) * 130);
  }

  destroy() {
    this.scene.tweens.killTweensOf([this.root, ...this.parts()]);
    this.root.destroy();
  }
}

const HAT = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706, 0x7c3aed, 0xdb2777];
const SHIRT = [0x7c2d12, 0x1e3a8a, 0x14532d, 0x78350f, 0x4c1d95, 0x831843];

class Dwarf extends Creature {
  private readonly armBox: Phaser.GameObjects.Container;
  private readonly pick: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, variant: number) {
    super(scene, x, y, variant);
    const shirt = SHIRT[variant % SHIRT.length];
    const hat = HAT[variant % HAT.length];

    const g = scene.add.graphics();
    g.fillStyle(0x3f2d1c);
    g.fillRoundedRect(-17, -38, 14, 36, 6);
    g.fillRoundedRect(3, -38, 14, 36, 6);
    g.fillStyle(0x1c1917);
    g.fillRoundedRect(-21, -8, 19, 8, 3);
    g.fillRoundedRect(2, -8, 19, 8, 3);
    g.fillStyle(shirt).fillRoundedRect(-28, -82, 56, 50, 22);
    g.fillStyle(shirt).fillRoundedRect(-38, -78, 14, 34, 7);
    g.fillStyle(0x2a1c10).fillRect(-28, -46, 56, 8);
    g.fillStyle(0xfacc15).fillRect(-6, -46, 12, 8);
    g.fillStyle(0xf0bd8e).fillCircle(0, -98, 22);
    g.fillStyle(0xf5f5f4).fillPoints(points(-23, -98, 23, -98, 16, -66, 0, -54, -16, -66), true);
    g.fillStyle(0xe8a07a).fillCircle(0, -94, 5);
    g.fillStyle(0x292524);
    g.fillCircle(-8, -103, 2.8);
    g.fillCircle(8, -103, 2.8);
    g.fillStyle(hat).fillTriangle(-25, -112, 0, -164, 25, -112);
    g.fillStyle(hat).fillRoundedRect(-27, -116, 54, 9, 4);
    g.fillStyle(0xffffff).fillCircle(0, -164, 6);

    // paže s krumpáčem – celý „armBox“ se otáčí v rameni, krumpáč je v ruce
    const arm = scene.add.graphics();
    arm.fillStyle(shirt).fillRoundedRect(-7, 0, 14, 32, 7);
    arm.fillStyle(0xf0bd8e).fillCircle(0, 34, 7);
    this.pick = scene.add.graphics({ x: 0, y: 34 });
    this.pick.fillStyle(0x8a5a2b).fillRoundedRect(-3, -26, 6, 62, 3);
    this.pick.fillStyle(0xa8a29e).fillTriangle(-26, -22, 26, -22, 0, -36);
    this.pick.fillStyle(0x78716c).fillTriangle(-26, -22, -14, -22, -26, -14);
    this.armBox = scene.add.container(24, -74, [this.pick, arm]);
    this.root.add([g, this.armBox]);
    this.resetPose();
  }

  protected parts() {
    return [this.armBox];
  }

  protected resetPose() {
    this.armBox.angle = 0;
    this.pick.setVisible(false);
  }

  protected animate(delay: number) {
    this.pick.setVisible(true);
    this.armBox.angle = -170;
    this.scene.tweens.add({
      targets: this.armBox,
      angle: -45,
      duration: 380,
      delay,
      ease: "Quad.easeIn",
      yoyo: true,
      hold: 80,
      repeat: -1,
    });
  }
}

const APPLE = [0xdc2626, 0x16a34a, 0xf59e0b];

class Apple extends Creature {
  private readonly leaf: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, variant: number) {
    super(scene, x, y, variant);
    const color = APPLE[variant % APPLE.length];

    const g = scene.add.graphics();
    g.fillStyle(0x6b4226).fillRoundedRect(-3, -112, 7, 22, 3);
    g.fillStyle(color);
    g.fillCircle(-17, -52, 36);
    g.fillCircle(17, -52, 36);
    g.fillCircle(0, -36, 30);
    g.fillStyle(0xffffff, 0.3).fillEllipse(-24, -66, 14, 22);
    g.fillStyle(0x292524);
    g.fillCircle(-12, -54, 4);
    g.fillCircle(12, -54, 4);
    g.lineStyle(3, 0x292524);
    g.beginPath();
    g.arc(0, -46, 9, Math.PI * 0.2, Math.PI * 0.8);
    g.strokePath();

    this.leaf = scene.add.graphics({ x: 3, y: -104 });
    this.leaf.fillStyle(0x16a34a).fillEllipse(16, -4, 30, 13);
    this.body = scene.add.container(0, 0, [g, this.leaf]);
    this.root.add(this.body);
    this.resetPose();
  }

  protected parts() {
    return [this.leaf, this.body];
  }

  protected resetPose() {
    this.leaf.angle = -10;
    this.body.setScale(1).setY(0);
  }

  protected animate(delay: number) {
    this.scene.tweens.add({
      targets: this.body,
      y: -34,
      duration: 320,
      delay,
      ease: "Quad.easeOut",
      yoyo: true,
      repeat: -1,
      repeatDelay: 120,
    });
    this.scene.tweens.add({ targets: this.leaf, angle: 25, duration: 220, delay, yoyo: true, repeat: -1 });
  }
}

const FUR = [0xfafaf9, 0xa8a29e, 0x92400e];

class Bunny extends Creature {
  private readonly earL: Phaser.GameObjects.Graphics;
  private readonly earR: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, variant: number) {
    super(scene, x, y, variant);
    const fur = FUR[variant % FUR.length];

    const ear = (ex: number) => {
      const e = scene.add.graphics({ x: ex, y: -86 });
      e.fillStyle(fur).fillEllipse(0, -26, 18, 54);
      e.fillStyle(0xfbcfe8).fillEllipse(0, -24, 8, 36);
      return e;
    };
    this.earL = ear(-14);
    this.earR = ear(14);

    const g = scene.add.graphics();
    g.fillStyle(fur);
    g.fillEllipse(-20, -6, 24, 14);
    g.fillEllipse(20, -6, 24, 14);
    g.fillEllipse(0, -32, 66, 54);
    g.fillCircle(-34, -32, 10);
    g.fillCircle(0, -76, 27);
    g.lineStyle(2, 0x000000, 0.12).strokeEllipse(0, -32, 66, 54);
    g.fillStyle(0x292524);
    g.fillCircle(-9, -80, 3.5);
    g.fillCircle(9, -80, 3.5);
    g.fillStyle(0xf472b6).fillCircle(0, -70, 4);

    this.body = scene.add.container(0, 0, [this.earL, this.earR, g]);
    this.root.add(this.body);
    this.resetPose();
  }

  protected parts() {
    return [this.earL, this.earR, this.body];
  }

  protected resetPose() {
    this.earL.angle = -8;
    this.earR.angle = 8;
    this.body.setY(0);
  }

  protected animate(delay: number) {
    this.scene.tweens.add({
      targets: this.body,
      y: -46,
      duration: 300,
      delay,
      ease: "Quad.easeOut",
      yoyo: true,
      repeat: -1,
      repeatDelay: 160,
    });
    this.scene.tweens.add({ targets: this.earL, angle: -35, duration: 300, delay, yoyo: true, repeat: -1 });
    this.scene.tweens.add({ targets: this.earR, angle: 35, duration: 300, delay, yoyo: true, repeat: -1 });
  }
}

export function makeCreature(
  scene: Phaser.Scene,
  type: CreatureType,
  x: number,
  y: number,
  variant: number,
): Creature {
  switch (type) {
    case "apple":
      return new Apple(scene, x, y, variant);
    case "animal":
      return new Bunny(scene, x, y, variant);
    case "dwarf":
    default:
      return new Dwarf(scene, x, y, variant);
  }
}
