/**
 * Samostatná sekce mimo ztišení – zatím jen zástupná obrazovka.
 * Skutečná hra se doplní, až přijde zadání.
 */
export function MathExploreView() {
  return (
    <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
      <header>
        <p className="text-sm uppercase tracking-widest text-indigo-700 font-semibold mb-1">
          Matematické objevování
        </p>
        <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-4">
          Tady bude matematická hra 🔢
        </h2>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-stone-700 leading-relaxed">
            Hra se ještě připravuje — jakmile přijde zadání, doplní se sem.
          </p>
        </div>
      </header>
    </main>
  );
}
