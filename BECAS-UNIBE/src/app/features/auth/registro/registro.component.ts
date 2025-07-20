import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { auth, db } from '../../../../firebase';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  irALogin() {
    this.router.navigate(['']);
  }

  errorMessage = '';
  registroForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registroForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      cedula: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      telefonoFijo: [''],
      telefonoMovil: ['', Validators.required],
      anioIngreso: ['', Validators.required],
      carrera: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registroForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    const { correo, password, ...userData } = this.registroForm.value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'usuarios', uid), {
        uid,
        correo,
        ...userData,
        activo: true
      });

      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Firebase error:', error);
      this.errorMessage = this.getFirebaseError(error.code);
    }
  }

  private getFirebaseError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo ya está en uso.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil.';
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      default:
        return 'Error al crear el usuario.';
    }
  }
}
