import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CrearCarreraDialogComponent, CrearCarreraResultado } from './crear-carrera-dialog.component';
import { AsignarPorcentajeDialogComponent, AsignarPorcentajeResultado } from './asignar-porcentaje-dialog.component';

@Component({
  selector: 'app-porcentaje-carrera',
  templateUrl: './porcentaje-carrera.component.html',
  styleUrls: ['./porcentaje-carrera.component.css']
})
export class PorcentajeCarreraComponent {
  constructor(private dialog: MatDialog) {}

  abrirCrearCarrera() {
    const ref = this.dialog.open(CrearCarreraDialogComponent, {
      width: 'auto',
      maxWidth: '100%',
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe((resultado?: CrearCarreraResultado) => {
      if (!resultado) return;
      console.log('Nueva carrera creada:', resultado);
    });
  }

  abrirAsignarPorcentaje() {
    const ref = this.dialog.open(AsignarPorcentajeDialogComponent, {
      width: '520px',
      maxWidth: '96vw',
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe((resultado?: AsignarPorcentajeResultado) => {
      if (!resultado) return;
      console.log('Porcentaje asignado:', resultado);
    });
  }
}
