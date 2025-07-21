import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-datos-personales',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css']
})
export class DatosPersonalesComponent {
  @Input() tipoBeca!: string;
  @Output() pasoCompletado = new EventEmitter<any>(); 

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
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
    const datosFormulario = {
      tipoBeca: this.tipoBeca,
      ...this.form.value
    };
    console.log('Formulario completo:', datosFormulario);
    this.pasoCompletado.emit(datosFormulario);
  }
}
