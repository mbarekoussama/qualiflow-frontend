import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AskChatRequestDto,
  AskChatResponseDto,
  ChatConversationDetailsDto,
  ChatConversationDto,
  CreateConversationDto
} from '../models/chatbot.models';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly endpoint = 'chat';

  constructor(private readonly apiService: ApiService) {}

  ask(payload: AskChatRequestDto): Observable<AskChatResponseDto> {
    return this.apiService.post<AskChatResponseDto>(`${this.endpoint}/ask`, payload);
  }

  getConversations(): Observable<ChatConversationDto[]> {
    return this.apiService.get<ChatConversationDto[]>(`${this.endpoint}/conversations`);
  }

  getConversationById(id: number): Observable<ChatConversationDetailsDto> {
    return this.apiService.get<ChatConversationDetailsDto>(`${this.endpoint}/conversations/${id}`);
  }

  createConversation(payload: CreateConversationDto): Observable<ChatConversationDto> {
    return this.apiService.post<ChatConversationDto>(`${this.endpoint}/conversations`, payload);
  }

  deleteConversation(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/conversations/${id}`);
  }
}
