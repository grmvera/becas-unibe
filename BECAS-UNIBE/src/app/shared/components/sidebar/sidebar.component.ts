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

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.usuarioService.getUsuario().subscribe((usuario) => {
      this.usuario = usuario;
      this.nombreUsuario = usuario?.nombres || null;
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
}
