import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DocumentDetailsResponse,
  DocumentStatus,
  DocumentType,
  DocumentVersionResponse
} from '../models/document.models';
import { DocumentService } from '../services/document.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-document-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './document-details.component.html',
  styleUrls: ['./document-details.component.scss']
})
export class DocumentDetailsComponent implements OnInit {
  readonly displayedVersionColumns: string[] = ['version', 'status', 'file', 'date', 'author', 'actions'];

  loading = false;
  documentId!: number;
  details: DocumentDetailsResponse | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly documentService: DocumentService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const parsedId = rawId ? Number(rawId) : Number.NaN;

    if (Number.isNaN(parsedId)) {
      this.notificationService.showError('Identifiant document invalide.');
      this.router.navigate(['/documents']);
      return;
    }

    this.documentId = parsedId;
    this.loadDetails();
  }

  get canWrite(): boolean {
    return this.authService.hasRole(['ADMIN_ORG', 'RESPONSABLE_QUALITE']);
  }

  get hasData(): boolean {
    return this.details !== null;
  }

  loadDetails(): void {
    this.loading = true;
    this.documentService.getDocumentById(this.documentId).subscribe({
      next: (details) => {
        this.details = details;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Impossible de charger les details du document.');
        this.router.navigate(['/documents']);
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/documents']);
  }

  editDocument(): void {
    this.router.navigate(['/documents', this.documentId, 'edit']);
  }

  openVersions(): void {
    this.router.navigate(['/documents', this.documentId, 'versions']);
  }

  downloadCurrent(): void {
    this.documentService.downloadCurrent(this.documentId).subscribe({
      next: (blob) => {
        const fileName = this.details?.currentVersion?.originalFileName
          ?? `${this.details?.document.code ?? 'document'}_current.bin`;
        this.saveBlob(blob, fileName);
      },
      error: () => {
        this.notificationService.showError('Telechargement impossible.');
      }
    });
  }

  downloadVersion(version: DocumentVersionResponse): void {
    this.documentService.downloadVersion(this.documentId, version.id).subscribe({
      next: (blob) => {
        const fileName = version.originalFileName || `${this.details?.document.code ?? 'document'}_${version.versionNumber}.bin`;
        this.saveBlob(blob, fileName);
      },
      error: () => {
        this.notificationService.showError('Telechargement de la version impossible.');
      }
    });
  }

  previewCurrent(): void {
    if (!this.details?.currentVersion) {
      this.notificationService.showWarning('Aucune version courante disponible.');
      return;
    }

    this.documentService.previewCurrent(this.documentId).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
      },
      error: () => {
        this.notificationService.showError('Previsualisation impossible.');
      }
    });
  }

  getTypeLabel(type: DocumentType): string {
    switch (type) {
      case 'MANUEL':
        return 'Manuel';
      case 'PROCEDURE':
        return 'Procedure';
      case 'ENREGISTREMENT':
        return 'Enregistrement';
      case 'FORMULAIRE':
        return 'Formulaire';
      case 'INSTRUCTION':
        return 'Instruction';
      case 'POLITIQUE':
        return 'Politique';
      default:
        return 'Autre';
    }
  }

  getStatusLabel(status: DocumentStatus): string {
    switch (status) {
      case 'APPROUVE':
        return 'Approuve';
      case 'PUBLIE':
        return 'Publie';
      case 'EN_REVISION':
        return 'En revision';
      case 'REJETE':
        return 'Rejete';
      case 'PERIME':
        return 'Perime';
      case 'ARCHIVE':
        return 'Archive';
      default:
        return 'Brouillon';
    }
  }

  getOwnerInitials(fullName?: string | null): string {
    if (!fullName) {
      return 'NA';
    }

    return fullName
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }
}
