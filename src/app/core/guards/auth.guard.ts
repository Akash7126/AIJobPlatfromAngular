import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ActorType } from '../models/api.models';
import { AuthService } from '../services/auth.service';

/** Requires a signed-in user; `data.actorType` optionally restricts the route to one actor (JobSeeker / Employer). */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  const required = route.data['actorType'] as ActorType | undefined;
  if (required && auth.actorType() !== required) {
    return router.createUrlTree(['/']);
  }
  return true;
};
