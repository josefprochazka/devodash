import { useState } from "react";
import { verses } from "./data/verses";
import { VerseMenu } from "./components/VerseMenu";
import { VerseView } from "./components/VerseView";

function App() {
  const [selectedId, setSelectedId] = useState(verses[0].id);
  const verse = verses.find((v) => v.id === selectedId) ?? verses[0];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50">
      <VerseMenu selectedId={selectedId} onSelect={setSelectedId} />
      <VerseView verse={verse} />
    </div>
  );
}

export default App;
