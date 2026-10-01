import { lazy, Suspense, type ComponentType } from "react";

/**
 * Hry na enginu Phaser se načítají líně – Phaser je velký (~1,4 MB) a
 * stáhne se, až když dítě takovou hru opravdu otevře.
 */
export function lazyGame(load: () => Promise<{ default: ComponentType }>) {
  const Game = lazy(load);
  return function LazyGame() {
    return (
      <Suspense fallback={<div className="mt-6 aspect-[5/3] rounded-xl bg-sky-100 animate-pulse" />}>
        <Game />
      </Suspense>
    );
  };
}
