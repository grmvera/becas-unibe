import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/registro/registro.component')
        .then(m => m.RegistroComponent)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  { path: '**', redirectTo: '' },

];
