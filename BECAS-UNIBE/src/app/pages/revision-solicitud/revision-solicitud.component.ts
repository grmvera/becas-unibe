import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Observable, switchMap, forkJoin, of } from 'rxjs';
import { SolicitudRevicionDetailDialogComponent } from './solicitud-revicion-detail-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-revision-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revision-solicitud.component.html',
  styleUrls: ['./revision-solicitud.component.css']
})
export class RevisionSolicitudComponent implements OnInit {
  private dialog = inject(MatDialog);
  postulaciones$: Observable<any[]> | undefined;
  postulacionesData: any[] = [];
  usuarioActual: User | null = null;

  private firestore = inject(Firestore);
  private auth = inject(Auth);

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.usuarioActual = user;

      if (user) {
        this.cargarPostulacionesFiltradasPorUsuario(user.uid);
      } else {
        this.postulaciones$ = of([]);
        this.postulacionesData = [];
      }
    });
  }

  cargarPostulacionesFiltradasPorUsuario(uid: string) {
    const colRef = collection(this.firestore, 'postulaciones');

    this.postulaciones$ = collectionData(colRef, { idField: 'id' }).pipe(
      switchMap((postulaciones: any[]) => {
        const propias = postulaciones.filter(p => p.datosPersonales?.uid === uid || p.uid === uid);

        const solicitudesConUsuario = propias.map(async (p) => {
          const userRef = doc(this.firestore, `usuarios/${uid}`);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          const id = p.uid;
          const userGuarderiaRef = doc(this.firestore, `usuarios/${id}`);
          const userGuarderiaSnap = await getDoc(userGuarderiaRef);
          const userGuarderiaData = userGuarderiaSnap.exists() ? userGuarderiaSnap.data() : {};

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
            tipoBeca: p.datosPersonales?.tipoBeca || 'tipo de beca no especificado',
            tipoServicio: p.datosPersonales?.tipoServicio || p.tipoServicio ||'tipo de servicio no especificado',
            fechaSolicitud: this.formatearFecha(p.fechaEnvio),
            estadoAprobacion: p.estadoAprobacion,
            observaciones: p.observaciones || 'Aun no tienes observaciones',
            porcentajeAprobado: p.becaCalculadaPct || 0
          };
        });

        return forkJoin(solicitudesConUsuario);
      })
    );

    this.postulaciones$.subscribe((data) => {
      this.postulacionesData = data;
    });
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
      this.dialog.open(SolicitudRevicionDetailDialogComponent, {
        width: '700px',
        maxWidth: '95vw',
        data: solicitud
      });
    }
}
