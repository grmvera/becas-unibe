import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-datos-personales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css']
})
export class DatosPersonalesComponent implements OnChanges {
  @Input() tipoBeca!: string;
  @Input() tipoServicio!: string; // 👈 nuevo input
  @Input() form!: FormGroup;
  @Output() pasoCompletado = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    // Se asegura de que los datos se actualicen en el formulario si cambian desde el padre
    if (changes['tipoBeca'] && this.form) {
      this.form.get('tipoBeca')?.setValue(this.tipoBeca);
    }
    if (changes['tipoServicio'] && this.form) {
      this.form.get('tipoServicio')?.setValue(this.tipoServicio);
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.form.patchValue({ imagen: file });
    }
  }

  cancelarImagen() {
    this.form.patchValue({ imagen: null });
  }

  siguientePaso() {
    console.log('Formulario Personal:', this.form.value);
    this.pasoCompletado.emit();
  }
}
