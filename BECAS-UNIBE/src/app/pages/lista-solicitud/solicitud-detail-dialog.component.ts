import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  standalone: true,
  selector: 'app-solicitud-detail-dialog',
  imports: [CommonModule, MatDialogModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="title-left">
        <span class="title-badge">{{ data.tipoServicio || 'Solicitud' }}</span>
        <span class="title-text">Detalle de la Solicitud</span>
      </span>

      <span class="status-pill" [class.ok]="data.estadoAprobacion===true"
                                [class.bad]="data.estadoAprobacion===false"
                                [class.neutral]="data.estadoAprobacion===null || data.estadoAprobacion===undefined">
        {{ statusLabel }}
      </span>
    </h2>

    <mat-dialog-content class="dialog-content">
      <!-- DATOS PRINCIPALES -->
      <section class="section-card">
        <h3 class="section-title">Datos de la solicitud</h3>

        <div class="details-grid">
          <div class="detail">
            <label>Periodo</label>
            <div class="value">{{ data.periodo }}</div>
          </div>

          <div class="detail">
            <label>Cédula</label>
            <div class="value">{{ data.cedulaUsuario }}</div>
          </div>

          <div class="detail">
            <label>Nombre</label>
            <div class="value">{{ data.nombreUsuario }}</div>
          </div>

          <div class="detail">
            <label>Correo</label>
            <div class="value email">{{ data.correoUsuario }}</div>
          </div>

          <div class="detail">
            <label>Servicio</label>
            <div class="value">{{ data.tipoServicio }}</div>
          </div>

          <div class="detail">
            <label>Fecha</label>
            <div class="value">{{ data.fechaSolicitud }}</div>
          </div>

          <div class="detail">
            <label>Carrera</label>
            <div class="value">{{ data.carrera || '—' }}</div>
          </div>

          <div class="detail">
            <label>Semestre</label>
            <div class="value">{{ data.semestre || '—' }}</div>
          </div>

          <div class="detail full">
            <label>Justificación</label>
            <div class="value pre">
              {{ data.descipcion || data.descripcion || '—' }}
            </div>
          </div>
        </div>
      </section>
      
      <!-- PUNTUACION -->
      <section class="section-card">
        <h3 class="section-title">Puntuación</h3>

        <div class="details-grid">
          <div class="detail">
            <label>Puntuacion</label>
            <!-- SOLO CAMBIO: texto directo -->
            <div class="value" [textContent]="displayTotal"></div>
          </div>

          <div class="detail">
            <label>Beca %</label>
            <!-- SOLO CAMBIO: texto directo -->
            <div class="value" [textContent]="displayPct"></div>
          </div>
        </div>
      </section>

      <!-- ARCHIVOS -->
      <section class="section-card">
        <h3 class="section-title">Archivos adjuntos</h3>

        <div class="files-row" *ngIf="data.tipoServicio==='TIPOS DE BECAS' || data.tipoServicio==='AYUDAS ECONÓMICAS'">
          <div class="file-chip" [class.empty]="data.archivosConadis==='No posee archivos'">
            <span class="file-label">📎 Conadis</span>
            <button class="file-btn" *ngIf="data.archivosConadis!=='No posee archivos'"
                    (click)="descargaArchivo(data.archivosConadis)">⬇️ Descargar</button>
            <span class="file-none" *ngIf="data.archivosConadis==='No posee archivos'">No posee</span>
          </div>

          <div class="file-chip" [class.empty]="data.archivosRequisitos==='No posee archivos'">
            <span class="file-label">📎 Requisitos</span>
            <button class="file-btn" *ngIf="data.archivosRequisitos!=='No posee archivos'"
                    (click)="descargaArchivo(data.archivosRequisitos)">⬇️ Descargar</button>
            <span class="file-none" *ngIf="data.archivosRequisitos==='No posee archivos'">No posee</span>
          </div>
        </div>

        <div class="files-row" *ngIf="data.tipoServicio==='GUARDERÍA'">
          <div class="file-chip" [class.empty]="data.archivosguarderia==='No posee archivos'">
            <span class="file-label">📎 Guardería</span>
            <button class="file-btn" *ngIf="data.archivosguarderia!=='No posee archivos'"
                    (click)="descargaArchivo(data.archivosguarderia)">⬇️ Descargar</button>
            <span class="file-none" *ngIf="data.archivosguarderia==='No posee archivos'">No posee</span>
          </div>
        </div>
      </section>

      <!-- REVISIÓN -->
      <section class="section-card">
        <h3 class="section-title">Revisión</h3>

        <div class="status-options">
          <label class="radio-pill">
            <input type="radio" name="status" [(ngModel)]="approved" [value]="true" />
            Aprobado
          </label>
          <label class="radio-pill">
            <input type="radio" name="status" [(ngModel)]="approved" [value]="false" />
            Rechazado
          </label>
          <label class="radio-pill">
            <input type="radio" name="status" [(ngModel)]="approved" [value]="null" />
            Sin revisar
          </label>
        </div>

        <div class="obs-field">
          <label for="obs">Observaciones</label>
          <textarea id="obs" rows="4" [(ngModel)]="observations"
                    placeholder="Añade un comentario para el estudiante..."></textarea>
        </div>
      </section>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button class="btn ghost" (click)="close()" [disabled]="saving">Cancelar</button>
      <button class="btn primary" (click)="save()" [disabled]="saving">
        {{ saving ? 'Guardando…' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,

  styles: [`
    /* Ensancha el panel del diálogo (horizontal de verdad) */
    :host ::ng-deep .cdk-overlay-pane.mat-mdc-dialog-panel {
      max-width: 96vw !important;
      width: clamp(980px, 85vw, 1280px) !important;
    }

    /* ---------- Título ---------- */
    .dialog-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .title-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .title-badge {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .04em;
      background: #eef2ff;
      color: #3730a3;
      white-space: nowrap;
    }
    .title-text { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .status-pill {
      padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
      border: 1px solid #e5e7eb; background: #f8fafc; color: #334155;
    }
    .status-pill.ok { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
    .status-pill.bad { background: #fef2f2; color: #7f1d1d; border-color: #fecaca; }
    .status-pill.neutral { background: #f1f5f9; color: #334155; border-color: #e2e8f0; }

    .dialog-content { max-height: 70vh; overflow: auto; padding-bottom: .5rem; }
    .section-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; margin-bottom: 14px; box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05); }
    .section-title { margin: 0 0 12px 0; font-size: .95rem; font-weight: 800; color: #0f172a; }

    .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px 16px; }
    .detail {
      display: grid; grid-template-columns: 120px 1fr; align-items: start; gap: 8px; min-width: 0;
      background: #fafafa; border: 1px dashed #e5e7eb; border-radius: 10px; padding: 10px 12px;
    }
    .detail.full { grid-column: 1 / -1; }
    .detail label { font-weight: 700; color: #334155; white-space: nowrap; }
    .value { color: #0f172a; min-width: 0; word-break: break-word; }
    .value.pre { white-space: pre-wrap; line-height: 1.45; }
    .value.email { overflow-wrap: anywhere; }

    .files-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .file-chip { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; padding: 8px 12px; }
    .file-chip.empty { opacity: .7; }
    .file-label { font-weight: 700; color: #334155; white-space: nowrap; }
    .file-btn { border: 1px solid #cbd5e1; background: #fff; padding: 6px 10px; border-radius: 999px; cursor: pointer; font-weight: 600; }
    .file-btn:hover { background: #f1f5f9; }
    .file-none { color: #64748b; font-style: italic; }

    .status-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .radio-pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #e5e7eb; border-radius: 999px; padding: 6px 10px; background: #fff; cursor: pointer; user-select: none; font-weight: 600; color: #334155; }
    .radio-pill input { accent-color: #2563eb; transform: scale(1.1); }

    .obs-field { display: grid; gap: 6px; }
    .obs-field label { font-weight: 700; color: #334155; }
    .obs-field textarea { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-family: inherit; font-size: .95rem; min-height: 100px; resize: vertical; background: #fff; }

    .dialog-actions { position: sticky; bottom: 0; background: linear-gradient(180deg, rgba(255,255,255,0.6), #fff 60%); padding-top: 10px; }
    .btn { padding: 10px 16px; border-radius: 10px; font-weight: 700; border: 1px solid transparent; cursor: pointer; }
    .btn.ghost { background: #fff; border-color: #cbd5e1; color: #334155; }
    .btn.ghost:hover { background: #f8fafc; }
    .btn.primary { background: #2563eb; color: #fff; }
    .btn.primary[disabled] { opacity: .7; cursor: default; }
    .btn.primary:hover:not([disabled]) { filter: brightness(0.95); }

    @media (max-width: 840px) { .detail { grid-template-columns: 100px 1fr; } .dialog-content { max-height: 66vh; } }
    @media (max-width: 620px) { .detail { grid-template-columns: 1fr; } .detail label { white-space: normal; } .title-text { display: none; } }
  `]
})
export class SolicitudDetailDialogComponent {
  approved!: boolean | null;
  observations!: string;
  saving = false;

  // valores para Puntuación
  rubrica: any | null = null;
  scoreTotal: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<SolicitudDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private firestore: Firestore
  ) {
    this.approved = data.estadoAprobacion;
    this.observations = data.observaciones || '';

    // llega desde ListaSolicitudComponent como __rubrica
    this.rubrica = data.__rubrica ?? null;
    this.scoreTotal = (this.rubrica && typeof this.rubrica.total === 'number')
      ? this.rubrica.total
      : (typeof this.data?.__rubrica?.total === 'number' ? this.data.__rubrica.total : null);
  }

  // Lo muestro como textos ya formateados (sin tocar estilos)
  get displayTotal(): string {
    const t = this.scoreTotal;
    return (t !== null && t !== undefined) ? `${t} / 26` : '—';
  }
  get displayPct(): string {
    const t = this.scoreTotal;
    return (t !== null && t !== undefined) ? `${Math.round((t / 26) * 100)}%` : '—';
  }

  get statusLabel(): string {
    if (this.data?.estadoAprobacion === true) return 'Aprobado';
    if (this.data?.estadoAprobacion === false) return 'Rechazado';
    return 'Sin revisar';
  }

  close() { this.dialogRef.close(); }

  descargaArchivo(url: string) {
    if (!url || url === 'No posee archivos') return;
    window.open(url, '_blank');
  }

  async save() {
    this.saving = true;
    try {
      const refDoc = doc(this.firestore, 'postulaciones', this.data.id);
      await updateDoc(refDoc, {
        estadoAprobacion: this.approved,
        observaciones: this.observations
      });
      this.dialogRef.close({ estadoAprobacion: this.approved, observaciones: this.observations });
    } catch (err) {
      console.error('Error guardando revisión:', err);
      alert('Ocurrió un error al guardar. Inténtalo nuevamente.');
    } finally {
      this.saving = false;
    }
  }
}
