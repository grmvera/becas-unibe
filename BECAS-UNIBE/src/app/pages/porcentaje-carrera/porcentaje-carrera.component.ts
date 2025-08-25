import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CrearCarreraDialogComponent, CrearCarreraResultado } from './crear-carrera-dialog.component';

@Component({
  selector: 'app-porcentaje-carrera',
  templateUrl: './porcentaje-carrera.component.html',
  styleUrls: ['./porcentaje-carrera.component.css']
})
export class PorcentajeCarreraComponent {

  constructor(private dialog: MatDialog) { }

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
}
