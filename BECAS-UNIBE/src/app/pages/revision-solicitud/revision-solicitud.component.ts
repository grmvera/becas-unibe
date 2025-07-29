import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Observable, switchMap, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-revision-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revision-solicitud.component.html',
  styleUrls: ['./revision-solicitud.component.css']
})
export class RevisionSolicitudComponent implements OnInit {
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
        const propias = postulaciones.filter(p => p.datosPersonales?.uid === uid);

        const solicitudesConUsuario = propias.map(async (p) => {
          const userRef = doc(this.firestore, `usuarios/${uid}`);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            cedulaUsuario: userData['cedula'] || 'No encontrada',
            tipoBeca: p.datosPersonales?.tipoBeca || 'tipo de beca no especificado',
            tipoServicio: p.datosPersonales?.tipoServicio || 'tipo de servicio no especificado',
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

  formatearFecha(fechaFirebase: any): string {
    if (!fechaFirebase || !fechaFirebase.seconds) return 'Fecha no válida';

    const date = new Date(fechaFirebase.seconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  }
}
