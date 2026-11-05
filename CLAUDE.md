# CLAUDE.md

@AGENTS.md

## Zusätzlich für Claude Code

- **Sprache:** Mit dem Nutzer Deutsch sprechen. Code, Befehle und Fehlermeldungen bleiben im Original.
- **Pläne ausführen:** Die Pläne in `docs/superpowers/plans/` sind für `superpowers:subagent-driven-development` bzw. `superpowers:executing-plans` geschrieben. Eine Phase nach der anderen abarbeiten, Checkboxen in der Plan-Datei abhaken.
- **Neue Features außerhalb der Pläne:** erst `superpowers:brainstorming`, dann die Spec ergänzen, dann `superpowers:writing-plans`.
- **Bugs:** `superpowers:systematic-debugging`, erst Ursache, dann Fix mit Regressionstest.
- **Vor „fertig“:** `superpowers:verification-before-completion`, also die Befehle aus „Befehle“ wirklich ausführen und das Ergebnis nennen.
- **Bibliotheks-Doku:** Bei Fragen zu Next.js 16, Prisma 7, Better Auth, Tailwind 4, shadcn, Vitest 5 oder Playwright erst per context7 nachschlagen und nicht aus dem Gedächtnis arbeiten. Die Versionen sind neuer als viele Beispiele im Netz.
- **shadcn-Komponenten** über `npx shadcn@4.23.0 add <name>` holen (oder das shadcn-MCP), nicht von Hand nachbauen.
- **Serena:** `.serena/` ist lokal und ignoriert. Für Code-Navigation gern nutzen, aber nichts daraus committen.
- **Commits und Pushes** nur, wenn der Nutzer darum bittet.
