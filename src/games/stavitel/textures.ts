import * as Phaser from "phaser";

export const BRICK_W = 128;
export const BRICK_H = 60;
export const ROOF_W = 310;
export const ROOF_H = 110;
export const ROCK_W = 330;
export const ROCK_H = 110;
export const SAND_W = 370;
export const SAND_H = 50;

/**
 * Všechny textury hry se kreslí kódem (Graphics -> generateTexture), takže
 * hra nepotřebuje žádné obrázky – jen se jednou vygenerují při startu.
 */
export function makeTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("brick")) return;
  const g = scene.add.graphics();

  const brick = (key: string, extra?: () => void) => {
    g.clear();
    g.fillStyle(0xc2410c).fillRect(0, 0, BRICK_W, BRICK_H);
    g.lineStyle(2, 0xfed7aa, 0.8);
    g.lineBetween(0, 30, BRICK_W, 30);
    g.lineBetween(64, 0, 64, 30);
    g.lineBetween(32, 30, 32, BRICK_H);
    g.lineBetween(96, 30, 96, BRICK_H);
    g.lineStyle(3, 0x7c2d12).strokeRect(1.5, 1.5, BRICK_W - 3, BRICK_H - 3);
    extra?.();
    g.generateTexture(key, BRICK_W, BRICK_H);
  };

  brick("brick");
  brick("brick-door", () => {
    g.fillStyle(0x78350f).fillRoundedRect(44, 12, 40, 48, { tl: 14, tr: 14, bl: 0, br: 0 });
    g.fillStyle(0xfacc15).fillCircle(76, 40, 3.5);
  });
  brick("brick-window", () => {
    g.fillStyle(0x7c2d12).fillRect(37, 7, 54, 44);
    g.fillStyle(0xe0f2fe).fillRect(40, 10, 48, 38);
    g.lineStyle(4, 0xffffff);
    g.lineBetween(64, 10, 64, 48);
    g.lineBetween(40, 29, 88, 29);
  });

  // střecha
  g.clear();
  g.fillStyle(0xdc2626).fillTriangle(0, ROOF_H, ROOF_W / 2, 0, ROOF_W, ROOF_H);
  g.lineStyle(2, 0x991b1b);
  for (const y of [40, 75]) {
    const half = (ROOF_W / 2) * (y / ROOF_H);
    g.lineBetween(ROOF_W / 2 - half + 8, y, ROOF_W / 2 + half - 8, y);
  }
  g.lineStyle(4, 0x7f1d1d).strokeTriangle(3, ROOF_H - 2, ROOF_W / 2, 3, ROOF_W - 3, ROOF_H - 2);
  g.generateTexture("roof", ROOF_W, ROOF_H);

  // skála
  g.clear();
  const rock = points(0, ROCK_H, 18, 42, 42, 14, 90, 4, 245, 2, 292, 16, 316, 50, ROCK_W, ROCK_H);
  g.fillStyle(0x78716c).fillPoints(rock, true);
  g.fillStyle(0xa8a29e).fillPoints(points(42, 14, 90, 4, 245, 2, 292, 16, 240, 26, 80, 28), true);
  g.lineStyle(3, 0x57534e);
  g.strokePoints(points(120, 40, 132, 62, 124, 86));
  g.strokePoints(points(230, 50, 222, 72, 236, 98));
  g.lineStyle(4, 0x44403c).strokePoints(rock, true);
  g.generateTexture("rock", ROCK_W, ROCK_H);

  // písečná duna – kreslí se jen horní polovina elipsy
  g.clear();
  g.fillStyle(0xfde68a).fillEllipse(SAND_W / 2, SAND_H, SAND_W, SAND_H * 2);
  g.fillStyle(0xd97706, 0.45);
  for (let i = 0; i < 26; i++) {
    const x = 40 + ((i * 53) % (SAND_W - 80));
    const y = 22 + ((i * 17) % 24);
    g.fillCircle(x, y, 2.5);
  }
  g.generateTexture("sand", SAND_W, SAND_H);

  // kapka deště
  g.clear();
  g.fillStyle(0xbfdbfe).fillRoundedRect(0, 0, 4, 20, 2);
  g.generateTexture("drop", 4, 20);

  // prach při pokládání kostky
  g.clear();
  g.fillStyle(0xe7e5e4).fillCircle(8, 8, 8);
  g.generateTexture("dust", 16, 16);

  // hvězdička na oslavu
  g.clear();
  const star: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 14 : 6;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    star.push(new Phaser.Math.Vector2(14 + Math.cos(a) * r, 14 + Math.sin(a) * r));
  }
  g.fillStyle(0xffffff).fillPoints(star, true);
  g.generateTexture("star", 28, 28);

  // bouřkový mrak
  g.clear();
  g.fillStyle(0x475569);
  g.fillCircle(60, 72, 40);
  g.fillCircle(120, 50, 50);
  g.fillCircle(185, 64, 44);
  g.fillCircle(225, 82, 30);
  g.fillRoundedRect(30, 70, 210, 40, 20);
  g.generateTexture("cloud", 260, 112);

  // vlna na hladině (opakuje se vodorovně)
  g.clear();
  g.fillStyle(0x0284c7, 0.92);
  g.beginPath();
  g.moveTo(0, 40);
  for (let x = 0; x <= 128; x += 4) g.lineTo(x, 16 + Math.sin((x / 128) * Math.PI * 2) * 8);
  g.lineTo(128, 40);
  g.closePath();
  g.fillPath();
  g.generateTexture("wave", 128, 40);

  g.destroy();
}

/** Plochý seznam souřadnic (x1, y1, x2, y2, …) -> body pro fillPoints/strokePoints. */
export function points(...xy: number[]): Phaser.Math.Vector2[] {
  const result: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < xy.length; i += 2) result.push(new Phaser.Math.Vector2(xy[i], xy[i + 1]));
  return result;
}
