// src/lib/errors.ts
export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    message: string,
    opts?: { code?: string; status?: number; cause?: unknown },
  ) {
    super(message);
    this.name = new.target.name;
    this.code = opts?.code ?? 'APP_ERROR';
    this.status = opts?.status ?? 500;
    if (opts?.cause) {
      // optional, nice to have for chaining
      // @ts-ignore - Node only, harmless elsewhere
      Error.captureStackTrace?.(this, new.target);
      (this as any).cause = opts.cause;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, { code: 'VALIDATION_ERROR', status: 400 });
  }
}

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(`User does not exist: ${userId}`, {
      code: 'USER_NOT_FOUND',
      status: 404,
    });
  }
}

export class ThreadNotFoundError extends AppError {
  constructor(threadId: string) {
    super(`Thread does not exist: ${threadId}`, {
      code: 'THREAD_NOT_FOUND',
      status: 404,
    });
  }
}
