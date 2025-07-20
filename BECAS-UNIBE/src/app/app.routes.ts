import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/registro/registro.component')
        .then(m => m.RegistroComponent)
  },
  { path: '**', redirectTo: '' },

];
