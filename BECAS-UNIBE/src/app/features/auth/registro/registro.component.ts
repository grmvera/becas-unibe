import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  doc, setDoc, collection, query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { auth, db } from '../../../../firebase';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnDestroy {
  errorMessage = '';
  submitted = false;
  registroForm: FormGroup;

  // Carreras desde Firebase
  carreras: string[] = [];
  cargandoCarreras = true;
  private carrerasUnsub?: Unsubscribe;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registroForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      cedula: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      fechaNacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      telefonoFijo: [''],
      telefonoMovil: ['', [Validators.required]],
      anioIngreso: ['', Validators.required],
      carrera: ['', Validators.required],
      semestre: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // ✅ Leer carreras activas (sin índice compuesto)
    const colRef = collection(db, 'carreras');
    const q = query(colRef, where('estado', '==', true)); // sin orderBy

    this.carrerasUnsub = onSnapshot(q, (snap) => {
      this.carreras = snap.docs
        .map(d => (d.data() as any).nombre as string)
        .sort((a, b) => a.localeCompare(b)); // ordenamos en cliente
      this.cargandoCarreras = false;
    }, (err) => {
      console.error('Error cargando carreras:', err);
      this.cargandoCarreras = false;
    });
  }

  ngOnDestroy(): void {
    this.carrerasUnsub?.();
  }

  get f() { return this.registroForm.controls; }

  irALogin() { this.router.navigate(['']); }

  // Sanitiza la cédula
  onCedulaInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const soloDigitos = el.value.replace(/\D+/g, '').slice(0, 10);
    if (el.value !== soloDigitos) el.value = soloDigitos;
    this.f['cedula'].setValue(soloDigitos, { emitEvent: false });
    this.f['cedula'].markAsDirty();
    this.f['cedula'].markAsTouched();
  }

  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registroForm.invalid) {
      this.errorMessage = 'Falta completar campos obligatorios o hay datos con formato inválido.';
      return;
    }

    const { correo, password, ...userData } = this.registroForm.value;

    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, 'usuarios', uid), {
        uid,
        correo,
        ...userData,
        activo: true,
        rol: 'student'
      });

      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Firebase error:', error);
      this.errorMessage = this.getFirebaseError(error.code);
    }
  }

  private getFirebaseError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'El correo ya está en uso.';
      case 'auth/weak-password': return 'La contraseña es demasiado débil.';
      case 'auth/invalid-email': return 'El correo no es válido.';
      default: return 'Error al crear el usuario.';
    }
  }
}
