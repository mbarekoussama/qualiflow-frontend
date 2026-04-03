import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Erreur: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = `Impossible de joindre l'API (${environment.apiUrl}). Verifiez que le backend est demarre.`;
            break;
          case 401:
            errorMessage = 'Non autorise. Veuillez vous reconnecter.';
            authService.forceLogout();
            break;
          case 403:
            errorMessage = 'Acces interdit.';
            break;
          case 404:
            errorMessage = 'Ressource non trouvee.';
            break;
          case 500:
            errorMessage = error.error?.message || 'Erreur serveur interne.';
            break;
          default:
            errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
            break;
        }
      }

      notificationService.showError(errorMessage);
      return throwError(() => error);
    })
  );
};
