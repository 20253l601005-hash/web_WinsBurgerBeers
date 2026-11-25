import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { NosotrosComponent } from './nosotros/nosotros';
import { ProductosComponent } from './productos/productos';
import { ContactoComponent } from './contacto/contacto';
import { LoginComponent } from './login/login';
import { AdminComponent } from './admin/admin';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'nosotros', component: NosotrosComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'contacto', component: ContactoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' }
];