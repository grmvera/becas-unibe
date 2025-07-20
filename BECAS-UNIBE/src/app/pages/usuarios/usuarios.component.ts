import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Usuario } from '../../shared/services/usuario.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios$: Observable<Usuario[]>;
  usuariosOriginal: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroCedula: string = '';

  constructor(
    private firestore: Firestore,
    private router: Router,
  ) {
    const usuariosRef = collection(this.firestore, 'usuarios');
    this.usuarios$ = collectionData(usuariosRef, { idField: 'uid' }) as Observable<Usuario[]>;
  }

  irACrearAdmin() {
    this.router.navigate(['/crear-admin']);
  }

  ngOnInit() {
    this.usuarios$.subscribe((usuarios) => {
      this.usuariosOriginal = usuarios;
      this.filtrarUsuarios();
    });
  }

  filtrarUsuarios() {
    const cedula = this.filtroCedula.trim().toLowerCase();
    if (cedula === '') {
      this.usuariosFiltrados = this.usuariosOriginal;
    } else {
      this.usuariosFiltrados = this.usuariosOriginal.filter(usuario =>
        usuario.cedula.toLowerCase().includes(cedula)
      );
    }
  }

  desactivarUsuario(usuario: Usuario) {
    const usuarioDocRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    updateDoc(usuarioDocRef, { activo: false })
      .then(() => console.log(`Usuario ${usuario.nombres} desactivado`))
      .catch(error => console.error('Error al desactivar usuario:', error));
  }

  activarUsuario(usuario: Usuario) {
    const usuarioDocRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    updateDoc(usuarioDocRef, { activo: true })
      .then(() => console.log(`Usuario ${usuario.nombres} activado`))
      .catch(error => console.error('Error al activar usuario:', error));
  }
}
