import * as Phaser from "phaser";
import { Child } from "./Child";
import { BEAM_H, TWEEZERS_LEN, makeTextures } from "./textures";
import { addConfetti, addHintHand, makeParticleTextures, points } from "../phaser/draw";
import { sfx } from "../phaser/sfx";
import { OUTCOME_EVENT } from "../phaser/usePhaserGame";

/** Logická velikost scény – Phaser ji pak přizpůsobí šířce obrazovky. */
export const W = 1200;
export const H = 720;

const GROUND = 670;
const TOM_X = 300;
const BARA_X = 880;
/** Kam Tom dojde s trámem v oku – dál nemůže, trám narazí do Báry. */
const BUMP_X = 435;
/** Kam dojde bez trámu, aby dosáhl pinzetou. */
const HELP_X = 600;
/** Kde je tříska vůči středu Bářina levého oka. */
const SPECK = { dx: 10, dy: 14 };
const BEAM_ANGLE = -6;

type Drag = "tweezers" | "beam" | null;

/**
 * Hra k Matouši 7:1–5 – tříska a trám.
 *
 * Báře spadla do oka tříska. Tom jí chce pinzetou pomoct, jenže sám má
 * v oku obrovský trám – nic nevidí a trám Báru praští. Dítě tedy nejdřív
 * prstem vytáhne trám z Tomova oka; teprve pak Tom „jasně vidí“, kamera
 * přiblíží Bářino oko a tříska jde ven. Trám jde vytáhnout i hned na
 * začátku – pak se nezdařený pokus přeskočí. Konec se hlásí do Reactu
 * přes `game.events` (OUTCOME_EVENT).
 */
export class TriskaScene extends Phaser.Scene {
  private tom!: Child;
  private bara!: Child;
  private beam!: Phaser.GameObjects.Image;
  private tweezers!: Phaser.GameObjects.Image;
  private speck!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;

  private beamIn = true;
  private tweezersHeld = true;
  private speckOn: "bara" | "tweezers" = "bara";
  private busy = false;
  private dragging: Drag = null;
  private dragStart = { x: 0, y: 0 };
  /** O kolik je trám povytažený z oka (při tahání). */
  private pull = { x: 0, y: 0 };
  private lastCreak = 0;
  private hint: Phaser.GameObjects.Text | null = null;
  private beamPulse: Phaser.Tweens.Tween | null = null;
  private tearTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("triska");
  }

  create() {
    // Scéna se při "Zkusit znovu" restartuje, instance třídy ale zůstává.
    this.beamIn = true;
    this.tweezersHeld = true;
    this.speckOn = "bara";
    this.busy = false;
    this.dragging = null;
    this.pull = { x: 0, y: 0 };
    this.hint = null;
    this.beamPulse = null;
    this.cameras.main.setZoom(1).centerOn(W / 2, H / 2);

    makeTextures(this);
    makeParticleTextures(this);
    this.drawWorld();

    this.tom = new Child(this, TOM_X, GROUND, {
      name: "Tom",
      shirt: 0x2563eb,
      pants: 0x78350f,
      hair: 0x6b3f1d,
      girl: false,
      lookX: 1,
    });
    this.tom.root.setDepth(10);
    this.tom.setEyes("open", "beam");
    this.tom.armR.angle = -25;

    this.bara = new Child(this, BARA_X, GROUND, {
      name: "Bára",
      shirt: 0x16a34a,
      pants: 0x16a34a,
      hair: 0xf59e0b,
      girl: true,
      lookX: -1,
    });
    this.bara.root.setDepth(10);
    this.bara.setEyes("speck", "open");
    this.bara.setMouth("sad");

    this.speck = this.add.image(0, 0, "t-speck").setAngle(-25).setDepth(11);

    this.beam = this.add
      .image(0, 0, "t-beam")
      .setOrigin(0.04, 0.5)
      .setAngle(BEAM_ANGLE)
      .setDepth(12)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.tweezers = this.add
      .image(0, 0, "t-tweezers")
      .setOrigin(0, 0.5)
      .setAngle(-60)
      .setDepth(13)
      .setInteractive({
        draggable: true,
        useHandCursor: true,
        // pinzeta je tenká – prst ji musí trefit i vedle
        hitArea: new Phaser.Geom.Rectangle(-30, -45, TWEEZERS_LEN + 60, 114),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });

    this.dust = this.add
      .particles(0, 0, "p-dust", {
        speed: { min: 80, max: 260 },
        angle: { min: 190, max: 350 },
        gravityY: 450,
        lifespan: 700,
        scale: { start: 1.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: 0xa8a29e,
        emitting: false,
      })
      .setDepth(14);
    this.sparkle = this.add
      .particles(0, 0, "p-star", {
        speed: { min: 60, max: 200 },
        lifespan: 800,
        scale: { start: 0.8, end: 0 },
        tint: [0xfde047, 0xffffff],
        emitting: false,
      })
      .setDepth(25);

    this.prompt = this.add
      .text(W / 2, 42, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#1c1917",
        backgroundColor: "#ffffffdd",
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.setupTweezers();
    this.setupBeam();
    this.add
      .zone(BARA_X, GROUND - 330, 260, 260)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (this.busy || this.dragging) return;
        sfx.unlock();
        this.tryHelp();
      });

    this.tearTimer = this.time.addEvent({ delay: 1500, loop: true, callback: () => this.tear() });
    this.syncFollowers();
    this.startHelp(false);
  }

  update() {
    this.syncFollowers();
  }

  /** Pinzeta drží v ruce, trám v oku a tříska v oku / na pinzetě. */
  private syncFollowers() {
    if (this.tweezersHeld) {
      const h = this.tom.handWorld();
      this.tweezers.setPosition(h.x, h.y);
    }
    if (this.beamIn) {
      const e = this.tom.eyeWorld(1);
      this.beam.setPosition(e.x + this.pull.x, e.y + this.pull.y);
    }
    if (this.speckOn === "bara") {
      const e = this.bara.eyeWorld(-1);
      this.speck.setPosition(e.x + SPECK.dx, e.y + SPECK.dy);
    } else {
      const tip = this.tweezersTip();
      this.speck.setPosition(tip.x, tip.y);
    }
  }

  private tweezersTip() {
    const r = this.tweezers.rotation;
    return {
      x: this.tweezers.x + Math.cos(r) * TWEEZERS_LEN,
      y: this.tweezers.y + Math.sin(r) * TWEEZERS_LEN,
    };
  }

  // ---------------------------------------------------------------- svět

  private drawWorld() {
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0xe0f2fe, 0xe0f2fe, 1);
    sky.fillRect(0, 0, W, GROUND);

    const rays = this.add.graphics();
    rays.lineStyle(6, 0xfde047);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.lineBetween(Math.cos(a) * 58, Math.sin(a) * 58, Math.cos(a) * 78, Math.sin(a) * 78);
    }
    const disc = this.add.circle(0, 0, 46, 0xfde047);
    this.add.container(1100, 130, [rays, disc]).setDepth(1);
    this.tweens.add({ targets: rays, angle: 360, duration: 20000, repeat: -1 });

    for (const [x, y, s, d] of [
      [160, 110, 1, 70000],
      [620, 70, 0.8, 90000],
    ] as const) {
      const cloud = this.add.image(x, y, "t-cloud").setScale(s).setDepth(1).setAlpha(0.95);
      this.tweens.add({ targets: cloud, x: x + 80, duration: d / 4, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    const land = this.add.graphics().setDepth(2);
    land.fillStyle(0xbbf7d0).fillEllipse(950, GROUND + 30, 900, 260);
    land.fillStyle(0x86efac).fillEllipse(220, GROUND + 30, 800, 230);

    // dřevěný plot – jsme na dvorku u tesaře
    const fence = this.add.graphics().setDepth(3);
    fence.fillStyle(0xd6a76a);
    fence.fillRect(0, GROUND - 150, W, 16);
    fence.fillRect(0, GROUND - 90, W, 16);
    for (let x = 20; x < W; x += 70) {
      fence.fillStyle(0xe7c08f).fillPoints(points(x, GROUND, x, GROUND - 170, x + 20, GROUND - 190, x + 40, GROUND - 170, x + 40, GROUND), true);
      fence.lineStyle(3, 0xb07c45).strokePoints(points(x, GROUND, x, GROUND - 170, x + 20, GROUND - 190, x + 40, GROUND - 170, x + 40, GROUND), true);
    }

    // hromádka prken vlevo
    const pile = this.add.graphics().setDepth(4);
    for (const [y, w] of [
      [GROUND - 22, 150],
      [GROUND - 44, 130],
      [GROUND - 66, 100],
    ]) {
      pile.fillStyle(0xb45309).fillRoundedRect(20, y, w, 22, 5);
      pile.fillStyle(0xfde68a).fillEllipse(20 + w - 6, y + 11, 10, 18);
      pile.lineStyle(2, 0x78350f).strokeRoundedRect(20, y, w, 22, 5);
    }

    const grass = this.add.graphics().setDepth(5);
    grass.fillStyle(0x4ade80).fillRect(0, GROUND, W, H - GROUND);
    grass.fillStyle(0x22c55e).fillRect(0, GROUND, W, 8);
    for (const [x, c] of [
      [470, 0xf472b6],
      [520, 0xffffff],
      [1080, 0xfacc15],
      [1140, 0xf472b6],
      [700, 0xfacc15],
    ] as const) {
      grass.fillStyle(0x15803d).fillRect(x - 2, GROUND - 14, 4, 22);
      grass.fillStyle(c).fillCircle(x, GROUND - 16, 8);
      grass.fillStyle(0xfde047).fillCircle(x, GROUND - 16, 3);
    }
  }

  // ------------------------------------------------------------- pomůcky

  private say(text: string, spoken?: string) {
    this.prompt.setText(text);
    if (spoken) sfx.say(spoken);
  }

  private bubble(x: number, y: number, text: string, ms = 1900) {
    const b = this.add
      .text(x, y, text, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#44403c",
        backgroundColor: "#ffffff",
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(28)
      .setScale(0);
    this.tweens.add({ targets: b, scale: 1, duration: 300, ease: "Back.easeOut" });
    this.time.delayedCall(ms, () =>
      this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }),
    );
  }

  private floatEmoji(x: number, y: number, emoji: string, delay = 0) {
    const t = this.add.text(x, y, emoji, { fontSize: "54px" }).setOrigin(0.5).setDepth(27).setAlpha(0);
    this.tweens.add({
      targets: t,
      y: y - 160,
      alpha: { from: 1, to: 0 },
      duration: 1600,
      delay,
      ease: "Sine.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private tear() {
    if (this.speckOn !== "bara") return;
    const e = this.bara.eyeWorld(-1);
    const drop = this.add.image(e.x - 6, e.y + 30, "t-tear").setDepth(11);
    this.tweens.add({
      targets: drop,
      y: drop.y + 70,
      alpha: 0,
      duration: 900,
      ease: "Quad.easeIn",
      onComplete: () => drop.destroy(),
    });
  }

  private clearHint() {
    this.hint?.destroy();
    this.hint = null;
  }

  // ------------------------------------------------------------ pinzeta

  private setupTweezers() {
    this.tweezers.on("dragstart", () => {
      if (this.busy || this.dragging) return;
      sfx.unlock();
      this.dragging = "tweezers";
      this.tweezersHeld = false;
      this.dragStart = { x: this.tweezers.x, y: this.tweezers.y };
      this.tweezers.setScale(1.15);
    });
    this.tweezers.on("drag", (_p: Phaser.Input.Pointer, x: number, y: number) => {
      if (this.dragging === "tweezers") this.tweezers.setPosition(x, y);
    });
    this.tweezers.on("dragend", () => {
      if (this.dragging !== "tweezers") return;
      this.dragging = null;
      this.tweezers.setScale(1);
      const eye = this.bara.eyeWorld(-1);
      const tip = this.tweezersTip();
      const moved = Phaser.Math.Distance.Between(this.tweezers.x, this.tweezers.y, this.dragStart.x, this.dragStart.y);
      // ťuknutí bez tažení taky stačí – pro nejmenší děti
      if (
        moved < 12 ||
        Phaser.Math.Distance.Between(tip.x, tip.y, eye.x, eye.y) < 190 ||
        Phaser.Math.Distance.Between(this.tweezers.x, this.tweezers.y, eye.x, eye.y) < 190
      ) {
        this.tryHelp();
      } else {
        this.returnTweezers();
      }
    });
  }

  private returnTweezers(onDone?: () => void) {
    const h = this.tom.handWorld();
    this.tweens.add({
      targets: this.tweezers,
      x: h.x,
      y: h.y,
      duration: 250,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweezersHeld = true;
        onDone?.();
      },
    });
  }

  /** 1) a 3) – výzva „pomoz Báře“; `again` = už bez trámu. */
  private startHelp(again: boolean) {
    this.busy = false;
    if (again) {
      this.say("Teď Tom dobře vidí. Pomoz Báře! 👆", "Výborně! Teď Tom dobře vidí. Pomoz Báře vyndat třísku.");
    } else {
      this.say("Báře spadla do oka tříska. Pomoz jí! 👆");
    }
    this.clearHint();
    const eye = this.bara.eyeWorld(-1);
    this.hint = addHintHand(this, { x: this.tweezers.x, y: this.tweezers.y }, { x: eye.x - 40, y: eye.y + 20 });
  }

  private tryHelp() {
    this.busy = true;
    this.clearHint();
    sfx.pop();
    this.returnTweezers(() => (this.beamIn ? this.failHelp() : this.successHelp()));
  }

  // ------------------------------------------------- 2a) s trámem to nejde

  private failHelp() {
    this.tweens.add({ targets: this.tom.armR, angle: -75, duration: 300 });
    this.tweens.add({ targets: this.tweezers, angle: 0, duration: 300 });
    this.tom.walkTo(BUMP_X, 800, () => {
      // BUM – trám praští Báru do hlavy
      sfx.bonk();
      this.cameras.main.shake(250, 0.01);
      this.sparkle.explode(14, this.beam.x + 340, this.beam.y - 30);
      this.bara.setMouth("ouch");
      this.tweens.add({ targets: this.bara.root, x: BARA_X + 36, duration: 120, yoyo: true, hold: 300, ease: "Quad.easeOut" });
      this.tweens.add({ targets: this.tom.root, x: BUMP_X - 30, duration: 140, ease: "Quad.easeOut" });
      const dizzy = this.add.text(BARA_X, GROUND - 470, "💫", { fontSize: "60px" }).setOrigin(0.5).setDepth(27);
      this.tweens.add({ targets: dizzy, angle: 360, duration: 900, repeat: 1, onComplete: () => dizzy.destroy() });
      this.bubble(BARA_X + 60, GROUND - 520, "Au! Pozor na ten trám! 😣");

      // Tom šátrá pinzetou naslepo
      this.time.delayedCall(700, () => {
        this.tom.setMouth("ouch");
        this.bubble(TOM_X + 60, GROUND - 520, "Nic nevidím! 🙈");
        this.tweens.add({ targets: this.tom.armR, angle: -140, duration: 180, yoyo: true, repeat: 3 });
        this.tweens.add({ targets: this.tweezers, angle: -70, duration: 180, yoyo: true, repeat: 3 });
      });

      this.time.delayedCall(2300, () => {
        this.say("Tom nic nevidí – v oku má trám! 🪵", "Jejda! Tom nevidí, protože má v oku velký trám.");
        this.bara.setMouth("sad");
        this.tom.setMouth("sad");
        this.tweens.add({ targets: this.tom.armR, angle: -25, duration: 400 });
        this.tweens.add({ targets: this.tweezers, angle: -60, duration: 400 });
        this.tom.walkTo(TOM_X, 800, () => this.time.delayedCall(1400, () => this.startBeam()));
      });
    });
  }

  // ------------------------------------------------- 2b) vytáhnout trám

  private startBeam() {
    this.busy = false;
    this.say("Nejdřív vytáhni trám z Tomova oka 👆", "Nejdřív musí Tom vyndat trám ze svého oka. Vytáhni ho prstem.");
    this.beamPulse = this.tweens.add({ targets: this.beam, scale: 1.05, duration: 450, yoyo: true, repeat: -1 });
    this.clearHint();
    const from = { x: this.beam.x + 170, y: this.beam.y };
    this.hint = addHintHand(this, from, { x: from.x + 220, y: from.y + 60 });
  }

  private setupBeam() {
    this.beam.on("dragstart", (p: Phaser.Input.Pointer) => {
      if (this.busy || this.dragging || !this.beamIn) return;
      sfx.unlock();
      this.dragging = "beam";
      this.dragStart = { x: p.x, y: p.y };
      this.tom.setMouth("strain");
    });
    this.beam.on("drag", (p: Phaser.Input.Pointer) => {
      if (this.dragging !== "beam") return;
      const dx = p.x - this.dragStart.x;
      const dy = p.y - this.dragStart.y;
      const len = Math.hypot(dx, dy);
      if (len > 200) {
        this.popBeam(dx / len, dy / len);
        return;
      }
      // trám drží pevně – povytáhne se jen trochu a Toma to táhne s sebou
      const k = Math.min(len * 0.3, 60) / (len || 1);
      this.pull = { x: dx * k, y: dy * k };
      this.tom.root.x = TOM_X + Phaser.Math.Clamp(dx * 0.08, -20, 20);
      if (len > 40 && this.time.now - this.lastCreak > 400) {
        this.lastCreak = this.time.now;
        sfx.creak();
      }
    });
    this.beam.on("dragend", (p: Phaser.Input.Pointer) => {
      if (this.dragging !== "beam") return;
      this.dragging = null;
      if (Math.hypot(p.x - this.dragStart.x, p.y - this.dragStart.y) < 12) {
        this.tugAndPop();
        return;
      }
      this.tom.setMouth("neutral");
      this.tweens.add({ targets: this.pull, x: 0, y: 0, duration: 250, ease: "Back.easeOut" });
      this.tweens.add({ targets: this.tom.root, x: TOM_X, duration: 250 });
    });
  }

  /** Ťuknutí na trám – trám se sám vytáhne (pro nejmenší). */
  private tugAndPop() {
    this.busy = true;
    sfx.creak();
    this.tweens.add({
      targets: this.pull,
      x: 40,
      y: 8,
      duration: 160,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.popBeam(0.95, 0.3),
    });
  }

  private popBeam(dx: number, dy: number) {
    this.dragging = null;
    this.beamIn = false;
    this.busy = true;
    this.beam.disableInteractive();
    this.beamPulse?.stop();
    this.beam.setScale(1);
    this.clearHint();

    sfx.pop();
    this.tom.setMouth("ouch");
    this.tom.setEyes("open", "closed");
    this.tweens.add({ targets: this.tom.root, x: TOM_X - 24 * Math.sign(dx || 1), duration: 120, yoyo: true });

    // trám odletí obloukem a spadne do trávy
    const from = { x: this.beam.x, y: this.beam.y, angle: this.beam.angle };
    const to = { x: dx >= 0 ? from.x + 40 : 30, y: GROUND + 24 };
    const spin = dx >= 0 ? 360 : -360;
    this.beam.setDepth(14);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        this.beam.x = Phaser.Math.Linear(from.x, to.x, t);
        this.beam.y = Phaser.Math.Linear(from.y, to.y, t) - Math.sin(Math.PI * t) * (200 + dy * -60);
        this.beam.angle = from.angle + spin * t;
        this.beam.setScale(1 - 0.18 * t);
      },
      onComplete: () => {
        this.beam.angle = 0;
        sfx.thud();
        this.cameras.main.shake(200, 0.008);
        this.dust.explode(26, this.beam.x + 140, GROUND + 30 + BEAM_H / 4);
        this.time.delayedCall(400, () => this.tomSeesAgain());
      },
    });
  }

  private tomSeesAgain() {
    this.tom.blink(2, () => {
      this.tom.setMouth("happy");
      sfx.chime();
      const e = this.tom.eyeWorld(1);
      this.sparkle.explode(16, e.x, e.y);
      this.bubble(TOM_X + 40, GROUND - 520, "Jé, už vidím! 👀");
      this.time.delayedCall(1800, () => this.startHelp(true));
    });
  }

  // ------------------------------------------------- 3) tříska jde ven

  private successHelp() {
    this.tweens.add({ targets: this.tom.armR, angle: -60, duration: 300 });
    this.tweens.add({ targets: this.tweezers, angle: -20, duration: 300 });
    this.tom.walkTo(HELP_X, 1000, () => {
      const target = { x: this.speck.x, y: this.speck.y };
      const armAngle = this.tom.armAngleTo(target);
      this.tweens.add({ targets: this.tom.armR, angle: armAngle, duration: 500 });
      this.tweens.add({ targets: this.tweezers, angle: armAngle + 90, duration: 500 });

      // přiblížíme Bářino oko, ať je třísku dobře vidět
      const cam = this.cameras.main;
      this.tweens.add({ targets: this.prompt, alpha: 0, duration: 300 });
      cam.pan(target.x - 40, target.y + 10, 1000, "Sine.easeInOut");
      cam.zoomTo(2.4, 1000, "Sine.easeInOut");

      this.time.delayedCall(1100, () => {
        // poslední kousek dojede pinzeta sama, špičkou přesně na třísku
        this.tweezersHeld = false;
        const r = this.tweezers.rotation;
        this.tweens.add({
          targets: this.tweezers,
          x: target.x - Math.cos(r) * TWEEZERS_LEN,
          y: target.y - Math.sin(r) * TWEEZERS_LEN,
          duration: 900,
          ease: "Sine.easeInOut",
          onComplete: () => this.pluck(),
        });
      });
    });
  }

  private pluck() {
    sfx.pluck();
    this.speckOn = "tweezers";
    this.tearTimer?.remove();
    this.bara.setEyes("closed", "open");
    const r = this.tweezers.rotation;
    this.tweens.add({
      targets: this.tweezers,
      x: this.tweezers.x - Math.cos(r) * 70,
      y: this.tweezers.y - Math.sin(r) * 70,
      duration: 500,
      delay: 200,
      ease: "Back.easeIn",
      onComplete: () => {
        this.sparkle.explode(12, this.speck.x, this.speck.y);
        this.tweens.add({ targets: this.speck, alpha: 0, scale: 0.3, duration: 400 });
        this.time.delayedCall(300, () => this.bara.blink(2, () => this.celebrate()));
      },
    });
  }

  private celebrate() {
    const cam = this.cameras.main;
    cam.pan(W / 2, H / 2, 900, "Sine.easeInOut");
    cam.zoomTo(1, 900, "Sine.easeInOut");
    this.tweens.add({ targets: this.prompt, alpha: 1, duration: 400, delay: 700 });

    this.bara.setMouth("happy");
    this.returnTweezers();
    this.tweens.add({ targets: this.tom.armR, angle: -12, duration: 400 });
    this.tweens.add({ targets: this.tweezers, angle: -60, duration: 400 });

    this.time.delayedCall(900, () => {
      this.say("Hurá! Tříska je venku! 🎉");
      this.bubble(BARA_X, GROUND - 520, "Děkuju, Tome! 💛", 2600);
      sfx.win();
      sfx.say("Děkuju, Tome!");
      this.bara.hop(3);
      this.tom.hop(3);
      const confetti = addConfetti(this);
      confetti.explode(70, W / 2, GROUND - 400);
      for (let i = 0; i < 6; i++) {
        this.floatEmoji(HELP_X + 60 + i * 40, GROUND - 440, i % 2 ? "💛" : "💖", i * 220);
      }
    });
    this.time.delayedCall(3800, () => {
      sfx.say("Nejdřív trám ze svého oka. Potom můžeš pomoct kamarádovi.");
      this.game.events.emit(OUTCOME_EVENT);
    });
  }
}
