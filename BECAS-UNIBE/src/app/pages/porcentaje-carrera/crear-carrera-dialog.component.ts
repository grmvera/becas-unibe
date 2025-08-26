import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
    Firestore, addDoc, collection, collectionData, deleteDoc,
    doc, updateDoc, query, orderBy
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface CrearCarreraResultado {
    // si quieres devolver algo al cerrar, lo puedes usar
    creada?: boolean;
}

export interface Carrera {
    id?: string;
    nombre: string;
    estado: boolean;
    createdAt: number;
}

@Component({
    standalone: true,
    selector: 'app-crear-carrera-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatIconModule,
        MatSnackBarModule,
    ],
    template: `
    <h2 mat-dialog-title class="dialog-title">Crear carrera</h2>

    <div class="dialog-body">
      <!-- FORM -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
        <mat-form-field appearance="outline" class="col-span">
          <mat-label>Nombre de la carrera</mat-label>
          <input matInput formControlName="nombre" maxlength="80" />
          <mat-hint align="end">{{ form.get('nombre')?.value?.length || 0 }}/80</mat-hint>
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">
            El nombre es obligatorio
          </mat-error>
          <mat-error *ngIf="form.get('nombre')?.hasError('minlength')">
            Mínimo 3 caracteres
          </mat-error>
        </mat-form-field>

        <div class="estado-box">
          <mat-checkbox formControlName="estado">Activo</mat-checkbox>
        </div>

        <div class="acciones">
          <button mat-stroked-button type="button" (click)="cerrar()">Cancelar</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || cargando">
            {{ cargando ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>

      <div class="divider"></div>

      <!-- TABLA -->
      <h3 class="section-title">Carreras registradas</h3>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th class="estado-col">Estado</th>
              <th class="acciones-col">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let c of carreras$ | async; trackBy: trackById">
              <td>
                <div class="nombre-cell">
                  <span class="nombre">{{ c.nombre }}</span>
                  <span class="pill" [class.ok]="c.estado" [class.bad]="!c.estado">
                    {{ c.estado ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </td>
              <td class="estado-col">
                <mat-slide-toggle [checked]="c.estado" (change)="toggleEstado(c)" aria-label="Cambiar estado">
                </mat-slide-toggle>
              </td>
              <td class="acciones-col">
                <button mat-icon-button color="warn" (click)="eliminar(c)" aria-label="Eliminar">
                  <mat-icon>🗑️</mat-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="(carreras$ | async)?.length === 0">
              <td colspan="3" class="empty">Aún no hay carreras registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
  /* ===== Base modal ===== */
  .dialog-title{margin:0 0 6px;font-weight:800;letter-spacing:.2px}
  .dialog-body{display:grid;gap:18px;padding:12px 14px 18px}

  /* ===== Form ===== */
  .form-grid{
    display:grid;grid-template-columns:1fr 200px;gap:16px;align-items:end
  }
  .col-span{grid-column:1 / -1}

  /* Quita el “doble borde azul” del input nativo */
  :host ::ng-deep input.mat-mdc-input-element{
    outline:none !important; box-shadow:none !important;
  }

  /* Mat form-field más suave */
  mat-form-field{width:100%}
  :host ::ng-deep .mat-mdc-form-field{
    --field-radius:12px;
  }
  :host ::ng-deep .mdc-text-field--outlined{
    border-radius:var(--field-radius);
    transition:border-color .15s ease, box-shadow .15s ease;
  }
  /* Glow de foco sutil en todo el contenedor */
  :host ::ng-deep .mdc-text-field--outlined.mdc-text-field--focused{
    box-shadow:0 0 0 3px rgba(37,99,235,.15);
  }
  mat-hint{opacity:.75}

  /* Checkbox en contenedor suave */
  .estado-box{
    display:flex;align-items:center;gap:10px;
    padding:12px 14px;background:#fafafa;
    border:1px solid #eee;border-radius:12px
  }

  /* Acciones */
  .acciones{grid-column:1 / -1;display:flex;justify-content:flex-end;gap:12px}
  .acciones button[mat-stroked-button],
  .acciones button[mat-raised-button]{
    border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.06);
    transition:transform .15s, box-shadow .15s, background .15s
  }
  .acciones button[mat-stroked-button]:hover,
  .acciones button[mat-raised-button]:hover{
    transform:translateY(-1px);box-shadow:0 10px 22px rgba(0,0,0,.10)
  }

  .divider{height:1px;background:linear-gradient(to right,transparent,#e9e9e9,transparent)}

  /* ===== Tabla ===== */
  .section-title{margin:0;font-weight:800;letter-spacing:.2px}

  .table-wrapper{
    width:100%;overflow:auto;border:1px solid #efefef;border-radius:14px;
    background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.06)
  }
  .table{width:100%;border-collapse:collapse;min-width:620px}

  .table thead th{
    position:sticky;top:0;z-index:1;background:#f9fafb;
    text-align:left;font-weight:700;padding:12px 16px;border-bottom:2px solid #ececec;
    white-space:nowrap
  }
  .table tbody td{
    padding:14px 16px;border-bottom:1px solid #f2f2f2;vertical-align:middle
  }

  /* Zebra + hover */
  .table tbody tr:nth-child(odd){background:#fcfcfc}
  .table tbody tr:hover{background:#f6faff;transition:background .15s}

  .estado-col{width:170px;text-align:center}
  .acciones-col{width:96px;text-align:center}

  /* Nombre + chip */
  .nombre-cell{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .nombre{font-weight:600}

  .pill{
    font-size:12px;padding:3px 10px;border-radius:999px;border:1px solid transparent;line-height:1.2
  }
  .pill.ok{background:#eaf7ee;color:#0e7a3e;border-color:#cfead9}
  .pill.bad{background:#fff1f0;color:#a8071a;border-color:#ffd3cf}

  /* Estado: switch más compacto + etiqueta */
  .estado-wrap{display:flex;align-items:center;gap:8px;justify-content:center}
  .switch-compact :where(.mdc-switch){transform:scale(.9)}
  .estado-label{font-size:13px;font-weight:600;padding:2px 8px;border-radius:999px;color:#4b5563}
  .estado-label.on{color:#0b5fd7}
  .estado-label.off{color:#a8071a}

  /* Botón eliminar discreto */
  button[mat-icon-button]{border-radius:10px;transition:background .15s, transform .1s}
  button[mat-icon-button]:hover{background:#fff2f2;transform:translateY(-1px)}
  button[mat-icon-button] mat-icon{font-variation-settings:'FILL' 0, 'wght' 400; font-size:22px}

  /* Estado vacío */
  .empty{text-align:center;color:#6b7280;padding:22px 0}

  /* Focus accesible global (sin doble borde) */
  :host ::ng-deep .cdk-keyboard-focused,
  :host ::ng-deep .cdk-program-focused,
  button:focus-visible,
  .mat-mdc-slide-toggle:focus-visible{
    outline:2px solid #2563eb !important; outline-offset:2px; border-radius:10px
  }

  /* ===== Responsive ===== */
  @media (max-width:840px){
    .form-grid{grid-template-columns:1fr}
    .acciones{justify-content:flex-start}
    .table{min-width:520px}
  }
`]

})
export class CrearCarreraDialogComponent {
    private fb = inject(FormBuilder);
    private ref = inject(MatDialogRef<CrearCarreraDialogComponent, CrearCarreraResultado>);
    private fs = inject(Firestore);
    private snack = inject(MatSnackBar);
    public data = inject(MAT_DIALOG_DATA);

    form: FormGroup = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
        estado: [true]
    });

    cargando = false;

    carreras$: Observable<Carrera[]> = collectionData(
        query(collection(this.fs, 'carreras'), orderBy('createdAt', 'desc')),
        { idField: 'id' }
    ).pipe(
        map((docs: any[]) =>
            docs.map(d => ({
                id: d.id,
                nombre: d.nombre,
                estado: !!d.estado,
                createdAt: Number(d.createdAt || 0)
            }) as Carrera)
        )
    );

    async guardar() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.cargando = true;
        try {
            const colRef = collection(this.fs, 'carreras');
            await addDoc(colRef, {
                nombre: (this.form.value.nombre as string).trim(),
                estado: !!this.form.value.estado,
                createdAt: Date.now()
            } as Omit<Carrera, 'id'>);
            this.snack.open('Carrera creada', 'OK', { duration: 2000 });
            this.form.reset({ nombre: '', estado: true });
            // Si quieres cerrar el modal al crear:
            // this.ref.close({ creada: true });
        } catch (e) {
            console.error(e);
            this.snack.open('Error al crear carrera', 'Cerrar', { duration: 3000 });
        } finally {
            this.cargando = false;
        }
    }

    async toggleEstado(c: Carrera) {
        if (!c.id) return;
        try {
            await updateDoc(doc(this.fs, 'carreras', c.id), { estado: !c.estado });
            this.snack.open(`Carrera ${!c.estado ? 'activada' : 'desactivada'}`, 'OK', { duration: 1800 });
        } catch (e) {
            console.error(e);
            this.snack.open('No se pudo actualizar el estado', 'Cerrar', { duration: 2500 });
        }
    }

    async eliminar(c: Carrera) {
        if (!c.id) return;
        const ok = confirm(`¿Eliminar la carrera "${c.nombre}"?`);
        if (!ok) return;
        try {
            await deleteDoc(doc(this.fs, 'carreras', c.id));
            this.snack.open('Carrera eliminada', 'OK', { duration: 1800 });
        } catch (e) {
            console.error(e);
            this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 2500 });
        }
    }

    cerrar() { this.ref.close(); }

    trackById = (_: number, item: Carrera) => item.id!;
}
