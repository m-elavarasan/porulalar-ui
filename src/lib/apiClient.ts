import { API_BASE, getHeaders } from './config';

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
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
