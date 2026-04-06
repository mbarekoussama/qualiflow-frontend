import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { finalize, map } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  languages: Array<{ value: 'fr' | 'en' | 'ar'; label: string; flag: string }> = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ar', label: 'العربية', flag: '🇦🇪' }
  ];

  selectedLanguage: 'fr' | 'en' | 'ar' = 'fr';
  isSavingLanguage = false;
  isDarkMode$ = this.themeService.theme$.pipe(
    map(theme => theme === 'dark')
  );

  constructor(
    public themeService: ThemeService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {
    const userLang = this.authService.getCurrentUser()?.preferredLanguage;
    const savedLang = localStorage.getItem('language');
    this.selectedLanguage = this.normalizeLanguage(userLang ?? savedLang);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onLanguageChange(lang: 'fr' | 'en' | 'ar'): void {
    if (this.isSavingLanguage) {
      return;
    }

    const nextLanguage = this.normalizeLanguage(lang);
    if (nextLanguage === this.selectedLanguage) {
      return;
    }

    const previousLanguage = this.selectedLanguage;
    this.selectedLanguage = nextLanguage;
    this.isSavingLanguage = true;

    this.authService.updatePreferredLanguage(nextLanguage).pipe(
      finalize(() => {
        this.isSavingLanguage = false;
      })
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Langue mise à jour avec succès.');
      },
      error: () => {
        this.selectedLanguage = previousLanguage;
        this.notificationService.showError('Impossible de modifier la langue pour le moment.');
      }
    });
  }

  private normalizeLanguage(value?: string | null): 'fr' | 'en' | 'ar' {
    if (value === 'fr' || value === 'en' || value === 'ar') {
      return value;
    }

    return 'fr';
  }
}
