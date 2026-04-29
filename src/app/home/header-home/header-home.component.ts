import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header-home.component.html',
  styleUrls: ['./header-home.component.scss']
})
export class HeaderHomeComponent {
  @Output() sectionChange = new EventEmitter<string>();
  activeSection: string = 'accueil';

  navItems = [
    { label: 'Accueil', section: 'accueil' },
    { label: 'Services', section: 'services' },
    { label: 'ISO 21001', section: 'iso' },
    { label: 'Contact', section: 'contact' }
  ];

  selectSection(section: string): void {
    this.activeSection = section;
    this.sectionChange.emit(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
