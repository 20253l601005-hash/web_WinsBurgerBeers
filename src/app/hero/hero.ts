import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent implements OnInit, OnDestroy {
  activeSlide = 0;
  private intervalId: any;

  ofertas = [
    {
      badge: '20% OFF • MÁS PEDIDO',
      badgeClass: 'bg-danger text-white',
      titulo: 'Combo Dúo Bacon',
      subtitulo: 'Doble carne, doble queso y tocino ahumado',
      descripcion: '2 Hamburguesas dobles artesanalmente preparadas con tocino crujiente, queso cheddar derretido, papas grandes sazonadas y 2 refrescos bien fríos.',
      precioOriginal: '$265',
      precioOferta: '$210',
      ahorro: 'Ahorras $55',
      imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
      botonTexto: 'Ordenar Combo Dúo',
      incluye: ['2 Burgers Dobles', 'Papas Grandes', '2 Refrescos']
    },
    {
      badge: 'HOY 2X1 • FAVORITO DE LA CASA',
      badgeClass: 'bg-orange text-white',
      titulo: 'Especial 24 Alitas',
      subtitulo: 'Crujientes por fuera, jugosas por dentro',
      descripcion: '24 alitas recién salidas de la freidora, bañadas en tus 2 salsas favoritas a elegir (BBQ, Mango Habanero, Búfalo o Parmesano) con bastones de apio y aderezo ranch.',
      precioOriginal: '$320',
      precioOferta: '$240',
      ahorro: 'Ahorras $80',
      imagen: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=1000&auto=format&fit=crop',
      botonTexto: '¡Quiero mis 24 Alitas!',
      incluye: ['24 Piezas', '2 Salsas a elegir', 'Aderezo Ranch']
    },
    {
      badge: 'PACK AMIGOS • NOCHE DE PARTIDO',
      badgeClass: 'bg-warning text-dark',
      titulo: 'Cubetazo + Boneless',
      subtitulo: 'La combinación perfecta para compartir',
      descripcion: '5 cervezas nacionales o artesanales bien heladas acompañadas de 12 boneless bañados en salsa y una orden generosa de papas a la francesa.',
      precioOriginal: '$360',
      precioOferta: '$299',
      ahorro: 'Ahorras $61',
      imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
      botonTexto: 'Armar la Reunión',
      incluye: ['5 Cervezas Heladas', '12 Boneless', 'Orden de Papas']
    }
  ];

  ngOnInit(): void {
    this.iniciarAutoPlay();
  }

  ngOnDestroy(): void {
    this.detenerAutoPlay();
  }

  iniciarAutoPlay(): void {
    this.detenerAutoPlay();
    this.intervalId = setInterval(() => {
      this.siguiente();
    }, 5000);
  }

  detenerAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  siguiente(): void {
    this.activeSlide = (this.activeSlide + 1) % this.ofertas.length;
  }

  anterior(): void {
    this.activeSlide = (this.activeSlide - 1 + this.ofertas.length) % this.ofertas.length;
  }

  irASlide(index: number): void {
    this.activeSlide = index;
    this.iniciarAutoPlay();
  }
}