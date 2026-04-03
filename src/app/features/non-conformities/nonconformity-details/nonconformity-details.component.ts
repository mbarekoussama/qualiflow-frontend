import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserResponse, UserService as CoreUserService } from '../../../core/services/user.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  CORRECTIVE_ACTION_STATUS_OPTIONS,
  CorrectiveActionResponse,
  CorrectiveActionStatus,
  CreateCorrectiveActionRequest,
  NON_CONFORMITY_STATUS_OPTIONS,
  NonConformityDetailsResponse,
  NonConformityStatus,
  UpdateCorrectiveActionRequest
} from '../models/nonconformity.models';
import { NonConformityService } from '../services/nonconformity.service';

@Component({
  selector: 'app-nonconformity-details',
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
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './nonconformity-details.component.html',
  styleUrls: ['./nonconformity-details.component.scss']
})
export class NonconformityDetailsComponent implements OnInit {
  readonly nonConformityStatusOptions = NON_CONFORMITY_STATUS_OPTIONS;
  readonly actionStatusOptions = CORRECTIVE_ACTION_STATUS_OPTIONS;
  readonly displayedActionColumns: string[] = ['title', 'responsible', 'dueDate', 'status', 'actions'];

  readonly actionForm = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]),
    description: this.fb.control<string>(''),
    responsibleUserId: this.fb.nonNullable.control<number>(0, [Validators.required, Validators.min(1)]),
    dueDate: this.fb.nonNullable.control('', Validators.required),
    completionDate: this.fb.control<string>(''),
    status: this.fb.nonNullable.control<CorrectiveActionStatus>('A_FAIRE', Validators.required)
  });

  loading = false;
  savingAction = false;
  nonConformityId!: number;
  details: NonConformityDetailsResponse | null = null;
  users: UserResponse[] = [];
  editingActionId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly nonConformityService: NonConformityService,
    private readonly userService: CoreUserService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const parsedId = rawId ? Number(rawId) : Number.NaN;

    if (Number.isNaN(parsedId)) {
      this.notificationService.showError('Identifiant non-conformite invalide.');
      this.router.navigate(['/non-conformities']);
      return;
    }

    this.nonConformityId = parsedId;
    this.loadData();
  }

  get canWrite(): boolean {
    return this.authService.hasRole(['ADMIN_ORG', 'RESPONSABLE_QUALITE']);
  }

  get hasData(): boolean {
    return this.details !== null;
  }

  get actionFormTitle(): string {
    return this.editingActionId ? 'Modifier action corrective' : 'Ajouter action corrective';
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      details: this.nonConformityService.getNonConformityById(this.nonConformityId),
      users: this.userService.getAll(1, 300)
    }).subscribe({
      next: ({ details, users }) => {
        this.details = details;
        this.users = users.items.filter(user => user.isActive);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Impossible de charger la non-conformite.');
        this.router.navigate(['/non-conformities']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/non-conformities']);
  }

  editNonConformity(): void {
    this.router.navigate(['/non-conformities', this.nonConformityId, 'edit']);
  }

  changeStatus(nextStatus: NonConformityStatus): void {
    if (!this.details || this.details.nonConformity.status === nextStatus) {
      return;
    }

    this.nonConformityService.updateNonConformityStatus(this.nonConformityId, { status: nextStatus }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Statut mis a jour.');
        this.loadData();
      },
      error: () => {
        this.notificationService.showError('Mise a jour du statut impossible.');
      }
    });
  }

  saveAction(): void {
    if (!this.details) {
      return;
    }

    if (this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    this.savingAction = true;
    const payload = this.buildActionPayload();

    const request$ = this.editingActionId
      ? this.nonConformityService.updateAction(this.nonConformityId, this.editingActionId, payload as UpdateCorrectiveActionRequest)
      : this.nonConformityService.createAction(this.nonConformityId, payload as CreateCorrectiveActionRequest);

    request$.subscribe({
      next: () => {
        this.savingAction = false;
        this.notificationService.showSuccess(this.editingActionId ? 'Action corrective mise a jour.' : 'Action corrective ajoutee.');
        this.cancelActionEdit();
        this.loadData();
      },
      error: () => {
        this.savingAction = false;
        this.notificationService.showError('Enregistrement de l action corrective impossible.');
      }
    });
  }

  editAction(action: CorrectiveActionResponse): void {
    this.editingActionId = action.id;
    this.actionForm.patchValue({
      title: action.title,
      description: action.description || '',
      responsibleUserId: action.responsibleUserId,
      dueDate: this.toDateInputValue(action.dueDate),
      completionDate: this.toDateInputValue(action.completionDate),
      status: action.status
    });
  }

  cancelActionEdit(): void {
    this.editingActionId = null;
    this.actionForm.reset({
      title: '',
      description: '',
      responsibleUserId: 0,
      dueDate: '',
      completionDate: '',
      status: 'A_FAIRE'
    });
  }

  deleteAction(action: CorrectiveActionResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer action corrective',
        message: `Confirmer la suppression de l'action ${action.title} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.nonConformityService.deleteAction(this.nonConformityId, action.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Action corrective supprimee.');
          this.loadData();
        },
        error: () => {
          this.notificationService.showError('Suppression impossible.');
        }
      });
    });
  }

  getStatusLabel(status: NonConformityStatus): string {
    return this.nonConformityStatusOptions.find(option => option.value === status)?.label ?? status;
  }

  getActionStatusLabel(status: CorrectiveActionStatus): string {
    return this.actionStatusOptions.find(option => option.value === status)?.label ?? status;
  }

  trackByActionId(_index: number, item: CorrectiveActionResponse): number {
    return item.id;
  }

  private buildActionPayload(): CreateCorrectiveActionRequest {
    const raw = this.actionForm.getRawValue();

    return {
      title: raw.title.trim(),
      description: raw.description?.trim() || null,
      responsibleUserId: raw.responsibleUserId,
      dueDate: `${raw.dueDate}T00:00:00Z`,
      completionDate: raw.completionDate ? `${raw.completionDate}T00:00:00Z` : null,
      status: raw.status
    };
  }

  private toDateInputValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
