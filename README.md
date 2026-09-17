# DevoDash

Appka pro děti na denní **ztišení** – verš z Bible, krátké vysvětlení pro
rodiče a jednoduchá interaktivní hra k danému verši. Běží jako webová PWA,
takže jde spustit rovnou v Safari na iPadu a přidat na plochu jako ikonu.

Víc kontextu a vize projektu je v [`CLAUDE.md`](./CLAUDE.md).

## Aktuální demo

- **Přísloví 20:4** – "Lenoch na podzim neorá, potom se při žni dožaduje,
  ale nic není."
- Nahoře popisek verše pro rodiče, dole hra: dítě prstem vede postavičku
  přes pole a oře ho. Po dokončení (nebo po volbě "jít radši lehnout")
  appka ukáže, jak to dopadlo o žních.

## Jak appku spustit

Potřebuješ [Node.js](https://nodejs.org/) (18+).

```bash
npm install
npm run dev
```

Otevře se na `http://localhost:5173`. Pro přístup z jiného zařízení v síti
(např. iPad) spusť:

```bash
npm run dev -- --host
```

a na iPadu otevři v Safari `http://<IP-adresa-počítače>:5173` (počítač i
iPad musí být na stejné Wi-Fi síti). V Safari pak přes tlačítko sdílení
appku můžeš přidat na plochu ("Přidat na plochu") jako ikonu.

Produkční build:

```bash
npm run build
npm run preview
```

## Jak přidat další verš/hru

Verše jsou datově vedené v [`src/data/verses.ts`](./src/data/verses.ts) –
stačí přidat další záznam typu `Verse` (kniha, kapitola, verš, text,
poznámka pro rodiče, klíč hry). Levé menu i výběr hry se podle tohoto pole
poskládají automaticky.

Hry jsou v [`src/games`](./src/games) a registrují se v
[`src/games/registry.tsx`](./src/games/registry.tsx) pod klíčem, který se
pak použije v `verse.game`. Nová hra = nová komponenta + jeden řádek v
registru.

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- vite-plugin-pwa (offline provoz, instalace na plochu)
