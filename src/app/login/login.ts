import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreApiService } from '../services/store-api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  vista: 'login' | 'registro' | 'recuperar' = 'login';
  cargando = false;
  mensajeError = '';
  mensajeExito = '';
  mostrarPassword = false;

  // Login
  usuario = '';
  password = '';

  // Registro
  regNombre = '';
  regUsername = '';
  regEmail = '';
  regPassword = '';
  regRol: 'admin' | 'cliente' = 'admin';

  // Recuperar
  recEmail = '';
  recNuevaPassword = '';

  constructor(private storeApi: StoreApiService, private router: Router) {}

  cambiarVista(nueva: 'login' | 'registro' | 'recuperar') {
    this.vista = nueva;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  llenarDemoFakeStore() {
    this.usuario = 'mor_2314';
    this.password = '83r5^_';
    this.mensajeError = '';
  }

  iniciarSesion(form: NgForm) {
    if (form.invalid) return;
    this.cargando = true;
    this.mensajeError = '';

    this.storeApi.loginConApi(this.usuario.trim(), this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.message || 'Error al iniciar sesión.';
      }
    });
  }

  async registrar(form: NgForm) {
    if (form.invalid) return;
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const obs = await this.storeApi.registrarUsuario({
      nombre: this.regNombre.trim(),
      username: this.regUsername.trim(),
      email: this.regEmail.trim(),
      password: this.regPassword,
      rol: this.regRol
    });

    obs.subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeExito = '¡Cuenta creada con contraseña cifrada (SHA-256)! Ya puedes iniciar sesión.';
        this.usuario = this.regUsername.trim();
        form.resetForm();
        setTimeout(() => this.cambiarVista('login'), 1800);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.message;
      }
    });
  }

  async recuperar(form: NgForm) {
    if (form.invalid) return;
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const ok = await this.storeApi.recuperarPassword(this.recEmail.trim(), this.recNuevaPassword);
    this.cargando = false;

    if (ok) {
      this.mensajeExito = 'Contraseña actualizada correctamente con nuevo hash SHA-256.';
      form.resetForm();
      setTimeout(() => this.cambiarVista('login'), 1800);
    } else {
      this.mensajeError = 'No encontramos ninguna cuenta registrada con ese correo electrónico.';
    }
  }
}