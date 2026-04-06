import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import {
  CreateDocumentRequest,
  CreateDocumentVersionRequest,
  DocumentDetailsResponse,
  DocumentQueryParams,
  DocumentResponse,
  DocumentStatisticsResponse,
  DocumentVersionResponse,
  PagedDocumentResponse,
  UpdateDocumentRequest,
  UpdateDocumentVersionStatusRequest
} from '../models/document.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly endpoint = 'documents';
  private readonly apiBase = `${environment.apiUrl}/api`;

  constructor(
    private readonly apiService: ApiService,
    private readonly http: HttpClient
  ) { }

  getDocuments(params: DocumentQueryParams = {}): Observable<PagedDocumentResponse> {
    return this.apiService.get<PagedDocumentResponse>(this.endpoint, params);
  }

  getDocumentById(id: number): Observable<DocumentDetailsResponse> {
    return this.apiService.get<DocumentDetailsResponse>(`${this.endpoint}/${id}`);
  }

  createDocument(payload: CreateDocumentRequest): Observable<DocumentResponse> {
    return this.apiService.post<DocumentResponse>(this.endpoint, payload);
  }

  updateDocument(id: number, payload: UpdateDocumentRequest): Observable<DocumentResponse> {
    return this.apiService.put<DocumentResponse>(`${this.endpoint}/${id}`, payload);
  }

  deleteDocument(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  toggleDocumentStatus(id: number): Observable<DocumentResponse> {
    return this.apiService.patch<DocumentResponse>(`${this.endpoint}/${id}/toggle-status`, {});
  }

  getDocumentStatistics(): Observable<DocumentStatisticsResponse> {
    return this.apiService.get<DocumentStatisticsResponse>(`${this.endpoint}/statistics`);
  }

  getVersions(documentId: number): Observable<DocumentVersionResponse[]> {
    return this.apiService.get<DocumentVersionResponse[]>(`${this.endpoint}/${documentId}/versions`);
  }

  getVersionById(documentId: number, versionId: number): Observable<DocumentVersionResponse> {
    return this.apiService.get<DocumentVersionResponse>(`${this.endpoint}/${documentId}/versions/${versionId}`);
  }

  createVersion(documentId: number, payload: CreateDocumentVersionRequest): Observable<DocumentVersionResponse> {
    return this.apiService.post<DocumentVersionResponse>(`${this.endpoint}/${documentId}/versions`, payload);
  }

  uploadVersion(documentId: number, file: File, metadata: CreateDocumentVersionRequest): Observable<DocumentVersionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('versionNumber', metadata.versionNumber);
    formData.append('status', metadata.status);

    if (metadata.revisionComment) {
      formData.append('revisionComment', metadata.revisionComment);
    }

    if (metadata.effectiveDate) {
      formData.append('effectiveDate', metadata.effectiveDate);
    }

    if (metadata.expiryDate) {
      formData.append('expiryDate', metadata.expiryDate);
    }

    if (metadata.signature) {
      formData.append('signature', metadata.signature);
    }

    return this.http.post<DocumentVersionResponse>(
      `${this.apiBase}/${this.endpoint}/${documentId}/upload`,
      formData
    );
  }

  updateVersionStatus(documentId: number, versionId: number, payload: UpdateDocumentVersionStatusRequest): Observable<DocumentVersionResponse> {
    return this.apiService.patch<DocumentVersionResponse>(`${this.endpoint}/${documentId}/versions/${versionId}/status`, payload);
  }

  downloadCurrent(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiBase}/${this.endpoint}/${documentId}/download-current`, {
      responseType: 'blob'
    });
  }

  downloadVersion(documentId: number, versionId: number): Observable<Blob> {
    return this.http.get(`${this.apiBase}/${this.endpoint}/${documentId}/versions/${versionId}/download`, {
      responseType: 'blob'
    });
  }

  previewCurrent(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiBase}/${this.endpoint}/${documentId}/preview-current`, {
      responseType: 'blob'
    });
  }
}
