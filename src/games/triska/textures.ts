import * as Phaser from "phaser";
import { points } from "../phaser/draw";

export const BEAM_W = 340;
export const BEAM_H = 56;
/** Délka pinzety od úchopu ke špičce. */
export const TWEEZERS_LEN = 118;

/** Textury hry kreslené kódem – trám, pinzeta, tříska, kapka, mráček. */
export function makeTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("t-beam")) return;
  const g = scene.add.graphics();

  // trám: hranol s letokruhy na konci
  g.fillStyle(0xa16207).fillRoundedRect(0, 0, BEAM_W, BEAM_H, 8);
  g.fillStyle(0xca8a04).fillRect(6, 6, BEAM_W - 30, 10);
  g.lineStyle(3, 0x854d0e);
  for (const [x1, y, x2] of [
    [30, 26, 150],
    [90, 40, 230],
    [170, 22, 290],
    [40, 46, 110],
  ]) {
    g.beginPath();
    g.moveTo(x1, y);
    g.lineTo((x1 + x2) / 2, y - 4);
    g.lineTo(x2, y);
    g.strokePath();
  }
  g.fillStyle(0xfde68a).fillEllipse(BEAM_W - 14, BEAM_H / 2, 24, BEAM_H - 6);
  g.lineStyle(2, 0xb45309).strokeEllipse(BEAM_W - 14, BEAM_H / 2, 14, 30);
  g.strokeEllipse(BEAM_W - 14, BEAM_H / 2, 6, 14);
  g.lineStyle(4, 0x713f12).strokeRoundedRect(2, 2, BEAM_W - 4, BEAM_H - 4, 8);
  g.generateTexture("t-beam", BEAM_W, BEAM_H);

  // pinzeta: úchop vlevo, špička vpravo (y = 12 je osa)
  g.clear();
  g.fillStyle(0xe2e8f0);
  g.fillPoints(points(0, 4, 12, 2, TWEEZERS_LEN, 10, TWEEZERS_LEN, 12), true);
  g.fillPoints(points(0, 20, 12, 22, TWEEZERS_LEN, 14, TWEEZERS_LEN, 12), true);
  g.lineStyle(2, 0x64748b);
  g.strokePoints(points(0, 4, 12, 2, TWEEZERS_LEN, 10, TWEEZERS_LEN, 12), true);
  g.strokePoints(points(0, 20, 12, 22, TWEEZERS_LEN, 14, TWEEZERS_LEN, 12), true);
  g.fillStyle(0x94a3b8).fillRect(0, 4, 8, 16);
  g.generateTexture("t-tweezers", TWEEZERS_LEN + 2, 24);

  // tříska
  g.clear();
  g.fillStyle(0xb45309).fillPoints(points(0, 6, 20, 0, 24, 3, 4, 10), true);
  g.lineStyle(1.5, 0x78350f).lineBetween(3, 7, 21, 2);
  g.generateTexture("t-speck", 24, 10);

  // slza
  g.clear();
  g.fillStyle(0x7dd3fc).fillCircle(8, 14, 8);
  g.fillTriangle(1, 11, 15, 11, 8, 0);
  g.fillStyle(0xffffff, 0.8).fillCircle(5, 13, 2.5);
  g.generateTexture("t-tear", 16, 22);

  // mráček
  g.clear();
  g.fillStyle(0xffffff);
  g.fillCircle(50, 50, 34);
  g.fillCircle(95, 38, 42);
  g.fillCircle(140, 52, 30);
  g.fillRoundedRect(30, 50, 130, 32, 16);
  g.generateTexture("t-cloud", 180, 90);

  g.destroy();
}
