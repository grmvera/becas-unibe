import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, combineLatest, startWith, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

export interface Paquete {
  id?: string;
  nombre: string;
  estado: boolean;
  servicio: string;
  tipoBeca?: string | null;
  requisitos: string[];
}

@Component({
  selector: 'app-requisitos-anexo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './requisitos-anexo.component.html',
  styleUrls: ['./requisitos-anexo.component.css'],
})
export class RequisitosAnexoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);

  /** ====== UI / estado ====== */
  modalAbierto = false;
  guardando = false;
  editando = false;
  idEditando: string | null = null;

  /** ====== búsqueda/listado ====== */
  search = new FormControl<string>('', { nonNullable: true });
  paquetes$: Observable<Paquete[]> = new Observable<Paquete[]>();
  filtrados$: Observable<Paquete[]> = new Observable<Paquete[]>();

  /** ====== datos para selects ====== */
  tiposServicios: string[] = ['TIPOS DE BECAS', 'AYUDAS ECONÓMICAS', 'GUARDERÍA'];
  becas: string[] = [
    'Beca por Excelencia Académica',
    'Beca para Deportistas destacados',
    'Beca Socioeconómica',
    'Beca por Actividades Culturales',
    'Beca por Desarrollo Profesional',
    'Beca Honorífica',
    'Beca SNNA',
    'Beca víctimas violencia de género',
    'Beca Discapacidad'
  ];

  /** ====== formulario modal (crear/editar) ====== */
  // Tipado estricto: controles no anulables y FormArray de FormControl<string>
  formCrear: FormGroup = this.fb.group({
    servicio: this.fb.nonNullable.control<string>('', { validators: [Validators.required] }),
    tipoBeca: this.fb.nonNullable.control<string>(''),
    requisitos: this.fb.array<FormControl<string>>([
      this.fb.nonNullable.control<string>('', Validators.required)
    ]),
  });

  // Getter tipado: ahora controls es FormControl<string>[] (no AbstractControl[])
  get requisitosFA(): FormArray<FormControl<string>> {
    return this.formCrear.get('requisitos') as FormArray<FormControl<string>>;
  }

  ngOnInit(): void {
    const colRef = collection(this.firestore, 'requisitos_anexo');
    this.paquetes$ = collectionData(query(colRef, orderBy('nombre', 'asc')), {
      idField: 'id',
    }) as Observable<Paquete[]>;

    this.filtrados$ = combineLatest([
      this.paquetes$,
      this.search.valueChanges.pipe(startWith(this.search.value)),
    ]).pipe(
      map(([items, q]) => {
        const term = (q ?? '').toString().trim().toLowerCase();
        if (!term) return items;
        return items.filter((p) =>
          [p.nombre, p.servicio, p.tipoBeca ?? ''].some((v) => (v || '').toLowerCase().includes(term)),
        );
      }),
    );

    // Validación dinámica de tipoBeca
    this.formCrear.get('servicio')?.valueChanges.subscribe((val: string) => {
      const tipoCtrl = this.formCrear.get('tipoBeca');
      if (val === 'TIPOS DE BECAS') {
        tipoCtrl?.addValidators(Validators.required);
      } else {
        tipoCtrl?.clearValidators();
        tipoCtrl?.setValue('');
      }
      tipoCtrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /** ====== Modal: crear ====== */
  crear(): void {
    this.editando = false;
    this.idEditando = null;
    this.resetForm();
    this.modalAbierto = true;
  }

  /** ====== Modal: editar ====== */
  editar(p: Paquete): void {
    this.editando = true;
    this.idEditando = p.id ?? null;

    this.resetForm();
    this.formCrear.patchValue({
      servicio: p.servicio || '',
      tipoBeca: p.servicio === 'TIPOS DE BECAS' ? (p.tipoBeca ?? '') : '',
    });

    this.requisitosFA.clear();
    (p.requisitos ?? []).forEach((r) => {
      this.requisitosFA.push(this.fb.nonNullable.control<string>(r, Validators.required));
    });
    if (this.requisitosFA.length === 0) {
      this.requisitosFA.push(this.fb.nonNullable.control<string>('', Validators.required));
    }

    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbierto = false;
  }

  /** ====== helpers ====== */
  agregarRequisito(val = ''): void {
    this.requisitosFA.push(this.fb.nonNullable.control<string>(val, Validators.required));
  }

  quitarRequisito(i: number): void {
    if (this.requisitosFA.length > 1) this.requisitosFA.removeAt(i);
  }

  private resetForm(): void {
    this.formCrear.reset({ servicio: '', tipoBeca: '' });
    this.requisitosFA.clear();
    this.requisitosFA.push(this.fb.nonNullable.control<string>('', Validators.required));
  }

  trackById = (_: number, item: Paquete) => item.id ?? _;

  /** ====== guardar (crea o actualiza) ====== */
  async guardarNuevo(): Promise<void> {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    this.guardando = true;
    try {
      const servicio = (this.formCrear.get('servicio')!.value ?? '') as string;
      const tipoBeca = (this.formCrear.get('tipoBeca')!.value ?? '') as string;

      const requisitos: string[] = this.requisitosFA.controls
        .map((c) => (c.value ?? '').trim())
        .filter((v) => !!v);

      const payload: Omit<Paquete, 'id'> = {
        servicio,
        tipoBeca: servicio === 'TIPOS DE BECAS' ? tipoBeca : null,
        requisitos,
        estado: true,
        nombre: servicio === 'TIPOS DE BECAS' && tipoBeca ? tipoBeca : servicio,
      };

      const colRef = collection(this.firestore, 'requisitos_anexo');

      if (this.editando && this.idEditando) {
        const ref = doc(this.firestore, `requisitos_anexo/${this.idEditando}`);
        await updateDoc(ref, payload as any);
      } else {
        await addDoc(colRef, payload as any);
      }

      this.modalAbierto = false;
    } finally {
      this.guardando = false;
    }
  }

  /** ====== borrar ====== */
  async borrar(p: Paquete): Promise<void> {
    if (!p.id) return;
    const ref = doc(this.firestore, `requisitos_anexo/${p.id}`);
    await deleteDoc(ref);
  }


  cargandoEstado = new Set<string>();

  async toggleEstado(p: Paquete): Promise<void> {
    if (!p.id) return;
    if (this.cargandoEstado.has(p.id)) return;
    this.cargandoEstado.add(p.id);
    try {
      const ref = doc(this.firestore, `requisitos_anexo/${p.id}`);
      await updateDoc(ref, { estado: !p.estado });
    } finally {
      this.cargandoEstado.delete(p.id);
    }
  }
}
