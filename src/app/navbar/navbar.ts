import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { StoreApiService } from '../services/store-api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  constructor(public storeApi: StoreApiService, private router: Router) {}

  cerrarSesion() {
    this.storeApi.logout();
    this.router.navigate(['/login']);
  }
}