import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, addDoc, collection, collectionData, query, where } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-periodos',
  templateUrl: './periodos.component.html',
  styleUrls: ['./periodos.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class PeriodosComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombrePeriodo: ['', Validators.required],
      inicioPostulacion: ['', Validators.required],
      finPostulacion: ['', Validators.required],
      inicioApelacion: ['', Validators.required],
      finApelacion: ['', Validators.required],
      socializacion: ['', Validators.required],
      reunionInformativa: ['', Validators.required],
      reunionComite: ['', Validators.required],
      resultadoBeca: ['', Validators.required],
      inicioEntregaDocs: ['', Validators.required],
      finEntregaDocs: ['', Validators.required]
    });
  }

  async guardar() {
    if (this.form.invalid) return;

    try {
      const periodosRef = collection(this.firestore, 'periodos');
      const q = query(periodosRef, where('estado', '==', true));
      const periodosActivos = await firstValueFrom(collectionData(q));

      if (periodosActivos.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Ya existe un periodo activo',
          text: 'Debes desactivarlo antes de crear uno nuevo.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      const data = {
        ...this.form.value,
        estado: true
      };

      await addDoc(periodosRef, data);

      Swal.fire({
        icon: 'success',
        title: 'Periodo guardado correctamente',
        showConfirmButton: false,
        timer: 1800
      });

      this.form.reset();
      this.router.navigate(['/lista-periodos']);

    } catch (e) {
      console.error('Error al guardar el periodo', e);
      Swal.fire({
        icon: 'error',
        title: 'Ocurrió un error',
        text: 'No se pudo guardar el periodo. Intenta nuevamente.',
        confirmButtonColor: '#d33'
      });
    }
  }

  camposFechas = [
    'inicioPostulacion',
    'finPostulacion',
    'inicioApelacion',
    'finApelacion',
    'socializacion',
    'reunionInformativa',
    'reunionComite',
    'resultadoBeca',
    'inicioEntregaDocs',
    'finEntregaDocs'
  ];

  etiquetas: { [key: string]: string } = {
    inicioPostulacion: 'Fecha de inicio de postulaciones',
    finPostulacion: 'Fecha de fin de postulaciones',
    inicioApelacion: 'Fecha de inicio de apelaciones',
    finApelacion: 'Fecha de fin de apelaciones',
    socializacion: 'Fecha de socialización de resultados',
    reunionInformativa: 'Fecha de reunión informativa',
    reunionComite: 'Fecha de reunión comité',
    resultadoBeca: 'Fecha de resultado de becas',
    inicioEntregaDocs: 'Fecha de inicio de entrega de documentos',
    finEntregaDocs: 'Fecha de fin de entrega de documentos'
  };
}
