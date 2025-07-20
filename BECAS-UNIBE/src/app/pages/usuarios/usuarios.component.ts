import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Usuario } from '../../shared/services/usuario.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  usuarios$: Observable<Usuario[]>;

  constructor(private firestore: Firestore) {
    const usuariosRef = collection(this.firestore, 'usuarios');
    this.usuarios$ = collectionData(usuariosRef, { idField: 'uid' }) as Observable<Usuario[]>;
  }

  desactivarUsuario(usuario: Usuario) {
    const usuarioDocRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    updateDoc(usuarioDocRef, { activo: false })
      .then(() => {
        console.log(`Usuario ${usuario.nombres} desactivado`);
      })
      .catch((error) => {
        console.error('Error al desactivar usuario:', error);
      });
  }
  activarUsuario(usuario: Usuario) {
    const usuarioDocRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    updateDoc(usuarioDocRef, { activo: true })
      .then(() => {
        console.log(`Usuario ${usuario.nombres} activado`);
      })
      .catch((error) => {
        console.error('Error al activar usuario:', error);
      });
  }
}
