import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Effectue une requête GET
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return this.http.get<T>(`${this.baseUrl}/${normalizedEndpoint}`, { params: httpParams });
  }

  /**
   * Effectue une requête POST
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return this.http.post<T>(`${this.baseUrl}/${normalizedEndpoint}`, data);
  }

  /**
   * Effectue une requête PUT
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return this.http.put<T>(`${this.baseUrl}/${normalizedEndpoint}`, data);
  }

  /**
   * Effectue une requête PATCH
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return this.http.patch<T>(`${this.baseUrl}/${normalizedEndpoint}`, data);
  }

  /**
   * Effectue une requête DELETE
   */
  delete<T>(endpoint: string): Observable<T> {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return this.http.delete<T>(`${this.baseUrl}/${normalizedEndpoint}`);
  }
}
