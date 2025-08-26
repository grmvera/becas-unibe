import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc
} from '@angular/fire/firestore';

import { CrearCarreraDialogComponent, CrearCarreraResultado } from './crear-carrera-dialog.component';
import { AsignarPorcentajeDialogComponent, AsignarPorcentajeResultado } from './asignar-porcentaje-dialog.component';

export interface CarreraRow {
  id: string;                // doc id
  carreraId: string;         // también viene en el doc
  carreraNombre: string;
  estado: boolean;
  porcentaje?: number;
  createdAt?: number;
  updatedAt?: number;

  // Auxiliar de UI
  __updating?: boolean;
}

@Component({
  selector: 'app-porcentaje-carrera',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Angular Material
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule
  ],
  templateUrl: './porcentaje-carrera.component.html',
  styleUrls: ['./porcentaje-carrera.component.css']
})
export class PorcentajeCarreraComponent implements AfterViewInit {
  displayedColumns = ['carreraNombre', 'porcentaje', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<CarreraRow>([]);
  filtroNombre = new FormControl<string>('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private firestore: Firestore,
    private snack: MatSnackBar
  ) {
    // Cargar datos
    const ref = collection(this.firestore, 'porcentajes_carrera');
    const q = query(ref, orderBy('carreraNombre'));
    collectionData(q, { idField: 'id' }).subscribe((rows: any[]) => {
      this.dataSource.data = rows as CarreraRow[];
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });

    // Filtro por nombre (case-insensitive)
    this.dataSource.filterPredicate = (data: CarreraRow, filter: string) =>
      (data.carreraNombre || '').toLowerCase().includes(filter.trim().toLowerCase());

    this.filtroNombre.valueChanges.subscribe(v => {
      this.dataSource.filter = (v || '').trim().toLowerCase();
      if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  abrirCrearCarrera() {
    const ref = this.dialog.open(CrearCarreraDialogComponent, {
      width: 'auto',
      maxWidth: '100%',
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe((resultado?: CrearCarreraResultado) => {
      if (!resultado) return;
      this.snack.open('Carrera creada', 'OK', { duration: 2500 });
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
      this.snack.open('Porcentaje asignado', 'OK', { duration: 2500 });
    });
  }

  async toggleEstado(row: CarreraRow, nuevoEstado: boolean) {
    // Optimistic UI
    const anterior = row.estado;
    row.estado = nuevoEstado;
    row.__updating = true;

    try {
      await updateDoc(doc(this.firestore, 'porcentajes_carrera', row.id), {
        estado: nuevoEstado,
        updatedAt: Date.now()
      });
      this.snack.open(`Estado actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'OK', { duration: 2000 });
    } catch (e) {
      console.error(e);
      // revertir
      row.estado = anterior;
      this.snack.open('No se pudo actualizar el estado', 'Cerrar', { duration: 3500 });
    } finally {
      row.__updating = false;
    }
  }

  async eliminar(row: CarreraRow) {
    const ok = window.confirm(`¿Eliminar "${row.carreraNombre}"?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(this.firestore, 'porcentajes_carrera', row.id));
      this.snack.open('Registro eliminado', 'OK', { duration: 2500 });
    } catch (e) {
      console.error(e);
      this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3500 });
    }
  }
}
