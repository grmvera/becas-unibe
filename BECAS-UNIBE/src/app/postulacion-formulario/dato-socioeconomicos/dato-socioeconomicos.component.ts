import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-socioeconomico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dato-socioeconomicos.component.html',
  styleUrls: ['./dato-socioeconomicos.component.css']
})
export class DatosSocioeconomicoComponent {
  @Input() form!: FormGroup;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() pasoCompletado = new EventEmitter<void>();

  // Lista de parentescos para el select
  parentescos: string[] = [
    'Postulante', 'Padre', 'Madre', 'Hermano/a', 'Tío/a', 'Otro'
  ];

  // Lista de actividades para el select
  actividades: string[] = [
    'Empleo público', 'Empleo privado', 'Negocio propio', 'Trabajo informal', 'No trabaja', 'Estudiante'
  ];

  constructor(private fb: FormBuilder) {}

  get integrantes(): FormArray {
    return this.form.get('integrantes') as FormArray;
  }

  agregarIntegrante() {
    this.integrantes.push(this.fb.group({
      parentesco: [''],
      nombre: [''],
      apellido: [''],
      actividad: [''],
      ingresos: [0],
      ingresosComplementarios: [0]
    }));
  }

  eliminarIntegrante(index: number) {
    this.integrantes.removeAt(index);
  }

  calcularTotalFamiliar(): number {
    return this.integrantes.controls.reduce((acc, ctrl) => {
      const ingresos = ctrl.get('ingresos')?.value || 0;
      const extra = ctrl.get('ingresosComplementarios')?.value || 0;
      return acc + Number(ingresos) + Number(extra);
    }, 0);
  }

  siguiente() {
    console.log('Datos socioeconómicos:', this.form.value);
    this.pasoCompletado.emit();
  }

  regresar() {
    this.volverAtras.emit();
  }
}
