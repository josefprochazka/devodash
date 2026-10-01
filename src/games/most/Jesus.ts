import * as Phaser from "phaser";
import { points } from "../phaser/draw";

/**
 * Zjednodušená, uctivá postava Ježíše – bílé roucho, fialová šerpa,
 * svatozář a jemná záře kolem. Počátek kontejneru je u spodního lemu roucha.
 * Levá ruka (na straně dítěte) se natahuje dolů a pak drží dítě za ruku.
 */
export class Jesus {
  /** Kde je natažená ruka (vůči počátku). */
  static readonly HAND = { x: -61, y: -79 };

  readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const aura = scene.add.circle(0, -90, 120, 0xfef9c3, 0.35);
    scene.tweens.add({ targets: aura, scale: 1.15, alpha: 0.2, duration: 1100, yoyo: true, repeat: -1 });
    const halo = scene.add.circle(0, -134, 34, 0xfde68a, 0.85);

    const body = scene.add.graphics();
    body.fillStyle(0xf8fafc).fillPoints(points(-32, 0, -22, -112, 22, -112, 32, 0), true);
    body.lineStyle(2, 0xe2e8f0).strokePoints(points(-32, 0, -22, -112, 22, -112, 32, 0), true);
    body.lineStyle(9, 0xa78bfa).lineBetween(-24, -78, 26, -48);
    // pravá ruka podél těla
    body.fillStyle(0xf8fafc).fillRoundedRect(14, -106, 13, 48, 6);
    body.fillStyle(0xe4b58c).fillCircle(20, -56, 6.5);
    // hlava, vlasy a vousy
    body.fillStyle(0x3f2d1c).fillRoundedRect(-22, -150, 44, 42, 14);
    body.fillStyle(0xe4b58c).fillCircle(0, -130, 19);
    body.fillStyle(0x3f2d1c);
    body.beginPath();
    body.arc(0, -134, 20, Math.PI, Math.PI * 2);
    body.closePath();
    body.fillPath();
    body.beginPath();
    body.arc(0, -124, 15, Math.PI * 0.1, Math.PI * 0.9);
    body.closePath();
    body.fillPath();
    body.fillStyle(0x292524);
    body.fillCircle(-7, -132, 2.4);
    body.fillCircle(7, -132, 2.4);
    body.lineStyle(2.5, 0x7c2d12);
    body.beginPath();
    body.arc(0, -126, 6, Math.PI * 0.2, Math.PI * 0.8);
    body.strokePath();

    const arm = scene.add.graphics({ x: -18, y: -104 });
    arm.fillStyle(0xf8fafc).fillRoundedRect(-6.5, 0, 13, 46, 6);
    arm.fillStyle(0xe4b58c).fillCircle(0, 50, 6.5);
    arm.angle = 60;

    this.root = scene.add.container(x, y, [aura, halo, arm, body]);
  }
}
