import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { apiErrorMessage } from '../core/services/api-error';

/** Busy/message state for one form or button: `run(request, 'Saved.')`. */
export class ActionState {
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly ok = signal(true);

  run<T>(request: Observable<T>, success: string | ((value: T) => string | null), onSuccess?: (value: T) => void): void {
    this.busy.set(true);
    this.message.set(null);
    request.subscribe({
      next: value => {
        this.busy.set(false);
        this.ok.set(true);
        this.message.set(typeof success === 'function' ? success(value) : success);
        onSuccess?.(value);
      },
      error: err => {
        this.busy.set(false);
        this.ok.set(false);
        this.message.set(apiErrorMessage(err));
      },
    });
  }
}

/** Loads one value into signals: `loader.load(api.get())`. */
export class Loader<T> {
  readonly value = signal<T | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** HTTP status of the last failure (404 = "not created yet"). */
  readonly status = signal<number | null>(null);

  load(request: Observable<T>): void {
    this.loading.set(true);
    this.error.set(null);
    this.status.set(null);
    request.subscribe({
      next: value => {
        this.value.set(value);
        this.loading.set(false);
      },
      error: err => {
        this.value.set(null);
        this.loading.set(false);
        this.status.set((err as { status?: number })?.status ?? null);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
