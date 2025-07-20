import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { auth, db } from '../../../firebase';

@Component({
  selector: 'app-crear-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './crear-admin.component.html',
  styleUrls: ['./crear-admin.component.css']
})
export class CrearAdminComponent {
  adminForm: FormGroup;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.adminForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      cedula: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.adminForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }

    const { correo, password, ...datosAdmin } = this.adminForm.value;

    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, 'usuarios', uid), {
        uid,
        correo,
        ...datosAdmin,
        activo: true,
        rol: 'admin'
      });

      this.router.navigate(['/usuarios']);
    } catch (error: any) {
      console.error('Error al crear administrador:', error);
      this.errorMessage = this.getFirebaseError(error.code);
    }
  }

  private getFirebaseError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo ya está en uso.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil.';
      case 'auth/invalid-email':
        return 'Correo no válido.';
      default:
        return 'Ocurrió un error al crear el administrador.';
    }
  }
}
