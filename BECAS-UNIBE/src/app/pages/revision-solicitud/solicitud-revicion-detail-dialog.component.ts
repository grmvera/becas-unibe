import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-solicitud-revicion-detail-dialog',
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
            <label>Servicio</label>
            <div class="value">{{ data.tipoServicio }}</div>
          </div>

          <div class="detail">
            <label>Fecha</label>
            <div class="value">{{ data.fechaSolicitud }}</div>
          </div>

          <div class="detail full">
            <label>Justificación</label>
            <div class="value pre">
              {{ data.descipcion || data.descripcion || '—' }}
            </div>
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

      <!-- RESULTADO / OBSERVACIONES -->
      <section class="section-card">
        <h3 class="section-title">Resultado de la revisión</h3>

        <div class="details-grid">
          <div class="detail">
            <label>Estado</label>
            <div class="value">
              {{ statusLabel }}
            </div>
          </div>

          <div class="detail full">
            <label>Observaciones</label>
            <div class="value pre">
              {{ data.observaciones || '—' }}
            </div>
          </div>
        </div>
      </section>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button class="btn ghost" (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Ensancha el panel del diálogo (horizontal real) */
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
    .title-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .status-pill {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid #e5e7eb;
      background: #f8fafc;
      color: #334155;
    }
    .status-pill.ok {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .status-pill.bad {
      background: #fef2f2;
      color: #7f1d1d;
      border-color: #fecaca;
    }
    .status-pill.neutral {
      background: #f1f5f9;
      color: #334155;
      border-color: #e2e8f0;
    }

    /* ---------- Contenido ---------- */
    .dialog-content {
      max-height: 70vh;
      overflow: auto;
      padding-bottom: .5rem;
    }

    .section-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
    }

    .section-title {
      margin: 0 0 12px 0;
      font-size: .95rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* GRID responsive */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px 16px;
    }

    .detail {
      display: grid;
      grid-template-columns: 120px 1fr;
      align-items: start;
      gap: 8px;
      min-width: 0;
      background: #fafafa;
      border: 1px dashed #e5e7eb;
      border-radius: 10px;
      padding: 10px 12px;
    }

    .detail.full {
      grid-column: 1 / -1;
    }

    .detail label {
      font-weight: 700;
      color: #334155;
      white-space: nowrap;
    }

    .value {
      color: #0f172a;
      min-width: 0;
      word-break: break-word;
    }

    .value.pre {
      white-space: pre-wrap;
      line-height: 1.45;
    }

    /* ---------- Archivos ---------- */
    .files-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }

    .file-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 8px 12px;
    }

    .file-chip.empty {
      opacity: .7;
    }

    .file-label {
      font-weight: 700;
      color: #334155;
      white-space: nowrap;
    }

    .file-btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      padding: 6px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 600;
    }
    .file-btn:hover { background: #f1f5f9; }

    .file-none {
      color: #64748b;
      font-style: italic;
    }

    /* ---------- Acciones ---------- */
    .dialog-actions {
      position: sticky;
      bottom: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.6), #fff 60%);
      padding-top: 10px;
    }

    .btn {
      padding: 10px 16px;
      border-radius: 10px;
      font-weight: 700;
      border: 1px solid transparent;
      cursor: pointer;
    }
    .btn.ghost {
      background: #fff;
      border-color: #cbd5e1;
      color: #334155;
    }
    .btn.ghost:hover { background: #f8fafc; }

    /* ---------- Breakpoints ---------- */
    @media (max-width: 840px) {
      .detail { grid-template-columns: 100px 1fr; }
      .dialog-content { max-height: 66vh; }
    }
    @media (max-width: 620px) {
      .detail { grid-template-columns: 1fr; }
      .detail label { white-space: normal; }
      .title-text { display: none; }
    }
  `]
})
export class SolicitudRevicionDetailDialogComponent {
  approved!: boolean | null;
  observations!: string;

  constructor(
    private dialogRef: MatDialogRef<SolicitudRevicionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.approved     = data?.estadoAprobacion ?? null;
    this.observations = data?.observaciones || '';
  }

  get statusLabel(): string {
    if (this.data?.estadoAprobacion === true) return 'Aprobado';
    if (this.data?.estadoAprobacion === false) return 'Rechazado';
    return 'Sin revisar';
  }

  close() {
    this.dialogRef.close();
  }

  descargaArchivo(url: string) {
    if (!url || url === 'No posee archivos') return;
    window.open(url, '_blank');
  }
}
