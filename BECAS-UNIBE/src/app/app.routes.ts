import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'tipo-servicio',
        loadComponent: () =>
          import('./pages/tipo-servicio/tipo-servicio/tipo-servicio.component').then(
            (m) => m.TipoServicioComponent
          ),
        data: { roles: ['student'] }
      },
      {
        path: 'revision-solicitud',
        loadComponent: () =>
          import('./pages/revision-solicitud/revision-solicitud.component').then(
            (m) => m.RevisionSolicitudComponent
          ),
        data: { roles: ['student'] }
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/usuarios/usuarios.component').then(
            (m) => m.UsuariosComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'crear-admin',
        loadComponent: () =>
          import('./pages/adm-usuarios/crear-admin.component').then(
            (m) => m.CrearAdminComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'periodos',
        loadComponent: () =>
          import('./pages/gestion-periodos/periodos.component').then(
            (m) => m.PeriodosComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'lista-periodos',
        loadComponent: () =>
          import('./pages/lista-periodos/lista-periodos.component').then(
            (m) => m.ListaPeriodosComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'info-publica',
        loadComponent: () =>
          import('./pages/info-publica/info-publica.component').then(
            (m) => m.InfoPublicaComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'list-solicitudes',
        loadComponent: () =>
          import('./pages/lista-solicitud/lista-solicitud.component').then(
            (m) => m.ListaSolicitudComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'reporte',
        loadComponent: () =>
          import('./pages/reporte/reporte.component').then(
            (m) => m.ReporteComponent
          ),
        data: { roles: ['admin'] }
      },
      {
        path: 'requisitos-anexo',
        loadComponent: () =>
          import('./pages/requisitos-anexo/requisitos-anexo.component').then(
            (m) => m.RequisitosAnexoComponent
          ),
        data: { roles: ['admin'] }
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
