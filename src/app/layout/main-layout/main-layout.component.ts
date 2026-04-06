import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { NotificationPanelComponent } from '../../features/notifications/notification-panel/notification-panel.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    LoadingComponent,
    NotificationPanelComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription();
  private logoObjectUrl: string | null = null;

  brandLogoUrl = 'assets/logo.png';
  sidebarOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.tryLoadOrganizationLogo();

    this.subscriptions.add(
      this.organizationService.logoRefresh$.subscribe(() => {
        this.tryLoadOrganizationLogo();
      })
    );

    // Close sidebar on route change (mobile)
    this.subscriptions.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
          this.sidebarOpen = false;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.revokeLogoObjectUrl();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  private tryLoadOrganizationLogo(): void {
    if (this.authService.hasRole('SUPER_ADMIN')) {
      this.revokeLogoObjectUrl();
      this.brandLogoUrl = 'assets/logo.png';
      return;
    }

    this.organizationService.downloadMyOrganizationLogo().subscribe({
      next: (blob) => {
        this.revokeLogoObjectUrl();
        this.logoObjectUrl = URL.createObjectURL(blob);
        this.brandLogoUrl = this.logoObjectUrl;
      },
      error: () => {
        this.revokeLogoObjectUrl();
        this.brandLogoUrl = 'assets/logo.png';
      }
    });
  }

  private revokeLogoObjectUrl(): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = null;
    }
  }
}
