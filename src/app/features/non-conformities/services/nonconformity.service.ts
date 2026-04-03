import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateCorrectiveActionRequest,
  CreateNonConformityRequest,
  CorrectiveActionResponse,
  NonConformityDetailsResponse,
  NonConformityQueryParams,
  NonConformityResponse,
  NonConformityStatisticsResponse,
  PagedNonConformityResponse,
  UpdateCorrectiveActionRequest,
  UpdateNonConformityRequest,
  UpdateNonConformityStatusRequest
} from '../models/nonconformity.models';

@Injectable({
  providedIn: 'root'
})
export class NonConformityService {
  private readonly endpoint = 'nonconformities';

  constructor(private readonly apiService: ApiService) {}

  getNonConformities(params: NonConformityQueryParams = {}): Observable<PagedNonConformityResponse> {
    return this.apiService.get<PagedNonConformityResponse>(this.endpoint, params);
  }

  getNonConformityById(id: number): Observable<NonConformityDetailsResponse> {
    return this.apiService.get<NonConformityDetailsResponse>(`${this.endpoint}/${id}`);
  }

  createNonConformity(payload: CreateNonConformityRequest): Observable<NonConformityResponse> {
    return this.apiService.post<NonConformityResponse>(this.endpoint, payload);
  }

  updateNonConformity(id: number, payload: UpdateNonConformityRequest): Observable<NonConformityResponse> {
    return this.apiService.put<NonConformityResponse>(`${this.endpoint}/${id}`, payload);
  }

  deleteNonConformity(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  updateNonConformityStatus(id: number, payload: UpdateNonConformityStatusRequest): Observable<NonConformityResponse> {
    return this.apiService.patch<NonConformityResponse>(`${this.endpoint}/${id}/status`, payload);
  }

  getStatistics(): Observable<NonConformityStatisticsResponse> {
    return this.apiService.get<NonConformityStatisticsResponse>(`${this.endpoint}/statistics`);
  }

  getActions(nonConformityId: number): Observable<CorrectiveActionResponse[]> {
    return this.apiService.get<CorrectiveActionResponse[]>(`${this.endpoint}/${nonConformityId}/actions`);
  }

  createAction(nonConformityId: number, payload: CreateCorrectiveActionRequest): Observable<CorrectiveActionResponse> {
    return this.apiService.post<CorrectiveActionResponse>(`${this.endpoint}/${nonConformityId}/actions`, payload);
  }

  updateAction(nonConformityId: number, actionId: number, payload: UpdateCorrectiveActionRequest): Observable<CorrectiveActionResponse> {
    return this.apiService.put<CorrectiveActionResponse>(`${this.endpoint}/${nonConformityId}/actions/${actionId}`, payload);
  }

  deleteAction(nonConformityId: number, actionId: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${nonConformityId}/actions/${actionId}`);
  }
}
