import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { auth, db } from '../../../../firebase';
import { getDoc, doc } from 'firebase/firestore';
import { UsuarioService, Usuario } from '../../../shared/services/usuario.service';


@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Completa todos los campos correctamente.';
      return;
    }

    const { email, password } = this.loginForm.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(async (cred) => {
        const uid = cred.user.uid;

        const docRef = doc(db, 'usuarios', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const usuario: Usuario = {
            uid,
            nombres: data['nombres'],
            correo: data['correo']
          };


          this.usuarioService.setUsuario(usuario);
          this.router.navigate(['dashboard']);
        } else {
          this.errorMessage = 'No se encontraron datos del usuario.';
        }
      })
      .catch(error => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          this.errorMessage = 'Credenciales inválidas o usuario no existe.';
        } else {
          this.errorMessage = 'Ocurrió un error al iniciar sesión. Inténtalo más tarde.';
        }
        console.error('Login error:', error);
      });
  }
}
