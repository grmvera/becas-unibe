import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, doc, query, where, getDocs, getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  periodoActivo: any = null;
  usuarioRol: string | null = null;

  async ngOnInit() {
    // Obtener usuario actual
    const user = this.auth.currentUser;
    if (!user) return;

    // Obtener rol desde Firestore
    const usuarioRef = doc(this.firestore, `usuarios/${user.uid}`);
    const usuarioSnap = await getDoc(usuarioRef);
    if (usuarioSnap.exists()) {
      const data = usuarioSnap.data();
      this.usuarioRol = data['rol'] ?? null;
    }

    // Obtener periodo activo
    const periodosRef = collection(this.firestore, 'periodos');
    const q = query(periodosRef, where('estado', '==', true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0];
      const data = docRef.data();

      // Subcolección informacionPublica/detalles
      const detallesRef = doc(this.firestore, `periodos/${docRef.id}/informacionPublica/detalles`);
      const detallesSnap = await getDoc(detallesRef);

      if (detallesSnap.exists()) {
        const detallesData = detallesSnap.data();
        this.periodoActivo = { ...data, ...detallesData };
      } else {
        this.periodoActivo = data;
      }
    }
  }
}
