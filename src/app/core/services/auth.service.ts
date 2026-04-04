import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  organizationCode?: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  organizationCode: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organizationId?: number;
}

export interface MeResponse {
  id: number;
  organizationId?: number;
  organizationName?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  function?: string;
  department?: string;
  birthDate?: string;
  preferredLanguage?: 'fr' | 'en' | 'ar';
  profilePhotoPath?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  preferredLanguage: 'fr' | 'en' | 'ar';
}

export interface ProfilePhotoResponse {
  userId: number;
  profilePhotoPath?: string | null;
  updatedAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<MeResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  private profilePhotoRefreshSubject = new Subject<void>();
  public profilePhotoRefresh$ = this.profilePhotoRefreshSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadCurrentUser();
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      // Keep UX consistent: even if API logout fails, clear local session.
      catchError(() => of(null)),
      tap(() => {
        this.forceLogout();
      })
    );
  }

  forceLogout(): void {
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.applyPlatformLanguage('fr');
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, request);
  }

  updateProfile(request: UpdateProfileRequest): Observable<MeResponse> {
    return this.http.put<MeResponse>(`${this.apiUrl}/me`, request).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveUserToStorage(user);
        this.applyPlatformLanguage(user.preferredLanguage);
      })
    );
  }

  uploadProfilePhoto(file: File): Observable<ProfilePhotoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProfilePhotoResponse>(`${this.apiUrl}/me/photo`, formData).pipe(
      tap(() => this.profilePhotoRefreshSubject.next())
    );
  }

  downloadProfilePhoto(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/me/photo`, { responseType: 'blob' });
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, request);
  }

  getProfile(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveUserToStorage(user);
        this.applyPlatformLanguage(user.preferredLanguage);
      })
    );
  }

  getCurrentUser(): MeResponse | null {
    return this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    if (this.hasToken()) {
      const storedUser = this.getUserFromStorage();
      if (storedUser) {
        this.currentUserSubject.next(storedUser);
        this.applyPlatformLanguage(storedUser.preferredLanguage);
      } else {
        this.applyPlatformLanguage('fr');
      }
    } else {
      this.applyPlatformLanguage('fr');
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  private saveUserToStorage(user: MeResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private getUserFromStorage(): MeResponse | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  private applyPlatformLanguage(language?: 'fr' | 'en' | 'ar' | string): void {
    const normalized = language === 'en' || language === 'ar' || language === 'fr' ? language : 'fr';
    document.documentElement.lang = normalized;
    document.documentElement.dir = normalized === 'ar' ? 'rtl' : 'ltr';
  }
}
