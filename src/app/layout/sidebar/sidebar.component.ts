import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() sidebarOpen = false;
  @Output() navClicked = new EventEmitter<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  onNavClick(): void {
    this.navClicked.emit();
  }

  get homeRoute(): string {
    return this.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';
  }

  get canAccessQuality(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR',
      'UTILISATEUR'
    ]);
  }

  get canReadNotifications(): boolean {
    return this.authService.hasRole([
      'SUPER_ADMIN',
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'UTILISATEUR',
      'AUDITEUR'
    ]);
  }

  get canAccessDocuments(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR'
    ]);
  }

  get canReadProcesses(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR',
      'UTILISATEUR'
    ]);
  }

  get canWriteProcesses(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE'
    ]);
  }

  get canReadProcedures(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR'
    ]);
  }

  get canReadNonConformities(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR'
    ]);
  }

  get canReadCorrectiveActions(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR'
    ]);
  }

  get canReadIndicators(): boolean {
    return this.authService.hasRole([
      'ADMIN_ORG',
      'RESPONSABLE_QUALITE',
      'CHEF_SERVICE',
      'AUDITEUR'
    ]);
  }

  get isAdminOrg(): boolean {
    return this.authService.hasRole('ADMIN_ORG');
  }

  get isSuperAdmin(): boolean {
    return this.authService.hasRole('SUPER_ADMIN');
  }
}
