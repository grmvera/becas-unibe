import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Promise<boolean | UrlTree> {
    const auth = getAuth();
    const user = auth.currentUser;


    if (user) {
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();

        if (user) {
          resolve(true);
        } else {
          resolve(this.router.parseUrl('/registro'));
        }
      }, (error) => {
        console.error('Error al verificar autenticación:', error);
        resolve(this.router.parseUrl('/'));
      });
    });
  }
}
