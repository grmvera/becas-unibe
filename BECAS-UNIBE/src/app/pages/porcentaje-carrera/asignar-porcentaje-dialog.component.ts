import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
    Firestore, collection, collectionData, doc, setDoc, getDoc,
    query, orderBy
} from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';

export interface AsignarPorcentajeResultado {
    carreraId: string;
    porcentaje: number;
    estado: boolean;
}

interface Carrera {
    id: string;
    nombre: string;
    estado: boolean;
}

@Component({
    standalone: true,
    selector: 'app-asignar-porcentaje-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatSnackBarModule,
    ],
    template: `
    <h2 mat-dialog-title class="dialog-title">Asignar porcentaje de beca</h2>

    <div class="dialog-body">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
        <!-- Carrera -->
        <mat-form-field appearance="outline" class="col-span">
          <mat-label>Selecciona carrera</mat-label>
          <mat-select formControlName="carreraId" (selectionChange)="prefill($event.value)">
            <mat-option *ngFor="let c of carreras$ | async" [value]="c.id">
              {{ c.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('carreraId')?.hasError('required')">
            Debes seleccionar una carrera
          </mat-error>
        </mat-form-field>

        <!-- Porcentaje -->
        <mat-form-field appearance="outline">
          <mat-label>Porcentaje</mat-label>
          <input matInput type="number" formControlName="porcentaje" min="1" max="100" step="1" />
          <span matSuffix>%&nbsp;</span>
          <mat-error *ngIf="form.get('porcentaje')?.hasError('required')">Obligatorio</mat-error>
          <mat-error *ngIf="form.get('porcentaje')?.hasError('min')">Mínimo 1%</mat-error>
          <mat-error *ngIf="form.get('porcentaje')?.hasError('max')">Máximo 100%</mat-error>
        </mat-form-field>

        <!-- Estado -->
        <div class="estado-box">
          <mat-slide-toggle formControlName="estado">Activo</mat-slide-toggle>
        </div>

        <div class="acciones">
          <button mat-stroked-button type="button" (click)="cerrar()">Cancelar</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || cargando">
            {{ cargando ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  `,

    styles: [`
        .dialog-title {
        margin: 0;
        padding: 16px 24px;
        font-weight: 500;
        font-size: 20px;
        border-bottom: 1px solid #e0e0e0;
        }
        .dialog-body {
        padding: 16px 24px;
        box-sizing: border-box;
        }
        .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        }
        .col-span {
        grid-column: span 2;
        }
        .estado-box {
        display: flex;
        align-items: center;
        padding-left: 8px;
        }
        .acciones {
        grid-column: span 2;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
        }
        @media (max-width: 600px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        .col-span, .acciones {
            grid-column: span 1;
        }
        }
    `]

})
export class AsignarPorcentajeDialogComponent {
    private fb = inject(FormBuilder);
    private fs = inject(Firestore);
    private ref = inject(MatDialogRef<AsignarPorcentajeDialogComponent, AsignarPorcentajeResultado>);
    private snack = inject(MatSnackBar);

    form: FormGroup = this.fb.group({
        carreraId: ['', Validators.required],
        porcentaje: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
        estado: [true],
    });

    cargando = false;

    // Carreras activas (orden alfabético)
    carreras$: Observable<Carrera[]> = collectionData(
        query(collection(this.fs, 'carreras'), orderBy('nombre')),
        { idField: 'id' }
    ).pipe(
        map((docs: any[]) =>
            docs
                .map(d => ({ id: d.id, nombre: d.nombre, estado: !!d.estado }) as Carrera)
                .filter(c => c.estado)
        )
    );

    /** Prefill desde la colección porcentajes_carrera (docId = carreraId) */
    async prefill(carreraId: string) {
        if (!carreraId) return;
        const asignRef = doc(this.fs, 'porcentajes_carrera', carreraId);
        const snap = await getDoc(asignRef);
        if (snap.exists()) {
            const data = snap.data() as any;
            this.form.patchValue({
                porcentaje: typeof data.porcentaje === 'number' ? data.porcentaje : null,
                estado: typeof data.estado === 'boolean' ? data.estado : true
            });
        } else {
            // carrera sin asignación previa
            this.form.patchValue({ porcentaje: null, estado: true });
        }
    }

    /** Guardar/actualizar en porcentajes_carrera (upsert) */
    async guardar() {
        // fuerza validación visible
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.cargando = true;
        try {
            const { carreraId, porcentaje, estado } = this.form.value as {
                carreraId: string; porcentaje: any; estado: boolean;
            };

            // 1) normaliza porcentaje a número
            const pct = Number(porcentaje);
            if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
                this.form.get('porcentaje')?.setErrors({ range: true });
                this.cargando = false;
                return;
            }

            // 2) obtenemos el nombre de la carrera de forma segura
            const list = await firstValueFrom(this.carreras$);
            const carreraNombre = list.find(c => c.id === carreraId)?.nombre || '';

            // 3) upsert en colección aparte
            const asignRef = doc(this.fs, 'porcentajes_carrera', carreraId);
            const now = Date.now();
            await setDoc(asignRef, {
                carreraId,
                carreraNombre,
                porcentaje: pct,
                estado,
                updatedAt: now,
                createdAt: now,   // se mantendrá en el primer set; con merge no lo pisas si ya existe
            }, { merge: true });

            this.snack.open('Porcentaje asignado', 'OK', { duration: 2000 });
            this.ref.close({ carreraId, porcentaje: pct, estado });
        } catch (e) {
            console.error(e);
            this.snack.open('No se pudo asignar el porcentaje', 'Cerrar', { duration: 3000 });
        } finally {
            this.cargando = false;
        }
    }


    cerrar() { this.ref.close(); }
}
