import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { auth } from '../../../../firebase';

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

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  onSubmit() {
    this.errorMessage = ''; // Limpiar errores previos

    if (this.loginForm.invalid) {
      this.errorMessage = 'Completa todos los campos correctamente.';
      return;
    }

    const { email, password } = this.loginForm.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // Redirigir después de una pequeña pausa para evitar conflictos con el guard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 0);
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
