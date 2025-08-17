import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  limit,
  addDoc,
} from '@angular/fire/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { AnexoCarnetComponent } from '../../postulacion-formulario/anexo-carnet/anexo-carnet.component';
import { DatoSaludComponent } from '../../postulacion-formulario/dato-salud/dato-salud.component';
import { DatosSocioeconomicoComponent } from '../../postulacion-formulario/dato-socioeconomicos/dato-socioeconomicos.component';
import { DatosGrupoFamiliarComponent } from '../../postulacion-formulario/datos-grupo-familiar/datos-grupo-familiar.component';
import { DatosPersonalesComponent } from '../../postulacion-formulario/datos-personales/datos-personales.component';
import { SeleccionStateService } from '../../core/services/seleccion-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PostulacionService } from '../../shared/services/postulacion.service';

interface Usuario {
  uid: string;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  correo?: string;
  email?: string;
  rol?: string;
}

@Component({
  standalone: true,
  selector: 'app-postulacion-servicio',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatosPersonalesComponent,
    DatosGrupoFamiliarComponent,
    DatosSocioeconomicoComponent,
    DatoSaludComponent,
    AnexoCarnetComponent,
  ],
  templateUrl: './postulacion-servicio.component.html',
  styleUrls: ['./postulacion-servicio.component.css'],
})
export class PostulacionServicioComponent implements OnInit {
  private firestore = inject(Firestore);
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private selState = inject(SeleccionStateService);

  enviandoFormulario = false;

  // Aquí guardaremos el ID del período activo
  periodoId: string = '';

  // ===== UI / selección =====
  periodoActivo = true;
  becas = ['Beca por Excelencia Académica', 'Beca Discapacidad'] as const;
  becaSeleccionada: string | null = null;

  // ===== Estudiantes (solo rol=student) =====
  students$: Observable<Usuario[]> = of([]);
  private studentsCache: Usuario[] = [];
  loadingStudents = false;
  selectedStudentUid: string | null = null;
  selectedStudent: Usuario | null = null;

  // ===== Categorías de gastos =====
  categorias = [
    'Alquiler',
    'Telefono fijo',
    'Medicina',
    'TV cable',
    'Educación',
    'Arriendo',
    'Alimentos',
    'Luz',
    'Agua',
    'Internet',
    'Transporte',
    'Educacion',
    'Salud',
    'Otros',
    'Total',
  ];

  // ===== Formularios =====
  etapaFormulario = 1;

  datosPersonalesForm!: FormGroup;
  grupoFamiliarForm!: FormGroup;
  socioeconomicoForm!: FormGroup;
  datosSaludForm!: FormGroup;
  anexoCarnetForm!: FormGroup;

  // —— usados en la plantilla
  textoAviso = 'Elige una beca y un estudiante para habilitar el formulario.';
  trackByStudent = (_: number, u: Usuario) => u.uid;
  trackByCat = (_: number, c: string) => c;
  trackByBeca = (_: number, b: string) => b;

  // 👉 Getter que usa el HTML
  get puedeMostrarFormulario(): boolean {
    return !!(this.periodoActivo && this.becaSeleccionada && this.selectedStudentUid);
  }

  constructor(
    private snackBar: MatSnackBar,
    private postulacionService: PostulacionService
  ) {
    this.datosPersonalesForm = this.fb.group({
      uid: [''],
      tipoServicio: [''],
      tipoBeca: [''],
      imagen: [null],
      independiente: [null],
      empleo: [''],
      viveSolo: [null],
      semestre: [''],
      direccion: this.fb.group({
        calle: [''],
        numero: [''],
        barrio: [''],
        departamento: [''],
        piso: [''],
        sector: [''],
      }),
    });

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.datosPersonalesForm.get('uid')?.setValue(user.uid);
      }
    });

    this.grupoFamiliarForm = this.fb.group({
      tipoVivienda: [''],
      gastos: this.fb.group(Object.fromEntries(this.categorias.map((c) => [c, [0]]))),
      nota: [''],
      vehiculos: this.fb.array([
        this.fb.group({
          tipo: ['Automóvil'],
          marca: [''],
          modelo: [''],
          anio: [''],
        }),
      ]),
    });

    this.socioeconomicoForm = this.fb.group({
      integrantes: this.fb.array([
        this.fb.group({
          parentesco: ['Postulante'],
          nombre: [''],
          apellido: [''],
          actividad: [''],
          ingresos: [0],
          ingresosComplementarios: [0],
        }),
      ]),
    });

    this.datosSaludForm = this.fb.group({
      salud: this.fb.array([
        this.fb.group({
          parentesco: ['Postulante'],
          problema: ['Ninguna'],
          ayuda: ['Sí'],
        }),
      ]),
      situaciones: this.fb.group({
        universidadPrivada: [false],
        fallecimientoPadres: [false],
        otrasDificultades: [false],
      }),
      justificacion: [''],
    });

    this.anexoCarnetForm = this.fb.group({
      urlConadis: [''],
      urlRequisitos: [''],
    });
  }

  ngOnInit(): void {
    this.selState.setServicio('TIPOS DE BECAS');

    onAuthStateChanged(this.auth, (user) => {
      if (user) this.datosPersonalesForm.get('uid')?.setValue(user.uid);
    });

    // Capturar el id del período activo (primer doc con estado == true)
    const perCol = collection(this.firestore, 'periodos');
    const perQ = query(perCol, where('estado', '==', true), limit(1));
    collectionData(perQ, { idField: 'id' }).subscribe((arr: any[]) => {
      this.periodoActivo = Array.isArray(arr) && arr.length > 0;
      this.periodoId = this.periodoActivo ? (arr[0].id as string) : '';
    });

    this.cargarEstudiantes();
  }

  private cargarEstudiantes() {
    this.loadingStudents = true;
    const usuariosCol = collection(this.firestore, 'usuarios');
    const qRef = query(usuariosCol, where('rol', '==', 'student'));
    this.students$ = collectionData(qRef, { idField: 'uid' }).pipe(
      map((rows) =>
        (rows as Usuario[])
          .filter((u) => (u.rol ?? '').toLowerCase() === 'student')
          .sort((a, b) =>
            (`${a.apellidos ?? ''} ${a.nombres ?? ''}`).localeCompare(
              `${b.apellidos ?? ''} ${b.nombres ?? ''}`,
              'es',
              { sensitivity: 'base' }
            )
          )
      )
    );

    this.students$.subscribe({
      next: (list) => {
        this.studentsCache = list;
        this.loadingStudents = false;
      },
      error: () => (this.loadingStudents = false),
    });
  }

  seleccionarBeca(b: string) {
    this.becaSeleccionada = b;
    this.selState.setServicio('TIPOS DE BECAS');
    this.selState.setBeca(b);

    this.datosPersonalesForm.patchValue({
      tipoServicio: 'TIPOS DE BECAS',
      tipoBeca: b,
    });

    this.etapaFormulario = 1;
  }

  onStudentChange(uid: string) {
    this.selectedStudentUid = uid || null;
    this.selectedStudent = this.studentsCache.find((u) => u.uid === uid) || null;

    this.datosPersonalesForm.get('uid')?.setValue(this.selectedStudentUid ?? '');

    if (this.selectedStudent) {
      const u = this.selectedStudent;
      const correo = u.correo ?? u.email ?? '';
      this.datosPersonalesForm.patchValue(
        {
          nombres: u.nombres ?? '',
          apellidos: u.apellidos ?? '',
          cedula: u.cedula ?? '',
          correo,
        },
        { emitEvent: false }
      );
    }
  }

  avanzarGrupoFamiliar(_: any) { this.etapaFormulario = 2; }
  regresarADatosPersonales() { this.etapaFormulario = 1; }
  avanzarDatosSocioeconomico(_: any) { this.etapaFormulario = 3; }
  avanzarDatosSalud(_: any) { this.etapaFormulario = 4; }
  avanzarDatosAnexoCarnet(_: any) { this.etapaFormulario = 5; }

  private syncSeleccionEnDatosPersonales(): void {
    this.datosPersonalesForm.patchValue({
      tipoServicio: 'TIPOS DE BECAS',
      tipoBeca: this.becaSeleccionada ?? '',
    });
  }

  enviarFormularioFinal(datos: any) {
    if (this.enviandoFormulario) return;

    this.syncSeleccionEnDatosPersonales();
    this.anexoCarnetForm.patchValue(datos ?? {});

    const formularioCompleto = {
      datosPersonales: this.datosPersonalesForm.value,
      grupoFamiliar: this.grupoFamiliarForm.value,
      datosSocioeconomicos: this.socioeconomicoForm.value,
      datosSalud: this.datosSaludForm.value,
      anexoCarnet: this.anexoCarnetForm.value,
      fechaEnvio: new Date(),
      estadoSoliticitud: true,
      estadoAprobacion: null,
      periodoId: this.periodoId, 
    };

    this.enviandoFormulario = true;

    this.postulacionService
      .guardarPostulacion(formularioCompleto)
      .then(() => {
        this.snackBar.open('Formulario enviado correctamente ✅', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success'],
        });
      })
      .catch((error) => {
        console.error(error);
        this.snackBar.open('Error al enviar el formulario ❌', 'Cerrar', {
          duration: 6000,
          panelClass: ['snackbar-error'],
        });
      })
      .finally(() => {
        this.enviandoFormulario = false;
      });
  }

  get vehiculosFA(): FormArray {
    return this.grupoFamiliarForm.get('vehiculos') as FormArray;
  }
  get integrantesFA(): FormArray {
    return this.socioeconomicoForm.get('integrantes') as FormArray;
  }
  get saludFA(): FormArray {
    return this.datosSaludForm.get('salud') as FormArray;
  }
}
