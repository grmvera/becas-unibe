import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { SolicitudDetailDialogComponent } from './solicitud-detail-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-lista-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-solicitud.component.html',
  styleUrls: ['./lista-solicitud.component.css']
})
export class ListaSolicitudComponent implements OnInit {
  private dialog = inject(MatDialog);
  postulaciones$: Observable<any[]> | undefined;
  busquedaCedula: string = '';
  busquedaPeriodo: string = '';
  periodos: { id: string; nombrePeriodo: string }[] = [];

  postulacionesData: any[] = [];

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    // carga de periodos
    const periodosRef = collection(this.firestore, 'periodos');
    collectionData(periodosRef, { idField: 'id' })
      .pipe(
        tap((lista: any[]) => {
          this.periodos = lista.map(p => ({
            id: p.id,
            nombrePeriodo: p.nombrePeriodo
          }));
        })
      )
      .subscribe();

    // carga de periodos y usuarios
    const colRef = collection(this.firestore, 'postulaciones');

    this.postulaciones$ = collectionData(colRef, { idField: 'id' }).pipe(
      switchMap((postulaciones: any[]) => {
        const solicitudesConUsuario = postulaciones.map(async (p) => {
          // datos del usuario
          const uid = p.datosPersonales?.uid;
          const userRef = doc(this.firestore, `usuarios/${uid}`);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          const id = p.uid;
          const userGuarderiaRef = doc(this.firestore, `usuarios/${id}`);
          const userGuarderiaSnap = await getDoc(userGuarderiaRef);
          const userGuarderiaData = userGuarderiaSnap.exists() ? userGuarderiaSnap.data() : {};
          // periodo
          const periodoId = p.periodoId;
          const periodoRef = doc(this.firestore, `periodos/${periodoId}`);
          const periodoSnap = await getDoc(periodoRef);
          const periodoData = periodoSnap.exists() ? periodoSnap.data() : {};

          return {
            id: p.id,
            cedulaUsuario: userData['cedula'] || userGuarderiaData['cedula'] || 'Cédula no encontrada',
            nombreUsuario: userData['nombres' ] + ' ' + userData['apellidos'] || 'Nombre no encontrado',
            correoUsuario: userData['correo'] || 'Correo no encontrado',
            descipcion: p.datosSalud?.justificacion || 'No posee justificación encontrado',
            archivosConadis: p.anexoCarnet?.urlConadis || 'No posee archivos',
            archivosRequisitos: p.anexoCarnet?.urlRequisitos || 'No posee archivos',
            archivosguarderia: p.anexoGuarderiaUrl || 'No posee archivos',
            periodo: periodoData['nombrePeriodo'] || 'Periodo no encontrado',
            tipoBeca: p.datosPersonales?.tipoBeca || 'Tipo de beca no especificado',
            tipoServicio: p.datosPersonales?.tipoServicio || p.tipoServicio ||'tipo de servicio no especificado',
            fechaSolicitud: this.formatearFecha(p.fechaEnvio),
            estadoAprobacion: p.estadoAprobacion,
          };
        });

        return forkJoin(solicitudesConUsuario);
      })
    );

    this.postulaciones$.subscribe((data) => {
      this.postulacionesData = data;
    });
  }

  filtradasPorCedula(lista: any[]) {
    return lista.filter(p =>
      p.cedulaUsuario?.toLowerCase().includes(this.busquedaCedula.toLowerCase())
    );
  }

  filtrarPorPeriodo(lista: any[]) {
    return lista.filter(p => p.periodo?.toLowerCase().includes(this.busquedaPeriodo.toLowerCase()));
  }

  get postulacionesFiltradas() {
    return this.postulacionesData
      .filter(p =>
        p.cedulaUsuario.toLowerCase().includes(this.busquedaCedula.toLowerCase())
      )
      .filter(p =>
        this.busquedaPeriodo === '' || this.busquedaPeriodo === 'Todos'
          ? true
          : p.periodo.toLowerCase() === this.busquedaPeriodo.toLowerCase()
      );
  }

  formatearFecha(fechaFirebase: any): string {
    if (!fechaFirebase || !fechaFirebase.seconds) return 'Fecha no válida';

    const date = new Date(fechaFirebase.seconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  }

  openDialog(solicitud: any) {
    this.dialog.open(SolicitudDetailDialogComponent, {
      width: '400px',
      data: solicitud
    });
  }

}
