# DevoDash

An app for kids' daily Bible **"quiet time"** – a verse, a short explanation
for parents, and a simple interactive game tied to that verse. It runs as a
web PWA, so it opens straight in Safari on an iPad and can be added to the
home screen as an icon.

More context and the project vision live in [`CLAUDE.md`](./CLAUDE.md).

## Current demo

- **Proverbs 20:4** – "A sluggard does not plow in season; so at harvest
  time he looks but finds nothing."
- A parent-facing explanation of the verse at the top, and a game below:
  the child drags a character across a field with their finger to plow it.
  After finishing (or choosing "go lie down instead"), the app shows how
  things turned out at harvest time.

## Running the app

You need [Node.js](https://nodejs.org/) (18+).

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. To access it from another device on the
network (e.g. an iPad), run:

```bash
npm run dev -- --host
```

and on the iPad open `http://<your-computer's-IP>:5173` in Safari (the
computer and iPad must be on the same Wi-Fi network). From Safari's share
menu you can then add the app to the home screen ("Add to Home Screen").

Production build:

```bash
npm run build
npm run preview
```

## Adding another verse/game

Verses are data-driven, in [`src/data/verses.ts`](./src/data/verses.ts) –
just add another `Verse` entry (book, chapter, verse, text, parent note,
game key). The left-hand menu and game selection are built from this array
automatically.

Games live in [`src/games`](./src/games) and register themselves in
[`src/games/registry.tsx`](./src/games/registry.tsx) under a key that's
then used as `verse.game`. A new game = one new component + one line in
the registry.

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- vite-plugin-pwa (offline support, installable on the home screen)
