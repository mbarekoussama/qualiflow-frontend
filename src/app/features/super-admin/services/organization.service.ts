import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateOrganizationRequest,
  OrganizationListQueryParams,
  OrganizationResponse,
  PagedOrganizationsResponse,
  ToggleOrganizationStatusRequest,
  UpdateOrganizationRequest
} from '../models/organization.models';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly endpoint = 'organizations';

  constructor(private readonly apiService: ApiService) {}

  getOrganizations(params: OrganizationListQueryParams = {}): Observable<PagedOrganizationsResponse> {
    return this.apiService.get<PagedOrganizationsResponse>(this.endpoint, params);
  }

  getOrganizationById(id: number): Observable<OrganizationResponse> {
    return this.apiService.get<OrganizationResponse>(`${this.endpoint}/${id}`);
  }

  createOrganization(payload: CreateOrganizationRequest): Observable<number> {
    return this.apiService.post<number>(this.endpoint, payload);
  }

  updateOrganization(id: number, payload: UpdateOrganizationRequest): Observable<void> {
    return this.apiService.put<void>(`${this.endpoint}/${id}`, payload);
  }

  toggleOrganizationStatus(id: number, payload: ToggleOrganizationStatusRequest = {}): Observable<OrganizationResponse> {
    return this.apiService.patch<OrganizationResponse>(`${this.endpoint}/${id}/toggle-status`, payload);
  }
}
