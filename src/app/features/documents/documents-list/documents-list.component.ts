import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DOCUMENT_STATUS_OPTIONS,
  DocumentListItemResponse,
  DocumentQueryParams,
  DocumentStatisticsResponse,
  DocumentStatus,
  DocumentType,
  PagedDocumentResponse
} from '../models/document.models';
import { DocumentService } from '../services/document.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type ToolbarTypeFilter = '' | 'MANUEL' | 'PROCEDURE' | 'ENREGISTREMENT' | 'FORMULAIRE';
type ToolbarStatusFilter = '' | 'APPROUVE' | 'EN_REVISION' | 'REJETE' | 'PERIME';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    TranslatePipe
  ],
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss']
})
export class DocumentsListComponent implements OnInit {
  readonly displayedColumns: string[] = ['document', 'type', 'process', 'status', 'revision', 'updatedAt', 'owner', 'actions'];
  readonly statusOptions = DOCUMENT_STATUS_OPTIONS;

  readonly filtersForm = this.fb.group({
    search: [''],
    type: ['' as ToolbarTypeFilter],
    status: ['' as ToolbarStatusFilter]
  });

  loading = false;
  documents: DocumentListItemResponse[] = [];
  statistics: DocumentStatisticsResponse | null = null;
  total = 0;
  pageNumber = 1;
  pageSize = 10;

  constructor(
    private readonly fb: FormBuilder,
    private readonly documentService: DocumentService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  get canWrite(): boolean {
    return this.authService.hasRole(['ADMIN_ORG', 'RESPONSABLE_QUALITE']);
  }

  refresh(): void {
    this.loading = true;

    forkJoin({
      page: this.documentService.getDocuments(this.buildQuery()),
      stats: this.documentService.getDocumentStatistics()
    }).subscribe({
      next: ({ page, stats }) => {
        this.applyPage(page);
        this.statistics = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Erreur lors du chargement des documents.');
      }
    });
  }

  onSearch(): void {
    this.pageNumber = 1;
    this.refresh();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      type: '',
      status: ''
    });
    this.pageNumber = 1;
    this.refresh();
  }

  onPageChanged(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.refresh();
  }

  openImport(): void {
    this.router.navigate(['/documents/new'], { queryParams: { mode: 'import' } });
  }

  createDocument(): void {
    this.router.navigate(['/documents/new']);
  }

  viewDocument(item: DocumentListItemResponse): void {
    this.router.navigate(['/documents', item.id]);
  }

  editDocument(item: DocumentListItemResponse): void {
    this.router.navigate(['/documents', item.id, 'edit']);
  }

  manageVersions(item: DocumentListItemResponse): void {
    this.router.navigate(['/documents', item.id, 'versions']);
  }

  deleteDocument(item: DocumentListItemResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer le document',
        message: `Confirmer la suppression logique de ${item.code} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.documentService.deleteDocument(item.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Document supprime.');
          this.refresh();
        },
        error: () => {
          this.notificationService.showError('Suppression impossible.');
        }
      });
    });
  }

  changeStatus(item: DocumentListItemResponse, newStatus: DocumentStatus): void {
    if (item.status === newStatus) {
      return;
    }

    const label = this.getStatusLabel(newStatus);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Changer le statut',
        message: `Passer le document ${item.code} au statut "${label}" ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.documentService.updateDocumentStatus(item.id, { status: newStatus }).subscribe({
        next: () => {
          this.notificationService.showSuccess('Statut mis à jour.');
          this.refresh();
        },
        error: () => {
          this.notificationService.showError('Impossible de changer le statut.');
        }
      });
    });
  }

  downloadCurrent(item: DocumentListItemResponse): void {
    this.documentService.downloadCurrent(item.id).subscribe({
      next: (blob) => {
        const fallbackName = `${item.code}_${item.versionNumber ?? 'current'}.bin`;
        const fileName = item.fileName || fallbackName;
        this.saveBlob(blob, fileName);
      },
      error: () => {
        this.notificationService.showError('Telechargement impossible.');
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
        return 'Approuvé';
      case 'EN_REVISION':
        return 'En révision';
      case 'REJETE':
        return 'Rejeté';
      case 'PERIME':
        return 'Périmé';
      case 'ARCHIVE':
        return 'Archivé';
      default:
        return 'Brouillon';
    }
  }

  getExpirationState(item: DocumentListItemResponse): 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' {
    if (item.expirationState) {
      return item.expirationState;
    }

    if (item.status === 'PERIME') {
      return 'EXPIRED';
    }

    if (typeof item.daysToExpiry === 'number') {
      if (item.daysToExpiry < 0) {
        return 'EXPIRED';
      }
      if (item.daysToExpiry <= 30) {
        return 'EXPIRING_SOON';
      }
    }

    return 'VALID';
  }

  getExpirationLabel(item: DocumentListItemResponse): string {
    const state = this.getExpirationState(item);
    if (state === 'EXPIRED') {
      return 'Expiré';
    }

    if (state === 'EXPIRING_SOON') {
      return 'Expire bientôt';
    }

    return 'Valide';
  }

  getOwnerInitials(fullName?: string | null): string {
    if (!fullName) {
      return 'NA';
    }

    const initials = fullName
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .toUpperCase();

    return initials || 'NA';
  }

  trackByDocumentId(_index: number, item: DocumentListItemResponse): number {
    return item.id;
  }

  private applyPage(page: PagedDocumentResponse): void {
    this.documents = page.items;
    this.total = page.total;
    this.pageNumber = page.pageNumber;
    this.pageSize = page.pageSize;
  }

  private buildQuery(): DocumentQueryParams {
    const raw = this.filtersForm.getRawValue();

    return {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: raw.search?.trim() || undefined,
      type: (raw.type as DocumentType | '') || undefined,
      status: (raw.status as DocumentStatus | '') || undefined
    };
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
