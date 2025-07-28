import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dato-discapacidad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dato-discapacidad.component.html',
  styleUrls: ['./dato-discapacidad.component.css']
})
export class DatoDiscapacidadComponent {
  @Input() form!: FormGroup;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() avanzarAnexoCarnet = new EventEmitter<any>();

  emitirVolverAtras() {
    this.volverAtras.emit();
  }

  emitirFinalizar() {
    console.log('Datos de Discapacidad:', this.form.value);
    this.avanzarAnexoCarnet.emit(this.form.value);
  }
}
