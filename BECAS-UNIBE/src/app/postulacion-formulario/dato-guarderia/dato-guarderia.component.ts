import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dato-guarderia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './dato-guarderia.component.html',
  styleUrls: ['./dato-guarderia.component.css']
})
export class DatoGuarderiaComponent {
  @Output() finalizar = new EventEmitter<FormData>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      archivo: [null, Validators.required]
    });
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0] || null;
    this.form.patchValue({ archivo: file });
  }

  submit() {
    if (this.form.invalid) return;
    const fd = new FormData();
    fd.append('archivo', this.form.value.archivo);
    this.finalizar.emit(fd);
  }
}
