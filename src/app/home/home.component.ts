import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { AccueilHomeComponent } from './accueil-home/accueil-home.component';
import { ContactHomeComponent } from './contact-home/contact-home.component';
import { FeaturesHomeComponent } from './features-home/features-home.component';
import { FooterHomeComponent } from './footer-home/footer-home.component';
import { HeaderHomeComponent } from './header-home/header-home.component';
import { NewsHomeComponent } from './news-home/news-home.component';
import { ServicesHomeComponent } from './services-home/services-home.component';
import { StatsHomeComponent } from './stats-home/stats-home.component';
import { WhyHomeComponent } from './why-home/why-home.component';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationRequestDialogComponent } from '../features/public/organization-request-dialog/organization-request-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderHomeComponent,
    AccueilHomeComponent,
    ServicesHomeComponent,
    FeaturesHomeComponent,
    NewsHomeComponent,
    WhyHomeComponent,
    StatsHomeComponent,
    ContactHomeComponent,
    FooterHomeComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  currentSection: 'all' | 'accueil' | 'services' | 'iso' | 'contact' = 'all';
  private observer?: IntersectionObserver;

  constructor(private readonly dialog: MatDialog) { }

  openRequestDialog(): void {
    this.dialog.open(OrganizationRequestDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog-panel'
    });
  }

  setSection(section: string): void {
    this.currentSection = section as any;
    // On relance les animations après un petit délai pour laisser le DOM se mettre à jour
    setTimeout(() => this.initRevealAnimations(), 50);
  }

  ngAfterViewInit(): void {
    // Déclenche les animations d'apparition des sections.
    this.initRevealAnimations();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private initRevealAnimations(): void {
    const revealElements = document.querySelectorAll('.reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach((element) => this.observer?.observe(element));
  }
}
