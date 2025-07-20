import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  uid: string;
  nombres: string;
  cedula: string;
  apellidos: string;
  correo: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private usuarioSubject: BehaviorSubject<Usuario | null> = new BehaviorSubject<Usuario | null>(null);

  constructor() {
    // VERIFICA SI ESTAMOS EN UN NAVEGADOR
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('usuario');
      if (data) {
        try {
          this.usuarioSubject.next(JSON.parse(data));
        } catch (e) {
          console.error('Error al parsear usuario localStorage', e);
          localStorage.removeItem('usuario');
        }
      }
    }
  }

  setUsuario(usuario: Usuario) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
    this.usuarioSubject.next(usuario);
  }

  getUsuario(): Observable<Usuario | null> {
    return this.usuarioSubject.asObservable();
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  limpiarUsuario() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('usuario');
    }
    this.usuarioSubject.next(null);
  }
}
