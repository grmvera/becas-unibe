import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dato-salud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dato-salud.component.html',
  styleUrls: ['./dato-salud.component.css']
})
export class DatoSaludComponent {
  @Input() form!: FormGroup;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<any>();

  opcionesProblemas = ['Ninguna', 'Enfermedad crónica', 'Discapacidad', 'Otro'];
  opcionesAyuda = ['Sí', 'No'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      salud: this.fb.array([
        this.fb.group({
          parentesco: ['Postulante'],
          problema: ['Ninguna'],
          ayuda: ['Sí']
        })
      ]),
      situaciones: this.fb.group({
        universidadPrivada: [false],
        fallecimientoPadres: [false],
        otrasDificultades: [false]
      })
    });
  }

  get salud(): FormArray {
    return this.form.get('salud') as FormArray;
  }

  agregarIntegrante() {
    this.salud.push(this.fb.group({
      parentesco: [''],
      problema: ['Ninguna'],
      ayuda: ['No']
    }));
  }

  eliminarIntegrante(index: number) {
    this.salud.removeAt(index);
  }

  emitirVolverAtras() {
    console.log('Volver a etapa anterior');
    this.volverAtras.emit();
  }

  emitirFinalizar() {
    console.log('Datos de salud:', this.form.value);
    this.finalizar.emit(this.form.value);
  }
}
