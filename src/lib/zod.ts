import { z } from "zod";

// Zod v4 prüft beim ersten Parsen, ob es kompilieren darf, und ruft dafür `Function("")` auf.
// Die CSP des Portals (next.config.ts, Spec 13.6) erlaubt im Browser keine String-Evalution.
// Im jitless-Modus bleibt die Kompilierung aus – damit läuft die Validation ohne Verstoß.
z.config({ jitless: true });

export { z };
