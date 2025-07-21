import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tipo-servicio',
  standalone: true,
  imports: [CommonModule],
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

  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = servicio === this.servicioSeleccionado ? null : servicio;
  }
}
