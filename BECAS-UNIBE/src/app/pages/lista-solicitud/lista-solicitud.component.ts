import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-solicitud.component.html',
  styleUrls: ['./lista-solicitud.component.css']
})
export class ListaSolicitudComponent implements OnInit {
  postulaciones$: Observable<any[]> | undefined;
  busquedaCedula: string = '';

  get postulacionesFiltradas() {
    return this.filtradasPorCedula(this.postulacionesData || []);
  }

  postulacionesData: any[] = [];

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    const colRef = collection(this.firestore, 'postulaciones');

    this.postulaciones$ = collectionData(colRef, { idField: 'id' }).pipe(
      switchMap((postulaciones: any[]) => {
        const solicitudesConUsuario = postulaciones.map(async (p) => {
          const uid = p.datosPersonales?.uid;
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

  filtradasPorCedula(lista: any[]) {
    return lista.filter(p =>
      p.cedulaUsuario?.toLowerCase().includes(this.busquedaCedula.toLowerCase())
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


}
