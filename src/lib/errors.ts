/** Errors the API layer maps to HTTP responses. Anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in to do that.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request.", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, 409, code);
  }
}

/** The requested slot is no longer bookable (already taken, blocked, or in the past). */
export class SlotUnavailableError extends ConflictError {
  constructor(message = "This time slot is no longer available. Please choose another.") {
    super(message, "SLOT_UNAVAILABLE");
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterSeconds: number, message = "Too many requests. Please slow down and try again shortly.") {
    super(message, 429, "RATE_LIMITED");
  }
}
