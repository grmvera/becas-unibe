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
  @Input() datosPersonales!: any;
  @Output() volverAtras = new EventEmitter<void>();
  grupoFamiliarForm: FormGroup;

  categorias = [
    'Alimentos', 'Alquiler', 'Luz', 'Internet', 'Agua',
    'Telefono fijo', 'Medicina', 'TV cable', 'Educación', 'Transporte'
  ];

  constructor(private fb: FormBuilder) {
    this.grupoFamiliarForm = this.fb.group({
      tipoVivienda: [''],
      gastos: this.fb.group(
        Object.fromEntries(this.categorias.map(c => [c, [0]]))
      ),
      nota: [''],
      vehiculos: this.fb.array([
        this.crearVehiculo()
      ])
    });
  }

  get vehiculos(): FormArray {
    return this.grupoFamiliarForm.get('vehiculos') as FormArray;
  }

  crearVehiculo(): FormGroup {
    return this.fb.group({
      tipo: ['Automóvil'],
      marca: [''],
      modelo: [''],
      anio: ['']
    });
  }

  agregarVehiculo() {
    this.vehiculos.push(this.crearVehiculo());
  }

  eliminarVehiculo(index: number) {
    this.vehiculos.removeAt(index);
  }

  calcularTotal(): number {
    const gastos = this.grupoFamiliarForm.get('gastos')?.value;
    return Object.values(gastos).reduce((acc: number, val: any) => acc + Number(val || 0), 0);
  }

  siguiente() {
    console.log(this.grupoFamiliarForm.value);
  }

  regresar() {
    this.volverAtras.emit(); // Emitimos el evento para retroceder
  }
}
