import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getBackendBaseUrl } from '../http/backend-url';
import { TransferProgress, TransferResponse } from '../models/transfer';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = getBackendBaseUrl();

  migrate(playlistIds: readonly string[]): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(`${this.baseUrl}/api/transfer`, {
      playlist_ids: [...playlistIds],
    });
  }

  fetchProgress(): Observable<TransferProgress> {
    return this.http.get<TransferProgress>(`${this.baseUrl}/api/transfer/progress`);
  }
}
