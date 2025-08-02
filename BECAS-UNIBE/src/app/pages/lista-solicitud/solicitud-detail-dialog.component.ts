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
    <h2 mat-dialog-title>Detalle de la Solicitud</h2>

    <mat-dialog-content class="dialog-content">
      <!-- tus datos y descargas -->
      <div class="info-row"><span>Periodo:</span> {{data.periodo}}</div>
      <div class="info-row"><span>Cédula:</span> {{data.cedulaUsuario}}</div>
      <div class="info-row"><span>Nombre:</span> {{data.nombreUsuario}}</div>
      <div class="info-row"><span>Correo:</span> {{data.correoUsuario}}</div>
      <div class="info-row"><span>Servicio:</span> {{data.tipoServicio}}</div>
      <div class="info-row"><span>Fecha:</span> {{data.fechaSolicitud}}</div>
      <div class="info-row"><span>Justificación:</span> {{data.descipcion}}</div>

      <!-- botones de descarga -->
      <ng-container *ngIf="data.tipoServicio==='TIPOS DE BECAS' || data.tipoServicio==='AYUDAS ECONÓMICAS'">
        <div class="info-row">
          <span>Archivo Conadis:</span>
          <button *ngIf="data.archivosConadis!=='No posee archivos'" mat-button (click)="descargaArchivo(data.archivosConadis)">Descargar</button>
          <span *ngIf="data.archivosConadis==='No posee archivos'">No posee archivos</span>
        </div>
        <div class="info-row">
          <span>Archivo Requisitos:</span>
          <button *ngIf="data.archivosRequisitos!=='No posee archivos'" mat-button (click)="descargaArchivo(data.archivosRequisitos)">Descargar</button>
          <span *ngIf="data.archivosRequisitos==='No posee archivos'">No posee archivos</span>
        </div>
      </ng-container>

      <ng-container *ngIf="data.tipoServicio==='GUARDERÍA'">
        <div class="info-row">
          <span>Archivo Guardería:</span>
          <button *ngIf="data.archivosguarderia!=='No posee archivos'" mat-button (click)="descargaArchivo(data.archivosguarderia)">Descargar</button>
          <span *ngIf="data.archivosguarderia==='No posee archivos'">No posee archivos</span>
        </div>
      </ng-container>

      <div class="info-row">
        <span>Estado actual:</span>
        <em>
          {{ data.estadoAprobacion===true ? 'Aprobado'
             : data.estadoAprobacion===false ? 'Rechazado'
             : 'Sin revisar' }}
        </em>
      </div>

      <!-- ===== revisión ===== -->
      <div class="review-section">
        <h3>Revisión</h3>

        <div class="status-options">
          <label>
            <input type="radio" name="status" [(ngModel)]="approved" [value]="true" />
            Aprobado
          </label>
          <label>
            <input type="radio" name="status" [(ngModel)]="approved" [value]="false" />
            Rechazado
          </label>
          <label>
            <input type="radio" name="status" [(ngModel)]="approved" [value]="null" />
            Sin revisar
          </label>
        </div>

        <div class="obs-field">
          <label for="obs">Observaciones:</label>
          <textarea id="obs" rows="4" [(ngModel)]="observations"></textarea>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()" [disabled]="saving">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { font-size: 1.5rem; margin-bottom: .5rem; }
    .dialog-content { max-height: 60vh; overflow: auto; }
    .info-row {
      display: flex;
      margin: .4rem 0;
    }
    .info-row span:first-child {
      flex: 0 0 140px;
      font-weight: 600;
    }
    .review-section {
      margin-top: 1.5rem;
      border-top: 1px solid #ddd;
      padding-top: 1rem;
    }
    .status-options {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    .status-options label {
      display: flex;
      align-items: center;
      gap: .3rem;
      font-weight: 500;
    }
    .obs-field {
      display: flex;
      flex-direction: column;
      gap: .3rem;
    }
    .obs-field textarea {
      padding: .6rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: inherit;
      font-size: .95rem;
      min-height: 80px;
    }
    mat-dialog-actions {
      margin-top: .8rem;
    }
  `]
})
export class SolicitudDetailDialogComponent {
  approved!: boolean | null;
  observations!: string;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<SolicitudDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private firestore: Firestore
  ) {
    this.approved     = data.estadoAprobacion;
    this.observations = data.observaciones || '';
  }

  close() {
    this.dialogRef.close();
  }

  descargaArchivo(url: string) {
    window.open(url, '_blank');
  }

  async save() {
    this.saving = true;
    try {
      const refDoc = doc(this.firestore, 'postulaciones', this.data.id);
      await updateDoc(refDoc, {
        estadoAprobacion: this.approved,
        observaciones:     this.observations
      });
      this.dialogRef.close({ estadoAprobacion: this.approved, observaciones: this.observations });
    } catch (err) {
      console.error('Error guardando revisión:', err);
    } finally {
      this.saving = false;
    }
  }
}
