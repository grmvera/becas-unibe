import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getAuth, signOut } from 'firebase/auth';
import { Usuario, UsuarioService } from '../../services/usuario.service';


@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  nombreUsuario: string | null = null;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.usuarioService.getUsuario().subscribe((usuario: Usuario | null) => {
      this.nombreUsuario = usuario?.nombres || null;
    });
  }

  logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
      this.router.navigate(['/']);
    });
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }
}
