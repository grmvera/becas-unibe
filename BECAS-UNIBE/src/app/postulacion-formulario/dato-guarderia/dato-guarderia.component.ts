import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, Subject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { SeleccionStateService } from '../../core/services/seleccion-state.service';


@Component({
  selector: 'app-dato-guarderia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatSnackBarModule],
  templateUrl: './dato-guarderia.component.html',
  styleUrls: ['./dato-guarderia.component.css']
})
export class DatoGuarderiaComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;                           // el padre puede pasar su FormGroup
  @Output() finalizar = new EventEmitter<FormData>();  // el padre espera FormData con 'archivo'

  servicioActual: string | null = null;                // desde SeleccionStateService
  becaActual: string | null = null;

  requisitos$: Observable<string[]> = of([]);          // lista dinámica observable
  private requisitosList: string[] = [];

  // Control de UI
  get tieneRequisitos(): boolean { return this.requisitosList.length > 0; }
  get puedeSubir(): boolean { return this.tieneRequisitos; }
  get puedeFinalizar(): boolean { return this.tieneRequisitos && !!this.archivoPdf; }

  // Archivo seleccionado (solo memoria)
  private archivoPdf?: File;

  // Validación
  private readonly maxFileSize = 5 * 1024 * 1024; // 5 MB

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private selState: SeleccionStateService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Fallback por si el padre no inyecta form
    if (!this.form) {
      this.form = this.fb.group({});
    }

    // Mantener selección actual (memoria)
    this.selState.servicio$.pipe(takeUntil(this.destroy$)).subscribe(v => this.servicioActual = v);
    this.selState.beca$.pipe(takeUntil(this.destroy$)).subscribe(v => this.becaActual = v);

    // Cargar y cachear requisitos dinámicos
    this.requisitos$ = combineLatest([this.selState.servicio$, this.selState.beca$]).pipe(
      switchMap(([servicio, beca]) => this.cargarRequisitos(servicio, beca))
    );
    this.requisitos$.pipe(takeUntil(this.destroy$)).subscribe(list => this.requisitosList = list ?? []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- Firestore: requisitos dinámicos ----------
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

    const servicioKey = servicio.trim(); // "GUARDERÍA"
    const becaNorm = this.norm(beca);

    type Doc = { estado: boolean; servicio: string; tipoBeca: string | null; requisitos: string[] };

    // Solo documentos ACTIVOS del servicio; filtramos beca en cliente (tolerante a tildes/espacios)
    const colRef = collection(this.firestore, 'requisitos_anexo');
    const qBase  = query(colRef, where('estado', '==', true), where('servicio', '==', servicioKey));

    return collectionData(qBase).pipe(
      map((docs: any[]) => {
        const out: string[] = [];
        (docs as Doc[]).forEach(d => {
          const reqs = Array.isArray(d.requisitos) ? d.requisitos : [];
          const tb = d.tipoBeca;

          if (tb === null || this.norm(tb) === '') { out.push(...reqs); return; } // genéricos
          if (this.norm(tb) === becaNorm)         { out.push(...reqs); }          // específicos
        });

        // limpiar y deduplicar
        return Array.from(new Set(out.map(r => (r ?? '').toString().trim()))).filter(Boolean);
      })
    );
  }

  // ---------- Manejo de archivo ----------
  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    if (!this.puedeSubir) {
      this.snack.open(
        'No hay requisitos configurados para este servicio/tipo de beca. Comunícate con Bienestar Estudiantil.',
        'Cerrar', { duration: 5000 }
      );
      input.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      this.snack.open('El archivo debe ser PDF.', 'Cerrar', { duration: 3000 });
      input.value = '';
      return;
    }
    if (file.size > this.maxFileSize) {
      this.snack.open('El PDF no puede superar 5 MB.', 'Cerrar', { duration: 3000 });
      input.value = '';
      return;
    }

    this.archivoPdf = file;
    this.snack.open('Archivo listo para subir.', 'OK', { duration: 1800 });
  }

  // ---------- Submit: emite FormData con 'archivo' (el padre lo sube/guarda) ----------
  submit() {
    if (!this.tieneRequisitos) {
      this.snack.open(
        'No hay requisitos configurados para este servicio/tipo de beca. Falta instrucción. ' +
        'Por favor, comunícate con Bienestar Estudiantil.',
        'Cerrar', { duration: 5500 }
      );
      return;
    }
    if (!this.archivoPdf) {
      this.snack.open('Debes adjuntar el PDF con todos los requisitos.', 'Cerrar', { duration: 3500 });
      return;
    }

    const fd = new FormData();
    fd.append('archivo', this.archivoPdf);  // *** clave que usa tu padre: formData.get('archivo')
    this.finalizar.emit(fd);
  }
}
