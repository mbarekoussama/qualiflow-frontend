import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserResponse, UserService } from '../../../core/services/user.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  AssignProcessActorItem,
  PROCESS_ACTOR_TYPE_OPTIONS,
  PROCESS_STATUS_OPTIONS,
  PROCESS_TYPE_OPTIONS,
  ProcessActorResponse,
  ProcessActorType,
  ProcessDetailsResponse,
  ProcessType
} from '../models/process.models';
import { ProcessService } from '../services/process.service';

@Component({
  selector: 'app-process-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './process-details.component.html',
  styleUrls: ['./process-details.component.scss']
})
export class ProcessDetailsComponent implements OnInit {
  readonly actorTypeOptions = PROCESS_ACTOR_TYPE_OPTIONS;
  readonly displayedActorColumns: string[] = ['fullName', 'email', 'function', 'actorType', 'assignedAt', 'actions'];

  readonly actorForm = this.fb.group({
    userId: this.fb.control<number | null>(null, Validators.required),
    actorType: this.fb.nonNullable.control<ProcessActorType>('CONTRIBUTEUR', Validators.required)
  });

  loading = false;
  processId!: number;
  details: ProcessDetailsResponse | null = null;
  users: UserResponse[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly processService: ProcessService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const parsedId = rawId ? Number(rawId) : Number.NaN;

    if (Number.isNaN(parsedId)) {
      this.notificationService.showError('Identifiant du processus invalide.');
      this.router.navigate(['/processes']);
      return;
    }

    this.processId = parsedId;
    this.loadDetails();
  }

  get canWrite(): boolean {
    return this.authService.hasRole(['SUPER_ADMIN', 'ADMIN_ORG', 'RESPONSABLE_QUALITE']);
  }

  get hasData(): boolean {
    return this.details !== null;
  }

  get availableUsers(): UserResponse[] {
    if (!this.details) {
      return [];
    }

    return this.users.filter(user => user.isActive && user.organizationId === this.details?.process.organizationId);
  }

  loadDetails(): void {
    this.loading = true;

    forkJoin({
      details: this.processService.getProcessById(this.processId),
      users: this.userService.getAll(1, 300)
    }).subscribe({
      next: ({ details, users }) => {
        this.details = details;
        this.users = users.items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Impossible de charger le processus.');
        this.router.navigate(['/processes']);
      }
    });
  }

  editProcess(): void {
    this.router.navigate(['/processes', this.processId, 'edit']);
  }

  backToList(): void {
    this.router.navigate(['/processes']);
  }

  addActor(): void {
    if (!this.details) {
      return;
    }

    if (this.actorForm.invalid) {
      this.actorForm.markAllAsTouched();
      return;
    }

    const raw = this.actorForm.getRawValue();
    const userId = raw.userId;
    const actorType = raw.actorType;

    if (!userId) {
      return;
    }

    const duplicate = this.details.actors.some(actor => actor.userId === userId);
    if (duplicate) {
      this.notificationService.showWarning('Cet utilisateur est deja acteur du processus.');
      return;
    }

    const actorsPayload: AssignProcessActorItem[] = [
      ...this.details.actors.map(actor => ({
        userId: actor.userId,
        actorType: actor.actorType
      })),
      {
        userId,
        actorType
      }
    ];

    this.processService.assignActors(this.processId, { actors: actorsPayload }).subscribe({
      next: (actors) => {
        if (!this.details) {
          return;
        }

        this.details.actors = actors;
        this.actorForm.reset({ userId: null, actorType: 'CONTRIBUTEUR' });
        this.notificationService.showSuccess('Acteur ajoute au processus.');
      },
      error: () => {
        this.notificationService.showError('Ajout de l acteur impossible.');
      }
    });
  }

  removeActor(actor: ProcessActorResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Retirer cet acteur',
        message: `Confirmer le retrait de ${actor.fullName} ?`,
        confirmText: 'Retirer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.processService.removeActor(this.processId, actor.userId).subscribe({
        next: () => {
          if (!this.details) {
            return;
          }

          this.details.actors = this.details.actors.filter(item => item.userId !== actor.userId);
          this.notificationService.showSuccess('Acteur retire du processus.');
        },
        error: () => {
          this.notificationService.showError('Suppression de l acteur impossible.');
        }
      });
    });
  }

  formatList(values: string[]): string {
    if (!values.length) {
      return 'Aucune donnee.';
    }

    return values.join(' | ');
  }

  getTypeLabel(type: ProcessType): string {
    return PROCESS_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type;
  }

  getStatusLabel(status: string): string {
    return PROCESS_STATUS_OPTIONS.find(option => option.value === status)?.label ?? status;
  }

  getActorTypeLabel(actorType: ProcessActorType): string {
    return PROCESS_ACTOR_TYPE_OPTIONS.find(option => option.value === actorType)?.label ?? actorType;
  }
}
