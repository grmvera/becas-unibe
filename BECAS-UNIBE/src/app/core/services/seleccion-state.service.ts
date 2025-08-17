import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SeleccionStateService {
  private _servicio$ = new BehaviorSubject<string | null>(null);
  private _beca$ = new BehaviorSubject<string | null>(null);

  setServicio(v: string | null) { this._servicio$.next(v); }
  setBeca(v: string | null) { this._beca$.next(v); }

  get servicio$(): Observable<string | null> { return this._servicio$.asObservable(); }
  get beca$(): Observable<string | null> { return this._beca$.asObservable(); }

  get servicioActual(): string | null { return this._servicio$.getValue(); }
  get becaActual(): string | null { return this._beca$.getValue(); }

  clear() { this._servicio$.next(null); this._beca$.next(null); }
}
