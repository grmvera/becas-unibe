import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatosGrupoFamiliarComponent } from '../../../postulacion-formulario/datos-grupo-familiar/datos-grupo-familiar.component';
import { DatosPersonalesComponent } from '../../../postulacion-formulario/datos-personales/datos-personales.component';
import { DatosSocioeconomicoComponent } from '../../../postulacion-formulario/dato-socioeconomicos/dato-socioeconomicos.component';
import { DatoSaludComponent } from '../../../postulacion-formulario/dato-salud/dato-salud.component';
import { AnexoCarnetComponent } from '../../../postulacion-formulario/anexo-carnet/anexo-carnet.component';
import { DatoGuarderiaComponent } from '../../../postulacion-formulario/dato-guarderia/dato-guarderia.component';

import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

import { PostulacionService } from '../../../shared/services/postulacion.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  addDoc, collection, doc, Firestore, getDoc, getDocs, query, where
} from '@angular/fire/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { SeleccionStateService } from '../../../core/services/seleccion-state.service';

@Component({
  selector: 'app-tipo-servicio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatosPersonalesComponent,
    DatosGrupoFamiliarComponent,
    DatosSocioeconomicoComponent,
    DatoSaludComponent,
    AnexoCarnetComponent,
    DatoGuarderiaComponent,
    MatSnackBarModule
  ],
  templateUrl: './tipo-servicio.component.html',
  styleUrls: ['./tipo-servicio.component.css']
})
export class TipoServicioComponent {
  categorias: string[] = [
    'Alimentos', 'Alquiler', 'Luz', 'Internet', 'Agua',
    'Telefono fijo', 'Medicina', 'TV cable', 'Educación', 'Transporte'
  ];

  tiposServicios = ['TIPOS DE BECAS', 'AYUDAS ECONÓMICAS', 'GUARDERÍA'];
  becas = [
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

  servicioSeleccionado: string | null = null;
  becaSeleccionada: string | null = null;
  etapaFormulario = 1;

  private firestore = inject(Firestore);

  datosPersonalesForm: FormGroup;
  grupoFamiliarForm: FormGroup;
  socioeconomicoForm: FormGroup;
  datosSaludForm: FormGroup;
  anexoCarnetForm: FormGroup;
  datosGuarderiaForm: FormGroup;

  enviandoFormulario = false;

  periodoActivo: any = null;
  periodoId: string = '';

  // --- NUEVO: textos para el panel de descripción ---
  servicioInfo: Record<string, { titulo: string; descripcion: string; requisitos?: string[] }> = {
    'TIPOS DE BECAS': {
      titulo: 'Postulación a Becas Institucionales',
      descripcion:
        'Selecciona un tipo de beca para continuar con tu postulación. La elegibilidad se evaluará con base en la documentación y la información proporcionada en el formulario.'
    },
    'AYUDAS ECONÓMICAS': {
      titulo: 'Ayudas Económicas',
      descripcion:
        'Apoyo económico temporal según evaluación socioeconómica del estudiante y su núcleo familiar.',
      requisitos: [
        'Completar la información socioeconómica.',
        'Adjuntar documentación de respaldo (si corresponde).'
      ]
    },
    'GUARDERÍA': {
      titulo: 'Servicio de Guardería',
      descripcion:
        'Apoyo para cuidado infantil durante el periodo académico activo para estudiantes que cumplan los criterios.',
      requisitos: [
        'Adjuntar el archivo requerido en la sección de guardería.',
        'Confirmar datos del estudiante y del menor a cargo (si aplica).'
      ]
    }
  };

  becaInfo: Record<string, { titulo: string; descripcion: string; requisitos?: string[] }> = {
    'Beca por Excelencia Académica': {
      titulo: 'Beca por Excelencia Académica',
      descripcion: 'Reconoce el alto rendimiento académico del estudiante.',
      requisitos: ['Historial académico actualizado.']
    },
    'Beca para Deportistas destacados': {
      titulo: 'Beca para Deportistas Destacados',
      descripcion:
        'Orienta su apoyo a estudiantes que representan a su institución o federación en competencias deportivas.',
      requisitos: ['Certificados o avales deportivos recientes.']
    },
    'Beca Socioeconómica': {
      titulo: 'Beca Socioeconómica',
      descripcion: 'Se asigna en función del análisis socioeconómico del hogar.',
      requisitos: ['Registro completo de gastos/ingresos.', 'Documentos de respaldo.']
    },
    'Beca por Actividades Culturales': {
      titulo: 'Beca por Actividades Culturales',
      descripcion:
        'Apoya la participación activa en actividades artísticas o culturales representativas.'
    },
    'Beca por Desarrollo Profesional': {
      titulo: 'Beca por Desarrollo Profesional',
      descripcion:
        'Fomenta la participación en proyectos, voluntariados y formación complementaria.'
    },
    'Beca Honorífica': {
      titulo: 'Beca Honorífica',
      descripcion: 'Reconoce méritos institucionales y/o comunitarios destacados.'
    },
    'Beca SNNA': {
      titulo: 'Beca SNNA',
      descripcion:
        'Asignación sujeta a lineamientos y cumplimiento de requisitos establecidos por la institución.'
    },
    'Beca víctimas violencia de género': {
      titulo: 'Beca para Víctimas de Violencia de Género',
      descripcion: 'Apoya a estudiantes que acrediten situaciones de violencia de género.',
      requisitos: ['Documentación o constancias pertinentes.']
    },
    'Beca Discapacidad': {
      titulo: 'Beca por Discapacidad',
      descripcion: 'Apoya a estudiantes con discapacidad acreditada.',
      requisitos: ['Carnet/constancia vigente según corresponda.']
    }
  };

  constructor(
    private selState: SeleccionStateService,
    private fb: FormBuilder,
    private auth: Auth,
    private postulacionService: PostulacionService,
    private snackBar: MatSnackBar
  ) {
    // --- Formularios ---
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
        sector: ['']
      })
    });

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.datosPersonalesForm.get('uid')?.setValue(user.uid);
      } else {
        console.warn('Usuario no autenticado.');
      }
    });

    this.grupoFamiliarForm = this.fb.group({
      tipoVivienda: [''],
      gastos: this.fb.group(
        Object.fromEntries(this.categorias.map(c => [c, [0]]))
      ),
      nota: [''],
      vehiculos: this.fb.array([
        this.fb.group({
          tipo: ['Automóvil'],
          marca: [''],
          modelo: [''],
          anio: ['']
        })
      ])
    });

    this.socioeconomicoForm = this.fb.group({
      integrantes: this.fb.array([
        this.fb.group({
          parentesco: ['Postulante'],
          nombre: [''],
          apellido: [''],
          actividad: [''],
          ingresos: [0],
          ingresosComplementarios: [0]
        })
      ])
    });

    this.datosSaludForm = this.fb.group({
      salud: this.fb.array([
        this.fb.group({
          parentesco: ['Postulante'],
          problema: ['Ninguna'],
          ayuda: ['Sí']
        })
      ]),
      situaciones: this.fb.group({
        universidadPrivada: [false],
        fallecimientoPadres: [false],
        otrasDificultades: [false]
      }),
      justificacion: ['']
    });

    this.anexoCarnetForm = this.fb.group({
      urlConadis: [''],
      urlRequisitos: ['']
    });

    this.datosGuarderiaForm = this.fb.group({
      urlguarderia: [''],
    });
  }

  async ngOnInit() {
    const periodosRef = collection(this.firestore, 'periodos');
    const q = query(periodosRef, where('estado', '==', true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0];
      const data = docRef.data();
      this.periodoId = docRef.id;

      const detallesRef = doc(this.firestore, `periodos/${docRef.id}/informacionPublica/detalles`);
      const detallesSnap = await getDoc(detallesRef);

      this.periodoActivo = detallesSnap.exists()
        ? { ...data, ...detallesSnap.data() }
        : data;
    }
  }

  // -------- Navegación / Selección ----------
  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = this.servicioSeleccionado === servicio ? null : servicio;
    this.becaSeleccionada = null;
    this.selState.setServicio(this.servicioSeleccionado);
    this.selState.setBeca(null);
    this.etapaFormulario = 1;
  }

  seleccionarBeca(beca: string) {
    this.becaSeleccionada = beca;
    this.selState.setBeca(beca);
    if (!this.selState.servicioActual) this.selState.setServicio(this.servicioSeleccionado ?? null);
    this.etapaFormulario = 1;
  }

  // -------- Avances entre pasos (becas/ayudas) ----------
  avanzarGrupoFamiliar(datos: any) {
    this.datosPersonalesForm.patchValue(datos ?? {});
    this.etapaFormulario = 2;
  }

  avanzarDatosSocioeconomico(datos: any) {
    this.grupoFamiliarForm.patchValue(datos ?? {});
    this.etapaFormulario = 3;
  }

  avanzarDatosSalud(datos: any) {
    this.socioeconomicoForm.patchValue(datos ?? {});
    this.etapaFormulario = 4;
  }

  avanzarDatosAnexoCarnet(datos: any) {
    this.datosSaludForm.patchValue(datos ?? {});
    this.etapaFormulario = 5;
  }

  formularioGuarderia(datos: any) {
    this.datosGuarderiaForm.patchValue(datos ?? {});
  }

  // -------- Envíos ----------
  async enviarFormularioGuarderia(formData: FormData) {
    if (this.enviandoFormulario) return;
    this.enviandoFormulario = true;

    try {
      const file = formData.get('archivo') as File | null;
      if (!file) throw new Error('No se ha seleccionado ningún archivo.');

      const storageInstance = getStorage();
      const storageRef = ref(storageInstance, `guarderia/${this.periodoId}/${file.name}`);

      const uploadSnap = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadSnap.ref);

      const nuevaPostulacion = {
        tipoServicio: 'GUARDERÍA',
        anexoGuarderiaUrl: downloadURL,
        periodoId: this.periodoId,
        uid: this.datosPersonalesForm.get('uid')?.value,
        fechaEnvio: new Date(),
        estadoSolicitud: true,
        estadoAprobacion: null
      };

      await addDoc(collection(this.firestore, 'postulaciones'), nuevaPostulacion);

      this.snackBar.open('✅ Formulario de guardería enviado correctamente', 'Cerrar', {
        duration: 5000, panelClass: ['snackbar-success']
      });

    } catch (err) {
      console.error(err);
      this.snackBar.open('❌ Error al enviar el formulario de guardería', 'Cerrar', {
        duration: 6000, panelClass: ['snackbar-error']
      });
    } finally {
      this.enviandoFormulario = false;
    }
  }

  enviarFormularioFinal(datos: any) {
    if (this.enviandoFormulario) return;

    // $event viene desde AnexoCarnet => parchar al form correcto
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
      periodoId: this.periodoId
    };

    this.enviandoFormulario = true;

    this.postulacionService.guardarPostulacion(formularioCompleto)
      .then(() => {
        this.snackBar.open('Formulario enviado correctamente ✅', 'Cerrar', {
          duration: 5000, panelClass: ['snackbar-success']
        });
      })
      .catch(error => {
        console.error(error);
        this.snackBar.open('Error al enviar el formulario ❌', 'Cerrar', {
          duration: 6000, panelClass: ['snackbar-error']
        });
      })
      .finally(() => {
        this.enviandoFormulario = false;
      });
  }

  regresarADatosPersonales() {
    this.etapaFormulario = 1;
  }

  // --- trackBy para evitar renders extra ---
  trackByServicio = (_: number, s: string) => s;
  trackByBeca = (_: number, b: string) => b;

  logEtapa(origen: string) {
    console.log(`[Flujo] ${origen} -> etapa`, this.etapaFormulario, {
      servicio: this.servicioSeleccionado, beca: this.becaSeleccionada
    });
  }

  // ---------- Getters para el panel de descripción ----------
  get tituloSeleccion(): string {
    if (!this.servicioSeleccionado) return '';
    if (this.servicioSeleccionado === 'TIPOS DE BECAS' && this.becaSeleccionada) {
      return this.becaInfo[this.becaSeleccionada]?.titulo ?? this.becaSeleccionada;
    }
    return this.servicioInfo[this.servicioSeleccionado]?.titulo ?? this.servicioSeleccionado;
  }

  get descripcionSeleccion(): string {
    if (!this.servicioSeleccionado) return '';
    const sDesc = this.servicioInfo[this.servicioSeleccionado]?.descripcion ?? '';
    if (this.servicioSeleccionado === 'TIPOS DE BECAS' && this.becaSeleccionada) {
      const bDesc = this.becaInfo[this.becaSeleccionada]?.descripcion ?? '';
      return bDesc || sDesc;
    }
    return sDesc;
  }

  get requisitosSeleccion(): string[] {
    if (!this.servicioSeleccionado) return [];
    const base = this.servicioInfo[this.servicioSeleccionado]?.requisitos ?? [];
    if (this.servicioSeleccionado === 'TIPOS DE BECAS' && this.becaSeleccionada) {
      const extra = this.becaInfo[this.becaSeleccionada]?.requisitos ?? [];
      return [...extra];
    }
    return base;
  }

  // ---------- Lógica para mostrar/ocultar formulario ----------
  get puedeMostrarFormulario(): boolean {
    if (!this.servicioSeleccionado) return false;
    if (this.servicioSeleccionado === 'TIPOS DE BECAS') {
      return !!this.becaSeleccionada;
    }
    return true;
  }

  /** Texto del aviso cuando aún no se puede mostrar el formulario */
  get textoAviso(): string {
    if (!this.servicioSeleccionado) {
      return 'Selecciona un tipo de servicio para continuar con la postulación.';
    }
    if (this.servicioSeleccionado === 'TIPOS DE BECAS' && !this.becaSeleccionada) {
      return 'Selecciona una beca para continuar con el formulario.';
    }
    return '';
  }
}
