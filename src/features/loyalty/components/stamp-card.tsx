import { cn } from "cn";
import { Gift } from "lucide-react";
import { useEffect, useRef } from "react";
import { stampCardView, stampRotation } from "../card";
import { readStampsSeen, writeStampsSeen } from "../stamp-seen-storage";

export type NextReward = { name: string; cost: number } | null;

/**
 * Stempelkarte (Spec 5.7). Die Drehung kommt als CSS-Variable, nicht als React-Style –
 * der erste Render muss auf Server und Client gleich sein. Nach einer Gutschrift „knallt“
 * der neue Stempel aufs Feld; bei reduzierter Bewegung blendet er nur ein (CSS).
 */
export function StampCard({
  balance,
  cardSize,
  nextReward,
  customerId,
}: {
  balance: number;
  cardSize: number;
  nextReward: NextReward;
  customerId?: string;
}) {
  const view = stampCardView(balance, cardSize);
  const current = view.current;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customerId) return;

    const seen = readStampsSeen(customerId);
    const added = current - seen;

    if (added > 0) {
      const nodes = gridRef.current?.querySelectorAll<HTMLElement>('[data-stamp="filled"]');
      nodes?.forEach((node, index) => {
        if (index >= nodes.length - added) node.dataset.new = "true";
      });
    }

    writeStampsSeen(customerId, current);
  }, [customerId, current]);

  const remaining = nextReward ? nextReward.cost - balance : 0;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Treuekarte</h2>
        <span className="font-mono text-sm">
          {view.current} / {cardSize} Stempel
        </span>
      </div>

      {view.fullCards > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {view.fullCards} volle{view.fullCards > 1 ? "n" : ""} Karte{view.fullCards > 1 ? "n" : ""} + {view.current}
        </p>
      ) : null}

      <div ref={gridRef} className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: cardSize }, (_, index) => {
          const filled = index < view.current;
          const last = index === cardSize - 1;

          return (
            <span
              key={index}
              data-stamp={filled ? "filled" : "empty"}
              className={cn("stamp", filled && "stamp--filled")}
              style={{ "--rot": `${stampRotation(index)}deg` } as React.CSSProperties}
            >
              {last ? <Gift aria-hidden className="size-4" /> : null}
            </span>
          );
        })}
      </div>

      {nextReward && remaining > 0 ? (
        <p className="mt-3 text-sm">Noch {remaining} Stempel bis „{nextReward.name}“</p>
      ) : null}

      {nextReward && remaining <= 0 ? (
        <p className="mt-3 text-sm text-success">„{nextReward.name}“ ist einlösbar.</p>
      ) : null}
    </section>
  );
}
