import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const ANONYMOUS_AUTH_ROUTES = ['/auth/login', '/auth/refresh'];

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/** Adds the bearer token and, on a 401, refreshes the session once and retries the request. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (ANONYMOUS_AUTH_ROUTES.some(route => req.url.endsWith(route))) {
    return next(req);
  }

  return next(withToken(req, auth.accessToken)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !auth.accessToken) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError(() => [null]),
        switchMap(token => {
          if (!token) {
            auth.clearSession();
            return throwError(() => error);
          }
          return next(withToken(req, token));
        }),
      );
    }),
  );
};
