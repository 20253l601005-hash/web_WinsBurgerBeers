import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreApiService } from '../services/store-api';

export const authGuard: CanActivateFn = () => {
  const storeApi = inject(StoreApiService);
  const router = inject(Router);

  if (storeApi.estaAutenticado()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};