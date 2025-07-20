import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {}

  private checkAuth(): Promise<boolean | UrlTree> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve(true);
          } else {
            resolve(this.router.parseUrl('/registro'));
          }
        },
        (error) => {
          console.error('Error al verificar autenticación:', error);
          resolve(this.router.parseUrl('/'));
        }
      );
    });
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    return this.checkAuth();
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    return this.checkAuth();
  }
}
