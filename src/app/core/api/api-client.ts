import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceKey, environment } from '../../../environments/environment';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Adds an Idempotency-Key header (create commands that the API de-duplicates). */
  idempotent?: boolean;
  /** Sent as If-Match for optimistic concurrency. */
  ifMatch?: string | null;
  responseType?: 'json' | 'blob' | 'text';
}

/** One HTTP entry point for every JobPlatform microservice: `service` picks the base URL, `path` is relative to it (e.g. `api/v1/jobs`). */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  url(service: ServiceKey, path: string): string {
    return `${environment.api[service]}/${path.replace(/^\//, '')}`;
  }

  request<T>(service: ServiceKey, method: HttpMethod, path: string, options: RequestOptions = {}): Observable<T> {
    let headers = new HttpHeaders();
    if (options.idempotent) {
      headers = headers.set('Idempotency-Key', crypto.randomUUID());
    }
    if (options.ifMatch) {
      headers = headers.set('If-Match', options.ifMatch);
    }
    return this.http.request<T>(method, this.url(service, path), {
      body: options.body,
      params: toParams(options.query),
      headers,
      responseType: (options.responseType ?? 'json') as 'json',
    });
  }

  get<T>(service: ServiceKey, path: string, query?: Query): Observable<T> {
    return this.request<T>(service, 'GET', path, { query });
  }

  post<T>(service: ServiceKey, path: string, body: unknown = {}, options: Omit<RequestOptions, 'body'> = {}): Observable<T> {
    return this.request<T>(service, 'POST', path, { ...options, body });
  }

  put<T>(service: ServiceKey, path: string, body: unknown = {}, options: Omit<RequestOptions, 'body'> = {}): Observable<T> {
    return this.request<T>(service, 'PUT', path, { ...options, body });
  }

  patch<T>(service: ServiceKey, path: string, body: unknown = {}): Observable<T> {
    return this.request<T>(service, 'PATCH', path, { body });
  }

  delete<T = void>(service: ServiceKey, path: string): Observable<T> {
    return this.request<T>(service, 'DELETE', path);
  }

  /** multipart/form-data upload (IFormFile endpoints). */
  upload<T>(service: ServiceKey, path: string, file: File, fields: Record<string, string | null | undefined> = {}, fileField = 'file'): Observable<T> {
    const form = new FormData();
    form.append(fileField, file, file.name);
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && value !== '') {
        form.append(key, value);
      }
    }
    return this.http.post<T>(this.url(service, path), form);
  }

  blob(service: ServiceKey, path: string, query?: Query): Observable<Blob> {
    return this.http.get(this.url(service, path), { params: toParams(query), responseType: 'blob' });
  }
}

function toParams(query: Query | undefined): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

/** Encodes one path segment. */
export const seg = (value: string | number): string => encodeURIComponent(String(value));
