import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, doc, query, where, getDocs, getDoc } from '@angular/fire/firestore';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {
  periodoActivo: any = null;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const periodosRef = collection(this.firestore, 'periodos');
    const q = query(periodosRef, where('estado', '==', true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0];
      const data = docRef.data();

      // Obtener subdocumento: informacionPublica/detalles
      const detallesRef = doc(this.firestore, `periodos/${docRef.id}/informacionPublica/detalles`);
      const detallesSnap = await getDoc(detallesRef);

      if (detallesSnap.exists()) {
        const detallesData = detallesSnap.data();
        this.periodoActivo = { ...data, ...detallesData }; // fusionar info
      } else {
        this.periodoActivo = data;
      }
    }
  }
}
