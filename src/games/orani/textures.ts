import * as Phaser from "phaser";

export const FIELD_W = 960;
export const FIELD_H = 175;
export const BED_W = 260;
export const BED_H = 120;

/** Textury hry s oráním – vše kreslené kódem, žádné obrázky. */
export function makeTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("o-grass")) return;
  const g = scene.add.graphics();

  // nezorané pole – tráva s trsy
  g.fillStyle(0x84cc16).fillRect(0, 0, FIELD_W, FIELD_H);
  g.lineStyle(3, 0x4d7c0f);
  for (let i = 0; i < 140; i++) {
    const x = (i * 97) % FIELD_W;
    const y = 12 + ((i * 41) % (FIELD_H - 20));
    g.lineBetween(x, y, x - 4, y - 10);
    g.lineBetween(x + 4, y, x + 6, y - 11);
  }
  g.generateTexture("o-grass", FIELD_W, FIELD_H);

  // zoraná hlína s brázdami
  g.clear();
  g.fillStyle(0x92400e).fillRect(0, 0, FIELD_W, FIELD_H);
  for (let y = 10; y < FIELD_H; y += 22) {
    g.fillStyle(0x78350f).fillRect(0, y, FIELD_W, 9);
    g.fillStyle(0xb45309).fillRect(0, y + 9, FIELD_W, 4);
  }
  g.generateTexture("o-plowed", FIELD_W, FIELD_H);

  // klas pšenice (počátek dole uprostřed)
  g.clear();
  g.lineStyle(3, 0xca8a04).lineBetween(10, 96, 10, 24);
  g.lineStyle(3, 0x65a30d).lineBetween(10, 70, 2, 56);
  g.lineBetween(10, 60, 18, 46);
  g.fillStyle(0xfacc15);
  for (let i = 0; i < 5; i++) {
    g.fillEllipse(6, 24 - i * 5, 7, 9);
    g.fillEllipse(14, 22 - i * 5, 7, 9);
  }
  g.fillEllipse(10, 0 + 4, 6, 9);
  g.generateTexture("o-wheat", 20, 96);

  // suchý plevel
  g.clear();
  g.lineStyle(4, 0x78716c);
  g.lineBetween(20, 50, 8, 14);
  g.lineBetween(20, 50, 22, 4);
  g.lineBetween(20, 50, 36, 18);
  g.lineStyle(3, 0xa8a29e);
  g.lineBetween(14, 32, 4, 26);
  g.lineBetween(28, 34, 38, 30);
  g.generateTexture("o-weed", 42, 52);

  // koruna stromu – bílá, barví se tintem (podzim / léto)
  g.clear();
  g.fillStyle(0xffffff);
  g.fillCircle(50, 70, 46);
  g.fillCircle(110, 56, 54);
  g.fillCircle(160, 78, 40);
  g.fillCircle(96, 100, 44);
  g.generateTexture("o-canopy", 200, 144);

  // list (bílý, barví se tintem)
  g.clear();
  g.fillStyle(0xffffff).fillEllipse(8, 5, 16, 9);
  g.generateTexture("o-leaf", 16, 10);

  // postel
  g.clear();
  g.fillStyle(0x92400e).fillRoundedRect(0, 10, 22, BED_H - 10, 6);
  g.fillStyle(0x92400e).fillRoundedRect(BED_W - 18, 40, 18, BED_H - 40, 6);
  g.fillStyle(0xb45309).fillRect(10, 70, BED_W - 20, 34);
  g.fillStyle(0xffffff).fillRoundedRect(18, 52, BED_W - 34, 24, 8);
  g.fillStyle(0xe0e7ff).fillRoundedRect(26, 34, 70, 30, 14);
  g.generateTexture("o-bed", BED_W, BED_H);

  // peřina (zvlášť, aby šla přes spícího farmáře)
  g.clear();
  g.fillStyle(0x3b82f6).fillRoundedRect(0, 0, 160, 46, 18);
  g.fillStyle(0xffffff, 0.5);
  for (const [x, y] of [
    [26, 14],
    [70, 26],
    [116, 12],
    [138, 32],
  ]) {
    g.fillCircle(x, y, 5);
  }
  g.generateTexture("o-blanket", 160, 46);

  g.destroy();
}
