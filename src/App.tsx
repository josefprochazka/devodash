import { useState } from "react";
import { verses } from "./data/verses";
import {
  VerseMenu,
  COMING_SOON_ID,
  MATH_EXPLORE_ID,
} from "./components/VerseMenu";
import { VerseView } from "./components/VerseView";
import { MathExploreView } from "./components/MathExploreView";

function App() {
  const [selectedId, setSelectedId] = useState(verses[0].id);
  const verse = verses.find((v) => v.id === selectedId);

  let content;
  if (verse) {
    content = <VerseView verse={verse} />;
  } else if (selectedId === MATH_EXPLORE_ID) {
    content = <MathExploreView />;
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
      <VerseMenu selectedId={selectedId} onSelect={setSelectedId} />
      {content}
    </div>
  );
}

export default App;
