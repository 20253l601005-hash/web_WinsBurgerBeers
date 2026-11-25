import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css'
})
export class ContactoComponent {
  nombre: string = '';
  correo: string = '';
  mensaje: string = '';
  enviado: boolean = false;

  enviarContacto(form: NgForm) {
    if (form.valid) {
      this.enviado = true;
      form.resetForm();
      setTimeout(() => this.enviado = false, 4000);
    }
  }
}