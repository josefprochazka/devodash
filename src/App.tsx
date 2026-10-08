import { useEffect, useState } from "react";
import { verses } from "./data/verses";
import {
  VerseMenu,
  COMING_SOON_ID,
  MATH_EXPLORE_ID,
} from "./components/VerseMenu";
import { VerseView } from "./components/VerseView";
import { MathExploreView } from "./components/MathExploreView";

const MENU_KEY = "devodash.menuOpen";

/** Jestli bylo menu naposledy otevřené (pamatuje si prohlížeč, jen pohodlí). */
function loadMenuOpen(): boolean {
  try {
    return localStorage.getItem(MENU_KEY) !== "0";
  } catch {
    return true;
  }
}

function App() {
  const [selectedId, setSelectedId] = useState(verses[0].id);
  const [menuOpen, setMenuOpen] = useState(loadMenuOpen);
  const verse = verses.find((v) => v.id === selectedId);

  useEffect(() => {
    try {
      localStorage.setItem(MENU_KEY, menuOpen ? "1" : "0");
    } catch {
      // soukromé okno apod. – menu se prostě nezapamatuje
    }
  }, [menuOpen]);

  // Se skrytým menu se obsah roztáhne do šířky, ať hra využije celý iPad.
  const wide = !menuOpen;

  let content;
  if (verse) {
    content = <VerseView verse={verse} wide={wide} />;
  } else if (selectedId === MATH_EXPLORE_ID) {
    content = <MathExploreView wide={wide} />;
  } else {
    content = (
      <main className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-5xl mb-4">🚧</div>
          <p className="text-lg text-stone-600">
            {selectedId === COMING_SOON_ID
              ? "Další verš se připravuje."
              : "Verš nenalezen."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50">
      {menuOpen ? (
        <VerseMenu
          selectedId={selectedId}
          onSelect={setSelectedId}
          onHide={() => setMenuOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Otevřít menu"
          className="fixed top-3 left-3 z-20 px-4 h-11 rounded-full bg-emerald-900 text-emerald-50 font-semibold shadow-lg hover:bg-emerald-800 cursor-pointer"
        >
          ☰ Menu
        </button>
      )}
      {content}
    </div>
  );
}

export default App;
