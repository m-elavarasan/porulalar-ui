// Authentication service utilizing Go REST API endpoints.
import { porulalarStore } from './store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const db = {};

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  const cachedUserStr = localStorage.getItem('porulalar_user');
  const refreshToken = localStorage.getItem('porulalar_refresh_token');

  if (cachedUserStr && refreshToken) {
    try {
      const userObj = JSON.parse(cachedUserStr);
      // Auto-refresh token on initial load
      fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token refresh failed');
      })
      .then(data => {
        localStorage.setItem('porulalar_access_token', data.accessToken);
        if (onAuthSuccess) {
          onAuthSuccess(userObj, data.accessToken);
        }
      })
      .catch(err => {
        console.error('Failed to auto refresh token on load:', err);
        localStorage.removeItem('porulalar_user');
        localStorage.removeItem('porulalar_refresh_token');
        localStorage.removeItem('porulalar_access_token');
        if (onAuthFailure) onAuthFailure();
      });
    } catch {
      if (onAuthFailure) onAuthFailure();
    }
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  // Returns dummy unsubscribe
  return () => {};
};

export const backendLogin = async (username: string, password: string): Promise<{ user: any; accessToken: string }> => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Invalid username or password');
  }
  const data = await res.json();
  localStorage.setItem('porulalar_access_token', data.accessToken);
  localStorage.setItem('porulalar_refresh_token', data.refreshToken);
  
  const mappedUser = {
    uid: data.user.id,
    displayName: data.user.username,
    email: data.user.email,
    role: data.user.role
  };
  localStorage.setItem('porulalar_user', JSON.stringify(mappedUser));
  return { user: mappedUser, accessToken: data.accessToken };
};

export const backendRegister = async (username: string, email: string, password: string): Promise<{ user: any; accessToken: string }> => {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Username or email already taken');
  }
  const data = await res.json();
  localStorage.setItem('porulalar_access_token', data.accessToken);
  localStorage.setItem('porulalar_refresh_token', data.refreshToken);
  
  const mappedUser = {
    uid: data.user.id,
    displayName: data.user.username,
    email: data.user.email,
    role: data.user.role
  };
  localStorage.setItem('porulalar_user', JSON.stringify(mappedUser));
  return { user: mappedUser, accessToken: data.accessToken };
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  throw new Error('Google Sign-In is disabled. Please register or login with username/password.');
};

export const getAccessToken = async (): Promise<string | null> => {
  return localStorage.getItem('porulalar_access_token');
};

export const setAccessToken = (token: string) => {
  localStorage.setItem('porulalar_access_token', token);
};

export const logout = async () => {
  const token = localStorage.getItem('porulalar_refresh_token');
  if (token) {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token })
    }).catch(() => {});
  }
  porulalarStore.clear();
  localStorage.removeItem('porulalar_user');
  localStorage.removeItem('porulalar_refresh_token');
  localStorage.removeItem('porulalar_access_token');
};
