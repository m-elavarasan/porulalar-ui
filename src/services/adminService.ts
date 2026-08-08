import { apiClient } from '../lib/apiClient';

export const adminService = {
  getStats: async (): Promise<any> => {
    return apiClient.get('/api/admin/stats');
  },

  getUsers: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/api/admin/users');
  },

  createUser: async (userData: { email: string; password?: string; role: string }): Promise<any> => {
    return apiClient.post('/api/admin/users', userData);
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiClient.delete(`/api/admin/users/${userId}`);
  },

  getMenus: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/api/admin/menus');
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    return apiClient.put(`/api/admin/users/${userId}/role`, { role });
  },

  saveMenuConfig: async (config: { role: string; channel: string; menuItems: any[] }): Promise<void> => {
    return apiClient.post('/api/admin/menus', config);
  }
};
