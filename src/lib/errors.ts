/** Fehlerklassen (Spec 4.4 / Plan 0.5). Die deutschen Meldungen erzeugt toActionError. */

export type FieldErrors = Record<string, string>;
export type ActionErrorResult = { error: string; fieldErrors?: FieldErrors };

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export class ForbiddenError extends ActionError {
  constructor(message = "Dafür fehlt dir die Berechtigung.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ActionError {
  constructor(message = "Das gibt es nicht.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ActionError {
  constructor(
    public readonly field: string,
    message = "Bitte Eingaben prüfen.",
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

export class BusinessRuleError extends ActionError {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

export class InsufficientStockError extends BusinessRuleError {
  constructor(message = "Nicht genug auf Lager.") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class InsufficientLoyaltyError extends BusinessRuleError {
  constructor(message = "Nicht genug Stempel/Punkte.") {
    super(message);
    this.name = "InsufficientLoyaltyError";
  }
}

type ZodLikeError = { issues: { path: (string | number)[]; message: string }[] };

function isZodError(error: unknown): error is ZodLikeError {
  return typeof error === "object" && error !== null && Array.isArray((error as ZodLikeError).issues);
}

function isPrismaUniqueError(error: unknown): error is { code: "P2002"; meta?: { target?: string[] } } {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

/** Alles wird in die Form für Server Actions gebracht – deutsch, ohne interne Details. */
export function toActionError(e: unknown): ActionErrorResult {
  if (isZodError(e)) {
    const fieldErrors: FieldErrors = {};
    for (const issue of e.issues) {
      const field = issue.path.map(String).join(".") || "_";
      fieldErrors[field] ??= issue.message;
    }
    return { error: "Bitte Eingaben prüfen.", fieldErrors };
  }

  if (isPrismaUniqueError(e)) {
    const field = e.meta?.target?.[0] ?? "_";
    return { error: "Bitte Eingaben prüfen.", fieldErrors: { [field]: "Das gibt es schon." } };
  }

  if (e instanceof ConflictError) {
    return { error: "Bitte Eingaben prüfen.", fieldErrors: { [e.field]: e.message } };
  }

  if (
    e instanceof ForbiddenError ||
    e instanceof NotFoundError ||
    e instanceof BusinessRuleError ||
    e instanceof ActionError
  ) {
    return { error: e.message };
  }

  console.error(e);
  return { error: "Unerwarteter Fehler. Bitte erneut versuchen." };
}
