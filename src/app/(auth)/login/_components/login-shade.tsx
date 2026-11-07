/**
 * Dunkle Schattenebene unten über der Szene (Spec 6.2). Ohne sie steht der HUD-Text direkt auf
 * dem Foto und fällt unter den geforderten Contrast.
 */
export function LoginShade() {
  return <div aria-hidden className="login-shade" />;
}
