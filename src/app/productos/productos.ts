import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoItem, StoreApiService } from '../services/store-api';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class ProductosComponent implements OnInit {
  productos: ProductoItem[] = [];
  categoriaSeleccionada = 'Todas';
  cargando = true;

  categorias = ['Todas', 'Hamburguesas', 'Alitas & Boneless', 'Entradas', 'Bebidas'];

  constructor(private storeApi: StoreApiService) {}

  ngOnInit(): void {
    this.storeApi.obtenerProductos().subscribe(data => {
      this.productos = data;
      this.cargando = false;
    });
  }

  get productosVisibles(): ProductoItem[] {
    if (this.categoriaSeleccionada === 'Todas') return this.productos;
    return this.productos.filter(p => p.category === this.categoriaSeleccionada);
  }
}