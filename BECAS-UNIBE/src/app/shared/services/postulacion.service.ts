import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class PostulacionService {
  constructor(private firestore: Firestore) {}

  guardarPostulacion(data: any) {
    const ref = collection(this.firestore, 'postulaciones');
    return addDoc(ref, data);
  }
}
