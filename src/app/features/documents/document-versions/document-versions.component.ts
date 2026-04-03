import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DOCUMENT_STATUS_OPTIONS,
  DocumentDetailsResponse,
  DocumentStatus,
  DocumentVersionResponse
} from '../models/document.models';
import { DocumentService } from '../services/document.service';

@Component({
  selector: 'app-document-versions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './document-versions.component.html',
  styleUrls: ['./document-versions.component.scss']
})
export class DocumentVersionsComponent implements OnInit {
  readonly statusOptions = DOCUMENT_STATUS_OPTIONS;
  readonly displayedColumns: string[] = ['version', 'status', 'file', 'effectiveDate', 'author', 'comment', 'actions'];

  readonly createVersionForm = this.fb.group({
    versionNumber: this.fb.nonNullable.control('v1.0', [Validators.required, Validators.maxLength(30)]),
    status: this.fb.nonNullable.control<DocumentStatus>('BROUILLON', Validators.required),
    revisionComment: this.fb.control<string>(''),
    effectiveDate: this.fb.control<string>(''),
    expiryDate: this.fb.control<string>('')
  });

  loading = false;
  submitting = false;
  documentId!: number;
  details: DocumentDetailsResponse | null = null;
  selectedFile: File | null = null;
  statusByVersion: Record<number, DocumentStatus> = {};
  commentByVersion: Record<number, string> = {};

  constructor(
    private readonly fb: FormBuilder,
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

  get documentCode(): string {
    return this.details?.document.code ?? 'DOC';
  }

  get versions(): DocumentVersionResponse[] {
    return this.details?.versions ?? [];
  }

  loadDetails(): void {
    this.loading = true;
    this.documentService.getDocumentById(this.documentId).subscribe({
      next: (details) => {
        this.details = details;
        this.hydrateStatusForms(details.versions);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Impossible de charger les versions du document.');
        this.router.navigate(['/documents']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFile = target.files?.[0] ?? null;
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
  }

  backToDocument(): void {
    this.router.navigate(['/documents', this.documentId]);
  }

  submitVersion(): void {
    if (!this.canWrite) {
      return;
    }

    if (this.createVersionForm.invalid) {
      this.createVersionForm.markAllAsTouched();
      return;
    }

    const raw = this.createVersionForm.getRawValue();
    const payload = {
      versionNumber: raw.versionNumber.trim(),
      status: raw.status,
      revisionComment: raw.revisionComment?.trim() || null,
      effectiveDate: raw.effectiveDate || null,
      expiryDate: raw.expiryDate || null
    };

    if (!payload.versionNumber) {
      this.notificationService.showWarning('Le numero de version est obligatoire.');
      return;
    }

    this.submitting = true;

    const request$ = this.selectedFile
      ? this.documentService.uploadVersion(this.documentId, this.selectedFile, payload)
      : this.documentService.createVersion(this.documentId, payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.selectedFile = null;
        this.createVersionForm.reset({
          versionNumber: this.nextVersionNumber(),
          status: 'BROUILLON',
          revisionComment: '',
          effectiveDate: '',
          expiryDate: ''
        });
        this.notificationService.showSuccess('Version enregistree avec succes.');
        this.loadDetails();
      },
      error: () => {
        this.submitting = false;
        this.notificationService.showError('Impossible de creer la version.');
      }
    });
  }

  updateVersionStatus(version: DocumentVersionResponse): void {
    if (!this.canWrite) {
      return;
    }

    const status = this.statusByVersion[version.id] || version.status;
    const revisionComment = this.commentByVersion[version.id]?.trim() || null;

    this.documentService.updateVersionStatus(this.documentId, version.id, { status, revisionComment }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Statut de version mis a jour.');
        this.loadDetails();
      },
      error: () => {
        this.notificationService.showError('Mise a jour du statut impossible.');
      }
    });
  }

  downloadVersion(version: DocumentVersionResponse): void {
    this.documentService.downloadVersion(this.documentId, version.id).subscribe({
      next: (blob) => {
        const fileName = version.originalFileName || `${this.documentCode}_${version.versionNumber}.bin`;
        this.saveBlob(blob, fileName);
      },
      error: () => {
        this.notificationService.showError('Telechargement impossible.');
      }
    });
  }

  getStatusLabel(status: DocumentStatus): string {
    return this.statusOptions.find(option => option.value === status)?.label ?? status;
  }

  private hydrateStatusForms(versions: DocumentVersionResponse[]): void {
    this.statusByVersion = {};
    this.commentByVersion = {};

    for (const version of versions) {
      this.statusByVersion[version.id] = version.status;
      this.commentByVersion[version.id] = version.revisionComment ?? '';
    }

    this.createVersionForm.patchValue({
      versionNumber: this.nextVersionNumber()
    });
  }

  private nextVersionNumber(): string {
    const current = this.versions[0]?.versionNumber;
    if (!current) {
      return 'v1.0';
    }

    const match = /^v?(\d+)\.(\d+)$/i.exec(current.trim());
    if (!match) {
      return 'v1.0';
    }

    const major = Number(match[1]);
    const minor = Number(match[2]) + 1;
    return `v${major}.${minor}`;
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
