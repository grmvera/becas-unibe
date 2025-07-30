import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatosGrupoFamiliarComponent } from '../../../postulacion-formulario/datos-grupo-familiar/datos-grupo-familiar.component';
import { DatosPersonalesComponent } from '../../../postulacion-formulario/datos-personales/datos-personales.component';
import { DatosSocioeconomicoComponent } from '../../../postulacion-formulario/dato-socioeconomicos/dato-socioeconomicos.component';
import { DatoSaludComponent } from '../../../postulacion-formulario/dato-salud/dato-salud.component';
import { DatoDiscapacidadComponent } from '../../../postulacion-formulario/dato-discapacidad/dato-discapacidad.component';
import { AnexoCarnetComponent } from '../../../postulacion-formulario/anexo-carnet/anexo-carnet.component';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { PostulacionService } from '../../../shared/services/postulacion.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { collection, doc, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';


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
    DatoDiscapacidadComponent,
    AnexoCarnetComponent,
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
  datosDiscapacidadForm: FormGroup;
  anexoCarnetForm: FormGroup;

  enviandoFormulario = false;

  periodoActivo: any = null;
  periodoId: string = '';

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

  constructor(private fb: FormBuilder,
    private auth: Auth,
    private postulacionService: PostulacionService,
    private snackBar: MatSnackBar) {
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
    // Obtiene el usuario actual UID
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

    this.datosDiscapacidadForm = this.fb.group({
      tipoDiscapacidad: [''],
      grado: [0],
      causa: [''],
      rol: ['Estudiante'],
      lugarTrabajo: [''],
      educativas: [''],
      sociales: [''],
      descripcion: ['']
    });

    this.anexoCarnetForm = this.fb.group({
      urlConadis: [''],
      urlRequisitos: ['']
    });
  }

  get isBecaDiscapacidad(): boolean {
    return this.becaSeleccionada === 'Beca Discapacidad';
  }

  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = this.servicioSeleccionado === servicio ? null : servicio;
    this.becaSeleccionada = null;
    this.datosPersonalesForm.get('tipoServicio')?.setValue(this.servicioSeleccionado);
  }

  seleccionarBeca(beca: string) {
    this.becaSeleccionada = beca;
    this.datosPersonalesForm.get('tipoBeca')?.setValue(this.becaSeleccionada);
  }

  avanzarGrupoFamiliar(datos: any) {
    this.datosPersonalesForm.patchValue(datos);
    this.etapaFormulario = 2;
  }

  avanzarDatosSocioeconomico(datos: any) {
    this.grupoFamiliarForm.patchValue(datos);
    this.etapaFormulario = 3;
  }

  avanzarDatosSalud(datos: any) {
    this.socioeconomicoForm.patchValue(datos);
    this.etapaFormulario = 4;
  }

  avanzarDatosDiscapacidad(datos: any) {
    this.datosSaludForm.patchValue(datos);
    this.etapaFormulario = this.isBecaDiscapacidad ? 5 : 6;
  }

  avanzarDatosAnexoCarnet(datos: any) {
    this.anexoCarnetForm.patchValue(datos);
    this.etapaFormulario = 6;
  }

  enviarFormularioFinal(datos: any) {
    if (this.enviandoFormulario) return;

    this.socioeconomicoForm.patchValue(datos);

    const formularioCompleto = {
      datosPersonales: this.datosPersonalesForm.value,
      grupoFamiliar: this.grupoFamiliarForm.value,
      datosSocioeconomicos: this.socioeconomicoForm.value,
      datosSalud: this.datosSaludForm.value,
      datosDiscapacidad: this.datosDiscapacidadForm.value,
      anexoCarnet: this.anexoCarnetForm.value,
      fechaEnvio: new Date(),
      estadoSoliticitud: true,
      estadoAprobacion: null,
      periodoId: this.periodoId
    };

    this.enviandoFormulario = true;

    this.postulacionService.guardarPostulacion(formularioCompleto)
      .then(() => {
        console.log('✅ Formulario guardado exitosamente en Firestore');
        this.snackBar.open('Formulario enviado correctamente ✅', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
      })
      .catch(error => {
        console.error('❌ Error al guardar formulario:', error);
        this.snackBar.open('Error al enviar el formulario ❌', 'Cerrar', {
          duration: 6000,
          panelClass: ['snackbar-error']
        });
      })
      .finally(() => {
        this.enviandoFormulario = false;
      });
  }

  regresarADatosPersonales() {
    this.etapaFormulario = 1;
  }
  regresarADiscapacidad() { 
    this.etapaFormulario = 4; 
  }
}
