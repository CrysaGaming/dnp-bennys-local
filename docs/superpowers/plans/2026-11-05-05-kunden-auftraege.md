# Benny's Portal – Plan 05: Kunden, Treue, Aufträge, Rechnungen (Phase 8–9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kundenkartei mit Fahrzeugen, Treuesystem (Stempel oder Punkte) mit Einstellungsseite und Prämien, Aufträge mit Preisberechnung, Lagerverbrauch und Prämien-Einlösung sowie Rechnungen mit automatischer Gutschrift.

**Architecture:** Alle Geldbeträge rechnet nur `calcOrderTotals` aus. Alle Treue-Buchungen laufen über `bookLoyalty`, alle Bestandsänderungen über `bookStock` (Plan 04). Statuswechsel prüft eine reine Übergangstabelle. Jede Fachfunktion arbeitet in einer Prisma-Transaktion.

**Tech Stack:** wie Übersicht.

**Spec:** `docs/superpowers/specs/2026-11-05-bennys-portal-design.md` (Abschnitte 3.6, 5.6, 5.7, 5.10, 7.3–7.5)

## Global Constraints

Gelten wie in `2026-11-05-00-uebersicht.md`.

## Review Focus

Aus der Übersicht: Punkt 2 (Prämie doppelt einlösen, Task 8.2 und 9.2) und Punkt 4 (Kennzeichen-Normalisierung, Task 8.1). Zusätzlich: Eine Rechnung wird ungültig, nachdem der Kunde die Gutschrift schon ausgegeben hat. Erwartung: Das Konto bleibt bei 0 und wird nicht negativ (Task 9.3).

---

## Phase 8 – Kunden & Treue

### Task 8.1: Kunden-Service

**Files:**
- Create: `src/features/customers/normalize.ts`, `src/features/customers/normalize.test.ts`, `src/features/customers/schemas.ts`, `src/features/customers/service.ts`, `src/features/customers/actions.ts`, `tests/integration/customers.test.ts`
- Modify: `tests/helpers/factories.ts` (`createCustomer(data?: { name?: string; phone?: string | null; plates?: string[] })`)

**Interfaces:**
- Produces:
  - `normalizePlate(input: string): string` (trimmen, Großbuchstaben, Leerzeichenfolgen → ein Leerzeichen), `plateSchema` (nach Normalisierung `^[A-Z0-9 ]{1,8}# Benny's Portal – Plan 05: Kunden, Treue, Aufträge, Rechnungen (Phase 8–9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kundenkartei mit Fahrzeugen, Treuesystem (Stempel oder Punkte) mit Einstellungsseite und Prämien, Aufträge mit Preisberechnung, Lagerverbrauch und Prämien-Einlösung sowie Rechnungen mit automatischer Gutschrift.

**Architecture:** Alle Geldbeträge rechnet nur `calcOrderTotals` aus. Alle Treue-Buchungen laufen über `bookLoyalty`, alle Bestandsänderungen über `bookStock` (Plan 04). Statuswechsel prüft eine reine Übergangstabelle. Jede Fachfunktion arbeitet in einer Prisma-Transaktion.

**Tech Stack:** wie Übersicht.

**Spec:** `docs/superpowers/specs/2026-11-05-bennys-portal-design.md` (Abschnitte 3.6, 5.6, 5.7, 5.10, 7.3–7.5)

## Global Constraints

Gelten wie in `2026-11-05-00-uebersicht.md`.

## Review Focus

Aus der Übersicht: Punkt 2 (Prämie doppelt einlösen, Task 8.2 und 9.2) und Punkt 4 (Kennzeichen-Normalisierung, Task 8.1). Zusätzlich: Eine Rechnung wird ungültig, nachdem der Kunde die Gutschrift schon ausgegeben hat. Erwartung: Das Konto bleibt bei 0 und wird nicht negativ (Task 9.3).

---

, Meldung „Kennzeichen: 1–8 Zeichen, nur A–Z, 0–9 und Leerzeichen“), `phoneDigits(s: string): string`, `formatCustomerNumber(n: number): string`
  - `customerSchema`: name 2–60, phone ≤ 20 (leer → `null`), notes ≤ 500, vehicles: bis 10 × `{ model: 1–40, plate, color: ≤ 20 | null }`
  - `type CustomerRow = { id: string; number: number; name: string; phone: string | null; plates: string[]; loyaltyBalance: number; lastVisitAt: Date | null }`
  - `searchCustomers(ctx, q: string, limit?: number): Promise<CustomerRow[]>` (`CUSTOMERS_VIEW`; leeres `q` → alle nach Name, max. 200)
  - `getCustomerByNumber(ctx, number: number)` (mit Fahrzeugen, letzten 20 Aufträgen, letzten 50 Treue-Buchungen)
  - `createCustomer(ctx, input: unknown): Promise<{ customer: Customer; warnings: string[] }>`, `updateCustomer(ctx, id, input)`, `addVehicle(ctx, customerId, v)`, `removeVehicle(ctx, vehicleId)` (mit Aufträgen: nur vom Kunden lösen, sonst löschen), `deleteCustomer(ctx, id)`; alles Schreibende mit `CUSTOMERS_EDIT`

- [x] **Step 1: Failing Tests**

```ts
// normalize.test.ts – Review Focus 4
expect(normalizePlate("  8ben  42 ")).toBe("8BEN 42");
expect(plateSchema.safeParse("ZUVIEL123").success).toBe(false);
expect(phoneDigits("555-01 23")).toBe("5550123");
expect(formatCustomerNumber(42)).toBe("#0042");
```
`customers.test.ts`:
- Kunde mit Fahrzeug „  8ben  42 “ → gespeichert `8BEN 42`; zweiter Kunde mit „8BEN 42“ → `ConflictError` field `vehicles.0.plate`, „Kennzeichen ist schon vergeben“
- zwei gleiche Kennzeichen in einer Eingabe → `ConflictError` field `vehicles.1.plate`
- gleiche Rufnummer wie Kunde #0001 → Anlage klappt, `warnings` = `["Rufnummer ist schon bei Kunde #0001 hinterlegt."]`
- Suche: „8ben“ findet über das Kennzeichen, „carl“ über den Namen, „555 01“ über die Rufnummer „555-0123“ (Ziffernsuche erst ab 3 Ziffern)
- `deleteCustomer` mit Auftrag → „Kunde hat Aufträge oder Treue-Buchungen und kann nicht gelöscht werden.“; ohne → gelöscht, Audit `customer.delete`
- ohne `CUSTOMERS_EDIT` → `ForbiddenError`

- [x] **Step 2: Ausführen** → FAIL
- [x] **Step 3: Implementieren** – Die Telefonsuche läuft per `$queryRaw` über `regexp_replace(phone, '\D', '', 'g') LIKE '%' || $digits || '%'` und liefert IDs. Diese werden mit den Treffern aus Name und Kennzeichen (Prisma `contains`, `mode: "insensitive"`) vereinigt.
- [x] **Step 4: Ausführen** → PASS
- [x] **Step 5: Commit** – `feat(kunden): Kunden-Service mit Fahrzeugen und Suche`

### Task 8.2: Treue-Kern

**Files:**
- Create: `src/features/loyalty/earn.ts`, `src/features/loyalty/earn.test.ts`, `src/features/loyalty/card.ts`, `src/features/loyalty/card.test.ts`, `src/features/loyalty/ledger.ts`, `src/features/loyalty/schemas.ts`, `src/features/loyalty/service.ts`, `src/features/loyalty/actions.ts`, `tests/integration/loyalty.test.ts`

**Interfaces:**
- Produces:
  - `type EarnSettings = Pick<LoyaltySettings, "enabled" | "mode" | "stampsPerVisit" | "dollarsPerPoint" | "minVisitTotal" | "cooldownHours">`
  - `calcEarn(s: EarnSettings, invoiceAmount: number, lastVisitAt: Date | null, now: Date): number`
  - `exampleText(s: EarnSettings, amount: number): string`
  - `stampCardView(balance: number, cardSize: number): { fullCards: number; current: number }`, `stampRotation(index: number): number` (ganzzahlig in −8…8, deterministisch)
  - `bookLoyalty(tx: Prisma.TransactionClient, input: { customerId: string; type: LoyaltyTxType; amount: number; employeeId: string; orderId?: string; invoiceId?: string; rewardId?: string; note?: string; visitAt?: Date }): Promise<{ balanceAfter: number }>`
  - `loyaltySettingsSchema` (stampsPerVisit 1–10, cardSize 4–20, dollarsPerPoint 1–100.000, minVisitTotal 0–10.000.000, cooldownHours 0–168), `rewardSchema` (name 2–40, description ≤ 200, cost 1–1000, type, value: Prozent 1–100 bzw. $ 1–10.000.000 bzw. 0, `priceListItemId` Pflicht genau bei `FREE_SERVICE` mit Meldung „Bitte eine Leistung wählen“)
  - `getLoyaltySettings(): Promise<LoyaltySettings>`, `updateLoyaltySettings(ctx, input)`, `listRewards(ctx, opts?: { includeInactive?: boolean })`, `createReward(ctx, input)`, `updateReward(ctx, id, input)`, `setRewardActive(ctx, id, active)`, `adjustLoyalty(ctx, input: { customerId: string; amount: number; note: string })`; Schreibendes mit `LOYALTY_MANAGE`

- [x] **Step 1: Failing Tests**

```ts
// earn.test.ts
const s = { enabled: true, mode: "STAMPS", stampsPerVisit: 1, dollarsPerPoint: 100, minVisitTotal: 500, cooldownHours: 12 } as const;
const now = new Date("2026-11-05T12:00:00Z");
expect(calcEarn({ ...s, enabled: false }, 1200, null, now)).toBe(0);
expect(calcEarn(s, 499, null, now)).toBe(0);
expect(calcEarn(s, 1200, null, now)).toBe(1);
expect(calcEarn({ ...s, mode: "POINTS" }, 1200, null, now)).toBe(12);
expect(calcEarn(s, 1200, new Date("2026-11-05T01:00:00Z"), now)).toBe(0);   // 11 h
expect(calcEarn(s, 1200, new Date("2026-11-05T00:00:00Z"), now)).toBe(1);   // genau 12 h
expect(calcEarn({ ...s, cooldownHours: 0 }, 1200, now, now)).toBe(1);
expect(exampleText(s, 1200)).toBe("Beispiel: Rechnung $1.200 → +1 Stempel");
expect(exampleText({ ...s, mode: "POINTS" }, 1200)).toBe("Beispiel: Rechnung $1.200 → +12 Punkte");
expect(exampleText({ ...s, minVisitTotal: 1500 }, 1200)).toBe("Beispiel: Rechnung $1.200 → keine Gutschrift (Mindestbetrag $1.500)");
// card.test.ts
expect(stampCardView(0, 10)).toEqual({ fullCards: 0, current: 0 });
expect(stampCardView(7, 10)).toEqual({ fullCards: 0, current: 7 });
expect(stampCardView(10, 10)).toEqual({ fullCards: 0, current: 10 });
expect(stampCardView(13, 10)).toEqual({ fullCards: 1, current: 3 });
expect(stampCardView(20, 10)).toEqual({ fullCards: 1, current: 10 });
for (let i = 0; i < 20; i++) expect(Math.abs(stampRotation(i))).toBeLessThanOrEqual(8);
expect(stampRotation(3)).toBe(stampRotation(3));
```
`loyalty.test.ts`:
- Modus wechseln, während ein Kunde Guthaben 1 hat → „Modus kann nur gewechselt werden, solange kein Kunde Guthaben hat.“; mit Guthaben 0 überall → klappt, Audit `loyalty.settings`
- Prämie `FREE_SERVICE` ohne Leistung → zod-Meldung „Bitte eine Leistung wählen“
- `adjustLoyalty(-5)` bei Guthaben 3 → `InsufficientLoyaltyError`, Guthaben bleibt 3, keine Buchung
- `adjustLoyalty(+7, "Papierkarte übertragen")` → Guthaben 7, Buchung `ADJUSTMENT` mit `balanceAfter: 7`; Notiz unter 3 Zeichen → zod-Fehler
- Review Focus 2: Guthaben 5, zweimal parallel `bookLoyalty(REDEEM, -3)` in je eigener Transaktion → genau eine erfolgreich, Guthaben 2

- [x] **Step 2: Ausführen** → FAIL
- [x] **Step 3: Implementieren**
  - `bookLoyalty` zieht negative Beträge per `updateMany({ where: { id, loyaltyBalance: { gte: -amount } }, data: { loyaltyBalance: { decrement: -amount } } })` ab. `count === 0` heißt `InsufficientLoyaltyError`.
  - Danach wird die Buchung mit `balanceAfter` angelegt. Bei `visitAt` wird zusätzlich `lastVisitAt` gesetzt.
  - `calcEarn`: Die Sperrzeit gilt erfüllt, wenn `now - lastVisitAt >= cooldownHours`.
- [x] **Step 4: Ausführen** → PASS
- [x] **Step 5: Commit** – `feat(treue): Gutschrift, Buchungsjournal und Einstellungen`

### Task 8.3: Kunden-Oberfläche mit Stempelkarte

**Files:**
- Create: `src/app/(portal)/kunden/page.tsx`, `src/app/(portal)/kunden/neu/page.tsx`, `src/app/(portal)/kunden/[nummer]/page.tsx`, `src/features/customers/components/customer-table.tsx`, `src/features/customers/components/customer-form.tsx`, `src/features/customers/components/vehicle-fields.tsx`, `src/features/loyalty/components/stamp-card.tsx`, `src/features/loyalty/components/stamp-card.test.tsx`, `src/features/loyalty/components/points-bar.tsx`, `src/features/loyalty/components/adjust-dialog.tsx`, `tests/e2e/customers.spec.ts`

**Interfaces:**
- Consumes: Kunden- und Treue-Actions, `stampCardView`, `stampRotation`, `formatCustomerNumber`
- Produces: `StampCard({ balance, cardSize, nextReward }: { balance: number; cardSize: number; nextReward: { name: string; cost: number } | null })`, `PointsBar({ balance, nextReward })`

- [x] **Step 1: Failing Tests**

`stamp-card.test.tsx`:
- `balance 7, cardSize 10, nextReward { "20 % Rabatt", 10 }` → 7 Elemente `[data-stamp="filled"]`, 3 `[data-stamp="empty"]`, Text „Noch 3 Stempel bis „20 % Rabatt““
- `balance 13` → Text „1 volle Karte + 3“

`customers.spec.ts` (Admin):
```ts
test("Kunde mit zwei Fahrzeugen anlegen und per Kennzeichen finden", async ({ page }) => {
  await page.goto("/kunden/neu");
  // Name "Carlos Ramirez", Rufnummer "555-0123", Fahrzeuge: "Sultan RS" / "8ben 42", "Infernus" / "VICE86" → Speichern
  await page.goto("/kunden");
  await page.getByPlaceholder("Name, Rufnummer oder Kennzeichen").fill("8ben");
  await expect(page.getByRole("row", { name: /Carlos Ramirez/ })).toContainText("8BEN 42");
});
test("manuelle Gutschrift erscheint auf der Stempelkarte", async ({ page }) => {
  // Treuesystem per Factory aktiv (Stempel, 10 Felder) + Prämie "20 % Rabatt" (10)
  // Kundenseite → "Treue buchen" → +7, Notiz "Papierkarte" → 7 gefüllte Felder, Text "Noch 3 Stempel bis „20 % Rabatt“"
});
```

- [x] **Step 2: Ausführen** → FAIL
- [x] **Step 3: Implementieren** nach Spec 5.6 und 5.7:
  - Die neu hinzugekommenen Stempel bekommen die Animation (Scale 1.6 → 1, Drehung, 300 ms). Der zuletzt gesehene Stand liegt in `localStorage` (`bennys:stamps-seen:<kundenId>`, `try/catch`).
  - „Neuer Auftrag“ führt zu `/auftraege/neu?kunde=<nummer>`, „Einlösen“ zu `…&praemie=<id>`.
  - Warnungen aus `createCustomer` erscheinen als Hinweis-Toast.
- [x] **Step 4: Ausführen** → PASS
- [x] **Step 5: Commit** – `feat(kunden): Kundenkartei, Kundenkarte und Stempelkarte`

### Task 8.4: Treueprämien und Treue-Einstellungen

**Files:**
- Create: `src/app/(portal)/kunden/praemien/page.tsx`, `src/app/(portal)/kunden/treue-einstellungen/page.tsx`, `src/features/loyalty/components/reward-table.tsx`, `src/features/loyalty/components/reward-sheet.tsx`, `src/features/loyalty/components/loyalty-settings-form.tsx`, `tests/e2e/loyalty-settings.spec.ts`

**Interfaces:**
- Consumes: `exampleText`, `StampCard`, `PointsBar`, Treue-Actions, `getPriceList`

- [x] **Step 1: Failing E2E**

```ts
test("Treuesystem einschalten", async ({ page }) => {
  await page.goto("/kunden/treue-einstellungen");
  await expect(page.getByText("Das Treuesystem ist aus. Kunden sammeln gerade nichts.")).toBeVisible();
  await expect(page.getByText("Beispiel: Rechnung $1.200 → +1 Stempel")).toBeVisible();
  await page.getByRole("switch", { name: "Treuesystem aktiv" }).click();
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Das Treuesystem ist aus.")).toHaveCount(0);
});
test("Moduswechsel gesperrt bei Guthaben", async ({ page }) => {
  // Factory: Kunde mit Guthaben 1 → Auswahl "Punkte" deaktiviert, Hinweis "Modus kann nur gewechselt werden, solange kein Kunde Guthaben hat."
});
test("Prämie Gratis-Leistung anlegen", async ({ page }) => {
  // /kunden/praemien → "Neue Prämie" → Art "Gratis-Leistung" → Leistung "Ölwechsel" → Kosten 5 → erscheint in Tabelle
});
```

- [x] **Step 2: Ausführen** → FAIL
- [x] **Step 3: Implementieren** nach Spec 5.10:
  - Die Felder hängen vom Modus ab, die Live-Vorschau zeigt `StampCard` bzw. `PointsBar` mit Beispielguthaben.
  - Ist der Modus gesperrt, steht die Begründung daneben.
  - Ohne `LOYALTY_MANAGE` ist alles schreibgeschützt.
- [x] **Step 4: Ausführen** → PASS
- [x] **Step 5: Commit** – `feat(treue): Prämien- und Einstellungsseite`

---

## Phase 9 – Aufträge & Rechnungen

### Task 9.1: Preisberechnung

**Files:**
- Create: `src/features/orders/pricing.ts`, `src/features/orders/pricing.test.ts`

**Interfaces:**
- Produces: `calcOrderTotals(input: { items: Array<{ quantity: number; unitPrice: number; priceListItemId: string | null }>; discountPercent: number; reward: null | { type: RewardType; value: number; priceListItemId: string | null } }): { subtotal: number; afterDiscount: number; loyaltyDiscount: number; total: number }`

- [x] **Step 1: Failing Tests** (Formel aus Spec 7.5)

```ts
const items = [{ quantity: 2, unitPrice: 250, priceListItemId: "oel" }, { quantity: 1, unitPrice: 1000, priceListItemId: "tuning" }];
expect(calcOrderTotals({ items, discountPercent: 0, reward: null })).toEqual({ subtotal: 1500, afterDiscount: 1500, loyaltyDiscount: 0, total: 1500 });
expect(calcOrderTotals({ items, discountPercent: 10, reward: null }).total).toBe(1350);
expect(calcOrderTotals({ items: [{ quantity: 1, unitPrice: 999, priceListItemId: null }], discountPercent: 15, reward: null }).afterDiscount).toBe(849); // Plan hatte 850 – 999 × 0,85 = 849,15.
expect(calcOrderTotals({ items, discountPercent: 10, reward: { type: "PERCENT_DISCOUNT", value: 20, priceListItemId: null } }))
  .toEqual({ subtotal: 1500, afterDiscount: 1350, loyaltyDiscount: 270, total: 1080 });
expect(calcOrderTotals({ items, discountPercent: 10, reward: { type: "FIXED_DISCOUNT", value: 250, priceListItemId: null } }).total).toBe(1100);
expect(calcOrderTotals({ items, discountPercent: 10, reward: { type: "FIXED_DISCOUNT", value: 5000, priceListItemId: null } }))
  .toMatchObject({ loyaltyDiscount: 1350, total: 0 });
expect(calcOrderTotals({ items, discountPercent: 0, reward: { type: "FREE_SERVICE", value: 0, priceListItemId: "oel" } }))
  .toMatchObject({ loyaltyDiscount: 250, total: 1250 });
expect(calcOrderTotals({ items, discountPercent: 0, reward: { type: "FREE_SERVICE", value: 0, priceListItemId: "fehlt" } }).loyaltyDiscount).toBe(0);
expect(calcOrderTotals({ items: [], discountPercent: 0, reward: null }).total).toBe(0);
```

- [x] **Step 2: Ausführen** → FAIL
- [x] **Step 3: Implementieren**
- [x] **Step 4: Ausführen** → PASS
- [x] **Step 5: Commit** – `feat(auftraege): Preisberechnung`

### Task 9.2: Auftrags-Service

**Files:**
- Create: `src/features/orders/schemas.ts`, `src/features/orders/status.ts`, `src/features/orders/status.test.ts`, `src/features/orders/service.ts`, `src/features/orders/actions.ts`, `tests/integration/orders.test.ts`

**Interfaces:**
- Consumes: `calcOrderTotals`, `bookStock`, `bookLoyalty`, `getLoyaltySettings`, `hasPermission`
- Produces:
  - `ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]>` = `{ OPEN: ["IN_PROGRESS", "DONE", "CANCELLED"], IN_PROGRESS: ["DONE", "CANCELLED"], DONE: ["CANCELLED"], CANCELLED: [] }`
  - `canTransition(from: OrderStatus, to: OrderStatus): boolean`
  - `canEditOrder(ctx, order: { createdById: string; assignedToId: string | null }): boolean` (`ORDERS_MANAGE` oder eigener bzw. zugewiesener Auftrag)
  - `createOrder(ctx, input: { type: OrderType; customerId: string; vehicleId: string | null; notes: string | null }): Promise<{ id: string; number: number }>` (`ORDERS_CREATE`)
  - `getOrderByNumber(ctx, number: number)`, `listOrders(ctx, filter: { status?: OrderStatus; type?: OrderType; employeeId?: string; q?: string })` (`ORDERS_VIEW`)
  - `addOrderItem(ctx, orderId, { priceListItemId: string; quantity: number })`, `setOrderItemQuantity(ctx, itemId, quantity)`, `removeOrderItem(ctx, itemId)`, `setDiscount(ctx, orderId, percent)`, `assignOrder(ctx, orderId, employeeId | null)` (`ORDERS_MANAGE`)
  - `changeOrderStatus(ctx, orderId, to: OrderStatus): Promise<void>`
  - `applyReward(ctx, orderId, rewardId): Promise<void>`, `removeReward(ctx, orderId): Promise<void>`
  - intern: `recalcOrder(tx, orderId): Promise<void>` (nach jeder Änderung)

- [ ] **Step 1: Failing Tests**

`status.test.ts`: `canTransition("OPEN", "DONE")` true; `("DONE", "IN_PROGRESS")` false; `("CANCELLED", "OPEN")` false. `canEditOrder` mit fremdem Auftrag ohne `ORDERS_MANAGE` → false, mit → true, eigener → true.

`orders.test.ts`:
- Fahrzeug eines anderen Kunden → „Fahrzeug gehört nicht zum Kunden.“
- Position übernimmt Name und Preis als Snapshot; späterer Preiswechsel in der Preisliste ändert die Position nicht
- inaktive Leistung → „Diese Leistung ist nicht aktiv.“
- fremder Auftrag ohne `ORDERS_MANAGE` → `ForbiddenError`; eigener → erlaubt
- Änderung an einem `DONE`-Auftrag → „Der Auftrag ist abgeschlossen und kann nicht mehr geändert werden.“
- `DONE` bucht `ORDER_USAGE`: Teil-Bestand 10, Leistung mit `partQuantity: 2`, Menge 2 → Bestand 6, `completedAt` gesetzt
- `DONE` bei zu wenig Bestand → `InsufficientStockError`, Status bleibt, Bestand unverändert
- `CANCELLED` nach `DONE` bucht `CORRECTION` +4 zurück (Notiz „Storno Auftrag #<nr>“); offene Rechnung wird `VOID`; mit bezahlter Rechnung → „Bezahlte Aufträge können nicht storniert werden.“
- `applyReward` (`PERCENT_DISCOUNT` 20, Kosten 1) bei Guthaben 1 → `loyaltyDiscount` und `total` gesetzt, Guthaben 0, Buchung `REDEEM`; zweite Prämie → „Pro Auftrag ist nur eine Prämie möglich.“; `removeReward` → Guthaben 1, Buchung `REVERSAL`
- Treuesystem aus → `applyReward` → „Das Treuesystem ist aus.“
- `FREE_SERVICE` fügt die verknüpfte Leistung mit Menge 1 hinzu, falls sie fehlt
- Entfernen der Position einer `FREE_SERVICE`-Prämie entfernt auch die Prämie (Rückbuchung)
- Storno eines Auftrags mit Prämie bucht die Kosten zurück
- Review Focus 2: Guthaben 1, dieselbe Prämie (Kosten 1) parallel in zwei offenen Aufträgen → genau eine erfolgreich, Guthaben 0

- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren** – Jede Mutation läuft so: Transaktion öffnen → Auftrag laden → `canEditOrder` bzw. `assertPermission` prüfen → Status prüfen → ändern → `recalcOrder` → `writeAudit` (`order.<aktion>`).
- [ ] **Step 4: Ausführen** → PASS
- [ ] **Step 5: Commit** – `feat(auftraege): Auftrags-Service mit Lager und Prämien`

### Task 9.3: Rechnungs-Service mit Gutschrift

**Files:**
- Create: `src/features/invoices/service.ts`, `src/features/invoices/actions.ts`, `tests/integration/invoices.test.ts`

**Interfaces:**
- Consumes: `calcEarn`, `bookLoyalty`, `getLoyaltySettings`
- Produces:
  - `createInvoice(ctx, orderId: string): Promise<{ id: string; number: number }>` (`INVOICES_MANAGE`, nur für `DONE`, `amount = order.total`)
  - `markInvoicePaid(ctx, invoiceId: string, method: PaymentMethod): Promise<{ earned: number }>`
  - `voidInvoice(ctx, invoiceId: string, reason: string): Promise<void>`
  - `listInvoices(ctx, filter?: { status?: InvoiceStatus })`

- [ ] **Step 1: Failing Tests** – Treue aktiv: Stempel, 1 pro Besuch, ab $500, Sperrzeit 12 h
  - Rechnung für Auftrag `IN_PROGRESS` → „Rechnungen gibt es nur für abgeschlossene Aufträge.“; zweite Rechnung → „Für diesen Auftrag gibt es schon eine Rechnung.“
  - `markInvoicePaid` bei $1.200 → `{ earned: 1 }`, Guthaben 1, genau eine `EARN`-Buchung mit `invoiceId`, `lastVisitAt` gesetzt
  - $400 → `{ earned: 0 }`, keine Buchung
  - zweite bezahlte Rechnung 1 h später → `{ earned: 0 }` (Sperrzeit)
  - Punkte-Modus, $1.200 → `{ earned: 12 }`
  - erneut bezahlen → „Rechnung ist schon bezahlt.“; parallel zweimal bezahlen → genau eine Gutschrift
  - `voidInvoice` einer bezahlten Rechnung mit Guthaben 1 → `REVERSAL` −1, Guthaben 0
  - Guthaben schon ausgegeben (0), dann `voidInvoice` → keine Buchung, Guthaben bleibt 0 (Review Focus)
- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren** – Bezahlen und Gutschrift laufen in einer Transaktion. Die Gutschrift nutzt `calcEarn(settings, amount, customer.lastVisitAt, now)` und `bookLoyalty({ type: "EARN", visitAt: now })`. Bei Storno wird `min(earned, balance)` abgezogen, bei 0 gibt es keine Buchung.
- [ ] **Step 4: Ausführen** → PASS
- [ ] **Step 5: Commit** – `feat(rechnungen): Rechnungen mit Treue-Gutschrift`

### Task 9.4: Auftrags-Oberfläche

**Files:**
- Create: `src/app/(portal)/auftraege/page.tsx`, `src/app/(portal)/auftraege/neu/page.tsx`, `src/app/(portal)/auftraege/[nummer]/page.tsx`, `src/features/orders/components/order-table.tsx`, `src/features/orders/components/new-order-form.tsx`, `src/features/orders/components/customer-combobox.tsx`, `src/features/orders/components/order-items.tsx`, `src/features/orders/components/order-totals.tsx`, `src/features/orders/components/loyalty-panel.tsx`, `src/features/orders/components/status-actions.tsx`
- Modify: shadcn `add command` (Combobox)

**Interfaces:**
- Consumes: Auftrags-, Rechnungs-, Kunden- und Preislisten-Actions, `ALLOWED_TRANSITIONS`, `formatMoney`
- Produces: `/auftraege/neu?kunde=<nummer>&praemie=<id>`: Kunde ist vorbelegt; nach dem Anlegen wird die Prämie eingelöst, dann folgt der Wechsel auf die Detailseite

- [ ] **Step 1: Failing E2E** – siehe Task 9.5 (ein gemeinsamer Ablauf-Test)
- [ ] **Step 2: Implementieren**
  - Liste mit Filtern in der URL (`status`, `typ`, `mitarbeiter`, `q`).
  - Kunden-Combobox sucht über Name, Rufnummer und Kennzeichen, mit „Neuen Kunden anlegen“ im Dialog.
  - Positionen per Combobox aus der Preisliste, gruppiert nach Kategorie.
  - Summenblock mit Zwischensumme, Rabatt, Treue-Rabatt und Gesamt.
  - Status-Buttons nur für erlaubte Übergänge. „Rechnung erstellen“ nur bei `DONE` mit `INVOICES_MANAGE` und ohne Rechnung.
- [ ] **Step 3: Commit** – `feat(auftraege): Auftragsliste, Anlage und Detailseite`

### Task 9.5: Rechnungs-Oberfläche und Gesamtablauf

**Files:**
- Create: `src/app/(portal)/rechnungen/page.tsx`, `src/features/invoices/components/invoice-table.tsx`, `src/features/invoices/components/pay-dialog.tsx`, `src/features/invoices/components/void-dialog.tsx`, `tests/e2e/order-flow.spec.ts`

- [ ] **Step 1: Failing E2E** – `order-flow.spec.ts` (Admin; Factory: Treue aktiv mit Stempeln, ab $500, 10 Felder; Prämie „20 % Rabatt“ Kosten 1; Leistung „Motor-Tuning Stufe 1“ $1.200; Kunde Carlos Ramirez mit Fahrzeug „8BEN 42“)

```ts
test("Auftrag → Rechnung → bezahlt → Stempel → Einlösen", async ({ page }) => {
  await page.goto("/auftraege/neu");
  // Kunde "8ben" suchen und wählen, Typ "Tuning", anlegen → Detailseite
  // Position "Motor-Tuning Stufe 1" hinzufügen → Gesamt "$1.200"
  // Status "Erledigt" → "Rechnung erstellen" → /rechnungen → "Bezahlt" (Bar)
  await expect(page.getByText("Bezahlt. +1 Stempel für Carlos Ramirez")).toBeVisible();
  // Kundenseite: 1 gefülltes Feld; "Einlösen" bei "20 % Rabatt" → neuer Auftrag mit Prämie
  // Position hinzufügen → Treue-Rabatt "$240", Gesamt "$960"; Kundenseite: Guthaben 0
});
```

- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren**
  - Rechnungsliste mit Statusfilter.
  - Bezahlen-Dialog (Bar oder Bank). Danach Toast „Bezahlt. +N Stempel für <Name>“, im Punkte-Modus „+N Punkte“, ohne Gutschrift nur „Bezahlt.“
  - Storno-Dialog mit Grund und Hinweis „Auftrag danach stornieren und neu anlegen.“
- [ ] **Step 4: Ausführen** – Run: `npm run test:unit && npm run test:int && npm run test:e2e` → PASS
- [ ] **Step 5: Commit** – `feat(rechnungen): Rechnungsseite und Gesamtablauf`
