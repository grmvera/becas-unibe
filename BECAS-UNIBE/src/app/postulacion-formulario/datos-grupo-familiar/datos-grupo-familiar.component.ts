import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-grupo-familiar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './datos-grupo-familiar.component.html',
  styleUrls: ['./datos-grupo-familiar.component.css']
})
export class DatosGrupoFamiliarComponent {
  @Input() form!: FormGroup;
  @Input() datosPersonales!: any;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() avanzarSocioeconomico = new EventEmitter<any>();


  categorias: string[] = [
    'Alimentos', 'Alquiler', 'Luz', 'Internet', 'Agua',
    'Telefono fijo', 'Medicina', 'TV cable', 'Educación', 'Transporte'
  ];

  constructor(private fb: FormBuilder) { }

  get vehiculos(): FormArray {
    return this.form.get('vehiculos') as FormArray;
  }

  agregarVehiculo() {
    this.vehiculos.push(this.crearVehiculo());
  }

  eliminarVehiculo(index: number) {
    this.vehiculos.removeAt(index);
  }

  crearVehiculo(): FormGroup {
    return this.fb.group({
      tipo: ['Automóvil'],
      marca: [''],
      modelo: [''],
      anio: ['']
    });
  }

  calcularTotal(): number {
    const gastos = this.form.get('gastos')?.value;
    return Object.values(gastos || {}).reduce((acc: number, val: any) => acc + Number(val || 0), 0);
  }

  siguiente() {
    console.log('Datos grupo familiar:', this.form.value);
    this.avanzarSocioeconomico.emit(this.form.value);
  }

  regresar() {
    this.volverAtras.emit();
  }
}
