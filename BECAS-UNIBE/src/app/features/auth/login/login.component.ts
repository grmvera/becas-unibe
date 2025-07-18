import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../../environments/environments';
import { CommonModule } from '@angular/common';


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

    initializeApp(environment.firebase);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const auth = getAuth();
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
