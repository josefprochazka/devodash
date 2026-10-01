import { lazy, Suspense } from "react";

// Hry na enginu Phaser se načítají líně – Phaser je velký (~1,4 MB) a
// stáhne se, až když dítě takovou hru opravdu otevře.
const StavitelGame = lazy(() => import("./StavitelGame"));

export function StavitelGameLoader() {
  return (
    <Suspense
      fallback={<div className="mt-6 aspect-[5/3] rounded-xl bg-sky-100 animate-pulse" />}
    >
      <StavitelGame />
    </Suspense>
  );
}
