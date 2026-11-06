/**
 * Bilder der Login-Seite (Spec 12.2). Erzeugt von `scripts/prepare-login-images.mjs`,
 * Quellen und Lizenzen in `public/login/CREDITS.md`.
 * Die Slideshow läuft in dieser Reihenfolge – `bg-01` lädt mit `priority`.
 */
export type LoginImage = { src: string; alt: string };

export const LOGIN_IMAGES: LoginImage[] = [
  {
    src: "/login/bg-01.webp",
    alt: "Skyline von Los Angeles mit Palmen im goldenen Abendlicht",
  },
  {
    src: "/login/bg-02.webp",
    alt: "Garage in pinkem und blauem Neon, Oldtimer, leichter Dunst",
  },
  {
    src: "/login/bg-03.webp",
    alt: "Straße bei Nacht mit Neon-Hotels, Retro-Miami",
  },
  {
    src: "/login/bg-04.webp",
    alt: "Palmen-Silhouetten vor pink-violettem Sonnenuntergang",
  },
];

/** Steht hinter dem Intro-Splash (Spec 6.1) – das dunkelste Bild der Auswahl. */
export const LOGIN_INTRO: LoginImage = {
  src: "/login/intro.webp",
  alt: "Dunkle Garage mit Neon und Auto-Silhouette im Rauch",
};
