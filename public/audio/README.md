# Musik

`strassen-im-blut.mp3` aus Suno herunterladen und hier ablegen (Spec 6.4). Der Song
läuft über den eigenen Server, weil Suno-CDN-Links nicht zuverlässig sind und eine
Share-Seite nicht als Audioquelle eingebettet werden kann.

Mit dem kostenlosen Suno-Plan sind Songs nur für nicht-kommerzielle Nutzung freigegeben –
für das interne RP-Portal passt das. Bei kommerzieller Nutzung braucht der Song einen
Pro- oder Premier-Plan. Der Song ist seit 2026-11-07 im Repo (Entscheidung vom Owner, die
Regel in `.gitignore` ist weg). Damit steckt er im Image und muss nicht mehr als Volume
eingehängt werden – Achtung: das Repo ist öffentlich.

`silence-1s.wav` (1 s Stille, 8 kHz, 8 bit, mono) wird von
`scripts/make-silence-wav.mjs` erzeugt und in den E2E-Tests als Quelle benutzt.
