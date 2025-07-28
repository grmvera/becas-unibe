import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-anexo-carnet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatSnackBarModule],
  templateUrl: './anexo-carnet.component.html',
  styleUrls: ['./anexo-carnet.component.css']
})
export class AnexoCarnetComponent {
  @Input() form!: FormGroup;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<any>();

  archivos: { conadis?: File; requisitos?: File } = {};

  constructor(private snackBar: MatSnackBar, private router: Router) {}

  onArchivoSeleccionado(event: any, tipo: 'conadis' | 'requisitos') {
    const archivo = event.target.files[0];
    if (archivo) this.archivos[tipo] = archivo;
  }

  async subirArchivo() {
    const confirmacion = confirm('¿Está seguro de haber completado el formulario completo y subir estos archivos? Esta acción no se podrá editar.');
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
      this.snackBar.open('✅ Archivos subidos correctamente', 'Cerrar', { duration: 4000, panelClass: ['snackbar-success'] });

      // Espera un momento antes de redirigir
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);

      this.emitirFinalizar();
    } catch (error) {
      console.error('Error al subir archivos:', error);
      this.snackBar.open('❌ Error al subir los archivos', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
    }
  }

  cancelarArchivo() {
    this.archivos = {};
  }

  emitirVolverAtras() {
    this.volverAtras.emit();
  }

  emitirFinalizar() {
    console.log('Datos para enviar', this.form.value);
    this.finalizar.emit(this.form.value);
  }
}
