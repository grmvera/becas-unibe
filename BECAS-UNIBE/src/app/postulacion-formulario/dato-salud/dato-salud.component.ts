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
  @Output() avanzarAnexoCarnet = new EventEmitter<any>();
  @Output() volverAtras = new EventEmitter<void>();

  opcionesProblemas = ['Ninguna', 'Enfermedad crónica', 'Discapacidad', 'Otro'];
  opcionesAyuda = ['Sí', 'No'];

  constructor(private fb: FormBuilder) {}

  get salud(): FormArray {
    return this.form.get('salud') as FormArray;
  }

  get situacionesForm(): FormGroup | null {
    const grupo = this.form.get('situaciones');
    return grupo instanceof FormGroup ? grupo : null;
  }

  agregarIntegrante() {
    this.salud.push(
      this.fb.group({
        parentesco: [''],
        problema: ['Ninguna'],
        ayuda: ['No']
      })
    );
  }

  eliminarIntegrante(index: number) {
    this.salud.removeAt(index);
  }

  emitirVolverAtras() {
    this.volverAtras.emit();
  }

  emitirFinalizar() {
    // Emite SOLO si el form es válido (marca todo si no lo es)
    if (this.form?.valid) {
      const payload = this.form.getRawValue();
      console.log('Datos de salud:', payload);
      this.avanzarAnexoCarnet.emit(payload);
    } else {
      this.form?.markAllAsTouched();
    }
  }
}
