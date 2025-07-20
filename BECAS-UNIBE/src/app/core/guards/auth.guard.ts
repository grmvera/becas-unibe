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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {}

  private async checkAuth(): Promise<boolean | UrlTree> {
    const auth = getAuth();
    const user = auth.currentUser;

    const validate = async (user: any) => {
      const ref = doc(db, 'usuarios', user.uid);
      const docSnap = await getDoc(ref);

      if (docSnap.exists() && docSnap.data()['activo'] === true) {
        return true;
      } else {
        return this.router.parseUrl('/');
      }
    };

    if (user) {
      return await validate(user);
    }

    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          unsubscribe();
          if (user) {
            resolve(await validate(user));
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
