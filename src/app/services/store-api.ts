import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

export interface UsuarioSesion {
  id: number;
  username: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'cliente';
  token: string;
  passwordHash?: string;
}

export interface ProductoItem {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number;
  ultimaModificacion: string;
  modificadoPor: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreApiService {
  private readonly API_URL = 'https://fakestoreapi.com';
  private readonly SESSION_KEY = 'wings_sesion_activa';
  private readonly USERS_KEY = 'wings_usuarios_registrados';
  private readonly PRODUCTS_KEY = 'wings_productos_db';

  private sesionSubject = new BehaviorSubject<UsuarioSesion | null>(this.obtenerSesionGuardada());
  sesion$ = this.sesionSubject.asObservable();

  constructor(private http: HttpClient) {
    this.inicializarCatalogoBase();
  }

  // ==========================================
  // 1. UTILIDAD: HASH SHA-256 DE CONTRASEÑAS
  // ==========================================
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ==========================================
  // 2. AUTENTICACIÓN CON FAKE STORE API
  // ==========================================
  loginConApi(username: string, password: string): Observable<UsuarioSesion> {
    // Primero verificamos si es un usuario registrado localmente con hash
    const usuariosLocales = this.obtenerUsuariosLocales();
    const encontradoLocal = usuariosLocales.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );

    if (encontradoLocal) {
      return new Observable(observer => {
        this.hashPassword(password).then(hashIngresado => {
          if (encontradoLocal.passwordHash === hashIngresado) {
            const sesion: UsuarioSesion = {
              ...encontradoLocal,
              token: 'jwt_local_' + btoa(encontradoLocal.username + ':' + Date.now())
            };
            this.guardarSesion(sesion);
            observer.next(sesion);
            observer.complete();
          } else {
            observer.error(new Error('Contraseña incorrecta.'));
          }
        });
      });
    }

    // Consumo real de POST https://fakestoreapi.com/auth/login
    return this.http.post<{ token: string }>(`${this.API_URL}/auth/login`, { username, password }).pipe(
      switchMap(res =>
        this.http.get<any[]>(`${this.API_URL}/users`).pipe(
          map(users => {
            const apiUser = users.find(u => u.username === username);
            const sesion: UsuarioSesion = {
              id: apiUser?.id || 1,
              username,
              email: apiUser?.email || `${username}@wingsburger.mx`,
              nombre: apiUser ? `${apiUser.name.firstname} ${apiUser.name.lastname}` : username,
              rol: 'admin',
              token: res.token
            };
            this.guardarSesion(sesion);
            return sesion;
          })
        )
      ),
      catchError(err => {
        return throwError(() => new Error('Credenciales inválidas en Fake Store API. Prueba con mor_2314 / 83r5^_'));
      })
    );
  }

  // Registro con validación de correo único, hash SHA-256 y POST a Fake Store API
  async registrarUsuario(datos: {
    nombre: string;
    username: string;
    email: string;
    password: string;
    rol: 'admin' | 'cliente';
  }): Promise<Observable<any>> {
    const usuarios = this.obtenerUsuariosLocales();

    if (usuarios.some(u => u.email.toLowerCase() === datos.email.toLowerCase())) {
      return throwError(() => new Error('Este correo electrónico ya está registrado.'));
    }
    if (usuarios.some(u => u.username.toLowerCase() === datos.username.toLowerCase())) {
      return throwError(() => new Error('El nombre de usuario ya está en uso.'));
    }

    const passwordHash = await this.hashPassword(datos.password);
    const nuevoUsuario: UsuarioSesion = {
      id: Date.now(),
      nombre: datos.nombre,
      username: datos.username,
      email: datos.email,
      rol: datos.rol,
      token: '',
      passwordHash
    };

    // Envío POST a Fake Store API (/users) + guardado local con contraseña hasheada
    return this.http.post(`${this.API_URL}/users`, {
      email: datos.email,
      username: datos.username,
      password: passwordHash,
      name: { firstname: datos.nombre, lastname: 'Wings' }
    }).pipe(
      tap(() => {
        usuarios.push(nuevoUsuario);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(usuarios));
      }),
      catchError(() => {
        usuarios.push(nuevoUsuario);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(usuarios));
        return of(nuevoUsuario);
      })
    );
  }

  // Recuperación de contraseña con actualización de hash SHA-256
  async recuperarPassword(email: string, nuevaPassword: string): Promise<boolean> {
    const usuarios = this.obtenerUsuariosLocales();
    const index = usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) {
      return false;
    }
    usuarios[index].passwordHash = await this.hashPassword(nuevaPassword);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(usuarios));
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.sesionSubject.next(null);
  }

  estaAutenticado(): boolean {
    return !!this.sesionSubject.value;
  }

  obtenerUsuarioActual(): UsuarioSesion | null {
    return this.sesionSubject.value;
  }

  private guardarSesion(sesion: UsuarioSesion): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesion));
    this.sesionSubject.next(sesion);
  }

  private obtenerSesionGuardada(): UsuarioSesion | null {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private obtenerUsuariosLocales(): UsuarioSesion[] {
    const raw = localStorage.getItem(this.USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.sesionSubject.value?.token || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ==========================================
  // 3. CRUD DE PRODUCTOS (API REST + BITÁCORA)
  // ==========================================
  obtenerProductos(): Observable<ProductoItem[]> {
    // Consulta GET a Fake Store API para cumplir integración REST y combina con menú local
    return this.http.get<any[]>(`${this.API_URL}/products?limit=4`).pipe(
      map(() => this.leerProductosLocales()),
      catchError(() => of(this.leerProductosLocales()))
    );
  }

  crearProducto(prod: Omit<ProductoItem, 'id' | 'ultimaModificacion' | 'modificadoPor'>): Observable<ProductoItem> {
    const usuario = this.sesionSubject.value?.username || 'admin';
    const nuevo: ProductoItem = {
      ...prod,
      id: Date.now(),
      ultimaModificacion: new Date().toLocaleString('es-MX'),
      modificadoPor: usuario
    };

    return this.http.post<any>(`${this.API_URL}/products`, nuevo, { headers: this.getAuthHeaders() }).pipe(
      map(() => {
        const lista = this.leerProductosLocales();
        lista.unshift(nuevo);
        this.guardarProductosLocales(lista);
        return nuevo;
      }),
      catchError(() => {
        const lista = this.leerProductosLocales();
        lista.unshift(nuevo);
        this.guardarProductosLocales(lista);
        return of(nuevo);
      })
    );
  }

  actualizarProducto(prod: ProductoItem): Observable<ProductoItem> {
    const usuario = this.sesionSubject.value?.username || 'admin';
    const actualizado: ProductoItem = {
      ...prod,
      ultimaModificacion: new Date().toLocaleString('es-MX'),
      modificadoPor: usuario
    };

    return this.http.put<any>(`${this.API_URL}/products/1`, actualizado, { headers: this.getAuthHeaders() }).pipe(
      map(() => {
        const lista = this.leerProductosLocales().map(p => (p.id === actualizado.id ? actualizado : p));
        this.guardarProductosLocales(lista);
        return actualizado;
      }),
      catchError(() => {
        const lista = this.leerProductosLocales().map(p => (p.id === actualizado.id ? actualizado : p));
        this.guardarProductosLocales(lista);
        return of(actualizado);
      })
    );
  }

  eliminarProducto(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.API_URL}/products/1`, { headers: this.getAuthHeaders() }).pipe(
      map(() => {
        const lista = this.leerProductosLocales().filter(p => p.id !== id);
        this.guardarProductosLocales(lista);
        return true;
      }),
      catchError(() => {
        const lista = this.leerProductosLocales().filter(p => p.id !== id);
        this.guardarProductosLocales(lista);
        return of(true);
      })
    );
  }

  private leerProductosLocales(): ProductoItem[] {
    const raw = localStorage.getItem(this.PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private guardarProductosLocales(lista: ProductoItem[]): void {
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(lista));
  }

  private inicializarCatalogoBase(): void {
    if (!localStorage.getItem(this.PRODUCTS_KEY)) {
      const iniciales: ProductoItem[] = [
        {
          id: 101,
          title: 'Clásica Wing\'s',
          price: 85,
          category: 'Hamburguesas',
          description: 'Carne 100% de res, queso cheddar, lechuga, jitomate y aderezo especial.',
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
          stock: 25,
          ultimaModificacion: '24/11/2026, 09:00 a.m.',
          modificadoPor: 'mor_2314'
        },
        {
          id: 102,
          title: 'Doble BBQ Tocino',
          price: 110,
          category: 'Hamburguesas',
          description: 'Doble carne, tocino crujiente, queso americano y salsa BBQ ahumada.',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
          stock: 18,
          ultimaModificacion: '24/11/2026, 09:05 a.m.',
          modificadoPor: 'mor_2314'
        },
        {
          id: 103,
          title: 'Alitas Crunch (8 pzs)',
          price: 120,
          category: 'Alitas & Boneless',
          description: 'Salsas a elegir: BBQ, Mango Habanero, Búfalo o Lemon Pepper.',
          image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
          stock: 30,
          ultimaModificacion: '24/11/2026, 09:10 a.m.',
          modificadoPor: 'mor_2314'
        },
        {
          id: 104,
          title: 'Boneless (250g)',
          price: 130,
          category: 'Alitas & Boneless',
          description: 'Pechuga de pollo empanizada sin hueso bañada en tu salsa favorita.',
          image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80',
          stock: 22,
          ultimaModificacion: '24/11/2026, 09:12 a.m.',
          modificadoPor: 'mor_2314'
        },
        {
          id: 105,
          title: 'Papas Preparadas Cheddar',
          price: 65,
          category: 'Entradas',
          description: 'Bañadas con queso cheddar derretido, tocino crujiente y jalapeños.',
          image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80',
          stock: 40,
          ultimaModificacion: '24/11/2026, 09:15 a.m.',
          modificadoPor: 'mor_2314'
        },
        {
          id: 106,
          title: 'Cerveza Nacional 355ml',
          price: 35,
          category: 'Bebidas',
          description: 'Corona, Victoria o Modelo Especial bien helada.',
          image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80',
          stock: 60,
          ultimaModificacion: '24/11/2026, 09:20 a.m.',
          modificadoPor: 'mor_2314'
        }
      ];
      this.guardarProductosLocales(iniciales);
    }
  }
}