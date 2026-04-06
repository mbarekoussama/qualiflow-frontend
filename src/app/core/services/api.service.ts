import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, params?: object): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), {
      params: this.buildHttpParams(params)
    });
  }

  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), data);
  }

  put<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), data);
  }

  patch<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }

  private buildUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return `${this.baseUrl}/${normalizedEndpoint}`;
  }

  private buildHttpParams(params?: object): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
