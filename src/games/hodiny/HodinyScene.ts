import * as Phaser from "phaser";
import { addConfetti, addHintHand, makeParticleTextures, points } from "../phaser/draw";
import { sfx } from "../phaser/sfx";
import { OUTCOME_EVENT } from "../phaser/usePhaserGame";
import {
  angleDelta,
  DAY_PART_ICON,
  dayPart,
  formatDigital,
  hourHandAngle,
  hoursOf,
  minuteHandAngle,
  minutesForDrag,
  pointerAngle,
  sameOnDial,
  snap,
  timeInCzech,
  toTotal,
  wrapDay,
  type Phase,
} from "./clockMath";
import { QUIZ_TASKS, slotForHour, TIME_SLOTS, type TimeSlot } from "./content";

export const W = 1280;
export const H = 800;

// Ciferník vlevo – co největší, přes celou výšku plátna.
const CX = 400;
const CY = 400;
const R = 370;
const MINUTE_LEN = R * 0.8;
const HOUR_LEN = R * 0.5;

// Pravý sloupec: digitální hodiny, čas slovy, panel se scénou, kartičky.
const COL_X = 810;
const COL_W = 450;
const PANEL_Y = 245;
const PANEL_H = 360;
const WIN = { x: 20, y: 64, w: COL_W - 40, h: 226 };
const WX = WIN.x + WIN.w / 2;
const WY = WIN.y + WIN.h / 2;
const CARDS_Y = 670;
const CARD_W = 82;
const CARD_H = 90;
const QUIZ_BTN_Y = 755;
const SPEAKER = { x: 1220, y: 90, r: 36 };

const FONT = "system-ui, sans-serif";
const GREEN = 0x15803d;
const DARK_GREEN = 0x064e3b;
const AMBER = 0xf59e0b;

type Hand = "minute" | "hour";

/**
 * „Boží hodiny – čas pro všechno“ (Kazatel 3:1–8).
 *
 * TEOLOGIE: Kazatel 3 vypočítává chvíle lidského života a říká, že každá
 * má svůj čas pod Božím nebem. Dítě na velkých hodinách prochází běžným
 * dnem a u každé chvíle (ráno, poledne, odpoledne, večer, noc) vidí, že
 * i obyčejné věci – vstát, najíst se, hrát si, uklidit, spát – mají u Boha
 * dobrý smysl. Závěr vrací k Kaz 3:1: Bůh drží každou hodinu v rukou.
 *
 * TECHNIKA: stav hodin je jediné číslo `total` (minuty od půlnoci), všechna
 * matematika je v clockMath.ts. Scéna je stavový automat:
 *   FREE_EXPLORE  → dítě točí ručičkami, ťuká na kartičky s „časem pro…“
 *   TIME_QUIZ     → „Nastav hodiny na 8:00…“, kontrola po puštění ručičky
 *   SUCCESS_CELEBRATION → oslava + hvězdička, pak další úkol
 *   FINISHED      → závěr; React dostane OUTCOME_EVENT a ukáže kartu.
 */
export class HodinyScene extends Phaser.Scene {
  private phase: Phase = "FREE_EXPLORE";
  /** Aktuální čas na hodinách v minutách od půlnoci (může být desetinný při tažení). */
  private total = toTotal(6);
  private dragging: { hand: Hand; lastAngle: number } | null = null;
  private animating = false;

  private taskIndex = 0;
  private misses = 0;

  // ciferník
  private minuteHand!: Phaser.GameObjects.Container;
  private hourHand!: Phaser.GameObjects.Container;
  private ghost!: Phaser.GameObjects.Container;
  private dayPill!: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text | null = null;

  // pravý sloupec
  private digitalBox!: Phaser.GameObjects.Container;
  private digital!: Phaser.GameObjects.Text;
  private digitalPart!: Phaser.GameObjects.Text;
  private spoken!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Container;
  private panelKey = "";
  /** Zvyšuje se při každém překreslení panelu – zastaví opožděné animace starého panelu. */
  private panelVersion = 0;
  private panelAction: (() => void) | null = null;
  private cards: { slot: TimeSlot; root: Phaser.GameObjects.Container }[] = [];
  private quizButton!: Phaser.GameObjects.Container;
  private stars: Phaser.GameObjects.Text[] = [];

  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;
  private confetti!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("hodiny");
  }

  create() {
    this.phase = "FREE_EXPLORE";
    this.total = toTotal(6);
    this.dragging = null;
    this.animating = false;
    this.taskIndex = 0;
    this.misses = 0;
    this.panelKey = "";
    this.panelAction = null;
    this.cards = [];
    this.stars = [];

    makeParticleTextures(this);
    this.drawBackground();
    this.drawDial();
    this.ghost = this.makeHands(true).setVisible(false);
    [this.hourHand, this.minuteHand] = this.makeHands(false).list as Phaser.GameObjects.Container[];
    this.drawCenterCap();

    this.drawDigital();
    this.panel = this.add.container(COL_X, PANEL_Y).setDepth(10);
    this.drawCards();
    this.quizButton = this.makeButton(COL_X + COL_W / 2, QUIZ_BTN_Y, COL_W, 56, "⭐ Úkoly s hodinami");
    this.drawStars();

    this.sparkle = this.add
      .particles(0, 0, "p-glow", {
        speed: { min: 80, max: 260 },
        lifespan: 800,
        scale: { start: 1.1, end: 0 },
        tint: [0xfde047, 0xffffff, 0x86efac],
        emitting: false,
      })
      .setDepth(50);
    this.confetti = addConfetti(this);

    this.hint = addHintHand(
      this,
      { x: CX - 10, y: CY - MINUTE_LEN * 0.85 },
      { x: CX + MINUTE_LEN * 0.6, y: CY - MINUTE_LEN * 0.6 },
    );

    this.input.on("pointerdown", this.onDown, this);
    this.input.on("pointermove", this.onMove, this);
    this.input.on("pointerup", this.onUp, this);
    this.input.on("pointerupoutside", this.onUp, this);
    this.events.once("shutdown", () => {
      this.input.off("pointerdown", this.onDown, this);
      this.input.off("pointermove", this.onMove, this);
      this.input.off("pointerup", this.onUp, this);
      this.input.off("pointerupoutside", this.onUp, this);
    });

    this.render();
  }

  update() {
    this.render();
  }

  // ============================================================ kreslení

  private drawBackground() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0xecfccb, 0xecfccb, 0xfef9c3, 0xfef9c3, 1);
    bg.fillRect(0, 0, W, H);
  }

  /** Velký kulatý ciferník s čísly 1–12, minutovými čárkami a minutami po pěti. */
  private drawDial() {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x000000, 0.12).fillCircle(CX + 8, CY + 10, R);
    g.fillStyle(GREEN).fillCircle(CX, CY, R);
    g.fillStyle(0xfffbeb).fillCircle(CX, CY, R - 14);
    g.lineStyle(8, 0xfbbf24).strokeCircle(CX, CY, R - 14);

    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      const r1 = R - 26;
      const r2 = big ? R - 50 : R - 38;
      g.lineStyle(big ? 6 : 3, big ? DARK_GREEN : 0xa8a29e);
      g.lineBetween(CX + Math.sin(a) * r1, CY - Math.cos(a) * r1, CX + Math.sin(a) * r2, CY - Math.cos(a) * r2);
    }

    for (let m = 5; m < 60; m += 5) {
      const a = (m / 60) * Math.PI * 2;
      this.add
        .text(CX + Math.sin(a) * (R - 70), CY - Math.cos(a) * (R - 70), String(m), {
          fontFamily: FONT,
          fontSize: "20px",
          color: "#a16207",
        })
        .setOrigin(0.5)
        .setDepth(2);
    }

    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      this.add
        .text(CX + Math.sin(a) * (R - 125), CY - Math.cos(a) * (R - 125), String(h), {
          fontFamily: FONT,
          fontSize: "78px",
          fontStyle: "bold",
          color: h % 3 === 0 ? "#b45309" : "#065f46",
        })
        .setOrigin(0.5)
        .setDepth(2);
    }

    // ☀️/🌙 okénko – ciferník sám 8:00 a 20:00 nerozliší, tohle ano
    this.dayPill = this.add
      .text(CX, CY + R * 0.34, "", {
        fontFamily: FONT,
        fontSize: "30px",
        fontStyle: "bold",
        color: "#064e3b",
        backgroundColor: "#fef3c7",
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(3);
  }

  /**
   * Ručičky kreslené „nahoru“ (k dvanáctce), otáčí se přes `angle`.
   * Na každé je kulaté „madlo“, za které se dětskému prstu dobře chytá.
   */
  private makeHands(ghost: boolean) {
    const hand = (len: number, width: number, fill: number, edge: number, grip: number) => {
      const g = this.add.graphics();
      const shape = points(-width / 2, 34, width / 2, 34, width / 4, -len + 34, 0, -len, -width / 4, -len + 34);
      g.fillStyle(fill).fillPoints(shape, true);
      g.lineStyle(4, edge).strokePoints(shape, true);
      g.fillStyle(fill).fillCircle(0, -len * 0.78, grip);
      g.lineStyle(4, edge).strokeCircle(0, -len * 0.78, grip);
      g.fillStyle(0xffffff, 0.6).fillCircle(-grip * 0.3, -len * 0.78 - grip * 0.3, grip * 0.3);
      return this.add.container(0, 0, [g]);
    };
    const hour = hand(HOUR_LEN, 38, 0x059669, DARK_GREEN, 28);
    const minute = hand(MINUTE_LEN, 24, AMBER, 0xb45309, 24);
    const root = this.add.container(CX, CY, [hour, minute]).setDepth(ghost ? 4 : 5);
    if (ghost) root.setAlpha(0.3);
    return root;
  }

  private drawCenterCap() {
    const g = this.add.graphics().setDepth(6);
    g.fillStyle(AMBER).fillCircle(CX, CY, 28);
    g.lineStyle(4, 0xb45309).strokeCircle(CX, CY, 28);
    g.fillStyle(DARK_GREEN).fillCircle(CX, CY, 11);
  }

  private drawDigital() {
    const g = this.add.graphics();
    g.fillStyle(DARK_GREEN).fillRoundedRect(0, 0, 360, 140, 28);
    g.lineStyle(6, 0xfbbf24).strokeRoundedRect(0, 0, 360, 140, 28);
    this.digital = this.add
      .text(180, 62, "", {
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontSize: "92px",
        fontStyle: "bold",
        color: "#fde047",
      })
      .setOrigin(0.5);
    this.digitalPart = this.add
      .text(180, 118, "", { fontFamily: FONT, fontSize: "24px", color: "#bbf7d0" })
      .setOrigin(0.5);
    this.digitalBox = this.add.container(COL_X, 20, [g, this.digital, this.digitalPart]).setDepth(10);

    const speaker = this.add.graphics();
    speaker.fillStyle(0xffffff).fillCircle(0, 0, SPEAKER.r);
    speaker.lineStyle(5, GREEN).strokeCircle(0, 0, SPEAKER.r);
    const icon = this.add.text(0, 0, "🔊", { fontSize: "36px" }).setOrigin(0.5);
    this.add.container(SPEAKER.x, SPEAKER.y, [speaker, icon]).setDepth(10);

    this.spoken = this.add
      .text(COL_X + COL_W / 2, 200, "", {
        fontFamily: FONT,
        fontSize: "30px",
        fontStyle: "bold",
        color: "#1c1917",
        align: "center",
        wordWrap: { width: COL_W },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private drawCards() {
    const step = (COL_W - CARD_W) / (TIME_SLOTS.length - 1);
    TIME_SLOTS.forEach((slot, i) => {
      const x = COL_X + CARD_W / 2 + i * step;
      const g = this.add.graphics();
      g.fillStyle(0xffffff).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
      g.lineStyle(4, 0x6ee7b7).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
      const icon = this.add.text(0, -14, slot.icon, { fontSize: "40px" }).setOrigin(0.5);
      const label = this.add
        .text(0, 28, `${slot.hour}:00`, { fontFamily: FONT, fontSize: "20px", fontStyle: "bold", color: "#064e3b" })
        .setOrigin(0.5);
      const root = this.add.container(x, CARDS_Y, [g, icon, label]).setDepth(10);
      this.cards.push({ slot, root });
    });
  }

  private drawStars() {
    const step = COL_W / QUIZ_TASKS.length;
    QUIZ_TASKS.forEach((_, i) => {
      const star = this.add
        .text(COL_X + step / 2 + i * step, CARDS_Y, "⭐", { fontSize: "58px" })
        .setOrigin(0.5)
        .setDepth(10)
        .setAlpha(0.2)
        .setVisible(false);
      this.stars.push(star);
    });
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(GREEN).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.lineStyle(4, 0xbbf7d0).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const text = this.add
      .text(0, 0, label, { fontFamily: FONT, fontSize: "28px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5);
    return this.add.container(x, y, [g, text]).setDepth(10).setSize(w, h);
  }

  // ======================================================= vykreslení stavu

  /** Každý snímek: ručičky, digitální čas, čas slovy, panel. */
  private render() {
    this.minuteHand.angle = minuteHandAngle(this.total);
    this.hourHand.angle = hourHandAngle(this.total);

    const shown = Math.round(this.total);
    const part = dayPart(shown);
    this.digital.setText(formatDigital(shown));
    this.digitalPart.setText(`${DAY_PART_ICON[part]} ${part}`);
    this.dayPill.setText(`${DAY_PART_ICON[part]} ${part}`);
    this.spoken.setText(timeInCzech(shown));

    // během animace (ťuknutí na kartičku) panel neblikne přes mezilehlé hodiny
    if (this.phase === "FREE_EXPLORE" && !this.animating) {
      const slot = slotForHour(hoursOf(shown));
      const key = slot ? `slot-${slot.hour}` : "idle";
      if (key !== this.panelKey) {
        this.panelKey = key;
        if (slot) this.showSlotPanel(slot);
        else this.showIdlePanel();
      }
    }
  }

  // ============================================================== vstup

  private onDown(p: Phaser.Input.Pointer) {
    sfx.unlock();

    if (Phaser.Math.Distance.Between(p.x, p.y, SPEAKER.x, SPEAKER.y) < SPEAKER.r + 8) {
      sfx.say(this.phase === "TIME_QUIZ" ? QUIZ_TASKS[this.taskIndex].spoken : timeInCzech(this.total));
      return;
    }

    // ťuknutí na obrázek v panelu (zasadit semínko, uklidit hračky…)
    if (
      this.panelAction &&
      p.x > COL_X + WIN.x &&
      p.x < COL_X + WIN.x + WIN.w &&
      p.y > PANEL_Y + WIN.y &&
      p.y < PANEL_Y + WIN.y + WIN.h
    ) {
      const action = this.panelAction;
      this.panelAction = null;
      action();
      return;
    }

    if (this.phase === "FREE_EXPLORE" && !this.animating) {
      const card = this.cards.find(
        (c) => Math.abs(p.x - c.root.x) < CARD_W / 2 && Math.abs(p.y - c.root.y) < CARD_H / 2,
      );
      if (card) {
        sfx.pop();
        this.tweens.add({ targets: card.root, scale: 1.12, duration: 120, yoyo: true });
        this.animateTo(toTotal(card.slot.hour), () => this.announce());
        return;
      }
      if (Math.abs(p.x - this.quizButton.x) < COL_W / 2 && Math.abs(p.y - QUIZ_BTN_Y) < 28) {
        sfx.pop();
        this.startQuiz();
        return;
      }
    }

    this.tryGrabHand(p);
  }

  /**
   * Kterou ručičku dítě chytlo? Daleko od středu může být jen velká
   * (malá tam nedosáhne); blíž rozhodne, ke které ručičce je prst úhlově
   * blíž.
   */
  private tryGrabHand(p: Phaser.Input.Pointer) {
    if (this.animating) return;
    if (this.phase !== "FREE_EXPLORE" && this.phase !== "TIME_QUIZ") return;
    const dist = Phaser.Math.Distance.Between(p.x, p.y, CX, CY);
    if (dist > R || dist < 20) return;

    const a = pointerAngle(CX, CY, p.x, p.y);
    const toMinute = Math.abs(angleDelta(a, minuteHandAngle(this.total)));
    const toHour = Math.abs(angleDelta(a, hourHandAngle(this.total)));
    const hand: Hand = dist > HOUR_LEN + 40 || toMinute <= toHour ? "minute" : "hour";

    this.dragging = { hand, lastAngle: a };
    (hand === "minute" ? this.minuteHand : this.hourHand).setScale(1.05);
    this.hint?.destroy();
    this.hint = null;
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.dragging) return;
    const a = pointerAngle(CX, CY, p.x, p.y);
    const delta = angleDelta(this.dragging.lastAngle, a);
    this.dragging.lastAngle = a;
    const before = Math.floor(this.total / 5);
    // Druhá ručička se dopočítá sama – obě ukazují pořád stejné `total`.
    this.total = wrapDay(this.total + minutesForDrag(this.dragging.hand, delta));
    if (Math.floor(this.total / 5) !== before) sfx.tick(this.dragging.hand === "minute" ? 6 : 0);
  }

  private onUp() {
    if (!this.dragging) return;
    this.minuteHand.setScale(1);
    this.hourHand.setScale(1);
    this.dragging = null;

    // „cvaknutí“ na nejbližší pětiminutu – nejkratší cestou (i přes půlnoc)
    let diff = snap(this.total) - this.total;
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    this.animateBy(diff, 150, () => {
      if (this.phase === "TIME_QUIZ") this.checkAnswer();
      else this.announce();
    });
  }

  // ============================================================ animace

  /** Posune ručičky dopředu na `target` – čas „plyne“, jako by běžel den. */
  private animateTo(target: number, done: () => void) {
    const diff = wrapDay(target - Math.round(this.total));
    if (diff === 0) {
      done();
      return;
    }
    sfx.whoosh();
    this.animateBy(diff, Math.min(1600, 500 + diff * 1.5), done);
  }

  private animateBy(diff: number, duration: number, done: () => void) {
    const start = this.total;
    this.animating = true;
    this.tweens.addCounter({
      from: 0,
      to: diff,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: (tw) => {
        this.total = wrapDay(start + tw.getValue()!);
      },
      onComplete: () => {
        this.total = wrapDay(Math.round(start + diff));
        this.animating = false;
        done();
      },
    });
  }

  /** Přečte čas nahlas, ve volném hraní i s „časem pro…“. */
  private announce() {
    const slot = slotForHour(hoursOf(this.total));
    sfx.say(slot ? `${timeInCzech(this.total)}. ${slot.title}.` : timeInCzech(this.total));
  }

  // ============================================================== panel

  private resetPanel(title: string, windowFill: number, windowTop?: number) {
    this.panelVersion++;
    this.panelAction = null;
    for (const child of this.panel.list) this.tweens.killTweensOf(child);
    this.panel.removeAll(true);

    const g = this.add.graphics();
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, COL_W, PANEL_H, 28);
    g.lineStyle(5, 0x6ee7b7).strokeRoundedRect(0, 0, COL_W, PANEL_H, 28);
    g.fillGradientStyle(windowTop ?? windowFill, windowTop ?? windowFill, windowFill, windowFill, 1);
    g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    const titleText = this.add
      .text(COL_W / 2, 34, title, {
        fontFamily: FONT,
        fontSize: "26px",
        fontStyle: "bold",
        color: "#064e3b",
        align: "center",
        wordWrap: { width: COL_W - 30 },
      })
      .setOrigin(0.5);
    this.panel.add([g, titleText]);

    this.panel.setScale(0.96).setAlpha(0.6);
    this.tweens.add({ targets: this.panel, scale: 1, alpha: 1, duration: 220, ease: "Back.easeOut" });
  }

  private panelText(x: number, y: number, text: string, size: number, color: string, style = "bold") {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: style,
        color,
        align: "center",
        wordWrap: { width: WIN.w - 20 },
      })
      .setOrigin(0.5);
    this.panel.add(t);
    return t;
  }

  private emoji(x: number, y: number, e: string, size: number) {
    const t = this.add.text(x, y, e, { fontSize: `${size}px` }).setOrigin(0.5);
    this.panel.add(t);
    return t;
  }

  /** Opožděná akce, která se zahodí, pokud se mezitím panel překreslil. */
  private later(ms: number, fn: () => void) {
    const version = this.panelVersion;
    this.time.delayedCall(ms, () => {
      if (version === this.panelVersion) fn();
    });
  }

  private sparkleAt(x: number, y: number, n = 16) {
    this.sparkle.explode(n, COL_X + x, PANEL_Y + y);
  }

  private showIdlePanel() {
    this.resetPanel("Nastav hodiny ⏰", 0xecfdf5);
    this.panelText(WX, WY - 62, "Velká žlutá ručička\nukazuje minuty", 26, "#b45309");
    this.panelText(WX, WY + 28, "Malá zelená ručička\nukazuje hodiny", 26, "#047857");
    this.panelText(WX, WY + 92, "Chyť ručičku prstem a toč 🔄", 20, "#57534e", "normal");
    this.panelText(COL_W / 2, 318, "Nebo ťukni na kartičku dole 👇", 22, "#57534e");
  }

  /** Ilustrovaná scéna „ČAS PRO…“ k dané hodině + interakce po ťuknutí. */
  private showSlotPanel(slot: TimeSlot) {
    this.resetPanel(slot.title, slot.sky[1], slot.sky[0]);
    const hint = this.panelText(COL_W / 2, 312, `👆 ${slot.tapHint}`, 20, "#064e3b");
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    this.panelText(COL_W / 2, 341, slot.verse, 19, "#92400e", "italic");

    const finish = () => {
      this.tweens.killTweensOf(hint);
      hint.setAlpha(1).setText("✨ " + slot.afterTap);
      sfx.say(slot.afterTap);
    };

    if (slot.action === "plant") {
      const sun = this.emoji(WX + 150, WY + 80, "☀️", 56);
      this.tweens.add({ targets: sun, y: WY - 60, duration: 2500, ease: "Sine.easeOut" });
      const pot = this.add.graphics();
      pot.fillStyle(0xb45309).fillPoints(points(-55, -30, 55, -30, 40, 50, -40, 50), true);
      pot.fillStyle(0x92400e).fillRoundedRect(-62, -42, 124, 18, 6);
      pot.fillStyle(0x78350f).fillRect(-50, -26, 100, 8);
      pot.setPosition(WX, WY + 55);
      this.panel.add(pot);
      const seed = this.emoji(WX, WY - 70, "🌰", 44);
      this.tweens.add({ targets: seed, y: WY - 82, duration: 600, yoyo: true, repeat: -1 });
      this.panelAction = () => {
        this.tweens.killTweensOf(seed);
        sfx.pop();
        this.tweens.add({
          targets: seed,
          y: WY + 25,
          scale: 0.5,
          duration: 400,
          ease: "Quad.easeIn",
          onComplete: () => {
            seed.destroy();
            const sprout = this.emoji(WX, WY + 20, "🌱", 70).setOrigin(0.5, 1).setScale(0);
            this.tweens.add({ targets: sprout, scale: 1.3, duration: 700, ease: "Back.easeOut" });
            this.later(1100, () => {
              sprout.setText("🌷");
              sfx.chime();
              this.sparkleAt(WX, WY - 30);
              finish();
            });
          },
        });
      };
    }

    if (slot.action === "pray") {
      this.emoji(WX - 130, WY + 30, "🧒", 84);
      const bowl = this.emoji(WX + 10, WY + 45, "🍲", 96);
      this.tweens.add({ targets: bowl, scale: 1.06, duration: 700, yoyo: true, repeat: -1 });
      this.panelAction = () => {
        const hands = this.emoji(WX + 140, WY + 25, "🙏", 76).setScale(0);
        this.tweens.add({ targets: hands, scale: 1, duration: 500, ease: "Back.easeOut" });
        sfx.chime();
        for (let i = 0; i < 4; i++) {
          const heart = this.emoji(WX - 60 + i * 50, WY + 10, "💛", 36).setAlpha(0);
          this.tweens.add({ targets: heart, alpha: { from: 1, to: 0 }, y: WY - 100, duration: 1600, delay: 300 + i * 200 });
        }
        finish();
      };
    }

    if (slot.action === "build") {
      const ground = this.add.graphics();
      ground.fillStyle(0x65a30d).fillRect(WIN.x, WY + 90, WIN.w, WIN.h / 2 - 90);
      this.panel.add(ground);
      const kids = [this.emoji(WX - 150, WY + 55, "🧒", 76), this.emoji(WX + 150, WY + 55, "👧", 76)];
      this.panelAction = () => {
        ["🟥", "🟨", "🟩", "🟦"].forEach((b, i) => {
          const block = this.emoji(WX, WY - 140, b, 50).setAlpha(0);
          this.tweens.add({
            targets: block,
            alpha: 1,
            y: WY + 66 - i * 48,
            duration: 380,
            delay: i * 380,
            ease: "Bounce.easeOut",
            onStart: () => sfx.pop(),
          });
        });
        this.later(4 * 380 + 300, () => {
          this.tweens.add({ targets: kids, y: WY + 25, duration: 260, yoyo: true, repeat: 2, ease: "Quad.easeOut" });
          this.sparkleAt(WX, WY - 70);
          sfx.win();
          finish();
        });
      };
    }

    if (slot.action === "tidy") {
      const box = this.emoji(WX + 140, WY + 45, "📦", 92);
      const toys = (
        [
          ["🧸", -150, -40],
          ["🚗", -55, 65],
          ["⚽", -10, -50],
          ["🧩", -150, 70],
        ] as const
      ).map(([e, dx, dy]) => this.emoji(WX + dx, WY + dy, e, 52));
      this.tweens.add({ targets: toys, angle: { from: -8, to: 8 }, duration: 400, yoyo: true, repeat: -1 });
      this.panelAction = () => {
        this.tweens.killTweensOf(toys);
        toys.forEach((toy, i) => {
          this.tweens.add({
            targets: toy,
            x: box.x,
            y: box.y - 10,
            scale: 0.3,
            alpha: 0,
            duration: 450,
            delay: i * 350,
            ease: "Quad.easeIn",
            onComplete: () => {
              sfx.pop();
              this.tweens.add({ targets: box, scale: 1.15, duration: 100, yoyo: true });
            },
          });
        });
        this.later(toys.length * 350 + 500, () => {
          this.sparkleAt(box.x, box.y);
          sfx.win();
          finish();
        });
      };
    }

    if (slot.action === "sleep") {
      const stars = [
        [-170, -80],
        [-90, -95],
        [40, -85],
        [-140, -20],
        [90, -40],
      ].map(([dx, dy], i) => {
        const s = this.add.image(WX + dx, WY + dy, "p-star").setScale(0.5).setAlpha(0.25);
        this.panel.add(s);
        this.tweens.add({ targets: s, alpha: 0.5, duration: 900, delay: i * 200, yoyo: true, repeat: -1 });
        return s;
      });
      this.emoji(WX + 150, WY - 60, "🌙", 64);
      const bed = this.emoji(WX - 10, WY + 55, "🛏️", 110);
      this.panelAction = () => {
        sfx.chime();
        for (const s of stars) {
          this.tweens.killTweensOf(s);
          this.tweens.add({ targets: s, alpha: 1, scale: 0.8, duration: 600 });
        }
        for (let i = 0; i < 3; i++) {
          const z = this.emoji(bed.x + 40, bed.y - 30, "💤", 40).setAlpha(0);
          this.tweens.add({
            targets: z,
            alpha: { from: 1, to: 0 },
            x: bed.x + 110,
            y: bed.y - 130,
            duration: 2000,
            delay: i * 700,
            repeat: -1,
          });
        }
        finish();
      };
    }
  }

  // ======================================================= kvíz – stavy

  /** FREE_EXPLORE → TIME_QUIZ */
  private startQuiz() {
    this.phase = "TIME_QUIZ";
    this.taskIndex = 0;
    this.misses = 0;
    this.hint?.destroy();
    this.hint = null;
    this.tweens.add({
      targets: [...this.cards.map((c) => c.root), this.quizButton],
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.cards.forEach((c) => c.root.setVisible(false));
        this.quizButton.setVisible(false);
      },
    });
    this.stars.forEach((s, i) => {
      s.setVisible(true).setScale(0);
      this.tweens.add({ targets: s, scale: 1, duration: 300, delay: 250 + i * 80, ease: "Back.easeOut" });
    });
    this.showTask();
  }

  private showTask() {
    const task = QUIZ_TASKS[this.taskIndex];
    this.misses = 0;
    this.ghost.setVisible(false);
    this.panelKey = "quiz";
    this.resetPanel(`Úkol ${this.taskIndex + 1} z ${QUIZ_TASKS.length}`, 0xecfdf5, 0xfef9c3);
    const icon = this.emoji(WX, WY - 55, task.icon, 72);
    this.tweens.add({ targets: icon, y: WY - 65, duration: 600, yoyo: true, repeat: -1 });
    this.panelText(WX, WY + 50, task.text, 27, "#064e3b");
    this.panelText(COL_W / 2, 312, "Toč ručičkami a pak je pusť 👆", 20, "#57534e");
    this.panelText(COL_W / 2, 341, "malá = hodiny · velká = minuty", 19, "#92400e", "italic");
    sfx.say(task.spoken);
  }

  /** Po puštění ručičky: je čas správně? (kontroluje se jen ciferník) */
  private checkAnswer() {
    const task = QUIZ_TASKS[this.taskIndex];
    const target = toTotal(task.hour, task.minute);
    if (sameOnDial(this.total, target)) {
      // 8:00 a 20:00 vypadají stejně – digitál ukáže ten čas, který úkol chtěl
      this.total = target;
      this.celebrate(target);
      return;
    }
    this.misses++;
    if (this.misses >= 3 && !this.ghost.visible) this.showGhost(target);
    sfx.say(
      this.misses >= 3
        ? `${timeInCzech(this.total)}. Ještě ne. Podívej se na průhledné ručičky a nastav je stejně.`
        : `${timeInCzech(this.total)}. Ještě ne, zkus to znovu.`,
    );
  }

  /** Nápověda po třech pokusech: průhledné ručičky ukážou cíl. */
  private showGhost(target: number) {
    const [hour, minute] = this.ghost.list as Phaser.GameObjects.Container[];
    hour.angle = hourHandAngle(target);
    minute.angle = minuteHandAngle(target);
    this.ghost.setVisible(true).setAlpha(0.3);
    this.tweens.add({ targets: this.ghost, alpha: 0.12, duration: 700, yoyo: true, repeat: -1 });
  }

  /** TIME_QUIZ → SUCCESS_CELEBRATION → další úkol / FINISHED */
  private celebrate(target: number) {
    this.phase = "SUCCESS_CELEBRATION";
    this.tweens.killTweensOf(this.ghost);
    this.ghost.setVisible(false);

    const star = this.stars[this.taskIndex];
    star.setAlpha(1);
    this.tweens.add({ targets: star, scale: 1.6, duration: 250, yoyo: true, ease: "Quad.easeOut" });
    this.confetti.explode(40, star.x, star.y);
    this.confetti.explode(50, CX, CY - 100);
    this.tweens.add({ targets: this.digitalBox, scale: 1.06, duration: 160, yoyo: true, repeat: 2 });
    sfx.win();

    this.resetPanel("Výborně! 🎉", 0xfef3c7, 0xfde68a);
    const bigStar = this.emoji(WX, WY - 30, "⭐", 110).setScale(0);
    this.tweens.add({ targets: bigStar, scale: 1, angle: 360, duration: 700, ease: "Back.easeOut" });
    this.panelText(WX, WY + 75, timeInCzech(target), 28, "#92400e");
    sfx.say(`Výborně! ${timeInCzech(target)}.`);

    this.time.delayedCall(3000, () => {
      this.taskIndex++;
      if (this.taskIndex < QUIZ_TASKS.length) {
        this.phase = "TIME_QUIZ";
        this.showTask();
      } else {
        this.finish();
      }
    });
  }

  /** Závěr – Kazatel 3:1; React podle OUTCOME_EVENT ukáže kartu se shrnutím. */
  private finish() {
    this.phase = "FINISHED";
    this.resetPanel("Všechno má svůj čas 🙌", 0xfef9c3, 0xfde68a);
    this.panelText(WX, WY - 30, "„Všechno má svou chvíli, každý záměr pod nebem má svůj čas.“", 25, "#78350f", "bold italic");
    this.panelText(WX, WY + 70, "Kazatel 3:1", 20, "#92400e");
    this.panelText(COL_W / 2, 325, "Bůh má v rukou každou tvou hodinu 💛", 21, "#064e3b");
    sfx.heaven();
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 350, () => this.confetti.explode(40, 150 + i * 330, 120));
    }
    this.time.delayedCall(800, () =>
      sfx.say("Bůh má v rukou každý tvůj den i každou hodinu. Neboj se, on ví, co v který čas potřebuješ."),
    );
    this.time.delayedCall(1500, () => this.game.events.emit(OUTCOME_EVENT, "done"));
  }
}
