import { apiClient } from '../lib/apiClient';
import { porulalarStore } from '../lib/store';

export const authService = {
  initAuth: (
    onAuthSuccess?: (user: any, token: string) => void,
    onAuthFailure?: () => void
  ) => {
    const cachedUserStr = localStorage.getItem('porulalar_user');
    const refreshToken = localStorage.getItem('porulalar_refresh_token');

    if (cachedUserStr && refreshToken) {
      try {
        const userObj = JSON.parse(cachedUserStr);
        apiClient.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken })
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

    return () => {};
  },

  backendLogin: async (email: string, password: string): Promise<{ user: any; accessToken: string }> => {
    const data = await apiClient.post<any>('/api/auth/login', { email, password });
    localStorage.setItem('porulalar_access_token', data.accessToken);
    localStorage.setItem('porulalar_refresh_token', data.refreshToken);
    
    const mappedUser = {
      uid: data.user.id,
      email: data.user.email,
      role: data.user.role
    };
    localStorage.setItem('porulalar_user', JSON.stringify(mappedUser));
    return { user: mappedUser, accessToken: data.accessToken };
  },

  backendRegister: async (email: string, password: string): Promise<{ user: any; accessToken: string }> => {
    const data = await apiClient.post<any>('/api/auth/register', { email, password });
    localStorage.setItem('porulalar_access_token', data.accessToken);
    localStorage.setItem('porulalar_refresh_token', data.refreshToken);
    
    const mappedUser = {
      uid: data.user.id,
      email: data.user.email,
      role: data.user.role
    };
    localStorage.setItem('porulalar_user', JSON.stringify(mappedUser));
    return { user: mappedUser, accessToken: data.accessToken };
  },

  googleSignIn: async (): Promise<{ user: any; accessToken: string } | null> => {
    throw new Error('Google Sign-In is disabled. Please register or login with email/password.');
  },

  getAccessToken: async (): Promise<string | null> => {
    return localStorage.getItem('porulalar_access_token');
  },

  setAccessToken: (token: string) => {
    localStorage.setItem('porulalar_access_token', token);
  },

  logout: async () => {
    const token = localStorage.getItem('porulalar_refresh_token');
    if (token) {
      await apiClient.post('/api/auth/logout', { refreshToken: token }).catch(() => {});
    }
    porulalarStore.clear();
    localStorage.removeItem('porulalar_user');
    localStorage.removeItem('porulalar_refresh_token');
    localStorage.removeItem('porulalar_access_token');
  }
};
