import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatosGrupoFamiliarComponent } from '../../../postulacion-formulario/datos-grupo-familiar/datos-grupo-familiar.component';
import { DatosPersonalesComponent } from '../../../postulacion-formulario/datos-personales/datos-personales.component';
import { DatosSocioeconomicoComponent } from '../../../postulacion-formulario/dato-socioeconomicos/dato-socioeconomicos.component';
import { DatoSaludComponent } from '../../../postulacion-formulario/dato-salud/dato-salud.component';

@Component({
  selector: 'app-tipo-servicio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatosPersonalesComponent,
    DatosGrupoFamiliarComponent,
    DatosSocioeconomicoComponent,
    DatoSaludComponent
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
  socioeconomicoForm: FormGroup;
  datosSaludForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.datosPersonalesForm = this.fb.group({
      tipoServicio: [''],
      tipoBeca: [''],
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
      vehiculos: this.fb.array([
        this.fb.group({
          tipo: ['Automóvil'],
          marca: [''],
          modelo: [''],
          anio: ['']
        })
      ])
    });

    this.socioeconomicoForm = this.fb.group({
      integrantes: this.fb.array([
        this.fb.group({
          parentesco: ['Postulante'],
          nombre: [''],
          apellido: [''],
          actividad: [''],
          ingresos: [0],
          ingresosComplementarios: [0]
        })
      ])
    });

    this.datosSaludForm = this.fb.group({
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

  avanzarDatosSocioeconomico(datos: any) {
    this.grupoFamiliarForm.patchValue(datos);
    this.etapaFormulario = 3;
    console.log('Grupo familiar recibido:', datos);
  }

  avanzarDatosSalud(datos: any) {
    this.datosSaludForm.patchValue(datos);
    this.etapaFormulario = 4;
    console.log('Datos de salud recibidos:', datos);
  }



  enviarFormularioFinal(datos: any) {
    this.socioeconomicoForm.patchValue(datos);
    console.log('Formulario completo:', {
      datosPersonales: this.datosPersonalesForm.value,
      grupoFamiliar: this.grupoFamiliarForm.value,
      datosSocioeconomicos: this.socioeconomicoForm.value,
      datosSalud: this.datosSaludForm.value
    });

  }

  regresarADatosPersonales() {
    this.etapaFormulario = 1;
  }
}
