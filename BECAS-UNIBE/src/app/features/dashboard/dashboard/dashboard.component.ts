import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, doc, query, where, getDocs, getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NgChartsModule } from 'ng2-charts';
import { ChartData } from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, NgChartsModule]
})
export class DashboardComponent implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  periodoActivo: any = null;
  usuarioRol: string | null = null;

  postulacionesTotales: number = 0;
  becas: number = 0;
  ayudas: number = 0;
  guarderia: number = 0;

  chartDataBecas: ChartData<'doughnut'> = {
    labels: ['Becas', 'Otros'],
    datasets: [{ data: [0, 0], backgroundColor: ['#36A2EB', '#E5E5E5'] }]
  };

  chartDataAyudas: ChartData<'doughnut'> = {
    labels: ['Ayudas económicas', 'Otros'],
    datasets: [{ data: [0, 0], backgroundColor: ['#FFCE56', '#E5E5E5'] }]
  };

  chartDataGuarderia: ChartData<'doughnut'> = {
    labels: ['Guardería', 'Otros'],
    datasets: [{ data: [0, 0], backgroundColor: ['#FF6384', '#E5E5E5'] }]
  };

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const usuarioRef = doc(this.firestore, `usuarios/${user.uid}`);
    const usuarioSnap = await getDoc(usuarioRef);
    if (usuarioSnap.exists()) {
      const data = usuarioSnap.data();
      this.usuarioRol = data['rol'] ?? null;
    }

    const periodosRef = collection(this.firestore, 'periodos');
    const q = query(periodosRef, where('estado', '==', true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0];
      const data = docRef.data();

      const detallesRef = doc(this.firestore, `periodos/${docRef.id}/informacionPublica/detalles`);
      const detallesSnap = await getDoc(detallesRef);

      this.periodoActivo = detallesSnap.exists()
        ? { ...data, ...detallesSnap.data() }
        : data;
    }

    const postulacionesRef = collection(this.firestore, 'postulaciones');
    const postulacionesSnap = await getDocs(postulacionesRef);
    this.postulacionesTotales = postulacionesSnap.size;

    postulacionesSnap.forEach((doc) => {
      const data = doc.data();
      const tipo = data['datosPersonales']?.['tipoServicio'];

      if (tipo === 'TIPOS DE BECAS') this.becas++;
      else if (tipo === 'AYUDAS ECONÓMICAS') this.ayudas++;
      else if (tipo === 'GUARDERÍA') this.guarderia++;
    });


    // Asignar datos a los gráficos
    this.chartDataBecas.datasets[0].data = [this.becas, this.postulacionesTotales - this.becas];
    this.chartDataAyudas.datasets[0].data = [this.ayudas, this.postulacionesTotales - this.ayudas];
    this.chartDataGuarderia.datasets[0].data = [this.guarderia, this.postulacionesTotales - this.guarderia];
  }
}
