import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';

@Component({
  standalone: true,
  selector: 'app-periodos',
  templateUrl: './periodos.component.html',
  styleUrls: ['./periodos.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class PeriodosComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore
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
      const data = {
        ...this.form.value,
        estado: true // Se agrega el estado por defecto
      };
      await addDoc(collection(this.firestore, 'periodos'), data);
      alert('Periodo guardado correctamente');
      this.form.reset();
    } catch (e) {
      console.error('Error al guardar el periodo', e);
      alert('Error al guardar');
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
