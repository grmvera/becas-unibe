import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'app-anexo-carnet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './anexo-carnet.component.html',
  styleUrls: ['./anexo-carnet.component.css']
})
export class AnexoCarnetComponent {
  @Input() form!: FormGroup;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<any>();

  archivos: { conadis?: File; requisitos?: File } = {};

  onArchivoSeleccionado(event: any, tipo: 'conadis' | 'requisitos') {
    const archivo = event.target.files[0];
    if (archivo) this.archivos[tipo] = archivo;
  }

  async subirArchivo() {
    const confirmacion = confirm('¿Está seguro de subir estos archivos? Esta acción no se podrá editar.');
    if (!confirmacion) return;

    const storage = getStorage();

    try {
      const urls: any = {};

      if (this.archivos.conadis) {
        const conadisRef = ref(storage, `anexos/conadis-${Date.now()}-${this.archivos.conadis.name}`);
        await uploadBytes(conadisRef, this.archivos.conadis);
        urls.urlConadis = await getDownloadURL(conadisRef);
      }

      if (this.archivos.requisitos) {
        const requisitosRef = ref(storage, `anexos/requisitos-${Date.now()}-${this.archivos.requisitos.name}`);
        await uploadBytes(requisitosRef, this.archivos.requisitos);
        urls.urlRequisitos = await getDownloadURL(requisitosRef);
      }

      this.form.patchValue(urls);
      alert('Archivos subidos con éxito.');
      this.emitirFinalizar();
    } catch (error) {
      console.error('Error al subir archivos:', error);
      alert('Hubo un error al subir los archivos.');
    }
  }

  cancelarArchivo() {
    this.archivos = {};
  }

  emitirVolverAtras() {
    this.volverAtras.emit();
  }

  emitirFinalizar() {
    this.finalizar.emit(this.form.value);
  }
}
