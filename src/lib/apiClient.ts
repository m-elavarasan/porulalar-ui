import { API_BASE, getHeaders } from './config';

export interface APIErrorDetail {
  code: string;
  message: string;
  details?: any;
}

export class APIClientError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'APIClientError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isExternal = url.startsWith('http://') || url.startsWith('https://');
  const fullUrl = isExternal ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;

  const headers = isExternal 
    ? (options.headers || {}) 
    : {
        ...getHeaders(),
        ...options.headers,
      };

  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const text = await response.text();
  let result: any = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }
  }

  if (!response.ok || (result && typeof result === 'object' && result.success === false)) {
    let message = `Request failed with status ${response.status}`;
    let code = 'UNKNOWN_ERROR';
    let details: any = undefined;

    if (result && typeof result === 'object') {
      if (typeof result.error === 'object' && result.error !== null) {
        message = result.error.message || result.message || message;
        code = result.error.code || code;
        details = result.error.details;
      } else if (typeof result.error === 'string') {
        message = result.error;
      } else if (result.message) {
        message = result.message;
      }
    }

    throw new APIClientError(message, code, details);
  }

  // Handle structured backend envelope { success: true, data: ... }
  if (result && typeof result === 'object' && 'success' in result && 'data' in result && result.success === true) {
    return result.data as T;
  }

  return (result ?? {}) as T;
}

export const apiClient = {
  get: <T>(url: string, headers?: Record<string, string>) => 
    request<T>(url, { method: 'GET', headers }),
    
  post: <T>(url: string, body?: any, headers?: Record<string, string>) => 
    request<T>(url, { 
      method: 'POST', 
      headers, 
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined) 
    }),
    
  put: <T>(url: string, body?: any, headers?: Record<string, string>) => 
    request<T>(url, { 
      method: 'PUT', 
      headers, 
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined) 
    }),
    
  delete: <T>(url: string, headers?: Record<string, string>) => 
    request<T>(url, { method: 'DELETE', headers }),
};

