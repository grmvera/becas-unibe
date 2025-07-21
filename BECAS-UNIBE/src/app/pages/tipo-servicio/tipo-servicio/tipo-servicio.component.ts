import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosPersonalesComponent } from '../../../postulacion-formulario/datos-personales/datos-personales.component';
import { DatosGrupoFamiliarComponent } from '../../../postulacion-formulario/datos-grupo-familiar/datos-grupo-familiar.component';

@Component({
  selector: 'app-tipo-servicio',
  standalone: true,
  imports: [CommonModule, DatosPersonalesComponent, DatosGrupoFamiliarComponent],
  templateUrl: './tipo-servicio.component.html',
  styleUrls: ['./tipo-servicio.component.css']
})
export class TipoServicioComponent {
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
  etapaFormulario = 1; // 1 = personales, 2 = grupo familiar
  datosPersonales: any = null;

  avanzarGrupoFamiliar(datos: any) {
    this.datosPersonales = datos;
    this.etapaFormulario = 2; // Aquí haces el cambio a la siguiente etapa
    console.log('Datos personales recibidos:', datos);
  }


  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = this.servicioSeleccionado === servicio ? null : servicio;
    this.becaSeleccionada = null; // Resetea si cambia de servicio
  }

  seleccionarBeca(beca: string) {
    this.becaSeleccionada = beca;
  }
}

