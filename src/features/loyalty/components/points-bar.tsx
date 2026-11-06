import { pointsProgress } from "../card";
import type { NextReward } from "./stamp-card";

/** Punkte-Modus (Spec 5.7): große Zahl in Geist Mono, Balken bis zur nächsten Prämie. */
export function PointsBar({ balance, nextReward }: { balance: number; nextReward: NextReward }) {
  const percent = nextReward ? pointsProgress(balance, nextReward.cost) : 0;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Treuekonto</h2>
        <span className="font-mono text-2xl">{balance} Punkte</span>
      </div>

      {nextReward ? (
        <p className="mt-2 text-sm">
          Noch {nextReward.cost - balance} Punkte bis „{nextReward.name}“
        </p>
      ) : null}

      <div className="points-bar mt-3">
        <div data-points-bar className="points-bar-fill" style={{ width: `${percent}%` }} aria-hidden />
      </div>
    </section>
  );
}
