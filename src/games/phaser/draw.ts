import * as Phaser from "phaser";

/**
 * Plochý seznam souřadnic (x1, y1, x2, y2, …) -> body pro
 * fillPoints/strokePoints (Phaser 4 je typuje jako Vector2[]).
 */
export function points(...xy: number[]): Phaser.Math.Vector2[] {
  const result: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < xy.length; i += 2) result.push(new Phaser.Math.Vector2(xy[i], xy[i + 1]));
  return result;
}

/** Text nadpisu nahoře ve scéně (bílý štítek). */
export function addPrompt(scene: Phaser.Scene, x: number, y: number) {
  return scene.add
    .text(x, y, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "34px",
      fontStyle: "bold",
      color: "#1c1917",
      backgroundColor: "#ffffffdd",
      padding: { x: 22, y: 10 },
    })
    .setOrigin(0.5)
    .setDepth(30);
}

/** Ukazující ruka, která opakovaně „předvádí“ pohyb z bodu A do B. */
export function addHintHand(
  scene: Phaser.Scene,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const hand = scene.add.text(from.x, from.y, "👆", { fontSize: "64px" }).setDepth(40);
  scene.tweens.add({
    targets: hand,
    x: to.x,
    y: to.y,
    duration: 1300,
    ease: "Sine.easeInOut",
    repeat: -1,
    repeatDelay: 500,
  });
  return hand;
}

/** Sdílené textury částic (prach, hvězdička, jiskra). */
export function makeParticleTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("p-dust")) return;
  const g = scene.add.graphics();

  g.fillStyle(0xffffff).fillCircle(8, 8, 8);
  g.generateTexture("p-dust", 16, 16);

  g.clear();
  const star: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 14 : 6;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    star.push(new Phaser.Math.Vector2(14 + Math.cos(a) * r, 14 + Math.sin(a) * r));
  }
  g.fillStyle(0xffffff).fillPoints(star, true);
  g.generateTexture("p-star", 28, 28);

  g.clear();
  g.fillStyle(0xffffff, 0.35).fillCircle(16, 16, 16);
  g.fillStyle(0xffffff).fillCircle(16, 16, 7);
  g.generateTexture("p-glow", 32, 32);

  g.destroy();
}

/** Barevné hvězdičky na oslavu. */
export function addConfetti(scene: Phaser.Scene) {
  return scene.add
    .particles(0, 0, "p-star", {
      speed: { min: 250, max: 520 },
      angle: { min: 200, max: 340 },
      gravityY: 520,
      lifespan: 1800,
      rotate: { min: 0, max: 360 },
      scale: { start: 1.3, end: 0.4 },
      tint: [0xfde047, 0xf472b6, 0x60a5fa, 0x4ade80, 0xfb923c],
      emitting: false,
    })
    .setDepth(35);
}
