import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosPersonalesComponent } from '../../../postulacion-formulario/datos-personales/datos-personales.component';

@Component({
  selector: 'app-tipo-servicio',
  standalone: true,
  imports: [CommonModule, DatosPersonalesComponent],
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

  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = this.servicioSeleccionado === servicio ? null : servicio;
    this.becaSeleccionada = null; // Resetea si cambia de servicio
  }

  seleccionarBeca(beca: string) {
    this.becaSeleccionada = beca;
  }
}

