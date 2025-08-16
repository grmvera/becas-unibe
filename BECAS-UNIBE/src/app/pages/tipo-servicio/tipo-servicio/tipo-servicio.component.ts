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

  constructor(
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
    // Toggle y reinicio de flujo
    this.servicioSeleccionado = this.servicioSeleccionado === servicio ? null : servicio;
    this.becaSeleccionada = null;
    this.etapaFormulario = 1;
    this.datosPersonalesForm.get('tipoServicio')?.setValue(this.servicioSeleccionado);
    this.datosPersonalesForm.get('tipoBeca')?.setValue(null);
  }

  seleccionarBeca(beca: string) {
    this.becaSeleccionada = beca;
    this.datosPersonalesForm.get('tipoBeca')?.setValue(this.becaSeleccionada);
    this.etapaFormulario = 1; // Asegura arrancar desde el paso 1
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
    // Desde el componente de Salud
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
      estadoSoliticitud: true, // se mantiene el nombre usado previamente
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

  // --- trackBy para evitar errores y renders extra ---
  trackByServicio = (_: number, s: string) => s;
  trackByBeca = (_: number, b: string) => b;

  // (Opcional) utilidad de depuración
  logEtapa(origen: string) {
    console.log(`[Flujo] ${origen} -> etapa`, this.etapaFormulario, {
      servicio: this.servicioSeleccionado, beca: this.becaSeleccionada
    });
  }
}
