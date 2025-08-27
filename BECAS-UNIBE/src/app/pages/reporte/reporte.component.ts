import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  collectionData,
  doc, getDoc
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Periodo {
  id: string;
  nombrePeriodo: string;
  estado: boolean;
}

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css']
})
export class ReporteComponent implements OnInit {
  periodos$: Observable<Periodo[]> = of([]);
  loadingMap = new Map<string, boolean>();

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    const colRef = collection(this.firestore, 'periodos');
    this.periodos$ = collectionData(colRef, { idField: 'id' }).pipe(
      map((docs: any[]) =>
        docs.map(d => ({
          id: d.id,
          nombrePeriodo: d.nombrePeriodo,
          estado: d.estado
        } as Periodo))
      )
    );
  }

  async descargarPDF(periodo: Periodo) {
    this.loadingMap.set(periodo.id, true);

    // 1) Filtrar postulaciones de este periodo
    const postulRef = collection(this.firestore, 'postulaciones');
    const q = query(postulRef, where('periodoId', '==', periodo.id));
    const snap = await getDocs(q);

    // 2) Preparar head & body, consultando usuario por cada postulación
    const head = ['Cédula', 'Nombre', 'Correo', 'Servicio', 'Beca', 'Fecha', 'Porcentaje Beca', 'Estado'];
    const body: string[][] = [];

    for (const docSnap of snap.docs) {
      const d: any = docSnap.data();

      const uid = d.datosPersonales?.uid || d.uid;
      let userData: any = {};
      if (uid) {
        const userRef = doc(this.firestore, `usuarios/${uid}`);
        const userSnap = await getDoc(userRef);
        userData = userSnap.exists() ? userSnap.data() : {};
      }

      const cedula = userData['cedula'] || 'Cedula no Encontrada';
      const nombre = `${userData['nombres'] || ''} ${userData['apellidos'] || ''}`.trim() || 'Nombre no Encontrado';
      const correo = userData['correo'] || 'Correo no Encontrado';
      const servicio = d.datosPersonales?.tipoServicio || d.tipoServicio || 'Tipo de Servicio no Especificado';
      const beca = d.datosPersonales?.tipoBeca || 'Tipo de Beca no Especificado';
      const becaporcentaje = d.becaCalculadaPct ? `${d.becaCalculadaPct}%` : '0%';

      // formatear fecha dd/mm/yy
      let fecha = '';
      if (d.fechaEnvio?.seconds) {
        const dt = new Date(d.fechaEnvio.seconds * 1000);
        fecha = [
          String(dt.getDate()).padStart(2, '0'),
          String(dt.getMonth() + 1).padStart(2, '0'),
          String(dt.getFullYear()).slice(-2)
        ].join('/');
      }

      const estado = d.estadoAprobacion === true ? 'Aprobado'
        : d.estadoAprobacion === false ? 'Rechazado'
          : 'Sin revisar';

      body.push([cedula, nombre, correo, servicio, beca, fecha, becaporcentaje, estado]);
    }

    // 3) Generar PDF
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.setFontSize(16);
    pdf.text(`Reporte – ${periodo.nombrePeriodo} – Listado de Postulaciones`, 14, 20);

    autoTable(pdf, {
      startY: 30,
      head: [head],
      body,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255 }
    });

    pdf.save(`reporte_${periodo.nombrePeriodo}.pdf`);
    this.loadingMap.set(periodo.id, false);
  }


  isLoading(id: string) {
    return this.loadingMap.get(id) === true;
  }
}
