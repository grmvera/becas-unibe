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
  // Inyecciones
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Estado del componente
  periodoActivo: any = null;
  usuarioRol: string | null = null;

  postulacionesTotales = 0;
  becas = 0;
  ayudas = 0;
  guarderia = 0;

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
    // Obtener el rol del usuario
    const user = this.auth.currentUser;
    if (!user) return;

    const usuarioSnap = await getDoc(doc(this.firestore, `usuarios/${user.uid}`));
    if (usuarioSnap.exists()) {
      this.usuarioRol = usuarioSnap.data()?.['rol'] ?? null;
    }

    // Cargar el periodo activo
    const periodosRef = collection(this.firestore, 'periodos');
    const periodoQ = query(periodosRef, where('estado', '==', true));
    const periodoSnap = await getDocs(periodoQ);

    if (periodoSnap.empty) return;

    // Tomamos el primer periodo activo
    const periodoDoc = periodoSnap.docs[0];
    const periodoData = periodoDoc.data();
    this.periodoActivo = {
      ...periodoData,
      ...(await (async () => {
        const detallesSnap = await getDoc(
          doc(this.firestore, `periodos/${periodoDoc.id}/informacionPublica/detalles`)
        );
        return detallesSnap.exists() ? detallesSnap.data()! : {};
      })())
    };

    const periodoId = periodoDoc.id;

    //  Traer solamente las postulaciones de este periodo
    const postulRef = collection(this.firestore, 'postulaciones');
    const postulQ = query(postulRef, where('periodoId', '==', periodoId));
    const postulSnap = await getDocs(postulQ);

    // Inicializar conteos
    this.postulacionesTotales = postulSnap.size;
    this.becas = 0;
    this.ayudas = 0;
    this.guarderia = 0;

    // Contar por tipo de servicio
    postulSnap.forEach(docSnap => {
      const data = docSnap.data();
      const tipo = data['tipoServicio'] ;
      const tipoP =  data['datosPersonales'];
      const servicio = tipo || tipoP['tipoServicio']

      if (servicio === 'TIPOS DE BECAS') this.becas++;
      else if (servicio === 'AYUDAS ECONÓMICAS') this.ayudas++;
      else if (servicio === 'GUARDERÍA') this.guarderia++;
    });

    // Actualizar datos de los gráficos
    this.chartDataBecas.datasets[0].data = [
      this.becas,
      this.postulacionesTotales - this.becas
    ];
    this.chartDataAyudas.datasets[0].data = [
      this.ayudas,
      this.postulacionesTotales - this.ayudas
    ];
    this.chartDataGuarderia.datasets[0].data = [
      this.guarderia,
      this.postulacionesTotales - this.guarderia
    ];
  }
}
