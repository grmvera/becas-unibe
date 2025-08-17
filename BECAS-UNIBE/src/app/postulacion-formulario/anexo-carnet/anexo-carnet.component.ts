import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { SeleccionStateService } from '../../core/services/seleccion-state.service';
import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, Subject, of, combineLatest, map, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-anexo-carnet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatSnackBarModule],
  templateUrl: './anexo-carnet.component.html',
  styleUrls: ['./anexo-carnet.component.css']
})
export class AnexoCarnetComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Output() volverAtras = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<any>();

  // Archivos seleccionados (solo memoria)
  archivos: { conadis?: File; requisitos?: File } = {};

  // Selección actual (memoria)
  servicioActual: string | null = null;
  becaActual: string | null = null;

  // Requisitos dinámicos
  requisitos$: Observable<string[]> = of([]);
  private requisitosList: string[] = [];

  // Getters de control UI
  get tieneRequisitos(): boolean { return this.requisitosList.length > 0; }
  get puedeSubir(): boolean { return this.tieneRequisitos; }
  get puedeFinalizar(): boolean { return this.tieneRequisitos && !!this.archivos.requisitos; }

  // Validación de archivos
  private readonly maxFileSize = 5 * 1024 * 1024; // 5 MB
  private readonly tiposRequisitos = ['application/pdf'];
  private readonly tiposConadis = ['application/pdf', 'image/jpeg', 'image/png'];

  private destroy$ = new Subject<void>();

  constructor(
    private selState: SeleccionStateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    // mantener selección actualizada
    this.selState.servicio$.pipe(takeUntil(this.destroy$)).subscribe(v => this.servicioActual = v);
    this.selState.beca$.pipe(takeUntil(this.destroy$)).subscribe(v => this.becaActual = v);

    // cargar y cachear requisitos
    this.requisitos$ = combineLatest([this.selState.servicio$, this.selState.beca$]).pipe(
      switchMap(([servicio, beca]) => this.cargarRequisitos(servicio, beca))
    );
    this.requisitos$.pipe(takeUntil(this.destroy$)).subscribe(list => this.requisitosList = list ?? []);
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }

  // ---------- Requisitos desde Firestore ----------
  private norm(s: string | null | undefined): string {
    return (s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  private cargarRequisitos(servicio: string | null, beca: string | null): Observable<string[]> {
    if (!servicio) return of([]);

    const servicioKey = servicio.trim();
    const becaNorm = this.norm(beca);

    type Doc = { estado: boolean; servicio: string; tipoBeca: string | null; requisitos: string[] };

    // solo documentos ACTivos de ese servicio
    const colRef = collection(this.firestore, 'requisitos_anexo');
    const qBase  = query(colRef, where('estado', '==', true), where('servicio', '==', servicioKey));

    return collectionData(qBase).pipe(
      map((docs: any[]) => {
        const out: string[] = [];
        (docs as Doc[]).forEach(d => {
          const reqs = Array.isArray(d.requisitos) ? d.requisitos : [];
          const tb = d.tipoBeca;

          if (tb === null || this.norm(tb) === '') {
            out.push(...reqs); // genéricos
            return;
          }
          if (this.norm(tb) === becaNorm) out.push(...reqs); // específicos por beca
        });
        return Array.from(new Set(out.map(r => (r ?? '').toString().trim()))).filter(Boolean);
      })
    );
  }

  // ---------- Archivos ----------
  onArchivoSeleccionado(evt: Event, tipo: 'conadis' | 'requisitos') {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    if (!this.puedeSubir) {
      this.snackBar.open(
        'No hay requisitos configurados para este servicio/tipo de beca. Comunícate con Bienestar Estudiantil.',
        'Cerrar', { duration: 5000 }
      );
      input.value = '';
      return;
    }

    const tipoOk = tipo === 'requisitos'
      ? this.tiposRequisitos.includes(file.type)
      : this.tiposConadis.includes(file.type);

    if (!tipoOk) {
      this.snackBar.open(
        tipo === 'requisitos' ? 'El archivo de requisitos debe ser PDF.' : 'Formato no permitido. Usa PDF, JPG o PNG.',
        'Cerrar', { duration: 3000 }
      );
      input.value = '';
      return;
    }

    if (file.size > this.maxFileSize) {
      this.snackBar.open('El archivo no puede superar 5 MB.', 'Cerrar', { duration: 3000 });
      input.value = '';
      return;
    }

    this.archivos[tipo] = file;
    this.snackBar.open('Archivo listo para subir.', 'OK', { duration: 1800 });
  }

  async subirArchivo() {
    if (!this.tieneRequisitos) {
      this.snackBar.open(
        'No hay requisitos configurados para este servicio/tipo de beca. Falta instrucción. ' +
        'Por favor, comunícate con Bienestar Estudiantil.',
        'Cerrar', { duration: 5500 }
      );
      return;
    }
    if (!this.archivos.requisitos) {
      this.snackBar.open('Debes adjuntar el PDF con los requisitos.', 'Cerrar', { duration: 3500 });
      return;
    }

    const ok = confirm('¿Confirmas subir los archivos? Esta acción no se podrá editar.');
    if (!ok) return;

    const storage = getStorage();
    try {
      const urls: { urlConadis?: string; urlRequisitos?: string } = {};

      if (this.archivos.conadis) {
        const conadisRef = ref(storage, `anexos/conadis-${Date.now()}-${this.archivos.conadis.name}`);
        await uploadBytes(conadisRef, this.archivos.conadis);
        urls.urlConadis = await getDownloadURL(conadisRef);
      }

      const reqFile = this.archivos.requisitos;
      const requisitosRef = ref(storage, `anexos/requisitos-${Date.now()}-${reqFile.name}`);
      await uploadBytes(requisitosRef, reqFile);
      urls.urlRequisitos = await getDownloadURL(requisitosRef);

      this.form.patchValue(urls);

      this.snackBar.open('✅ Archivos subidos correctamente', 'Cerrar', {
        duration: 4000, panelClass: ['snackbar-success']
      });

      this.emitirFinalizar();
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);

    } catch (error) {
      console.error('Error al subir archivos:', error);
      this.snackBar.open('❌ Error al subir los archivos', 'Cerrar', {
        duration: 5000, panelClass: ['snackbar-error']
      });
    }
  }

  cancelarArchivo() { this.archivos = {}; }
  emitirVolverAtras() { this.volverAtras.emit(); }
  emitirFinalizar() { this.finalizar.emit(this.form.value); }
}
