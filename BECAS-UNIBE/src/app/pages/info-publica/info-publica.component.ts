import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, collection, doc, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-info-publica',
  templateUrl: './info-publica.component.html',
  styleUrls: ['./info-publica.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class InfoPublicaComponent implements OnInit {
  form: FormGroup;
  periodoId: string | null = null;
  nombrePeriodo: string = '';
  storage = getStorage();
  periodoActivo: boolean = false;

  etiquetas: any = {
    temaZoom: 'Tema de la reunión Zoom',
    horaZoom: 'Hora de la reunión Zoom',
    linkZoom: 'Link de Zoom',
    idZoom: 'ID de reunión',
    reqGuarderia: 'Requisitos para guarderías',
    reqSocioeconomica: 'Requisitos para beca socioeconómica',
    reqExcelencia: 'Requisitos para beca de excelencia académica',
    reqProfesional: 'Requisitos para beca profesional',
    reqDiscapacidad: 'Requisitos para beca por discapacidad',
    infoCapacitacion: 'Información sobre capacitación virtual',
    docResolucion: 'Documento resolución de becas',
    docApelacion: 'Documento apelación de becas'
  };

  camposTexto: string[] = [
    'temaZoom',
    'horaZoom',
    'linkZoom',
    'idZoom',
    'reqGuarderia',
    'reqSocioeconomica',
    'reqExcelencia',
    'reqProfesional',
    'reqDiscapacidad',
    'infoCapacitacion'
  ];

  camposArchivo: string[] = [
    'docResolucion',
    'docApelacion'
  ];

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.form = this.fb.group({
      temaZoom: ['', Validators.required],
      horaZoom: ['', Validators.required],
      linkZoom: ['', Validators.required],
      idZoom: ['', Validators.required],
      reqGuarderia: [''],
      reqSocioeconomica: [''],
      reqExcelencia: [''],
      reqProfesional: [''],
      reqDiscapacidad: [''],
      infoCapacitacion: [''],
      docResolucion: [null],
      docApelacion: [null]
    });
  }

  async ngOnInit() {
    const periodosRef = collection(this.firestore, 'periodos');
    const q = query(periodosRef, where('estado', '==', true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      this.periodoActivo = true;
      const docRef = snapshot.docs[0];
      this.periodoId = docRef.id;
      this.nombrePeriodo = docRef.data()['nombrePeriodo'];

      const infoSnap = await getDocs(collection(this.firestore, `periodos/${this.periodoId}/informacionPublica`));
      if (!infoSnap.empty) {
        const data = infoSnap.docs[0].data();
        this.form.patchValue(data);
      }
    }
  }

  async guardar() {
    if (!this.periodoId) return;

    const infoData = { ...this.form.value };

    // Subir archivos si existen
    const docRes = this.form.get('docResolucion')?.value;
    const docAp = this.form.get('docApelacion')?.value;

    try {
      if (docRes) {
        const resRef = ref(this.storage, `documentos/${this.periodoId}/resolucion.pdf`);
        const snap = await uploadBytes(resRef, docRes);
        const url = await getDownloadURL(snap.ref);
        infoData['docResolucionURL'] = url;
      }

      if (docAp) {
        const apRef = ref(this.storage, `documentos/${this.periodoId}/apelacion.pdf`);
        const snap = await uploadBytes(apRef, docAp);
        const url = await getDownloadURL(snap.ref);
        infoData['docApelacionURL'] = url;
      }

      // ⚠️ Elimina los archivos antes de guardar
      delete infoData['docResolucion'];
      delete infoData['docApelacion'];

      await setDoc(doc(this.firestore, `periodos/${this.periodoId}/informacionPublica/detalles`), infoData);

      Swal.fire({
        icon: 'success',
        title: 'Información guardada',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar la información',
        text: 'Verifica tu conexión o intenta más tarde'
      });
    }
  }


  subirArchivo(event: any, control: string) {
    const file = event.target.files[0];
    if (file) {
      this.form.get(control)?.setValue(file);
    }
  }
}
