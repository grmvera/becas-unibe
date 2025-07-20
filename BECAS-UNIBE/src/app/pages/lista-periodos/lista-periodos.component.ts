import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, updateDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-lista-periodos',
  templateUrl: './lista-periodos.component.html',
  styleUrls: ['./lista-periodos.component.css'],
  imports: [CommonModule]
})
export class ListaPeriodosComponent implements OnInit {
  periodos$: Observable<any[]> = new Observable();

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    const periodosRef = collection(this.firestore, 'periodos');
    this.periodos$ = collectionData(periodosRef, { idField: 'id' });
  }

  async cambiarEstado(periodo: any) {
    const docRef = doc(this.firestore, 'periodos', periodo.id);

    if (!periodo.estado) {
      // ...verificar si ya hay otro activo
      const periodosRef = collection(this.firestore, 'periodos');
      const q = query(periodosRef, where('estado', '==', true));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Swal.fire({
          icon: 'warning',
          title: 'Ya existe un periodo activo',
          text: 'Desactiva el periodo actual antes de activar otro.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }
    }

    // Cambiar estado
    await updateDoc(docRef, { estado: !periodo.estado });

    Swal.fire({
      icon: 'success',
      title: periodo.estado ? 'Periodo desactivado' : 'Periodo activado',
      showConfirmButton: false,
      timer: 1500
    });
  }
}
