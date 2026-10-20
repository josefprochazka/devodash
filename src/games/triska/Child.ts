import * as Phaser from "phaser";
import { points } from "../phaser/draw";

const SKIN = 0xf5c79e;
const INK = 0x1c1917;

export type EyeState = "open" | "closed" | "speck" | "beam";
export type Mouth = "neutral" | "happy" | "sad" | "ouch" | "strain";

interface Look {
  name: string;
  shirt: number;
  pants: number;
  hair: number;
  girl: boolean;
  /** Kam se dívají panenky: -1 doleva, 1 doprava. */
  lookX: number;
}

/**
 * Velká postavička dítěte s velkou hlavou a velkýma očima – aby bylo
 * dobře vidět, co má kdo v oku. Počátek kontejneru je mezi chodidly
 * (`y` = úroveň země). Pravá ruka je samostatný Graphics s počátkem
 * v rameni, aby se dala natahovat (úhel 0 = visí dolů, -90 = vodorovně
 * doprava).
 */
export class Child {
  static readonly EYE_DX = 34;
  static readonly EYE_Y = -340;
  static readonly ARM_LEN = 96;
  private static readonly SHOULDER = { x: 56, y: -228 };

  readonly root: Phaser.GameObjects.Container;
  readonly armR: Phaser.GameObjects.Graphics;
  private readonly scene: Phaser.Scene;
  private readonly armL: Phaser.GameObjects.Graphics;
  private readonly face: Phaser.GameObjects.Graphics;
  private readonly look: Look;
  /** Stav očí [levé, pravé] z pohledu diváka. */
  private eyes: [EyeState, EyeState] = ["open", "open"];
  private mouth: Mouth = "neutral";

  constructor(scene: Phaser.Scene, x: number, y: number, look: Look) {
    this.scene = scene;
    this.look = look;

    const back = scene.add.graphics();
    if (look.girl) {
      // dlouhé vlasy za hlavou
      back.fillStyle(look.hair).fillCircle(0, -330, 108);
      back.fillRoundedRect(-108, -340, 216, 120, 40);
    }

    const body = scene.add.graphics();
    if (look.girl) {
      body.fillStyle(SKIN);
      body.fillRoundedRect(-34, -112, 24, 100, 10);
      body.fillRoundedRect(10, -112, 24, 100, 10);
      body.fillStyle(0xffffff);
      body.fillRoundedRect(-36, -48, 28, 36, 8);
      body.fillRoundedRect(8, -48, 28, 36, 8);
      body.fillStyle(look.shirt).fillPoints(points(-46, -252, 46, -252, 82, -96, -82, -96), true);
      body.fillStyle(0xffffff).fillEllipse(0, -246, 60, 22);
      body.fillStyle(0xffffff, 0.6);
      for (const [dx, dy] of [
        [-30, -140],
        [20, -170],
        [40, -120],
        [-10, -200],
      ]) {
        body.fillCircle(dx, dy, 7);
      }
    } else {
      body.fillStyle(look.pants);
      body.fillRoundedRect(-36, -120, 30, 110, 10);
      body.fillRoundedRect(6, -120, 30, 110, 10);
      body.fillStyle(look.shirt).fillRoundedRect(-58, -252, 116, 150, 28);
      body.fillStyle(0xffffff, 0.35).fillRect(-58, -200, 116, 16);
    }
    body.fillStyle(0x44403c);
    body.fillRoundedRect(-44, -16, 40, 16, 7);
    body.fillRoundedRect(4, -16, 40, 16, 7);

    const arm = (sx: number) => {
      const g = scene.add.graphics({ x: sx, y: Child.SHOULDER.y });
      g.fillStyle(look.shirt).fillRoundedRect(-14, -6, 28, 50, 12);
      g.fillStyle(SKIN).fillRoundedRect(-11, 40, 22, 52, 10);
      g.fillCircle(0, Child.ARM_LEN, 15);
      return g;
    };
    this.armL = arm(-Child.SHOULDER.x);
    this.armR = arm(Child.SHOULDER.x);

    const head = scene.add.graphics();
    head.fillStyle(SKIN);
    head.fillCircle(-94, -330, 18);
    head.fillCircle(94, -330, 18);
    head.fillCircle(0, -330, 95);
    head.fillStyle(look.hair);
    head.slice(0, -345, 102, Math.PI * 1.15, Math.PI * 1.85, false);
    head.fillPath();
    if (look.girl) {
      for (const side of [-1, 1]) {
        head.fillStyle(look.hair).fillCircle(side * 114, -296, 30);
        head.fillStyle(0xec4899);
        head.fillPoints(points(side * 96, -330, side * 76, -350, side * 76, -310), true);
        head.fillPoints(points(side * 96, -330, side * 116, -350, side * 116, -310), true);
        head.fillCircle(side * 96, -330, 7);
      }
    } else {
      head.fillPoints(points(-20, -440, 0, -470, 12, -442), true);
    }

    this.face = scene.add.graphics();

    const label = scene.add
      .text(0, 28, look.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#14532d",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.root = scene.add.container(x, y, [back, body, this.armL, this.armR, head, this.face, label]);
    this.armL.angle = 12;
    this.armR.angle = -12;
    this.draw();
  }

  setEyes(left: EyeState, right: EyeState) {
    this.eyes = [left, right];
    this.draw();
  }

  setMouth(mouth: Mouth) {
    this.mouth = mouth;
    this.draw();
  }

  /** Zamrká (jedno oko, nebo obě) a vrátí oči do „open“. */
  blink(times = 1, onDone?: () => void) {
    const run = (left: number) => {
      this.setEyes("closed", "closed");
      this.scene.time.delayedCall(150, () => {
        this.setEyes("open", "open");
        if (left > 1) this.scene.time.delayedCall(220, () => run(left - 1));
        else onDone?.();
      });
    };
    run(times);
  }

  /** Střed oka ve světě; -1 = levé, 1 = pravé (z pohledu diváka). */
  eyeWorld(side: -1 | 1) {
    return { x: this.root.x + side * Child.EYE_DX, y: this.root.y + Child.EYE_Y };
  }

  shoulderWorld() {
    return { x: this.root.x + Child.SHOULDER.x, y: this.root.y + Child.SHOULDER.y };
  }

  /** Kde je teď dlaň pravé ruky. */
  handWorld() {
    const s = this.shoulderWorld();
    const r = this.armR.rotation;
    return { x: s.x - Math.sin(r) * Child.ARM_LEN, y: s.y + Math.cos(r) * Child.ARM_LEN };
  }

  /** Úhel ruky, aby mířila z ramene na bod (ve stupních). */
  armAngleTo(target: { x: number; y: number }) {
    const s = this.shoulderWorld();
    return Phaser.Math.RadToDeg(Math.atan2(target.y - s.y, target.x - s.x)) - 90;
  }

  walkTo(x: number, duration: number, onDone?: () => void) {
    const bob = this.scene.tweens.add({
      targets: this.root,
      y: this.root.y - 12,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
    const groundY = this.root.y;
    this.scene.tweens.add({
      targets: this.root,
      x,
      duration,
      ease: "Sine.easeInOut",
      onComplete: () => {
        bob.stop();
        this.root.y = groundY;
        onDone?.();
      },
    });
  }

  hop(times = 3) {
    this.scene.tweens.add({
      targets: this.root,
      y: this.root.y - 40,
      duration: 220,
      ease: "Quad.easeOut",
      yoyo: true,
      repeat: times - 1,
    });
  }

  // ------------------------------------------------------------ kreslení

  private draw() {
    const f = this.face;
    f.clear();
    f.fillStyle(0xfb7185, this.mouth === "happy" ? 0.55 : 0.3);
    f.fillCircle(-60, -296, 14);
    f.fillCircle(60, -296, 14);
    this.drawEye(-1, this.eyes[0]);
    this.drawEye(1, this.eyes[1]);
    this.drawBrows();
    this.drawMouth();
  }

  private drawEye(side: -1 | 1, state: EyeState) {
    const f = this.face;
    const ex = side * Child.EYE_DX;
    const ey = Child.EYE_Y;

    if (state === "closed") {
      f.lineStyle(5, INK);
      f.beginPath();
      f.arc(ex, ey - 8, 20, Math.PI * 0.15, Math.PI * 0.85);
      f.strokePath();
      return;
    }
    if (state === "beam") {
      // přimhouřené oko schované za trámem
      f.lineStyle(5, INK);
      f.lineBetween(ex - 22, ey - 14, ex + 6, ey);
      f.lineBetween(ex - 22, ey + 14, ex + 6, ey);
      return;
    }

    const sore = state === "speck";
    f.fillStyle(sore ? 0xffe4e6 : 0xffffff).fillEllipse(ex, ey, 52, 60);
    f.lineStyle(3, sore ? 0xf43f5e : INK).strokeEllipse(ex, ey, 52, 60);
    const px = ex + this.look.lookX * 6;
    const py = ey + 4;
    f.fillStyle(0x6b4423).fillCircle(px, py, 14);
    f.fillStyle(INK).fillCircle(px, py, 8);
    f.fillStyle(0xffffff).fillCircle(px - 5, py - 6, 5);
    if (sore) {
      // bolavé oko je napůl přivřené
      f.fillStyle(SKIN);
      f.slice(ex, ey, 32, Math.PI, Math.PI * 2, false);
      f.fillPath();
      f.lineStyle(4, INK).lineBetween(ex - 27, ey, ex + 27, ey);
    }
  }

  private drawBrows() {
    const f = this.face;
    f.lineStyle(6, 0x57534e);
    for (const side of [-1, 1]) {
      const inner = side * 18;
      const outer = side * 50;
      if (this.mouth === "strain" || this.mouth === "ouch") f.lineBetween(inner, -374, outer, -386);
      else if (this.mouth === "sad") f.lineBetween(inner, -386, outer, -376);
      else f.lineBetween(inner, -382, outer, -382);
    }
  }

  private drawMouth() {
    const f = this.face;
    switch (this.mouth) {
      case "happy":
        f.fillStyle(0x7f1d1d);
        f.slice(0, -292, 26, 0, Math.PI, false);
        f.fillPath();
        f.fillStyle(0xfb7185).fillEllipse(0, -276, 22, 10);
        break;
      case "sad":
        f.lineStyle(5, 0x7c2d12);
        f.beginPath();
        f.arc(0, -262, 20, Math.PI * 1.2, Math.PI * 1.8);
        f.strokePath();
        break;
      case "ouch":
        f.fillStyle(0x7f1d1d).fillEllipse(0, -282, 24, 30);
        break;
      case "strain":
        f.fillStyle(0xffffff).fillRoundedRect(-22, -292, 44, 18, 6);
        f.lineStyle(3, INK).strokeRoundedRect(-22, -292, 44, 18, 6);
        f.lineBetween(-22, -283, 22, -283);
        break;
      default:
        f.lineStyle(5, 0x7c2d12).lineBetween(-12, -282, 12, -282);
    }
  }
}
