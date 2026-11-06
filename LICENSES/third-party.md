# Lizenzen von Materialien im Repo

Stand: 2026-11-06. Die Bildquellen mit Fotograf und Link stehen in `public/login/CREDITS.md`.

## Tabler Icons – MIT

Genutzt für die Logo-Entwürfe (Icon `engine` in `docs/brand/logo-entwuerfe/`), Version 3.50.

> MIT License
>
> Copyright (c) 2023 Tabler Icons
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
> associated documentation files (the "Software"), to deal in the Software without restriction,
> including without limitation the rights to use, copy, modify, merge, publish, distribute,
> sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
> NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Quelle: https://github.com/tabler/icons/blob/master/LICENSE

## Lucide – ISC

Genutzt für die Icons in Navigation, Buttons und Status (`lucide-react`).

> ISC License
>
> Copyright (c) 2020-2025 Lucide Contributors
>
> Permission to use, copy, modify, and/or distribute this software for any purpose with or without
> fee is hereby granted, provided that the above copyright notice and this permission notice appear
> in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
> SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
> AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
> WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
> NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
> OF THIS SOFTWARE.

Quelle: https://github.com/lucide-icons/lucide/blob/main/LICENSE

## Schriften – SIL Open Font License 1.1

Genutzt über `next/font/google`: **Anton** ( Überschriften und Logo), **Geist** und **Geist Mono**
(Fließtext und Zahlen), dazu **Pacifico** in den Logo-Entwürfen.

Der vollständige OFL-Text steht offiziell unter https://openfontlicense.org . Kurzfassung der
Rechte, die für dieses Projekt zählen:

- Die Schriften dürfen kostenlos genutzt, weitergegeben und in ein Projekt eingebunden werden.
- Sie dürfen nicht verkauft werden, und der Name einer modifizierten Fassung darf nicht den
  ursprünglichen Reserved-Font-Namen tragen.
- Weil hier nichts modifiziert wird – `next/font` lädt nur die unveränderten Dateien –, ist die
  Nutzung ohne weiteren Vermerk erfüllt. Der Hinweis hier genügt.

Einzelne Quellen der Schriftfamilien:
- Anton: https://fonts.google.com/specimen/Anton
- Pacifico: https://fonts.google.com/specimen/Pacifico
- Geist: https://fonts.google.com/specimen/Geist

## Bilder der Login-Seite – Unsplash-Lizenz und Pexels-Lizenz

- Unsplash-Lizenz: https://unsplash.com/license – free for commercial and non-commercial use,
  no permission needed, selling the unmodified photo as-is is not allowed.
- Pexels-Lizenz: https://www.pexels.com/license/ – free for commercial use, no attribution
  required; der Nachweis der Quellen ist in `public/login/CREDITS.md` geführt.

Die Aufbereitung (WebP, Helligkeit −15 %, Größe 1920 × 1080) ist eine Änderung am Bild. Nach der
Unsplash-Lizenz ist das erlaubt, solange das Bild nicht unverändert weiterverkauft wird.

## Musik

`public/audio/strassen-im-blut.mp3` wird **nicht** committet (`.gitignore`). Es gilt der Suno-Plan
des Urhebers. Im Repo liegt nur `public/audio/silence-1s.wav` – eine selbst erzeugte Stille-Datei
für Tests.

## Pakete

Die npm-Abhängigkeiten haben eigene Lizenzen (überwiegend MIT). Sie werden nicht gebündelt
veröffentlicht, darum ist hier kein zusätzlicher Text nötig. `npm ls --license` liefert die Liste,
wenn sie jemand braucht.
