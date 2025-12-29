
import { ApiResponse } from '../types';

const DEFAULT_API_URL = 'https://ka-en.com.vn/mail_api';
const SIMULATE_DELAY = 400;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  body?: any
): Promise<ApiResponse<T>> {
  
  const baseUrl = localStorage.getItem('mailflow_api_url') || DEFAULT_API_URL;

  if (baseUrl) {
    try {
      // Split query params first
      const [pathString, queryString] = endpoint.split('?');
      
      const parts = pathString.split('/');
      let resource = parts[0];
      const id = parts[1];

      let phpFile = resource;
      let finalQueryParams = queryString ? `?${queryString}` : '';

      if (resource === 'subscribers_bulk') {
          phpFile = 'subscribers';
          finalQueryParams = '?route=subscribers_bulk';
      } else {
          if (id) {
              // Append ID to existing query params or start new ones
              finalQueryParams += (finalQueryParams ? '&' : '?') + `id=${id}`;
          }
      }

      const url = `${baseUrl}/${phpFile}.php${finalQueryParams}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      
      if (!response.ok) {
          return { success: false, data: {} as T, message: `Server error ${response.status}: ${text.substring(0, 100)}` };
      }

      if (!text || text.trim() === "") {
          return { success: true, data: {} as T }; // Return success if empty body (e.g. DELETE)
      }

      try {
          return JSON.parse(text);
      } catch (e) {
          console.error("JSON Parse Error. Raw response:", text);
          return { success: false, data: {} as T, message: "Invalid JSON response from server." };
      }

    } catch (error) {
      console.error("API Request Failed", error);
      return { success: false, data: {} as T, message: "Connection Error." };
    }
  }

  // FALLBACK LOCALSTORAGE (Mock Data)
  await delay(SIMULATE_DELAY);
  const [pathString] = endpoint.split('?');
  const parts = pathString.split('/');
  const resource = parts[0];
  const id = parts[1];

  let storedData = JSON.parse(localStorage.getItem(`mailflow_${resource}`) || '[]');

  switch (method) {
    case 'GET':
      if (id) {
        const item = storedData.find((x: any) => x.id === id);
        return { success: !!item, data: item || null };
      }
      return { success: true, data: storedData as T };
    case 'POST':
      const newItem = { id: body.id || crypto.randomUUID(), createdAt: new Date().toISOString(), ...body };
      storedData = [newItem, ...storedData];
      localStorage.setItem(`mailflow_${resource}`, JSON.stringify(storedData));
      return { success: true, data: newItem as T };
    case 'PUT':
      if (!id) return { success: false, data: {} as T, message: "ID required" };
      storedData = storedData.map((item: any) => item.id === id ? { ...item, ...body } : item);
      localStorage.setItem(`mailflow_${resource}`, JSON.stringify(storedData));
      return { success: true, data: { id, ...body } as T };
    case 'DELETE':
      storedData = storedData.filter((item: any) => item.id !== id);
      localStorage.setItem(`mailflow_${resource}`, JSON.stringify(storedData));
      return { success: true, data: { id } as T };
  }
  return { success: false, data: {} as T };
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, data: any) => request<T>(endpoint, 'POST', data),
  put: <T>(endpoint: string, data: any) => request<T>(endpoint, 'PUT', data),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};
