import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatosGrupoFamiliarComponent } from '../../../postulacion-formulario/datos-grupo-familiar/datos-grupo-familiar.component';
import { DatosPersonalesComponent } from '../../../postulacion-formulario/datos-personales/datos-personales.component';

@Component({
  selector: 'app-tipo-servicio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatosPersonalesComponent,
    DatosGrupoFamiliarComponent,
  ],
  templateUrl: './tipo-servicio.component.html',
  styleUrls: ['./tipo-servicio.component.css']
})
export class TipoServicioComponent {
  categorias: string[] = [
    'Alimentos', 'Alquiler', 'Luz', 'Internet', 'Agua',
    'Telefono fijo', 'Medicina', 'TV cable', 'Educación', 'Transporte'
  ];

  tiposServicios = ['TIPOS DE BECAS', 'AYUDAS ECONÓMICAS', 'GUARDERÍA'];
  becas = [
    'Beca por Excelencia Académica',
    'Beca para Deportistas destacados',
    'Beca Socioeconómica',
    'Beca por Actividades Culturales',
    'Beca por Desarrollo Profesional',
    'Beca Honorífica',
    'Beca SNNA',
    'Beca víctimas violencia de género',
    'Beca Discapacidad'
  ];

  servicioSeleccionado: string | null = null;
  becaSeleccionada: string | null = null;
  etapaFormulario = 1;

  datosPersonalesForm: FormGroup;
  grupoFamiliarForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.datosPersonalesForm = this.fb.group({
      tipoServicio: [''],        // <- nuevo campo
      tipoBeca: [''],            // <- nuevo campo
      imagen: [null],
      independiente: [null],
      empleo: [''],
      viveSolo: [null],
      semestre: [''],
      direccion: this.fb.group({
        calle: [''],
        numero: [''],
        barrio: [''],
        departamento: [''],
        piso: [''],
        sector: ['']
      })
    });

    this.grupoFamiliarForm = this.fb.group({
      tipoVivienda: [''],
      gastos: this.fb.group(
        Object.fromEntries(this.categorias.map(c => [c, [0]]))
      ),
      nota: [''],
      vehiculos: this.fb.array([this.fb.group({
        tipo: ['Automóvil'],
        marca: [''],
        modelo: [''],
        anio: ['']
      })])
    });
  }

  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = this.servicioSeleccionado === servicio ? null : servicio;
    this.becaSeleccionada = null;
    this.datosPersonalesForm.get('tipoServicio')?.setValue(this.servicioSeleccionado);
  }

  seleccionarBeca(beca: string) {
    this.becaSeleccionada = beca;
    this.datosPersonalesForm.get('tipoBeca')?.setValue(this.becaSeleccionada);
  }

  avanzarGrupoFamiliar(datos: any) {
    this.datosPersonalesForm.patchValue(datos);
    this.etapaFormulario = 2;
    console.log('Datos personales recibidos:', datos);
  }

  regresarADatosPersonales() {
    this.etapaFormulario = 1;
  }
}
