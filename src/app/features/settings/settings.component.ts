import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { finalize, map } from 'rxjs/operators';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { SupportService } from './services/support.service';
import { SupportContactInfoResponse } from './models/support.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    TranslatePipe
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

  readonly supportProblemTypes: string[] = [
    'Bug technique',
    'Problème connexion',
    'Erreur validation',
    'Document introuvable',
    'Autre'
  ];

  selectedLanguage: 'fr' | 'en' | 'ar' = 'fr';
  isSavingLanguage = false;
  isSupportPanelOpen = false;
  isSendingSupport = false;
  supportContact: SupportContactInfoResponse | null = null;

  readonly supportForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    organizationName: ['', [Validators.required, Validators.maxLength(200)]],
    problemType: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(4000), Validators.minLength(10)]]
  });

  isDarkMode$ = this.themeService.theme$.pipe(
    map(theme => theme === 'dark')
  );

  constructor(
    private readonly fb: FormBuilder,
    public themeService: ThemeService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly supportService: SupportService
  ) {
    const userLang = this.authService.getCurrentUser()?.preferredLanguage;
    const savedLang = localStorage.getItem('language');
    this.selectedLanguage = this.normalizeLanguage(userLang ?? savedLang);

    const user = this.authService.getCurrentUser();
    this.supportForm.patchValue({
      email: user?.email ?? '',
      organizationName: user?.organizationName ?? ''
    });

    this.loadSupportContactInfo();
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
    this.applyLanguagePreview(nextLanguage);
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
        this.applyLanguagePreview(previousLanguage);
        this.notificationService.showError('Impossible de modifier la langue pour le moment.');
      }
    });
  }

  toggleSupportPanel(): void {
    this.isSupportPanelOpen = !this.isSupportPanelOpen;
  }

  submitSupportTicket(): void {
    if (this.supportForm.invalid || this.isSendingSupport) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.isSendingSupport = true;

    this.supportService.submitTicket(this.supportForm.getRawValue()).pipe(
      finalize(() => {
        this.isSendingSupport = false;
      })
    ).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(response.message || 'Ticket support envoye.');
        this.supportForm.patchValue({ description: '', problemType: '' });
      },
      error: () => {
        this.notificationService.showError('Impossible d envoyer le ticket support pour le moment.');
      }
    });
  }

  private loadSupportContactInfo(): void {
    this.supportService.getContactInfo().subscribe({
      next: (response) => {
        this.supportContact = response;
      },
      error: () => {
        this.supportContact = {
          assistantName: 'Assistant Technique QualiFlow',
          assistantEmail: 'support.qualiflow@gmail.com',
          assistantPhone: '+216 70 000 000'
        };
      }
    });
  }

  private normalizeLanguage(value?: string | null): 'fr' | 'en' | 'ar' {
    if (value === 'fr' || value === 'en' || value === 'ar') {
      return value;
    }

    return 'fr';
  }

  private applyLanguagePreview(language: 'fr' | 'en' | 'ar'): void {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }
}
