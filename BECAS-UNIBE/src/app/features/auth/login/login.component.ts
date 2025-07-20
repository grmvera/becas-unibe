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
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
        .catch(error => {
          this.errorMessage = 'Credenciales inválidas o usuario no existe.';
          console.error(error);
        });
    }
  }
}
