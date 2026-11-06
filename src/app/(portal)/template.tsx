import type { ReactNode } from "react";

/**
 * Seitenwechsel: Fade plus 4 px Slide, 200 ms ease-out (Spec 4.3).
 *
 * Rein über CSS, nicht über motion. motion schrieb dem Server das `initial` in den Style und
 * der Client renderte bereits das `animate` – zwei verschiedene erste Render, also die
 * Hydration-Meldung. Ein CSS-Animation-Element ist auf beiden Seiten identisch, und die
 * Entscheidung „Bewegung oder nur Fade“ fällt die CSS-Regel über die Nutzer-Einstellung
 * (data-reduced-motion) und die Medienabfrage, nicht ein Client-Hook.
 */
export default function PortalTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
