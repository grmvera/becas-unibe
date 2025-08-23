import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { SolicitudDetailDialogComponent } from './solicitud-detail-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-lista-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-solicitud.component.html',
  styleUrls: ['./lista-solicitud.component.css']
})
export class ListaSolicitudComponent implements OnInit {
  private dialog = inject(MatDialog);
  postulaciones$: Observable<any[]> | undefined;
  busquedaCedula: string = '';
  busquedaPeriodo: string = '';
  periodos: { id: string; nombrePeriodo: string }[] = [];

  postulacionesData: any[] = [];

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    // ===== Cargar periodos =====
    const periodosRef = collection(this.firestore, 'periodos');
    collectionData(periodosRef, { idField: 'id' })
      .pipe(
        tap((lista: any[]) => {
          this.periodos = lista.map(p => ({
            id: p.id,
            nombrePeriodo: p.nombrePeriodo
          }));
        })
      )
      .subscribe();

    // ===== Cargar postulaciones + datos mostrables en la tabla =====
    const colRef = collection(this.firestore, 'postulaciones');

    this.postulaciones$ = collectionData(colRef, { idField: 'id' }).pipe(
      switchMap((postulaciones: any[]) => {
        const solicitudesConUsuario = postulaciones.map(async (p) => {
          // datos del usuario
          const uid = p.datosPersonales?.uid || p.uid;
          const userRef = doc(this.firestore, `usuarios/${uid}`);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          // periodo
          const periodoId = p.periodoId;
          const periodoRef = doc(this.firestore, `periodos/${periodoId}`);
          const periodoSnap = await getDoc(periodoRef);
          const periodoData = periodoSnap.exists() ? periodoSnap.data() : {};

          return {
            id: p.id,
            cedulaUsuario: (userData as any)['cedula'] || 'Cédula no encontrada',
            nombreUsuario: (((userData as any)['nombres'] || '') + ' ' + ((userData as any)['apellidos'] || '')).trim() || 'Nombre no encontrado',
            correoUsuario: (userData as any)['correo'] || 'Correo no encontrado',
            descipcion: p.datosSalud?.justificacion || 'No posee justificación encontrado',
            archivosConadis: p.anexoCarnet?.urlConadis || 'No posee archivos',
            archivosRequisitos: p.anexoCarnet?.urlRequisitos || 'No posee archivos',
            archivosguarderia: p.anexoGuarderiaUrl || 'No posee archivos',
            periodo: (periodoData as any)['nombrePeriodo'] || 'Periodo no encontrado',
            tipoBeca: p.datosPersonales?.tipoBeca || 'Tipo de beca no especificado',
            tipoServicio: p.datosPersonales?.tipoServicio || p.tipoServicio || 'tipo de servicio no especificado',
            fechaSolicitud: this.formatearFecha(p.fechaEnvio),
            estadoAprobacion: p.estadoAprobacion,
          };
        });

        return forkJoin(solicitudesConUsuario);
      })
    );

    this.postulaciones$.subscribe((data) => {
      this.postulacionesData = data;
    });
  }

  filtradasPorCedula(lista: any[]) {
    return lista.filter(p =>
      p.cedulaUsuario?.toLowerCase().includes(this.busquedaCedula.toLowerCase())
    );
  }

  filtrarPorPeriodo(lista: any[]) {
    return lista.filter(p => p.periodo?.toLowerCase().includes(this.busquedaPeriodo.toLowerCase()));
  }

  get postulacionesFiltradas() {
    return this.postulacionesData
      .filter(p =>
        p.cedulaUsuario.toLowerCase().includes(this.busquedaCedula.toLowerCase())
      )
      .filter(p =>
        this.busquedaPeriodo === '' || this.busquedaPeriodo === 'Todos'
          ? true
          : p.periodo.toLowerCase() === this.busquedaPeriodo.toLowerCase()
      );
  }

  formatearFecha(fechaFirebase: any): string {
    if (!fechaFirebase || !fechaFirebase.seconds) return 'Fecha no válida';
    const date = new Date(fechaFirebase.seconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  // ======= RÚBRICA (Tipo de puntuación basado en tu planilla) =======
  private norm(s: any): string { return (s || '').toString().trim().toLowerCase(); }
  private toNum(v: any): number { return (typeof v === 'number' && isFinite(v)) ? v : 0; }

  private puntuarEstadoCivil(estadoCivilTxt: string, tieneHijos: boolean): number {
    const ec = this.norm(estadoCivilTxt);
    if (tieneHijos) {
      if (ec.includes('soltero') || ec.includes('viudo') || ec.includes('divorciado')) return 3;
      if (ec.includes('casado') || ec.includes('union') || ec.includes('unión')) return 2;
    } else {
      if (ec) return 1;
    }
    return 0;
  }

  private puntuarSectorVivienda(sectorTxt: string): number {
    const s = this.norm(sectorTxt);
    if (s.includes('parroquia') || s.includes('rural')) return 2;
    if (s.includes('quito')) return 1; 
    return 0;
  }

  private puntuarSituacionInmueble(tipoViviendaTxt: string): number {
    const t = this.norm(tipoViviendaTxt);
    if (t.includes('alquil')) return 2;
    if (t.includes('cedida') || t.includes('prestada') || t.includes('prestamo') || t.includes('préstamo')) return 1;
    if (t.includes('propia')) return 0;
    return 0;
  }

  private puntuarEgresoFamiliar(gastosTotales: number): number {
    if (gastosTotales <= 500) return 3;
    if (gastosTotales <= 1000) return 2;
    if (gastosTotales <= 2000) return 1;
    return 0;
  }

  private puntuarIngresoFamiliar(ingresosTotales: number): number {
    if (ingresosTotales < 500) return 4;
    if (ingresosTotales <= 1000) return 3;
    if (ingresosTotales <= 1500) return 2;
    if (ingresosTotales <= 2000) return 1;
    return 0;
  }

  private puntuarNumeroMiembros(personas: number): number {
    if (personas >= 5 && personas <= 7) return 2;
    if (personas >= 3 && personas <= 4) return 1;
    return 0; // 1–2
  }

  private puntuarTipoEmpleo(tipoEmpleoTxt: string): number {
    const t = this.norm(tipoEmpleoTxt);
    if (!t || t.includes('sin trabajo') || t.includes('desempleado')) return 4;
    if (t.includes('negocio') || t.includes('propio') || t.includes('autoempleo') || t.includes('emprend')) return 3;
    if (t.includes('jubil')) return 2;
    if (t.includes('privad')) return 1;
    if (t.includes('públic') || t.includes('publico') || t.includes('publica')) return 1;
    return 0;
  }

  private puntuarSalud(registros: any[], contarConadis: boolean, conadisUrl?: string): number {
    const tieneConadis = contarConadis && !!conadisUrl;
    if (tieneConadis) return 2;
    const anyDiscap = registros?.some(r => this.norm(r?.problema).includes('discap'));
    const anyCronica = registros?.some(r => this.norm(r?.problema).includes('crón') || this.norm(r?.problema).includes('cron'));
    return (anyDiscap || anyCronica) ? 2 : 0;
  }

  /** Calcula la rúbrica total (máx 26) según tu planilla */
  private calcularRubricaDePlanilla(post: any) {
    const integrantes: any[] = Array.isArray(post?.datosSocioeconomicos?.integrantes)
      ? post.datosSocioeconomicos.integrantes : [];
    const personas = Math.max(integrantes.length || 0, 1);

    const ingresosTotales = integrantes.reduce((acc, it) =>
      acc + this.toNum(it?.ingresos) + this.toNum(it?.ingresosComplementarios), 0);

    const gastosObj = post?.grupoFamiliar?.gastos || {};
    const gastosTotales = Object.values(gastosObj).reduce((acc: number, g: any) => acc + this.toNum(g), 0);

    // Datos texto
    const estadoCivilTxt = post?.datosPersonales?.estadoCivil || ''; 
    const tieneHijos = integrantes.some(i => this.norm(i?.parentesco).includes('hijo')) ||
      this.norm(estadoCivilTxt).includes('con hijos');
    const sectorTxt = post?.datosPersonales?.direccion?.sector || post?.datosPersonales?.direccion?.barrio || '';
    const tipoViviendaTxt = post?.grupoFamiliar?.tipoVivienda || '';
    const poseeVehiculo = Array.isArray(post?.grupoFamiliar?.vehiculos) && post.grupoFamiliar.vehiculos.length > 0;
    const tipoEmpleoTxt = post?.datosPersonales?.empleo || '';

    // Salud
    const saludArr = Array.isArray(post?.datosSalud?.salud) ? post.datosSalud.salud : [];
    const saludPost = saludArr.filter((s: any) => this.norm(s?.parentesco).includes('postulante'));
    const saludFam = saludArr.filter((s: any) => !this.norm(s?.parentesco).includes('postulante'));
    const urlConadis = post?.anexoCarnet?.urlConadis;

    // Situaciones particulares
    const sit = post?.datosSalud?.situaciones || {};
    let p11 = 0;
    if (sit?.fallecimientoPadres) p11 = 3;
    else if (sit?.otrasDificultades) p11 = 2;
    else if (sit?.universidadPrivada) p11 = 1; 

    // Puntajes
    const p1 = this.puntuarEstadoCivil(estadoCivilTxt, tieneHijos);
    const p2 = this.puntuarSectorVivienda(sectorTxt);
    const p3 = this.puntuarSituacionInmueble(tipoViviendaTxt);
    const p4 = this.puntuarEgresoFamiliar(gastosTotales);
    const p5 = poseeVehiculo ? 0 : 1;
    const p6 = this.puntuarIngresoFamiliar(ingresosTotales);
    const p7 = this.puntuarNumeroMiembros(personas);
    const p8 = this.puntuarTipoEmpleo(tipoEmpleoTxt);
    const p9 = this.puntuarSalud(saludPost, true, urlConadis);
    const p10 = this.puntuarSalud(saludFam, false);

    const total = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10 + p11;

    const breakdown = {
      estadoCivil: p1,
      sectorVivienda: p2,
      situacionInmueble: p3,
      egresoFamiliar: p4,
      poseeVehiculo: p5,
      ingresoFamiliar: p6,
      numeroMiembros: p7,
      tipoEmpleo: p8,
      saludPostulante: p9,
      saludFamilia: p10,
      situacionesParticulares: p11,
      total,
      debug: {
        personas, ingresosTotales, gastosTotales, estadoCivilTxt, tieneHijos,
        sectorTxt, tipoViviendaTxt, poseeVehiculo, tipoEmpleoTxt,
        urlConadis, saludArr, sit
      }
    };
    return breakdown;
  }

  // ===== Abre el modal cargando la postulación COMPLETA y la puntuación =====
  async openDialog(solicitud: any) {
    try {
      const ref = doc(this.firestore, `postulaciones/${solicitud.id}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.warn('⚠️ No existe la postulación con id:', solicitud.id);
        return;
      }

      const postulacionCompleta = { id: snap.id, ...snap.data() };
      const rubrica = this.calcularRubricaDePlanilla(postulacionCompleta);

      this.dialog.open(SolicitudDetailDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { ...postulacionCompleta, ...solicitud, __rubrica: rubrica },
      });

    } catch (err) {
      console.error('❌ Error al cargar la postulación completa:', err);
    }
  }

}
