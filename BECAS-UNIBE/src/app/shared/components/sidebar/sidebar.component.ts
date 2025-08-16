import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';
import { Usuario, UsuarioService } from '../../services/usuario.service';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, RouterModule, NgIf]
})
export class SidebarComponent implements OnInit {
  nombreUsuario: string | null = null;
  usuario: Usuario | null = null;

  semestreNumero: number | null = null;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.usuarioService.getUsuario().subscribe((usuario) => {
      this.usuario = usuario || null;
      this.nombreUsuario = usuario?.nombres || null;
      this.semestreNumero = this.parseSemestre(usuario?.semestre as any);
    });
  }

  logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
      this.usuarioService.limpiarUsuario();
      this.router.navigate(['/']);
    });
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }

  /** Click protegido para Postulación a Servicio */
  navegarPostulacion() {
    if (this.bloqueadoPorSemestre) {
      return;
    }
    this.navegar('/tipo-servicio');
  }

  /** Regla: bloqueado si tenemos semestre y es < 2 */
  get bloqueadoPorSemestre(): boolean {
    const s = this.semestreNumero;
    return s !== null && s < 2;
  }

  /** Acepta "1", "3", "1er", "2do", "5to", etc. Devuelve número o null. */
  private parseSemestre(value: any): number | null {
    if (value == null) return null;
    const m = String(value).match(/\d+/);
    if (!m) return null;
    const n = parseInt(m[0], 10);
    return Number.isFinite(n) ? n : null;
  }
}
