import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, getFirestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router) {}

  private checkAuthAndRole(route?: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();

        if (!user) {
          return resolve(this.router.parseUrl('/'));
        }

        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return resolve(this.router.parseUrl('/'));

        const userData = userSnap.data();
        const activo = userData['activo'] ?? true;
        const rol = userData['rol'] ?? 'user';

        if (!activo) return resolve(this.router.parseUrl('/'));

        const requiredRoles = route?.data?.['roles'] as string[] | undefined;

        if (!requiredRoles || requiredRoles.includes(rol)) {
          return resolve(true);
        } else {
          return resolve(this.router.parseUrl('/dashboard'));
        }
      }, () => resolve(this.router.parseUrl('/')));
    });
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    return this.checkAuthAndRole(route);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    return this.checkAuthAndRole(childRoute);
  }
}
