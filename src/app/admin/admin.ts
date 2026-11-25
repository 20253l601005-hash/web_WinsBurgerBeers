import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ProductoItem, StoreApiService, UsuarioSesion } from '../services/store-api';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit {
  productos: ProductoItem[] = [];
  usuarioActual: UsuarioSesion | null = null;
  cargando = false;
  feedback = '';
  tipoFeedback: 'success' | 'danger' = 'success';

  // Búsqueda y Paginación
  busqueda = '';
  paginaActual = 1;
  itemsPorPagina = 5;

  // Formulario Crear / Editar
  editandoId: number | null = null;
  formTitle = '';
  formPrice: number | null = null;
  formStock: number | null = null;
  formCategory = 'Hamburguesas';
  formDescription = '';
  formImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';

  // Confirmación de borrado
  productoAEliminar: ProductoItem | null = null;

  constructor(private storeApi: StoreApiService) {}

  ngOnInit(): void {
    this.usuarioActual = this.storeApi.obtenerUsuarioActual();
    this.cargarProductos();
  }

  get esAdmin(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  cargarProductos(): void {
    this.cargando = true;
    this.storeApi.obtenerProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
      },
      error: () => {
        this.mostrarAlerta('Error al cargar productos desde la API.', 'danger');
        this.cargando = false;
      }
    });
  }

  get productosFiltrados(): ProductoItem[] {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) return this.productos;
    return this.productos.filter(
      p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.itemsPorPagina));
  }

  get productosPaginados(): ProductoItem[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  guardarProducto(form: NgForm): void {
    if (form.invalid || !this.esAdmin) return;
    this.cargando = true;

    if (this.editandoId !== null) {
      const original = this.productos.find(p => p.id === this.editandoId)!;
      this.storeApi.actualizarProducto({
        ...original,
        title: this.formTitle.trim(),
        price: Number(this.formPrice),
        stock: Number(this.formStock),
        category: this.formCategory,
        description: this.formDescription.trim(),
        image: this.formImage.trim()
      }).subscribe(() => {
        this.mostrarAlerta('Producto actualizado vía PUT y bitácora registrada.', 'success');
        this.cancelarEdicion(form);
        this.cargarProductos();
      });
    } else {
      this.storeApi.crearProducto({
        title: this.formTitle.trim(),
        price: Number(this.formPrice),
        stock: Number(this.formStock),
        category: this.formCategory,
        description: this.formDescription.trim() || 'Especialidad de la casa Wing\'s Burger & Beer\'s.',
        image: this.formImage.trim()
      }).subscribe(() => {
        this.mostrarAlerta('Producto creado vía POST en Fake Store API.', 'success');
        this.cancelarEdicion(form);
        this.cargarProductos();
      });
    }
  }

  seleccionarParaEditar(prod: ProductoItem): void {
    if (!this.esAdmin) return;
    this.editandoId = prod.id;
    this.formTitle = prod.title;
    this.formPrice = prod.price;
    this.formStock = prod.stock;
    this.formCategory = prod.category;
    this.formDescription = prod.description;
    this.formImage = prod.image;
  }

  cancelarEdicion(form?: NgForm): void {
    this.editandoId = null;
    if (form) form.resetForm({ formCategory: 'Hamburguesas', formImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' });
  }

  confirmarEliminacion(prod: ProductoItem): void {
    if (!this.esAdmin) return;
    this.productoAEliminar = prod;
  }

  ejecutarEliminacion(): void {
    if (!this.productoAEliminar) return;
    const id = this.productoAEliminar.id;
    this.productoAEliminar = null;
    this.cargando = true;

    this.storeApi.eliminarProducto(id).subscribe(() => {
      this.mostrarAlerta('Producto eliminado correctamente (DELETE).', 'success');
      if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;
      this.cargarProductos();
    });
  }

  private mostrarAlerta(msg: string, tipo: 'success' | 'danger'): void {
    this.feedback = msg;
    this.tipoFeedback = tipo;
    setTimeout(() => (this.feedback = ''), 4000);
  }
}